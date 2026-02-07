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

interface RainDrop {
  text: Phaser.GameObjects.Text;
  speed: number;
}

export class MatrixBackground {
  private scene: Phaser.Scene;
  private gridGraphics: Phaser.GameObjects.Graphics;
  private rainDrops: RainDrop[] = [];
  private frameCount = 0;

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
    drop.speed = Phaser.Math.FloatBetween(RAIN_SPEED_MIN, RAIN_SPEED_MAX);
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
  }

  destroy(): void {
    this.gridGraphics.destroy();
    for (const drop of this.rainDrops) {
      drop.text.destroy();
    }
    this.rainDrops.length = 0;
  }
}
