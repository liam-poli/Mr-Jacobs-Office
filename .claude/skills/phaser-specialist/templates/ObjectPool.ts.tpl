/**
 * Reusable object pool pattern for Phaser 3.
 * Use for any entity that spawns repeatedly: items, particles, effects.
 *
 * Usage:
 *   const pool = new __ENTITY__Pool(this);
 *   pool.spawn(x, y, data);
 */

export class __ENTITY__Sprite extends Phaser.Physics.Arcade.Sprite {
  constructor(scene: Phaser.Scene, x: number, y: number, texture: string) {
    super(scene, x, y, texture);
  }

  spawn(x: number, y: number, data?: Record<string, unknown>) {
    this.body?.reset(x, y);
    this.setActive(true);
    this.setVisible(true);
    // Configure sprite based on data
  }

  recycle() {
    this.setActive(false);
    this.setVisible(false);
    // Never call destroy() — let the pool reuse this
  }

  preUpdate(time: number, delta: number) {
    super.preUpdate(time, delta);
    // Check if out of bounds or expired, then recycle
  }
}

export class __ENTITY__Pool extends Phaser.Physics.Arcade.Group {
  constructor(scene: Phaser.Scene, size = 20) {
    super(scene.physics.world, scene);

    this.createMultiple({
      frameQuantity: size,
      key: '__ENTITY_TEXTURE_KEY__',
      active: false,
      visible: false,
      classType: __ENTITY__Sprite,
    });
  }

  spawn(x: number, y: number, data?: Record<string, unknown>) {
    const entity = this.getFirstDead(false) as __ENTITY__Sprite | null;
    if (entity) {
      entity.spawn(x, y, data);
    }
  }
}
