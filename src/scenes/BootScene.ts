import Phaser from 'phaser';
import playerSheet from '../assets/sprites/mr-jacobs-player-1.png';
import floorTileImg from '../assets/tiles/floor_tile.png';
import carpetTileImg from '../assets/tiles/carpet_tile.png';
import deskTopImg from '../assets/tiles/desk_top.png';

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
    this.load.image('floor-tile', floorTileImg);
    this.load.image('carpet-tile', carpetTileImg);
    this.load.image('desk-tile', deskTopImg);
  }

  create() {
    // floor-tile loaded from image in preload()
    this.generateWallTile();
    this.generateWallCapTile();
    this.generateWallBaseTile();
    this.generateFallbackTextures();
    // desk-tile loaded from image in preload()
    this.generateIndicatorTextures();
    this.generateJacobsFaces();
    this.generatePromptTexture();

    this.generateItemHighlight();
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
    // Generic item fallback (16x16 neutral question mark)
    const itemG = this.add.graphics();
    // Dark neutral background
    itemG.fillStyle(0x20232b, 1);
    itemG.fillRect(0, 0, 16, 16);
    // Subtle glitch offset
    itemG.fillStyle(0x884444, 0.25);
    itemG.fillRect(4, 3, 1, 1); itemG.fillRect(5, 2, 3, 1);
    itemG.fillRect(8, 3, 1, 2); itemG.fillRect(7, 5, 2, 1);
    itemG.fillRect(6, 6, 1, 2); itemG.fillRect(6, 10, 1, 2);
    // Question mark in warm gray
    itemG.fillStyle(0xe6e2d8, 1);
    itemG.fillRect(5, 2, 4, 1);   // top bar
    itemG.fillRect(4, 3, 2, 1);   // top-left curve
    itemG.fillRect(9, 3, 2, 1);   // top-right curve
    itemG.fillRect(9, 4, 2, 1);   // right side
    itemG.fillRect(8, 5, 2, 1);   // bend
    itemG.fillRect(7, 6, 2, 2);   // stem
    itemG.fillRect(7, 10, 2, 2);  // dot
    // Scanline artifacts
    itemG.fillStyle(0xe6e2d8, 0.12);
    itemG.fillRect(0, 5, 16, 1);
    itemG.fillRect(0, 11, 16, 1);
    // Border
    itemG.lineStyle(1, 0xe6e2d8, 0.2);
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


  private generateWallTile() {
    const g = this.add.graphics();
    // Wall palette from mockup: RGB(222, 230, 231)
    g.fillStyle(0xDEE6E7, 1);
    g.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
    g.lineStyle(1, 0xB8C2C3, 0.8);
    g.strokeRect(0, 0, TILE_SIZE, TILE_SIZE);
    g.lineStyle(1, 0xF2F6F7, 0.6);
    g.lineBetween(1, 1, TILE_SIZE - 1, 1);
    g.generateTexture('wall-tile', TILE_SIZE, TILE_SIZE);
    g.destroy();
  }

  private generateWallCapTile() {
    const g = this.add.graphics();
    // Top trim band (transparent elsewhere)
    g.fillStyle(0xDEE6E7, 1);
    g.fillRect(0, 0, TILE_SIZE, 4);
    // Highlight line
    g.lineStyle(1, 0xF7FAFB, 0.8);
    g.lineBetween(0, 1, TILE_SIZE, 1);
    g.generateTexture('wall-cap', TILE_SIZE, TILE_SIZE);
    g.destroy();
  }

  private generateWallBaseTile() {
    const g = this.add.graphics();
    // Baseboard/shadow band at bottom (transparent elsewhere)
    g.fillStyle(0xDEE6E7, 1);
    g.fillRect(0, TILE_SIZE - 3, TILE_SIZE, 3);
    g.lineStyle(1, 0xB8C2C3, 0.6);
    g.lineBetween(0, TILE_SIZE - 5, TILE_SIZE, TILE_SIZE - 5);
    g.generateTexture('wall-base', TILE_SIZE, TILE_SIZE);
    g.destroy();
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
    const S = TILE_SIZE; // 32x32
    const CX = S / 2;   // 16
    const CY = S / 2;   // 16

    // Pixel-art filled disc — crisp rectangle spans, no anti-aliasing
    const fillDisc = (g: Phaser.GameObjects.Graphics, cx: number, cy: number, r: number, color: number, alpha = 1) => {
      g.fillStyle(color, alpha);
      for (let y = -r; y <= r; y++) {
        const hw = Math.floor(Math.sqrt(r * r - y * y));
        g.fillRect(cx - hw, cy + y, hw * 2 + 1, 1);
      }
    };

    // CRT scanlines baked into every face
    const addScanlines = (g: Phaser.GameObjects.Graphics) => {
      g.fillStyle(0x000000, 0.08);
      for (let y = 0; y < S; y += 2) {
        g.fillRect(0, y, S, 1);
      }
    };

    // Open eyes with white shine highlight
    const drawEyes = (g: Phaser.GameObjects.Graphics, lx: number, rx: number, ey: number, r: number) => {
      fillDisc(g, lx, ey, r, 0x222222);
      fillDisc(g, rx, ey, r, 0x222222);
      g.fillStyle(0xffffff, 0.8);
      g.fillRect(lx - 1, ey - 1, 1, 1);
      g.fillRect(rx - 1, ey - 1, 1, 1);
    };

    // Closed eyes — thin horizontal lines for blink frames
    const drawClosedEyes = (g: Phaser.GameObjects.Graphics, lx: number, rx: number, ey: number) => {
      g.fillStyle(0x222222, 1);
      g.fillRect(lx - 2, ey, 4, 1);
      g.fillRect(rx - 2, ey, 4, 1);
    };

    // Generate each face twice: normal + blink variant
    for (const blink of [false, true]) {
      const sfx = blink ? '-blink' : '';

      // ─── PLEASED ─────────────────────────────────────
      const pleased = this.add.graphics();
      fillDisc(pleased, CX, CY, 12, 0xffdd44);
      fillDisc(pleased, CX, CY, 11, 0xffe855);
      pleased.fillStyle(0x222222, 1);
      pleased.fillRect(CX - 7, CY - 7, 4, 1);
      pleased.fillRect(CX + 3, CY - 7, 4, 1);
      if (blink) drawClosedEyes(pleased, CX - 4, CX + 4, CY - 3);
      else drawEyes(pleased, CX - 4, CX + 4, CY - 3, 2);
      pleased.lineStyle(2, 0x222222, 1);
      pleased.beginPath();
      pleased.arc(CX, CY + 1, 6, 0.2, Math.PI - 0.2, false);
      pleased.strokePath();
      fillDisc(pleased, CX - 8, CY + 2, 2, 0xff8866, 0.3);
      fillDisc(pleased, CX + 8, CY + 2, 2, 0xff8866, 0.3);
      addScanlines(pleased);
      pleased.generateTexture(`jacobs-face-PLEASED${sfx}`, S, S);
      pleased.destroy();

      // ─── NEUTRAL ─────────────────────────────────────
      const neutral = this.add.graphics();
      fillDisc(neutral, CX, CY, 12, 0xffdd44);
      fillDisc(neutral, CX, CY, 11, 0xffe855);
      neutral.fillStyle(0x222222, 1);
      neutral.fillRect(CX - 7, CY - 6, 4, 1);
      neutral.fillRect(CX + 3, CY - 6, 4, 1);
      if (blink) drawClosedEyes(neutral, CX - 4, CX + 4, CY - 3);
      else drawEyes(neutral, CX - 4, CX + 4, CY - 3, 2);
      neutral.fillStyle(0x222222, 1);
      neutral.fillRect(CX - 4, CY + 4, 8, 2);
      addScanlines(neutral);
      neutral.generateTexture(`jacobs-face-NEUTRAL${sfx}`, S, S);
      neutral.destroy();

      // ─── SUSPICIOUS ──────────────────────────────────
      const suspicious = this.add.graphics();
      fillDisc(suspicious, CX, CY, 12, 0xffdd44);
      fillDisc(suspicious, CX, CY, 11, 0xffe855);
      suspicious.fillStyle(0x222222, 1);
      suspicious.fillRect(CX - 7, CY - 5, 1, 1);
      suspicious.fillRect(CX - 6, CY - 6, 1, 1);
      suspicious.fillRect(CX - 5, CY - 7, 2, 1);
      suspicious.fillRect(CX + 3, CY - 7, 2, 1);
      suspicious.fillRect(CX + 5, CY - 6, 1, 1);
      suspicious.fillRect(CX + 6, CY - 5, 1, 1);
      if (blink) {
        drawClosedEyes(suspicious, CX - 4, CX + 3, CY - 3);
      } else {
        suspicious.fillStyle(0x222222, 1);
        suspicious.fillRect(CX - 6, CY - 3, 5, 2);
        suspicious.fillRect(CX + 1, CY - 3, 5, 2);
        suspicious.fillStyle(0xffffff, 0.6);
        suspicious.fillRect(CX - 5, CY - 3, 1, 1);
        suspicious.fillRect(CX + 2, CY - 3, 1, 1);
      }
      suspicious.lineStyle(2, 0x222222, 1);
      suspicious.beginPath();
      suspicious.moveTo(CX - 5, CY + 4);
      suspicious.lineTo(CX - 2, CY + 5);
      suspicious.lineTo(CX + 2, CY + 3);
      suspicious.lineTo(CX + 5, CY + 5);
      suspicious.strokePath();
      addScanlines(suspicious);
      suspicious.generateTexture(`jacobs-face-SUSPICIOUS${sfx}`, S, S);
      suspicious.destroy();

      // ─── DISAPPOINTED ────────────────────────────────
      const disappointed = this.add.graphics();
      fillDisc(disappointed, CX, CY, 12, 0xffdd44);
      fillDisc(disappointed, CX, CY, 11, 0xffe855);
      disappointed.fillStyle(0x222222, 1);
      disappointed.fillRect(CX - 7, CY - 5, 1, 1);
      disappointed.fillRect(CX - 6, CY - 6, 2, 1);
      disappointed.fillRect(CX - 4, CY - 7, 2, 1);
      disappointed.fillRect(CX + 2, CY - 7, 2, 1);
      disappointed.fillRect(CX + 4, CY - 6, 2, 1);
      disappointed.fillRect(CX + 6, CY - 5, 1, 1);
      if (blink) drawClosedEyes(disappointed, CX - 4, CX + 4, CY - 2);
      else drawEyes(disappointed, CX - 4, CX + 4, CY - 2, 2);
      disappointed.lineStyle(2, 0x222222, 1);
      disappointed.beginPath();
      disappointed.arc(CX, CY + 10, 5, Math.PI + 0.3, -0.3, false);
      disappointed.strokePath();
      disappointed.fillStyle(0xff0044, 0.6);
      disappointed.fillRect(2, 24, 5, 2);
      disappointed.fillStyle(0x00ffaa, 0.5);
      disappointed.fillRect(22, 5, 6, 2);
      disappointed.fillStyle(0xff00ff, 0.3);
      disappointed.fillRect(8, 28, 8, 1);
      addScanlines(disappointed);
      disappointed.generateTexture(`jacobs-face-DISAPPOINTED${sfx}`, S, S);
      disappointed.destroy();

      // ─── UNHINGED ────────────────────────────────────
      const unhinged = this.add.graphics();
      fillDisc(unhinged, CX - 1, CY + 1, 12, 0xff4400, 0.4);
      fillDisc(unhinged, CX + 1, CY - 1, 12, 0xffdd44);
      fillDisc(unhinged, CX + 1, CY - 1, 11, 0xffe855);
      unhinged.fillStyle(0x222222, 1);
      unhinged.fillRect(CX - 7, CY - 8, 4, 1);
      unhinged.fillRect(CX + 3, CY - 4, 4, 1);
      if (blink) {
        unhinged.fillStyle(0x222222, 1);
        unhinged.fillRect(CX - 7, CY - 3, 5, 1);
        unhinged.fillRect(CX + 3, CY - 2, 3, 1);
      } else {
        fillDisc(unhinged, CX - 5, CY - 3, 3, 0x222222);
        fillDisc(unhinged, CX + 4, CY - 2, 1, 0x222222);
        unhinged.fillStyle(0xff0000, 0.8);
        unhinged.fillRect(CX - 6, CY - 4, 1, 1);
      }
      unhinged.lineStyle(2, 0x222222, 1);
      unhinged.beginPath();
      unhinged.moveTo(CX - 7, CY + 3);
      unhinged.lineTo(CX - 4, CY + 6);
      unhinged.lineTo(CX - 1, CY + 2);
      unhinged.lineTo(CX + 2, CY + 7);
      unhinged.lineTo(CX + 5, CY + 3);
      unhinged.lineTo(CX + 7, CY + 5);
      unhinged.strokePath();
      unhinged.fillStyle(0xff0044, 0.8);
      unhinged.fillRect(0, 22, S, 2);
      unhinged.fillStyle(0x00ff88, 0.6);
      unhinged.fillRect(0, 6, S, 1);
      unhinged.fillRect(0, 14, 8, 1);
      unhinged.fillStyle(0xff00ff, 0.5);
      unhinged.fillRect(4, 28, 12, 2);
      unhinged.fillRect(18, 1, 10, 2);
      unhinged.fillStyle(0x000000, 0.15);
      for (let y = 0; y < S; y += 2) {
        unhinged.fillRect(0, y, S, 1);
      }
      unhinged.generateTexture(`jacobs-face-UNHINGED${sfx}`, S, S);
      unhinged.destroy();

      // ─── PROUD ──────────────────────────────────────
      const proud = this.add.graphics();
      fillDisc(proud, CX, CY, 12, 0xffdd44);
      fillDisc(proud, CX, CY, 11, 0xffe855);
      // Flat brows (confident)
      proud.fillStyle(0x222222, 1);
      proud.fillRect(CX - 7, CY - 7, 5, 1);
      proud.fillRect(CX + 2, CY - 7, 5, 1);
      if (blink) {
        drawClosedEyes(proud, CX - 4, CX + 4, CY - 3);
      } else {
        // Closed happy eyes (upside-down arcs / curved lines)
        proud.fillStyle(0x222222, 1);
        proud.fillRect(CX - 6, CY - 4, 4, 1);
        proud.fillRect(CX - 5, CY - 3, 2, 1);
        proud.fillRect(CX + 2, CY - 4, 4, 1);
        proud.fillRect(CX + 3, CY - 3, 2, 1);
      }
      // Confident smile
      proud.lineStyle(2, 0x222222, 1);
      proud.beginPath();
      proud.arc(CX, CY + 2, 5, 0.3, Math.PI - 0.3, false);
      proud.strokePath();
      // Sparkle pixel top-right
      proud.fillStyle(0xffffff, 0.9);
      proud.fillRect(CX + 9, CY - 10, 2, 2);
      proud.fillRect(CX + 10, CY - 11, 1, 1);
      proud.fillRect(CX + 8, CY - 9, 1, 1);
      addScanlines(proud);
      proud.generateTexture(`jacobs-face-PROUD${sfx}`, S, S);
      proud.destroy();

      // ─── AMUSED ─────────────────────────────────────
      const amused = this.add.graphics();
      fillDisc(amused, CX, CY, 12, 0xffdd44);
      fillDisc(amused, CX, CY, 11, 0xffe855);
      // Flat brows
      amused.fillStyle(0x222222, 1);
      amused.fillRect(CX - 7, CY - 6, 4, 1);
      amused.fillRect(CX + 3, CY - 6, 4, 1);
      if (blink) {
        drawClosedEyes(amused, CX - 4, CX + 4, CY - 3);
      } else {
        // Squinting laughing eyes
        amused.fillStyle(0x222222, 1);
        amused.fillRect(CX - 6, CY - 3, 5, 1);
        amused.fillRect(CX - 5, CY - 4, 3, 1);
        amused.fillRect(CX + 1, CY - 3, 5, 1);
        amused.fillRect(CX + 2, CY - 4, 3, 1);
      }
      // Open mouth grin (filled arc)
      amused.fillStyle(0x222222, 1);
      amused.fillRect(CX - 5, CY + 2, 10, 1);
      amused.fillRect(CX - 4, CY + 3, 8, 2);
      amused.fillRect(CX - 3, CY + 5, 6, 1);
      // Rosy cheeks
      fillDisc(amused, CX - 8, CY + 1, 2, 0xff8866, 0.25);
      fillDisc(amused, CX + 8, CY + 1, 2, 0xff8866, 0.25);
      addScanlines(amused);
      amused.generateTexture(`jacobs-face-AMUSED${sfx}`, S, S);
      amused.destroy();

      // ─── IMPRESSED ──────────────────────────────────
      const impressed = this.add.graphics();
      fillDisc(impressed, CX, CY, 12, 0xffdd44);
      fillDisc(impressed, CX, CY, 11, 0xffe855);
      // Raised brows (high arches)
      impressed.fillStyle(0x222222, 1);
      impressed.fillRect(CX - 6, CY - 8, 4, 1);
      impressed.fillRect(CX - 7, CY - 7, 1, 1);
      impressed.fillRect(CX + 2, CY - 8, 4, 1);
      impressed.fillRect(CX + 6, CY - 7, 1, 1);
      if (blink) {
        drawClosedEyes(impressed, CX - 4, CX + 4, CY - 3);
      } else {
        // Wide open eyes (larger radius)
        fillDisc(impressed, CX - 4, CY - 3, 3, 0x222222);
        fillDisc(impressed, CX + 4, CY - 3, 3, 0x222222);
        impressed.fillStyle(0xffffff, 0.9);
        impressed.fillRect(CX - 5, CY - 4, 1, 1);
        impressed.fillRect(CX + 3, CY - 4, 1, 1);
      }
      // Small "O" mouth
      impressed.lineStyle(2, 0x222222, 1);
      impressed.strokeCircle(CX, CY + 4, 3);
      addScanlines(impressed);
      impressed.generateTexture(`jacobs-face-IMPRESSED${sfx}`, S, S);
      impressed.destroy();

      // ─── GENEROUS ───────────────────────────────────
      const generous = this.add.graphics();
      fillDisc(generous, CX, CY, 12, 0xffdd44);
      fillDisc(generous, CX, CY, 11, 0xffe855);
      // Gentle brows
      generous.fillStyle(0x222222, 1);
      generous.fillRect(CX - 7, CY - 7, 4, 1);
      generous.fillRect(CX + 3, CY - 7, 4, 1);
      if (blink) {
        drawClosedEyes(generous, CX - 4, CX + 4, CY - 3);
      } else {
        // Heart-shaped eyes (small heart pixels)
        generous.fillStyle(0xff4466, 1);
        generous.fillRect(CX - 6, CY - 4, 2, 1);
        generous.fillRect(CX - 3, CY - 4, 2, 1);
        generous.fillRect(CX - 6, CY - 3, 5, 1);
        generous.fillRect(CX - 5, CY - 2, 3, 1);
        generous.fillRect(CX - 4, CY - 1, 1, 1);
        generous.fillRect(CX + 2, CY - 4, 2, 1);
        generous.fillRect(CX + 5, CY - 4, 2, 1);
        generous.fillRect(CX + 2, CY - 3, 5, 1);
        generous.fillRect(CX + 3, CY - 2, 3, 1);
        generous.fillRect(CX + 4, CY - 1, 1, 1);
      }
      // Warm smile
      generous.lineStyle(2, 0x222222, 1);
      generous.beginPath();
      generous.arc(CX, CY + 2, 5, 0.2, Math.PI - 0.2, false);
      generous.strokePath();
      // Subtle pink glow
      fillDisc(generous, CX, CY, 12, 0xff8888, 0.08);
      addScanlines(generous);
      generous.generateTexture(`jacobs-face-GENEROUS${sfx}`, S, S);
      generous.destroy();

      // ─── BORED ──────────────────────────────────────
      const bored = this.add.graphics();
      fillDisc(bored, CX, CY, 12, 0xffdd44);
      fillDisc(bored, CX, CY, 11, 0xffe855);
      // Flat low brows
      bored.fillStyle(0x222222, 1);
      bored.fillRect(CX - 7, CY - 5, 4, 1);
      bored.fillRect(CX + 3, CY - 5, 4, 1);
      if (blink) {
        drawClosedEyes(bored, CX - 4, CX + 4, CY - 2);
      } else {
        // Heavy-lidded droopy eyes (half-closed)
        bored.fillStyle(0x222222, 1);
        bored.fillRect(CX - 6, CY - 3, 5, 2);
        bored.fillRect(CX + 1, CY - 3, 5, 2);
        // Eyelids covering top half
        bored.fillStyle(0xffe855, 1);
        bored.fillRect(CX - 6, CY - 3, 5, 1);
        bored.fillRect(CX + 1, CY - 3, 5, 1);
        // Tiny pupil visible
        bored.fillStyle(0x222222, 1);
        bored.fillRect(CX - 4, CY - 2, 2, 1);
        bored.fillRect(CX + 2, CY - 2, 2, 1);
      }
      // Flat slightly droopy mouth
      bored.fillStyle(0x222222, 1);
      bored.fillRect(CX - 4, CY + 4, 8, 1);
      bored.fillRect(CX - 5, CY + 5, 2, 1);
      addScanlines(bored);
      bored.generateTexture(`jacobs-face-BORED${sfx}`, S, S);
      bored.destroy();

      // ─── SMUG ───────────────────────────────────────
      const smug = this.add.graphics();
      fillDisc(smug, CX, CY, 12, 0xffdd44);
      fillDisc(smug, CX, CY, 11, 0xffe855);
      // One raised brow, one flat
      smug.fillStyle(0x222222, 1);
      smug.fillRect(CX - 7, CY - 6, 4, 1);
      smug.fillRect(CX + 2, CY - 8, 4, 1);
      smug.fillRect(CX + 6, CY - 7, 1, 1);
      if (blink) {
        drawClosedEyes(smug, CX - 4, CX + 4, CY - 3);
      } else {
        // Half-closed confident eyes
        smug.fillStyle(0x222222, 1);
        smug.fillRect(CX - 6, CY - 3, 5, 2);
        smug.fillRect(CX + 1, CY - 3, 5, 2);
        smug.fillStyle(0xffe855, 1);
        smug.fillRect(CX - 6, CY - 3, 5, 1);
        smug.fillRect(CX + 1, CY - 3, 5, 1);
        smug.fillStyle(0xffffff, 0.5);
        smug.fillRect(CX - 5, CY - 2, 1, 1);
        smug.fillRect(CX + 2, CY - 2, 1, 1);
      }
      // One-sided smirk (right side up, left flat)
      smug.lineStyle(2, 0x222222, 1);
      smug.beginPath();
      smug.moveTo(CX - 5, CY + 4);
      smug.lineTo(CX, CY + 4);
      smug.lineTo(CX + 4, CY + 2);
      smug.strokePath();
      addScanlines(smug);
      smug.generateTexture(`jacobs-face-SMUG${sfx}`, S, S);
      smug.destroy();

      // ─── SAD ────────────────────────────────────────
      const sad = this.add.graphics();
      fillDisc(sad, CX, CY, 12, 0xffdd44);
      fillDisc(sad, CX, CY, 11, 0xffe855);
      // Sad tilted brows (inner up)
      sad.fillStyle(0x222222, 1);
      sad.fillRect(CX - 5, CY - 8, 2, 1);
      sad.fillRect(CX - 7, CY - 7, 2, 1);
      sad.fillRect(CX + 3, CY - 8, 2, 1);
      sad.fillRect(CX + 5, CY - 7, 2, 1);
      if (blink) {
        drawClosedEyes(sad, CX - 4, CX + 4, CY - 2);
      } else {
        drawEyes(sad, CX - 4, CX + 4, CY - 2, 2);
      }
      // Deep frown
      sad.lineStyle(2, 0x222222, 1);
      sad.beginPath();
      sad.arc(CX, CY + 10, 5, Math.PI + 0.4, -0.4, false);
      sad.strokePath();
      // Tear drops (blue pixels)
      sad.fillStyle(0x4488ff, 0.8);
      sad.fillRect(CX - 7, CY, 1, 2);
      sad.fillRect(CX - 7, CY + 3, 1, 1);
      sad.fillRect(CX + 6, CY, 1, 2);
      sad.fillRect(CX + 6, CY + 3, 1, 1);
      // Light glitch
      sad.fillStyle(0x4488ff, 0.3);
      sad.fillRect(0, 26, 8, 1);
      addScanlines(sad);
      sad.generateTexture(`jacobs-face-SAD${sfx}`, S, S);
      sad.destroy();

      // ─── PARANOID ───────────────────────────────────
      const paranoid = this.add.graphics();
      fillDisc(paranoid, CX, CY, 12, 0xffdd44);
      fillDisc(paranoid, CX, CY, 11, 0xffe855);
      // Uneven twitchy brows
      paranoid.fillStyle(0x222222, 1);
      paranoid.fillRect(CX - 7, CY - 8, 5, 1);
      paranoid.fillRect(CX + 3, CY - 6, 4, 1);
      if (blink) {
        drawClosedEyes(paranoid, CX - 4, CX + 4, CY - 3);
      } else {
        // Mismatched eyes — left big, right small
        fillDisc(paranoid, CX - 4, CY - 3, 3, 0x222222);
        fillDisc(paranoid, CX + 4, CY - 2, 1, 0x222222);
        paranoid.fillStyle(0xffffff, 0.8);
        paranoid.fillRect(CX - 5, CY - 4, 1, 1);
        paranoid.fillRect(CX + 3, CY - 3, 1, 1);
      }
      // Tight wobbly mouth
      paranoid.lineStyle(2, 0x222222, 1);
      paranoid.beginPath();
      paranoid.moveTo(CX - 4, CY + 4);
      paranoid.lineTo(CX - 2, CY + 3);
      paranoid.lineTo(CX, CY + 5);
      paranoid.lineTo(CX + 2, CY + 3);
      paranoid.lineTo(CX + 4, CY + 4);
      paranoid.strokePath();
      // Sweat drop
      paranoid.fillStyle(0x88ccff, 0.7);
      paranoid.fillRect(CX + 9, CY - 4, 1, 2);
      paranoid.fillRect(CX + 9, CY - 1, 1, 1);
      // Medium glitch corruption
      paranoid.fillStyle(0xff0044, 0.4);
      paranoid.fillRect(0, 20, 10, 1);
      paranoid.fillStyle(0x00ffaa, 0.35);
      paranoid.fillRect(20, 8, 8, 1);
      paranoid.fillStyle(0xff00ff, 0.25);
      paranoid.fillRect(6, 28, 6, 1);
      addScanlines(paranoid);
      paranoid.generateTexture(`jacobs-face-PARANOID${sfx}`, S, S);
      paranoid.destroy();

      // ─── FURIOUS ────────────────────────────────────
      const furious = this.add.graphics();
      // Red-tinted base
      fillDisc(furious, CX, CY, 12, 0xff6633, 0.3);
      fillDisc(furious, CX, CY, 12, 0xffdd44);
      fillDisc(furious, CX, CY, 11, 0xffe855);
      fillDisc(furious, CX, CY, 11, 0xff4422, 0.2);
      // Angry V-brows
      furious.fillStyle(0x222222, 1);
      furious.fillRect(CX - 7, CY - 6, 1, 1);
      furious.fillRect(CX - 6, CY - 7, 2, 1);
      furious.fillRect(CX - 4, CY - 8, 2, 1);
      furious.fillRect(CX + 2, CY - 8, 2, 1);
      furious.fillRect(CX + 4, CY - 7, 2, 1);
      furious.fillRect(CX + 6, CY - 6, 1, 1);
      if (blink) {
        drawClosedEyes(furious, CX - 4, CX + 4, CY - 3);
      } else {
        // Angry narrowed eyes
        furious.fillStyle(0x222222, 1);
        furious.fillRect(CX - 6, CY - 3, 5, 2);
        furious.fillRect(CX + 1, CY - 3, 5, 2);
        furious.fillStyle(0xff0000, 0.7);
        furious.fillRect(CX - 5, CY - 3, 1, 1);
        furious.fillRect(CX + 2, CY - 3, 1, 1);
      }
      // Open shouting mouth
      furious.fillStyle(0x222222, 1);
      furious.fillRect(CX - 5, CY + 2, 10, 1);
      furious.fillRect(CX - 4, CY + 3, 8, 3);
      furious.fillRect(CX - 3, CY + 6, 6, 1);
      // Teeth
      furious.fillStyle(0xffffff, 0.8);
      furious.fillRect(CX - 3, CY + 3, 6, 1);
      // Medium glitch
      furious.fillStyle(0xff0044, 0.5);
      furious.fillRect(0, 24, 12, 1);
      furious.fillStyle(0xff4400, 0.4);
      furious.fillRect(18, 4, 10, 1);
      addScanlines(furious);
      furious.generateTexture(`jacobs-face-FURIOUS${sfx}`, S, S);
      furious.destroy();

      // ─── MANIC ──────────────────────────────────────
      const manic = this.add.graphics();
      // Double outline vibration effect
      fillDisc(manic, CX - 1, CY, 12, 0xffee00, 0.3);
      fillDisc(manic, CX + 1, CY, 12, 0xffee00, 0.3);
      fillDisc(manic, CX, CY, 12, 0xffdd44);
      fillDisc(manic, CX, CY, 11, 0xffe855);
      // High arched brows
      manic.fillStyle(0x222222, 1);
      manic.fillRect(CX - 6, CY - 9, 4, 1);
      manic.fillRect(CX + 2, CY - 9, 4, 1);
      if (blink) {
        manic.fillStyle(0x222222, 1);
        manic.fillRect(CX - 6, CY - 3, 5, 1);
        manic.fillRect(CX + 2, CY - 3, 5, 1);
      } else {
        // Spiral/pinwheel eyes — concentric rings
        fillDisc(manic, CX - 4, CY - 3, 3, 0x222222);
        fillDisc(manic, CX - 4, CY - 3, 2, 0xffe855);
        fillDisc(manic, CX - 4, CY - 3, 1, 0x222222);
        fillDisc(manic, CX + 4, CY - 3, 3, 0x222222);
        fillDisc(manic, CX + 4, CY - 3, 2, 0xffe855);
        fillDisc(manic, CX + 4, CY - 3, 1, 0x222222);
      }
      // Impossibly wide grin
      manic.lineStyle(2, 0x222222, 1);
      manic.beginPath();
      manic.arc(CX, CY + 1, 8, 0.1, Math.PI - 0.1, false);
      manic.strokePath();
      // Heavy glitch + color bars
      manic.fillStyle(0xff0044, 0.7);
      manic.fillRect(0, 22, S, 2);
      manic.fillStyle(0x00ff88, 0.5);
      manic.fillRect(0, 6, S, 1);
      manic.fillRect(0, 28, S, 1);
      manic.fillStyle(0xff00ff, 0.4);
      manic.fillRect(2, 14, 8, 1);
      manic.fillRect(20, 2, 8, 1);
      manic.fillStyle(0x00ffff, 0.3);
      manic.fillRect(10, 18, 12, 1);
      manic.fillStyle(0x000000, 0.12);
      for (let y = 0; y < S; y += 2) {
        manic.fillRect(0, y, S, 1);
      }
      manic.generateTexture(`jacobs-face-MANIC${sfx}`, S, S);
      manic.destroy();

      // ─── GLITCHING ──────────────────────────────────
      const glitch = this.add.graphics();
      // Fragmented face — horizontal bands with offsets
      // Band 1 (top third)
      glitch.save();
      fillDisc(glitch, CX + 2, CY, 12, 0xffdd44);
      fillDisc(glitch, CX + 2, CY, 11, 0xffe855);
      // Mask: only show top band
      glitch.fillStyle(0x0c0f16, 1);
      glitch.fillRect(0, 11, S, 21);
      // Band 2 (middle) — shifted left
      fillDisc(glitch, CX - 2, CY, 12, 0xffdd44);
      fillDisc(glitch, CX - 2, CY, 11, 0xffe855);
      // Mask: only show middle band
      glitch.fillStyle(0x0c0f16, 1);
      glitch.fillRect(0, 0, S, 11);
      glitch.fillRect(0, 22, S, 10);
      // Band 3 (bottom) — shifted right
      fillDisc(glitch, CX + 1, CY, 12, 0xffdd44);
      fillDisc(glitch, CX + 1, CY, 11, 0xffe855);
      glitch.fillStyle(0x0c0f16, 1);
      glitch.fillRect(0, 0, S, 22);
      // Rebuild full face with fragments
      glitch.restore();
      // Redraw as simple fragmented approach:
      // Top shard
      fillDisc(glitch, CX + 2, CY, 12, 0xffdd44, 0.6);
      // Middle shard
      fillDisc(glitch, CX - 1, CY + 1, 11, 0xffe855, 0.7);
      // Bottom shard
      fillDisc(glitch, CX, CY - 1, 12, 0xffcc33, 0.5);
      // Fragmented eyes (displaced)
      if (!blink) {
        fillDisc(glitch, CX - 3, CY - 3, 2, 0x222222);
        fillDisc(glitch, CX + 5, CY - 2, 2, 0x222222);
        glitch.fillStyle(0xff0000, 0.6);
        glitch.fillRect(CX - 4, CY - 4, 1, 1);
      } else {
        glitch.fillStyle(0x222222, 1);
        glitch.fillRect(CX - 5, CY - 3, 4, 1);
        glitch.fillRect(CX + 3, CY - 2, 4, 1);
      }
      // Corrupted mouth fragments
      glitch.fillStyle(0x222222, 0.8);
      glitch.fillRect(CX - 4, CY + 3, 3, 2);
      glitch.fillRect(CX + 1, CY + 4, 4, 1);
      // Extreme glitch corruption
      glitch.fillStyle(0xff00ff, 0.7);
      glitch.fillRect(0, 10, S, 2);
      glitch.fillRect(0, 21, S, 2);
      glitch.fillStyle(0x00ffff, 0.6);
      glitch.fillRect(0, 5, 14, 1);
      glitch.fillRect(16, 26, 16, 1);
      glitch.fillStyle(0xff0044, 0.8);
      glitch.fillRect(0, 15, S, 1);
      glitch.fillRect(0, 28, S, 2);
      glitch.fillStyle(0x00ff44, 0.5);
      glitch.fillRect(8, 0, 1, S);
      glitch.fillRect(24, 0, 1, S);
      // Heavy scanlines
      glitch.fillStyle(0x000000, 0.2);
      for (let y = 0; y < S; y += 2) {
        glitch.fillRect(0, y, S, 1);
      }
      glitch.generateTexture(`jacobs-face-GLITCHING${sfx}`, S, S);
      glitch.destroy();
    }

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


  private generateItemHighlight() {
    // Soft circular glow for items on the ground (40x40 radial gradient)
    const S = 40;
    const g = this.add.graphics();
    const cx = S / 2, cy = S / 2;
    for (let r = S / 2; r > 0; r -= 1) {
      const alpha = 0.15 * (1 - r / (S / 2));
      g.fillStyle(0xccffcc, alpha);
      g.fillCircle(cx, cy, r);
    }
    g.generateTexture('item-glow', S, S);
    g.destroy();

    // Small downward arrow indicator (10x8)
    const a = this.add.graphics();
    a.fillStyle(0x5ee6b0, 1);
    a.fillTriangle(5, 8, 0, 0, 10, 0);
    a.fillStyle(0x8fffd4, 0.8);
    a.fillTriangle(5, 6, 2, 1, 8, 1);
    a.generateTexture('item-arrow', 10, 8);
    a.destroy();
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
