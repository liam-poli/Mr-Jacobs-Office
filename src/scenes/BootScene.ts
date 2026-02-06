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
    this.generateFallbackTextures();
    this.generateDeskTile();
    this.generateIndicatorTextures();
    this.generateJacobsFaces();
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

  private generateFallbackTextures() {
    // Generic item fallback (16x16 glitchy question mark)
    const itemG = this.add.graphics();
    // Dark CRT background
    itemG.fillStyle(0x1a1a2e, 1);
    itemG.fillRect(0, 0, 16, 16);
    // Glitch offset (red channel shifted left)
    itemG.fillStyle(0xff0044, 0.3);
    itemG.fillRect(4, 3, 1, 1); itemG.fillRect(5, 2, 3, 1);
    itemG.fillRect(8, 3, 1, 2); itemG.fillRect(7, 5, 2, 1);
    itemG.fillRect(6, 6, 1, 2); itemG.fillRect(6, 10, 1, 2);
    // Question mark in cyan
    itemG.fillStyle(0x5ee6b0, 1);
    itemG.fillRect(5, 2, 4, 1);   // top bar
    itemG.fillRect(4, 3, 2, 1);   // top-left curve
    itemG.fillRect(9, 3, 2, 1);   // top-right curve
    itemG.fillRect(9, 4, 2, 1);   // right side
    itemG.fillRect(8, 5, 2, 1);   // bend
    itemG.fillRect(7, 6, 2, 2);   // stem
    itemG.fillRect(7, 10, 2, 2);  // dot
    // Scanline artifacts
    itemG.fillStyle(0x5ee6b0, 0.15);
    itemG.fillRect(0, 5, 16, 1);
    itemG.fillRect(0, 11, 16, 1);
    // Border
    itemG.lineStyle(1, 0x5ee6b0, 0.2);
    itemG.strokeRect(0, 0, 16, 16);
    itemG.generateTexture('item-default', 16, 16);
    itemG.destroy();

    // Generic object fallback (32x32 glitchy question mark)
    const objG = this.add.graphics();
    // Dark CRT background
    objG.fillStyle(0x1a1a2e, 1);
    objG.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
    // Glitch offset (red channel shifted)
    objG.fillStyle(0xff0044, 0.3);
    objG.fillRect(9, 5, 2, 2); objG.fillRect(11, 4, 6, 2);
    objG.fillRect(18, 6, 2, 4); objG.fillRect(16, 10, 3, 2);
    objG.fillRect(13, 12, 3, 4); objG.fillRect(13, 21, 3, 3);
    // Question mark in cyan (doubled scale)
    objG.fillStyle(0x5ee6b0, 1);
    objG.fillRect(11, 5, 8, 2);   // top bar
    objG.fillRect(9, 7, 3, 2);    // top-left curve
    objG.fillRect(19, 7, 3, 2);   // top-right curve
    objG.fillRect(19, 9, 3, 2);   // right side
    objG.fillRect(17, 11, 3, 2);  // upper bend
    objG.fillRect(15, 13, 3, 4);  // stem
    objG.fillRect(15, 21, 3, 3);  // dot
    // Brighter inner highlight
    objG.fillStyle(0x8fffd4, 0.6);
    objG.fillRect(12, 6, 6, 1);
    objG.fillRect(16, 14, 1, 2);
    objG.fillRect(16, 22, 1, 1);
    // Scanline artifacts
    objG.fillStyle(0x5ee6b0, 0.1);
    for (let y = 0; y < TILE_SIZE; y += 4) {
      objG.fillRect(0, y, TILE_SIZE, 1);
    }
    // Glitch corruption lines
    objG.fillStyle(0xff00ff, 0.25);
    objG.fillRect(2, 18, 7, 1);
    objG.fillStyle(0x00ffaa, 0.2);
    objG.fillRect(22, 8, 6, 1);
    // Border
    objG.lineStyle(1, 0x5ee6b0, 0.2);
    objG.strokeRect(0, 0, TILE_SIZE, TILE_SIZE);
    objG.generateTexture('obj-default', TILE_SIZE, TILE_SIZE);
    objG.destroy();
  }

  private generateFloorTile() {
    const g = this.add.graphics();
    // Base: cool blue-gray institutional panel
    g.fillStyle(0xbecdd4, 1);
    g.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
    // Inner highlight (top + left edges)
    g.lineStyle(1, 0xd6e2e8, 0.6);
    g.lineBetween(1, 1, TILE_SIZE - 1, 1);
    g.lineBetween(1, 1, 1, TILE_SIZE - 1);
    // Inner shadow (bottom + right edges)
    g.lineStyle(1, 0x9aacb4, 0.5);
    g.lineBetween(1, TILE_SIZE - 1, TILE_SIZE - 1, TILE_SIZE - 1);
    g.lineBetween(TILE_SIZE - 1, 1, TILE_SIZE - 1, TILE_SIZE - 1);
    // Grid gap border
    g.lineStyle(1, 0x8a9ca6, 0.7);
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

  private generateDeskTile() {
    const desk = this.add.graphics();
    desk.fillStyle(0x6b5040, 1);
    desk.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
    desk.fillStyle(0x7d6050, 1);
    desk.fillRect(2, 2, TILE_SIZE - 4, TILE_SIZE - 4);
    desk.lineStyle(1, 0x4a3828, 0.8);
    desk.strokeRect(0, 0, TILE_SIZE, TILE_SIZE);
    desk.generateTexture('desk-tile', TILE_SIZE, TILE_SIZE);
    desk.destroy();

    // Plant object — green circle with pot
    const plant = this.add.graphics();
    plant.fillStyle(0x2d5a27, 1);
    plant.fillCircle(16, 16, 10);
    plant.fillStyle(0x3a7a30, 1);
    plant.fillCircle(14, 14, 7);
    plant.fillStyle(0x4a9a40, 0.6);
    plant.fillCircle(12, 12, 4);
    plant.fillStyle(0x8b5e3c, 1);
    plant.fillRect(10, 22, 12, 8);
    plant.generateTexture('obj-plant', TILE_SIZE, TILE_SIZE);
    plant.destroy();
  }

  private generateIndicatorTextures() {
    const S = 16; // indicator icon size

    // Lock — yellow padlock with shackle
    const lock = this.add.graphics();
    lock.fillStyle(0xffd700, 1);
    lock.fillRoundedRect(2, 7, 12, 8, 1);
    lock.fillStyle(0xe6c200, 1);
    lock.fillRect(3, 8, 10, 6);
    lock.lineStyle(2, 0xffd700, 1);
    lock.beginPath();
    lock.arc(8, 7, 4, Math.PI, 0, false);
    lock.strokePath();
    lock.fillStyle(0x8b7500, 1);
    lock.fillRect(7, 10, 2, 3);
    lock.generateTexture('indicator-lock', S, S);
    lock.destroy();

    // Power — green lightning bolt with outline
    const power = this.add.graphics();
    power.fillStyle(0x00cc66, 1);
    power.fillTriangle(9, 0, 3, 7, 8, 7);
    power.fillTriangle(7, 7, 13, 7, 6, 16);
    power.fillStyle(0x00ff88, 1);
    power.fillTriangle(9, 1, 4, 7, 8, 7);
    power.fillTriangle(7, 7, 12, 7, 7, 15);
    power.generateTexture('indicator-power', S, S);
    power.destroy();

    // Broken — red X with thick outline
    const broken = this.add.graphics();
    broken.lineStyle(3, 0xcc2222, 1);
    broken.lineBetween(2, 2, 14, 14);
    broken.lineBetween(14, 2, 2, 14);
    broken.lineStyle(2, 0xff4444, 1);
    broken.lineBetween(2, 2, 14, 14);
    broken.lineBetween(14, 2, 2, 14);
    broken.generateTexture('indicator-broken', S, S);
    broken.destroy();

    // Burning — orange/yellow flame with layers
    const burn = this.add.graphics();
    burn.fillStyle(0xcc4400, 1);
    burn.fillTriangle(8, 0, 1, 14, 15, 14);
    burn.fillStyle(0xff8844, 1);
    burn.fillTriangle(8, 2, 2, 14, 14, 14);
    burn.fillStyle(0xffcc44, 1);
    burn.fillTriangle(8, 5, 4, 14, 12, 14);
    burn.fillStyle(0xffee88, 1);
    burn.fillTriangle(8, 8, 6, 14, 10, 14);
    burn.generateTexture('indicator-burning', S, S);
    burn.destroy();

    // Flooded — blue water droplet with highlight
    const flood = this.add.graphics();
    flood.fillStyle(0x4466aa, 1);
    flood.fillTriangle(8, 1, 1, 10, 15, 10);
    flood.fillCircle(8, 11, 7);
    flood.fillStyle(0x6688cc, 1);
    flood.fillTriangle(8, 2, 2, 10, 14, 10);
    flood.fillCircle(8, 11, 6);
    flood.fillStyle(0x88aaee, 0.5);
    flood.fillCircle(6, 9, 2);
    flood.generateTexture('indicator-flooded', S, S);
    flood.destroy();

    // Jammed — amber gear with teeth
    const jam = this.add.graphics();
    jam.fillStyle(0xccaa44, 1);
    jam.fillCircle(8, 8, 6);
    jam.fillRect(6, 1, 4, 3);
    jam.fillRect(6, 12, 4, 3);
    jam.fillRect(1, 6, 3, 4);
    jam.fillRect(12, 6, 3, 4);
    jam.fillStyle(0x8a7430, 1);
    jam.fillCircle(8, 8, 3);
    jam.fillStyle(0xccaa44, 1);
    jam.fillCircle(8, 8, 1);
    jam.generateTexture('indicator-jammed', S, S);
    jam.destroy();

    // Hacked — green terminal brackets with cursor
    const hack = this.add.graphics();
    hack.lineStyle(2, 0x22cc66, 1);
    hack.lineBetween(1, 2, 5, 2);
    hack.lineBetween(1, 2, 1, 14);
    hack.lineBetween(1, 14, 5, 14);
    hack.lineBetween(11, 2, 15, 2);
    hack.lineBetween(15, 2, 15, 14);
    hack.lineBetween(11, 14, 15, 14);
    hack.fillStyle(0x44ff88, 1);
    hack.fillRect(6, 7, 4, 2);
    hack.generateTexture('indicator-hacked', S, S);
    hack.destroy();

    // Contaminated — purple hazard with exclamation
    const contam = this.add.graphics();
    contam.lineStyle(2, 0x7733aa, 1);
    contam.strokeTriangle(8, 1, 1, 15, 15, 15);
    contam.fillStyle(0xaa44cc, 1);
    contam.fillTriangle(8, 3, 3, 14, 13, 14);
    contam.fillStyle(0x220033, 1);
    contam.fillRect(7, 6, 2, 4);
    contam.fillRect(7, 11, 2, 2);
    contam.generateTexture('indicator-contaminated', S, S);
    contam.destroy();
  }

  private generateJacobsFaces() {
    const S = TILE_SIZE;
    const CX = S / 2;
    const CY = S / 2;

    // Helper: draw CRT screen background (dark border + dark interior)
    const drawScreen = (g: Phaser.GameObjects.Graphics) => {
      g.fillStyle(0x222222, 1);
      g.fillRect(0, 0, S, S);
      g.fillStyle(0x1a1a2e, 1);
      g.fillRect(2, 2, S - 4, S - 4);
    };

    // ─── PLEASED ─────────────────────────────────────
    const pleased = this.add.graphics();
    drawScreen(pleased);
    pleased.fillStyle(0xffdd44, 1);
    pleased.fillCircle(CX, CY, 10);
    pleased.fillStyle(0x222222, 1);
    pleased.fillCircle(CX - 4, CY - 2, 2);
    pleased.fillCircle(CX + 4, CY - 2, 2);
    pleased.lineStyle(2, 0x222222, 1);
    pleased.beginPath();
    pleased.arc(CX, CY + 1, 5, 0.3, Math.PI - 0.3, false);
    pleased.strokePath();
    pleased.generateTexture('jacobs-face-PLEASED', S, S);
    pleased.destroy();

    // ─── NEUTRAL ─────────────────────────────────────
    const neutral = this.add.graphics();
    drawScreen(neutral);
    neutral.fillStyle(0xffdd44, 1);
    neutral.fillCircle(CX, CY, 10);
    neutral.fillStyle(0x222222, 1);
    neutral.fillCircle(CX - 4, CY - 2, 2);
    neutral.fillCircle(CX + 4, CY - 2, 2);
    neutral.lineStyle(2, 0x222222, 1);
    neutral.lineBetween(CX - 4, CY + 4, CX + 4, CY + 4);
    neutral.generateTexture('jacobs-face-NEUTRAL', S, S);
    neutral.destroy();

    // ─── SUSPICIOUS ──────────────────────────────────
    const suspicious = this.add.graphics();
    drawScreen(suspicious);
    suspicious.fillStyle(0xffdd44, 1);
    suspicious.fillCircle(CX, CY, 10);
    suspicious.fillStyle(0x222222, 1);
    // Narrowed eyes (thin rectangles)
    suspicious.fillRect(CX - 6, CY - 3, 5, 2);
    suspicious.fillRect(CX + 1, CY - 3, 5, 2);
    // Slight frown
    suspicious.lineStyle(2, 0x222222, 1);
    suspicious.beginPath();
    suspicious.arc(CX, CY + 8, 5, Math.PI + 0.4, -0.4, false);
    suspicious.strokePath();
    suspicious.generateTexture('jacobs-face-SUSPICIOUS', S, S);
    suspicious.destroy();

    // ─── DISAPPOINTED ────────────────────────────────
    const disappointed = this.add.graphics();
    drawScreen(disappointed);
    disappointed.fillStyle(0xffdd44, 1);
    disappointed.fillCircle(CX, CY, 10);
    disappointed.fillStyle(0x222222, 1);
    disappointed.fillCircle(CX - 4, CY - 2, 2);
    disappointed.fillCircle(CX + 4, CY - 2, 2);
    // Frown
    disappointed.lineStyle(2, 0x222222, 1);
    disappointed.beginPath();
    disappointed.arc(CX, CY + 9, 5, Math.PI + 0.3, -0.3, false);
    disappointed.strokePath();
    // Glitch artifacts
    disappointed.fillStyle(0xff0044, 0.6);
    disappointed.fillRect(3, 24, 4, 2);
    disappointed.fillStyle(0x00ffaa, 0.5);
    disappointed.fillRect(22, 6, 5, 2);
    disappointed.fillStyle(0xff0044, 0.4);
    disappointed.fillRect(8, 28, 6, 1);
    disappointed.generateTexture('jacobs-face-DISAPPOINTED', S, S);
    disappointed.destroy();

    // ─── UNHINGED ────────────────────────────────────
    const unhinged = this.add.graphics();
    drawScreen(unhinged);
    // Distorted face (offset, double-exposed)
    unhinged.fillStyle(0xffaa00, 0.5);
    unhinged.fillCircle(CX - 1, CY + 1, 10);
    unhinged.fillStyle(0xffdd44, 1);
    unhinged.fillCircle(CX + 1, CY - 1, 10);
    // Misaligned eyes (different sizes)
    unhinged.fillStyle(0x222222, 1);
    unhinged.fillCircle(CX - 5, CY - 3, 3);
    unhinged.fillCircle(CX + 4, CY - 1, 1);
    // Jagged mouth
    unhinged.lineStyle(2, 0x222222, 1);
    unhinged.beginPath();
    unhinged.moveTo(CX - 6, CY + 3);
    unhinged.lineTo(CX - 3, CY + 6);
    unhinged.lineTo(CX, CY + 2);
    unhinged.lineTo(CX + 3, CY + 6);
    unhinged.lineTo(CX + 6, CY + 3);
    unhinged.strokePath();
    // Heavy corruption lines
    unhinged.fillStyle(0xff0044, 0.8);
    unhinged.fillRect(0, 22, S, 2);
    unhinged.fillStyle(0x00ff88, 0.6);
    unhinged.fillRect(0, 6, S, 1);
    unhinged.fillStyle(0xff00ff, 0.5);
    unhinged.fillRect(4, 28, 10, 2);
    unhinged.fillRect(18, 2, 8, 2);
    unhinged.generateTexture('jacobs-face-UNHINGED', S, S);
    unhinged.destroy();

    // ─── STATIC OVERLAY ──────────────────────────────
    const staticG = this.add.graphics();
    for (let y = 0; y < S; y += 2) {
      for (let x = 0; x < S; x += 2) {
        staticG.fillStyle(0xffffff, Math.random() * 0.3);
        staticG.fillRect(x, y, 2, 2);
      }
    }
    staticG.generateTexture('jacobs-static', S, S);
    staticG.destroy();
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
