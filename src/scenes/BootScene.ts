import Phaser from 'phaser';
import playerSheet from '../assets/sprites/mr-jacobs-player-1.png';

const TILE_SIZE = 32;
const SPRITE_SIZE = 48;
const COLS = 6; // 288 / 48

// Frame layout (6 cols x 12 rows, 48x48 each):
//  Row 0: down-idle (4 frames)    Row 4: down-walk (6 frames)    Row 8:  down-run (6 frames)
//  Row 1: left-idle (4 frames)    Row 5: left-walk (6 frames)    Row 9:  left-run (6 frames)
//  Row 2: right-idle (4 frames)   Row 6: right-walk (6 frames)   Row 10: right-run (6 frames)
//  Row 3: up-idle (4 frames)      Row 7: up-walk (6 frames)      Row 11: up-run (6 frames)

const DIRECTIONS = ['down', 'left', 'right', 'up'] as const;

function rowStart(row: number) {
  return row * COLS;
}

export class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  preload() {
    this.load.spritesheet('player-0', playerSheet, {
      frameWidth: SPRITE_SIZE,
      frameHeight: SPRITE_SIZE,
    });
  }

  create() {
    this.generateFloorTile();
    this.generateWallTile();
    this.generateItemTextures();
    this.generateObjectTextures();
    this.generatePromptTexture();
    this.createPlayerAnimations('player-0');
    this.scene.start('OfficeScene');
  }

  private createPlayerAnimations(key: string) {
    for (let d = 0; d < 4; d++) {
      const dir = DIRECTIONS[d];

      // Idle — 4 frames, rows 0-3
      this.anims.create({
        key: `${key}-idle-${dir}`,
        frames: this.anims.generateFrameNumbers(key, {
          start: rowStart(d),
          end: rowStart(d) + 3,
        }),
        frameRate: 4,
        repeat: -1,
      });

      // Walk — 6 frames, rows 4-7
      this.anims.create({
        key: `${key}-walk-${dir}`,
        frames: this.anims.generateFrameNumbers(key, {
          start: rowStart(4 + d),
          end: rowStart(4 + d) + 5,
        }),
        frameRate: 8,
        repeat: -1,
      });

      // Run — 6 frames, rows 8-11
      this.anims.create({
        key: `${key}-run-${dir}`,
        frames: this.anims.generateFrameNumbers(key, {
          start: rowStart(8 + d),
          end: rowStart(8 + d) + 5,
        }),
        frameRate: 10,
        repeat: -1,
      });
    }
  }

  private generateItemTextures() {
    const items: Array<{ key: string; color: number }> = [
      { key: 'item-coffee-mug', color: 0x8b4513 },
      { key: 'item-wrench', color: 0x708090 },
      { key: 'item-bucket', color: 0x4169e1 },
      { key: 'item-matches', color: 0xff4500 },
    ];
    for (const { key, color } of items) {
      const g = this.add.graphics();
      g.fillStyle(color, 1);
      g.fillRect(0, 0, 16, 16);
      g.lineStyle(1, 0xffffff, 0.4);
      g.strokeRect(0, 0, 16, 16);
      g.generateTexture(key, 16, 16);
      g.destroy();
    }
  }

  private generateObjectTextures() {
    const objects: Array<{ key: string; color: number }> = [
      { key: 'obj-coffee-maker', color: 0x2f4f4f },
      { key: 'obj-filing-cabinet', color: 0x696969 },
      { key: 'obj-desk', color: 0x8b7355 },
    ];
    for (const { key, color } of objects) {
      const g = this.add.graphics();
      g.fillStyle(color, 1);
      g.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
      g.lineStyle(1, 0xffffff, 0.3);
      g.strokeRect(0, 0, TILE_SIZE, TILE_SIZE);
      g.generateTexture(key, TILE_SIZE, TILE_SIZE);
      g.destroy();
    }
  }

  private generatePromptTexture() {
    // Small downward-pointing triangle as interaction indicator
    const g = this.add.graphics();
    g.fillStyle(0x5ee6b0, 1);
    g.fillTriangle(4, 0, 0, 8, 8, 8);
    g.generateTexture('prompt-e', 8, 8);
    g.destroy();
  }

  private generateFloorTile() {
    const g = this.add.graphics();
    g.fillStyle(0xB8D4C8, 1);
    g.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
    g.lineStyle(1, 0xA0BFB0, 0.5);
    g.strokeRect(0, 0, TILE_SIZE, TILE_SIZE);
    g.generateTexture('floor-tile', TILE_SIZE, TILE_SIZE);
    g.destroy();
  }

  private generateWallTile() {
    const g = this.add.graphics();
    g.fillStyle(0xD4CAB8, 1);
    g.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
    g.lineStyle(1, 0x9E9680, 0.8);
    g.strokeRect(0, 0, TILE_SIZE, TILE_SIZE);
    g.lineStyle(1, 0xE8DDD0, 0.6);
    g.lineBetween(1, 1, TILE_SIZE - 1, 1);
    g.generateTexture('wall-tile', TILE_SIZE, TILE_SIZE);
    g.destroy();
  }
}
