import Phaser from 'phaser';
import { useGameStore } from '../stores/gameStore';
import type { InteractionTarget } from '../types';

const INTERACT_RADIUS = 40;

interface ItemMeta {
  name: string;
  tags: string[];
  textureKey: string;
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
  private promptSprite: Phaser.GameObjects.Image | null = null;
  private currentTarget: InteractionTarget | null = null;

  private itemSprites = new Map<string, Phaser.GameObjects.Image>();
  private itemDefs = new Map<string, ItemMeta>();

  private objectSprites = new Map<string, Phaser.GameObjects.Image>();
  private objectDefs = new Map<string, ObjectMeta>();

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
  }

  registerObject(
    id: string,
    sprite: Phaser.GameObjects.Image,
    def: ObjectMeta,
  ): void {
    this.objectSprites.set(id, sprite);
    this.objectDefs.set(id, def);
  }

  update(): void {
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
    if (!target) {
      this.promptSprite?.setVisible(false);
      return;
    }

    if (!this.promptSprite) {
      this.promptSprite = this.scene.add.image(0, 0, 'prompt-e');
      this.promptSprite.setScale(0.5); // rendered at 2x, display at 1x world
      this.promptSprite.setDepth(200);
    }

    const sprite =
      target.type === 'item'
        ? this.itemSprites.get(target.id)!
        : this.objectSprites.get(target.id)!;

    this.promptSprite.setPosition(sprite.x, sprite.y - 20);
    this.promptSprite.setVisible(true);
  }

  private handleInteraction(target: InteractionTarget): void {
    const store = useGameStore.getState();

    if (target.type === 'item') {
      // Inventory full — silently block
      if (store.inventory.length >= 4) return;

      const def = this.itemDefs.get(target.id)!;
      store.addItem({
        id: target.id,
        name: def.name,
        tags: def.tags,
        textureKey: def.textureKey,
      });

      // Remove from world
      const sprite = this.itemSprites.get(target.id);
      sprite?.destroy();
      this.itemSprites.delete(target.id);
      this.itemDefs.delete(target.id);

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
    this.promptSprite?.destroy();
    this.itemSprites.clear();
    this.objectSprites.clear();
    this.itemDefs.clear();
    this.objectDefs.clear();
  }
}
