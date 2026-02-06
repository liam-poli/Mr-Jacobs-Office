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
  private postUpdateHandler: () => void;

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

    // Render label at 2x so it's 1:1 screen pixels after camera zoom (avoids NEAREST blur)
    const LABEL_SCALE = 2;
    const labelKey = `label-${textureKey}`;
    const tempText = scene.add.text(0, 0, playerName, {
      fontFamily: '"Courier New", monospace',
      fontSize: `${10 * LABEL_SCALE}px`,
      color: '#ffffff',
      backgroundColor: '#1a1a2ecc',
      padding: { x: 3 * LABEL_SCALE, y: 1 * LABEL_SCALE },
    });
    tempText.setOrigin(0.5, 1);

    const tw = Math.ceil(tempText.width);
    const th = Math.ceil(tempText.height);
    const rt = scene.add.renderTexture(0, 0, tw, th);
    rt.draw(tempText, tw / 2, th);
    rt.saveTexture(labelKey);
    rt.destroy();
    tempText.destroy();

    this.nameLabel = scene.add.image(x, y - 24, labelKey);
    this.nameLabel.setOrigin(0.5, 1);
    this.nameLabel.setScale(1 / LABEL_SCALE);
    this.nameLabel.setDepth(100);
    this.nameLabel.setVisible(false);

    if (isLocal) {
      this.inputManager = new InputManager(scene);
    }

    // Sync label AFTER physics resolves — no manual rounding; camera roundPixels
    // handles both sprite and label identically so they always shift together.
    this.postUpdateHandler = () => {
      this.nameLabel.setPosition(this.x, this.y - 24);
    };
    scene.events.on(Phaser.Scenes.Events.POST_UPDATE, this.postUpdateHandler, this);

    this.play(`${this.texturePrefix}-idle-down`);
  }

  update(): void {
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
    this.scene.events.off(Phaser.Scenes.Events.POST_UPDATE, this.postUpdateHandler, this);
    this.nameLabel.destroy();
    super.destroy(fromScene);
  }
}
