import Phaser from 'phaser';
import { useGameStore } from '../stores/gameStore';
import type { InteractionTarget, InventoryItem } from '../types';

const INTERACT_RADIUS = 40;
const LABEL_SCALE = 2;

interface ItemMeta {
  name: string;
  tags: string[];
  textureKey: string;
  imageUrl?: string;
}

interface ObjectMeta {
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
    const sprite = this.scene.add.image(px, py, item.textureKey);
    sprite.setDepth(py);

    // Scale large textures (e.g. server sprites) to match 32px item size
    const frame = sprite.frame;
    if (frame.width > 32 || frame.height > 32) {
      sprite.setScale(32 / Math.max(frame.width, frame.height));
    }
    this.registerItem(item.id, sprite, {
      name: item.name,
      tags: item.tags,
      textureKey: item.textureKey,
      imageUrl: item.imageUrl,
    });
  }

  update(): void {
    // Check for items dropped from inventory (React → Phaser bridge)
    const { pendingDrop, clearPendingDrop } = useGameStore.getState();
    if (pendingDrop) {
      this.spawnDroppedItem(pendingDrop);
      clearPendingDrop();
    }

    const nearest = this.findNearest();

    if (nearest?.id !== this.currentTarget?.id) {
      this.currentTarget = nearest;
      useGameStore.getState().setInteractionTarget(nearest);

      // Clear inventory selection when leaving an object
      if (nearest?.type !== 'object') {
        useGameStore.getState().setSelectedInventoryIndex(null);
      }
    }

    this.updatePrompt(nearest);

    if (Phaser.Input.Keyboard.JustDown(this.eKey) && nearest) {
      this.handleInteraction(nearest);
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

  private handleInteraction(target: InteractionTarget): void {
    const store = useGameStore.getState();

    if (target.type === 'item') {
      // Inventory full — silently block
      if (store.inventory.length >= 5) return;

      const def = this.itemDefs.get(target.id)!;
      store.addItem({
        id: target.id,
        name: def.name,
        tags: def.tags,
        textureKey: def.textureKey,
        imageUrl: def.imageUrl,
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
    } else {
      const selectedIdx = store.selectedInventoryIndex;

      if (selectedIdx !== null && store.inventory[selectedIdx]) {
        // Use item on object
        const item = store.inventory[selectedIdx];
        const objDef = this.objectDefs.get(target.id)!;
        console.log(
          `Used ${item.name} [${item.tags}] on ${objDef.name} [${objDef.tags}]`,
        );

        store.removeItem(item.id);
        store.setSelectedInventoryIndex(null);
        store.updateObjectState(target.id, [...objDef.states, 'INTERACTED']);
      } else {
        // Bare-handed interaction
        const objDef = this.objectDefs.get(target.id)!;
        console.log(`Interacted with ${objDef.name} (no item)`);
      }
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
