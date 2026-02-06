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
    this.generateCarpetTile();
    this.generateItemTextures();
    this.generateObjectTextures();
    this.generateFurnitureTextures();
    this.generateIndicatorTextures();
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
      { key: 'obj-door', color: 0x8b6914 },
      { key: 'obj-terminal', color: 0x1a3a2a },
      { key: 'obj-vending-machine', color: 0x3a1a5a },
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

  private generateCarpetTile() {
    const g = this.add.graphics();
    g.fillStyle(0x5c6b7a, 1);
    g.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
    // Subtle striped texture
    g.fillStyle(0x526170, 0.3);
    for (let i = 0; i < TILE_SIZE; i += 4) {
      g.fillRect(i, 0, 2, TILE_SIZE);
    }
    g.lineStyle(1, 0x4a5a68, 0.5);
    g.strokeRect(0, 0, TILE_SIZE, TILE_SIZE);
    g.generateTexture('carpet-tile', TILE_SIZE, TILE_SIZE);
    g.destroy();
  }

  private generateFurnitureTextures() {
    // Desk — warm brown with highlight edge
    const desk = this.add.graphics();
    desk.fillStyle(0x6b5040, 1);
    desk.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
    desk.fillStyle(0x7d6050, 1);
    desk.fillRect(2, 2, TILE_SIZE - 4, TILE_SIZE - 4);
    desk.lineStyle(1, 0x4a3828, 0.8);
    desk.strokeRect(0, 0, TILE_SIZE, TILE_SIZE);
    desk.generateTexture('furn-desk', TILE_SIZE, TILE_SIZE);
    desk.destroy();

    // Plant — green circle on transparent
    const plant = this.add.graphics();
    plant.fillStyle(0x2d5a27, 1);
    plant.fillCircle(16, 16, 10);
    plant.fillStyle(0x3a7a30, 1);
    plant.fillCircle(14, 14, 7);
    plant.fillStyle(0x4a9a40, 0.6);
    plant.fillCircle(12, 12, 4);
    // Pot
    plant.fillStyle(0x8b5e3c, 1);
    plant.fillRect(10, 22, 12, 8);
    plant.generateTexture('furn-plant', TILE_SIZE, TILE_SIZE);
    plant.destroy();

    // Jacobs' screen — dark monitor with glowing edge
    const screen = this.add.graphics();
    screen.fillStyle(0x0a0a14, 1);
    screen.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
    screen.fillStyle(0x1a2a20, 1);
    screen.fillRect(3, 3, TILE_SIZE - 6, TILE_SIZE - 6);
    screen.lineStyle(1, 0x5ee6b0, 0.6);
    screen.strokeRect(2, 2, TILE_SIZE - 4, TILE_SIZE - 4);
    screen.generateTexture('furn-jacobs-screen', TILE_SIZE, TILE_SIZE);
    screen.destroy();
  }

  private generateIndicatorTextures() {
    const S = 10; // indicator icon size

    // Lock — yellow padlock
    const lock = this.add.graphics();
    lock.fillStyle(0xffd700, 1);
    lock.fillRect(1, 4, 8, 6);
    lock.lineStyle(2, 0xffd700, 1);
    lock.strokeCircle(5, 4, 3);
    lock.generateTexture('indicator-lock', S, S);
    lock.destroy();

    // Power — green lightning bolt
    const power = this.add.graphics();
    power.fillStyle(0x00ff88, 1);
    power.fillTriangle(5, 0, 2, 5, 6, 5);
    power.fillTriangle(4, 5, 8, 5, 5, 10);
    power.generateTexture('indicator-power', S, S);
    power.destroy();

    // Broken — red X
    const broken = this.add.graphics();
    broken.lineStyle(2, 0xff4444, 1);
    broken.lineBetween(1, 1, 9, 9);
    broken.lineBetween(9, 1, 1, 9);
    broken.generateTexture('indicator-broken', S, S);
    broken.destroy();
  }

  private generatePromptTexture() {
    // "E" key prompt — small rounded box with letter
    const g = this.add.graphics();
    g.fillStyle(0x1a1a2e, 0.9);
    g.fillRoundedRect(0, 0, 14, 14, 3);
    g.lineStyle(1, 0x5ee6b0, 0.8);
    g.strokeRoundedRect(0, 0, 14, 14, 3);
    g.generateTexture('prompt-e-bg', 14, 14);
    g.destroy();

    // Create text label "E"
    const txt = this.add.text(0, 0, 'E', {
      fontFamily: '"Courier New", monospace',
      fontSize: '10px',
      color: '#5ee6b0',
    });
    txt.setOrigin(0.5, 0.5);
    const rt = this.add.renderTexture(0, 0, 14, 14);
    rt.draw(txt, 7, 7);
    rt.saveTexture('prompt-e');
    rt.destroy();
    txt.destroy();
  }
}
