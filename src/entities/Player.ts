import Phaser from 'phaser';
import { InputManager } from '../systems/InputManager';
import type { Direction } from '../types';

const PLAYER_SPEED = 160;

export class Player extends Phaser.Physics.Arcade.Sprite {
  private currentDirection: Direction = 'down';
  private isMoving = false;
  private nameLabel: Phaser.GameObjects.Image;
  private inputManager: InputManager | null = null;
  private texturePrefix: string;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    textureKey: string,
    playerName: string,
    isLocal: boolean,
  ) {
    super(scene, x, y, textureKey, 0);

    this.texturePrefix = textureKey;

    scene.add.existing(this);
    scene.physics.add.existing(this);

    // Physics body — smaller hitbox at feet for 48x48 sprite
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setSize(16, 14);
    body.setOffset(16, 32);
    body.setCollideWorldBounds(true);

    // Render label text to a texture, then display as Image (benefits from roundPixels)
    const labelKey = `label-${textureKey}`;
    const tempText = scene.add.text(0, 0, playerName, {
      fontFamily: '"Courier New", monospace',
      fontSize: '10px',
      color: '#ffffff',
      backgroundColor: '#1a1a2ecc',
      padding: { x: 3, y: 1 },
      resolution: 2,
    });
    tempText.setOrigin(0.5, 1);

    // Snapshot text to a texture, then destroy the Text object
    const tw = Math.ceil(tempText.width);
    const th = Math.ceil(tempText.height);
    const rt = scene.add.renderTexture(0, 0, tw, th);
    rt.draw(tempText, tw / 2, th);
    rt.saveTexture(labelKey);
    rt.destroy();
    tempText.destroy();

    // Use an Image for the label — goes through WebGL sprite pipeline, roundPixels works
    this.nameLabel = scene.add.image(x, y - 24, labelKey);
    this.nameLabel.setOrigin(0.5, 1);
    this.nameLabel.setDepth(100);

    if (isLocal) {
      this.inputManager = new InputManager(scene);
    }

    this.play(`${this.texturePrefix}-idle-down`);
  }

  update(): void {
    // Label position tracks sprite — roundPixels handles sub-pixel snapping automatically
    this.nameLabel.setPosition(this.x, this.y - 24);

    if (!this.inputManager) return;

    const { velocity, direction } = this.inputManager.getMovement(PLAYER_SPEED);
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setVelocity(velocity.x, velocity.y);

    if (direction) {
      if (direction !== this.currentDirection || !this.isMoving) {
        this.currentDirection = direction;
        this.isMoving = true;
        this.play(`${this.texturePrefix}-walk-${direction}`, true);
      }
    } else if (this.isMoving) {
      this.isMoving = false;
      body.setVelocity(0, 0);
      this.play(`${this.texturePrefix}-idle-${this.currentDirection}`, true);
    }
  }

  getDirection(): Direction {
    return this.currentDirection;
  }

  destroy(fromScene?: boolean): void {
    this.nameLabel.destroy();
    super.destroy(fromScene);
  }
}
