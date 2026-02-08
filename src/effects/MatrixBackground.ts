import Phaser from 'phaser';

const RAIN_CHARS = ['0', '1', '/', '\\', '|', '-', '+', '*', '#'];

const CANVAS_W = 960;
const CANVAS_H = 640;

const GRID_SPACING = 48;
const GRID_COLOR = 0x00ff41;
const GRID_ALPHA = 0.08;

const COLUMN_COUNT = 35;
const RAIN_COLOR = '#00ff41';
const RAIN_ALPHA_MIN = 0.04;
const RAIN_ALPHA_MAX = 0.12;
const RAIN_SPEED_MIN = 15;
const RAIN_SPEED_MAX = 30;
const RAIN_FONT_SIZE = 14;

const DEPTH = -10;

// Bouncing logo constants
const LOGO_COUNT = 4;
const LOGO_SCALE = 0.35;
const LOGO_SPEED = 40;
const LOGO_ALPHA = 0.10;

interface RainDrop {
  text: Phaser.GameObjects.Text;
  speed: number;
}

interface BouncingLogo {
  sprite: Phaser.GameObjects.Image;
  vx: number;
  vy: number;
}

// Mood severity → visual parameters
const MOOD_RAIN_CONFIG: Record<number, { color: string; gridColor: number; gridAlpha: number; speedMin: number; speedMax: number }> = {
  1: { color: '#00ff41', gridColor: 0x00ff41, gridAlpha: 0.08, speedMin: 15, speedMax: 30 },
  2: { color: '#00ff41', gridColor: 0x00ff41, gridAlpha: 0.08, speedMin: 15, speedMax: 30 },
  3: { color: '#ffaa00', gridColor: 0xffaa00, gridAlpha: 0.10, speedMin: 20, speedMax: 35 },
  4: { color: '#ff4444', gridColor: 0xff4444, gridAlpha: 0.12, speedMin: 25, speedMax: 40 },
  5: { color: '#ff2222', gridColor: 0xff2222, gridAlpha: 0.50, speedMin: 30, speedMax: 50 },
};

