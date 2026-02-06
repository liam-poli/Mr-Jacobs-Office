import Phaser from 'phaser';
import type { Direction } from '../types';

export class InputManager {
  private cursors: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd: {
    W: Phaser.Input.Keyboard.Key;
    A: Phaser.Input.Keyboard.Key;
    S: Phaser.Input.Keyboard.Key;
    D: Phaser.Input.Keyboard.Key;
  };

  // Reusable vector — zero allocations in update()
  private readonly velocity = new Phaser.Math.Vector2(0, 0);

  constructor(scene: Phaser.Scene) {
    const keyboard = scene.input.keyboard!;
    this.cursors = keyboard.createCursorKeys();
    this.wasd = {
      W: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      A: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      S: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      D: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
    };
  }

  getMovement(speed: number): { velocity: Phaser.Math.Vector2; direction: Direction | null } {
    this.velocity.set(0, 0);
    let direction: Direction | null = null;

    const left = this.cursors.left.isDown || this.wasd.A.isDown;
    const right = this.cursors.right.isDown || this.wasd.D.isDown;
    const up = this.cursors.up.isDown || this.wasd.W.isDown;
    const down = this.cursors.down.isDown || this.wasd.S.isDown;

    if (left && !right) this.velocity.x = -1;
    else if (right && !left) this.velocity.x = 1;

    if (up && !down) this.velocity.y = -1;
    else if (down && !up) this.velocity.y = 1;

    if (this.velocity.length() > 0) {
      this.velocity.normalize().scale(speed);

      // Direction priority: vertical wins for tie-breaking (front-facing default)
      if (down && !up) direction = 'down';
      else if (up && !down) direction = 'up';
      else if (left && !right) direction = 'left';
      else if (right && !left) direction = 'right';
    }

    return { velocity: this.velocity, direction };
  }
}
