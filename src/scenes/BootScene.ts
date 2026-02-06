export class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  preload() {
    // Future: load texture atlases, tilemaps, audio
  }

  create() {
    this.scene.start('OfficeScene');
  }
}