export class MatrixBackground {
  private scene: Phaser.Scene;
  private gridGraphics: Phaser.GameObjects.Graphics;
  private rainDrops: RainDrop[] = [];
  private frameCount = 0;
  private currentSpeedMin = RAIN_SPEED_MIN;
  private currentSpeedMax = RAIN_SPEED_MAX;
  private bouncingLogos: BouncingLogo[] = [];

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.gridGraphics = this.createGrid();
    this.rainDrops = this.createRainPool();
  }

  private createGrid(): Phaser.GameObjects.Graphics {
    const g = this.scene.add.graphics();
    g.setScrollFactor(0);
    g.setDepth(DEPTH);
    g.lineStyle(1, GRID_COLOR, GRID_ALPHA);

    for (let x = 0; x <= CANVAS_W; x += GRID_SPACING) {
      g.lineBetween(x, 0, x, CANVAS_H);
    }
    for (let y = 0; y <= CANVAS_H; y += GRID_SPACING) {
      g.lineBetween(0, y, CANVAS_W, y);
    }

    return g;
  }

  private createRainPool(): RainDrop[] {
    const drops: RainDrop[] = [];
    const spacing = CANVAS_W / COLUMN_COUNT;

    for (let i = 0; i < COLUMN_COUNT; i++) {
      const x = i * spacing + spacing / 2;
      const text = this.scene.add.text(x, 0, this.randomChar(), {
        fontFamily: '"Courier New", monospace',
        fontSize: `${RAIN_FONT_SIZE}px`,
        color: RAIN_COLOR,
      });
      text.setScrollFactor(0);
      text.setDepth(DEPTH + 0.1);
      text.setOrigin(0.5, 0.5);
      text.setAlpha(Phaser.Math.FloatBetween(RAIN_ALPHA_MIN, RAIN_ALPHA_MAX));
      text.y = Phaser.Math.Between(0, CANVAS_H);

      drops.push({
        text,
        speed: Phaser.Math.FloatBetween(RAIN_SPEED_MIN, RAIN_SPEED_MAX),
      });
    }

    return drops;
  }

  private resetDrop(drop: RainDrop): void {
    drop.text.setText(this.randomChar());
    drop.text.setAlpha(Phaser.Math.FloatBetween(RAIN_ALPHA_MIN, RAIN_ALPHA_MAX));
    drop.speed = Phaser.Math.FloatBetween(this.currentSpeedMin, this.currentSpeedMax);
    drop.text.y = -RAIN_FONT_SIZE;
  }

  private randomChar(): string {
    return RAIN_CHARS[Phaser.Math.Between(0, RAIN_CHARS.length - 1)];
  }

  update(_time: number, delta: number): void {
    const dt = delta / 1000;

    for (const drop of this.rainDrops) {
      drop.text.y += drop.speed * dt;
      if (drop.text.y > CANVAS_H + RAIN_FONT_SIZE) {
        this.resetDrop(drop);
      }
    }

    // Occasional character flicker
    this.frameCount++;
    if (this.frameCount % 10 === 0) {
      const idx = Phaser.Math.Between(0, this.rainDrops.length - 1);
      this.rainDrops[idx].text.setText(this.randomChar());
    }

    // Bounce logos (DVD screensaver style)
    for (const logo of this.bouncingLogos) {
      const s = logo.sprite;
      s.x += logo.vx * dt;
      s.y += logo.vy * dt;

      const hw = (s.displayWidth * s.originX);
      const hh = (s.displayHeight * s.originY);

      if (s.x - hw <= 0) { s.x = hw; logo.vx = Math.abs(logo.vx); }
      if (s.x + hw >= CANVAS_W) { s.x = CANVAS_W - hw; logo.vx = -Math.abs(logo.vx); }
      if (s.y - hh <= 0) { s.y = hh; logo.vy = Math.abs(logo.vy); }
      if (s.y + hh >= CANVAS_H) { s.y = CANVAS_H - hh; logo.vy = -Math.abs(logo.vy); }
    }
  }

  /** Update rain color, speed, and grid based on mood severity (1-5). */
  setMoodIntensity(severity: number): void {
    const config = MOOD_RAIN_CONFIG[severity] ?? MOOD_RAIN_CONFIG[2];

    // Update rain color and speed
    this.currentSpeedMin = config.speedMin;
    this.currentSpeedMax = config.speedMax;
    for (const drop of this.rainDrops) {
      drop.text.setColor(config.color);
      drop.speed = Phaser.Math.FloatBetween(config.speedMin, config.speedMax);
    }

    // Redraw grid with new color
    this.gridGraphics.clear();
    this.gridGraphics.lineStyle(1, config.gridColor, config.gridAlpha);
    for (let x = 0; x <= CANVAS_W; x += GRID_SPACING) {
      this.gridGraphics.lineBetween(x, 0, x, CANVAS_H);
    }
    for (let y = 0; y <= CANVAS_H; y += GRID_SPACING) {
      this.gridGraphics.lineBetween(0, y, CANVAS_W, y);
    }

    // Bouncing logos — spawn at severity 5, destroy otherwise
    if (severity >= 5) {
      this.spawnBouncingLogos();
    } else {
      this.destroyBouncingLogos();
    }
  }

  private spawnBouncingLogos(): void {
    if (this.bouncingLogos.length > 0) return; // already active
    if (!this.scene.textures.exists('jacobs-logo')) return;

    for (let i = 0; i < LOGO_COUNT; i++) {
      const angle = Math.random() * Math.PI * 2;
      const sprite = this.scene.add.image(
        Phaser.Math.Between(100, CANVAS_W - 100),
        Phaser.Math.Between(100, CANVAS_H - 100),
        'jacobs-logo',
      );
      sprite.setScrollFactor(0);
      sprite.setDepth(DEPTH + 0.05);
      sprite.setScale(LOGO_SCALE);
      sprite.setAlpha(LOGO_ALPHA);
      sprite.setTint(0xff2222);

      this.bouncingLogos.push({
        sprite,
        vx: Math.cos(angle) * LOGO_SPEED,
        vy: Math.sin(angle) * LOGO_SPEED,
      });
    }
  }

  private destroyBouncingLogos(): void {
    for (const logo of this.bouncingLogos) {
      logo.sprite.destroy();
    }
    this.bouncingLogos = [];
  }

  destroy(): void {
    this.gridGraphics.destroy();
    for (const drop of this.rainDrops) {
      drop.text.destroy();
    }
    this.rainDrops.length = 0;
    this.destroyBouncingLogos();
  }
}
