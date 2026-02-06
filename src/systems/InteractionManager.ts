import Phaser from 'phaser';
import { useGameStore } from '../stores/gameStore';
import { useJacobsStore } from '../stores/jacobsStore';
import { soundService } from '../services/soundService';
import { resolveInteraction } from '../services/interactionService';
import type { InteractionTarget, InventoryItem } from '../types';

const INTERACT_RADIUS = 40;
const LABEL_SCALE = 2;

interface ItemMeta {
  item_id: string;
  name: string;
  tags: string[];
  spriteUrl?: string;
}

interface ObjectMeta {
  object_id: string;
  name: string;
  tags: string[];
  states: string[];
}

export class InteractionManager {
  private scene: Phaser.Scene;
  private player: Phaser.Physics.Arcade.Sprite;
  private eKey: Phaser.Input.Keyboard.Key;
  private currentTarget: InteractionTarget | null = null;

  private itemSprites = new Map<string, Phaser.GameObjects.Image>();
  private itemDefs = new Map<string, ItemMeta>();

  private objectSprites = new Map<string, Phaser.GameObjects.Image>();
  private objectDefs = new Map<string, ObjectMeta>();

  private nameLabels = new Map<string, Phaser.GameObjects.Image>();
  private activeLabel: Phaser.GameObjects.Image | null = null;

  constructor(scene: Phaser.Scene, player: Phaser.Physics.Arcade.Sprite) {
    this.scene = scene;
    this.player = player;
    this.eKey = scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.E);
  }

  registerItem(
    id: string,
    sprite: Phaser.GameObjects.Image,
    def: ItemMeta,
  ): void {
    this.itemSprites.set(id, sprite);
    this.itemDefs.set(id, def);
    this.createNameLabel(id, def.name);
  }

  registerObject(
    id: string,
    sprite: Phaser.GameObjects.Image,
    def: ObjectMeta,
  ): void {
    this.objectSprites.set(id, sprite);
    this.objectDefs.set(id, def);
    this.createNameLabel(id, def.name);
  }

  private createNameLabel(id: string, name: string): void {
    const textureKey = `label-${id}`;
    if (this.scene.textures.exists(textureKey)) {
      this.scene.textures.remove(textureKey);
    }
    const tempText = this.scene.add.text(0, 0, name, {
      fontFamily: '"Courier New", monospace',
      fontSize: `${7 * LABEL_SCALE}px`,
      color: '#5ee6b0',
      backgroundColor: '#1a1a2ecc',
      padding: { x: 2 * LABEL_SCALE, y: 1 * LABEL_SCALE },
    });
    tempText.setOrigin(0.5, 1);

    const tw = Math.ceil(tempText.width);
    const th = Math.ceil(tempText.height);
    const rt = this.scene.add.renderTexture(0, 0, tw, th);
    rt.draw(tempText, tw / 2, th);
    rt.saveTexture(textureKey);
    rt.destroy();
    tempText.destroy();

    const label = this.scene.add.image(0, 0, textureKey);
    label.setOrigin(0.5, 1);
    label.setScale(1 / LABEL_SCALE);
    label.setDepth(10000);
    label.setVisible(false);
    this.nameLabels.set(id, label);
  }

  private spawnDroppedItem(item: InventoryItem): void {
    const px = this.player.x;
    const py = this.player.y + 16;
    const textureKey = item.spriteUrl
      ? `sprite-item-${item.item_id}`
      : 'item-default';
    const sprite = this.scene.add.image(px, py, textureKey);
    sprite.setDepth(py);

    // Scale large textures (e.g. server sprites) to match 32px item size
    const frame = sprite.frame;
    if (frame.width > 32 || frame.height > 32) {
      sprite.setScale(32 / Math.max(frame.width, frame.height));
    }
    this.registerItem(item.id, sprite, {
      item_id: item.item_id,
      name: item.name,
      tags: item.tags,
      spriteUrl: item.spriteUrl,
    });
  }

  update(): void {
    const store = useGameStore.getState();

    // Check for items dropped from inventory (React → Phaser bridge)
    if (store.pendingDrop) {
      const dropped = store.pendingDrop;
      this.spawnDroppedItem(dropped);
      store.clearPendingDrop();
      soundService.playSfx('drop');
      useJacobsStore.getState().logEvent({
        type: 'DROP',
        timestamp: Date.now(),
        player: 'PLAYER 1',
        details: { itemName: dropped.name },
      });
    }

    // Consume pending interaction from menu (React → Phaser bridge)
    if (store.pendingInteraction) {
      const { targetId, itemId } = store.pendingInteraction;
      store.setPendingInteraction(null);
      const target = this.currentTarget;
      if (target && target.id === targetId) {
        this.executeObjectInteraction(target, itemId);
      }
    }

    // Don't update nearest target or handle E key while menu/resolution is active
    if (store.interactionMenuOpen || store.interactionPending) return;

    const nearest = this.findNearest();

    if (nearest?.id !== this.currentTarget?.id) {
      this.currentTarget = nearest;
      useGameStore.getState().setInteractionTarget(nearest);
    }

    this.updatePrompt(nearest);

    if (Phaser.Input.Keyboard.JustDown(this.eKey) && nearest) {
      if (nearest.type === 'object') {
        // Open the interaction menu instead of acting immediately
        useGameStore.getState().openInteractionMenu();
      } else {
        this.handleItemPickup(nearest);
      }
    }
  }

  private findNearest(): InteractionTarget | null {
    let closest: InteractionTarget | null = null;
    let closestDist = INTERACT_RADIUS;
    const px = this.player.x;
    const py = this.player.y;

    for (const [id, sprite] of this.itemSprites) {
      const dist = Phaser.Math.Distance.Between(px, py, sprite.x, sprite.y);
      if (dist < closestDist) {
        closestDist = dist;
        const def = this.itemDefs.get(id)!;
        closest = { type: 'item', id, name: def.name };
      }
    }

    for (const [id, sprite] of this.objectSprites) {
      const dist = Phaser.Math.Distance.Between(px, py, sprite.x, sprite.y);
      if (dist < closestDist) {
        closestDist = dist;
        const def = this.objectDefs.get(id)!;
        closest = { type: 'object', id, name: def.name };
      }
    }

    return closest;
  }

  private updatePrompt(target: InteractionTarget | null): void {
    // Hide the previously active label if target changed
    if (this.activeLabel && (!target || this.nameLabels.get(target.id) !== this.activeLabel)) {
      this.activeLabel.setVisible(false);
      this.activeLabel = null;
    }

    if (!target) return;

    const label = this.nameLabels.get(target.id);
    if (!label) return;

    const sprite =
      target.type === 'item'
        ? this.itemSprites.get(target.id)!
        : this.objectSprites.get(target.id)!;

    const offsetY = target.type === 'item' ? 12 : 20;
    label.setPosition(sprite.x, sprite.y - offsetY);
    label.setVisible(true);
    this.activeLabel = label;
  }

  private handleItemPickup(target: InteractionTarget): void {
    const store = useGameStore.getState();

    if (store.inventory.length >= 5) {
      soundService.playSfx('error');
      return;
    }

    const def = this.itemDefs.get(target.id)!;
    store.addItem({
      id: target.id,
      item_id: def.item_id,
      name: def.name,
      tags: def.tags,
      spriteUrl: def.spriteUrl,
    });
    soundService.playSfx('pickup');
    useJacobsStore.getState().logEvent({
      type: 'PICKUP',
      timestamp: Date.now(),
      player: 'PLAYER 1',
      details: { itemName: def.name, itemTags: def.tags },
    });

    // Remove from world
    const sprite = this.itemSprites.get(target.id);
    sprite?.destroy();
    this.itemSprites.delete(target.id);
    this.itemDefs.delete(target.id);

    // Remove name label
    const label = this.nameLabels.get(target.id);
    label?.destroy();
    this.nameLabels.delete(target.id);
    this.activeLabel = null;

    this.currentTarget = null;
    store.setInteractionTarget(null);
  }

  private async executeObjectInteraction(target: InteractionTarget, itemId: string | null): Promise<void> {
    const store = useGameStore.getState();
    const objDef = this.objectDefs.get(target.id)!;

    const item = itemId ? store.inventory.find((i) => i.id === itemId) : null;
    if (itemId && !item) return;

    // Freeze player + show pending state
    store.setInteractionPending(true);
    soundService.playSfx('interact');

    try {
      const itemTags = item ? item.tags : [];
      const itemName = item ? item.name : '(bare hands)';
      const objectState = objDef.states[0] ?? null;

      const result = await resolveInteraction({
        itemId: item ? item.item_id : null,
        objectId: objDef.object_id,
        itemTags,
        objectTags: objDef.tags,
        objectState,
        itemName,
        objectName: objDef.name,
      });

      // Consume item on success (only if one was used)
      if (item) {
        store.removeItem(item.id);
      }

      // Update object state if the result provides one
      if (result.result_state) {
        const newStates = [result.result_state];
        objDef.states = newStates;
        store.updateObjectState(target.id, newStates);
        useJacobsStore.getState().logEvent({
          type: 'STATE_CHANGE',
          timestamp: Date.now(),
          player: 'PLAYER 1',
          details: { objectName: objDef.name, objectId: target.id, newState: result.result_state },
        });
      }

      // Spawn output item if the result provides one
      if (result.output_item) {
        const outputItem: InventoryItem = {
          id: crypto.randomUUID(),
          item_id: 'output',
          name: result.output_item,
          tags: result.output_item_tags ?? [],
        };

        if (store.inventory.length < 5) {
          store.addItem(outputItem);
          soundService.playSfx('pickup');
        } else {
          this.spawnDroppedItem(outputItem);
          soundService.playSfx('drop');
        }
      }

      // Show result description
      store.setInteractionResult({ description: result.description });

      // Log interaction for Mr. Jacobs
      useJacobsStore.getState().logEvent({
        type: 'INTERACTION',
        timestamp: Date.now(),
        player: 'PLAYER 1',
        details: {
          objectName: objDef.name,
          itemName,
          resultState: result.result_state,
          description: result.description,
        },
      });
    } catch (err) {
      console.error('Interaction failed:', err);
      soundService.playSfx('error');
      store.setInteractionResult({ description: "Something went wrong..." });
    } finally {
      store.setInteractionPending(false);
    }
  }

  destroy(): void {
    for (const label of this.nameLabels.values()) label.destroy();
    this.nameLabels.clear();
    this.itemSprites.clear();
    this.objectSprites.clear();
    this.itemDefs.clear();
    this.objectDefs.clear();
  }
}
