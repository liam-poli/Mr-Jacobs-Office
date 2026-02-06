import { useGameStore } from '../stores/gameStore';
import type { GameState } from '../types/game';

export class OfficeScene extends Phaser.Scene {
  private unsubscribe?: () => void;

  constructor() {
    super('OfficeScene');
  }

  create() {
    this.cameras.main.setBackgroundColor('#1a1a2e');

    // Placeholder room
    const graphics = this.add.graphics();
    graphics.fillStyle(0x16213e, 1);
    graphics.fillRect(80, 60, 800, 520);

    // Placeholder grid lines (floor tiles)
    graphics.lineStyle(1, 0x0f3460, 0.3);
    for (let x = 80; x <= 880; x += 40) {
      graphics.lineBetween(x, 60, x, 580);
    }
    for (let y = 60; y <= 580; y += 40) {
      graphics.lineBetween(80, y, 880, y);
    }

    this.add
      .text(480, 300, 'J.A.C.O.B.S. OFFICE', {
        fontSize: '28px',
        color: '#e94560',
        fontFamily: 'monospace',
      })
      .setOrigin(0.5);

    this.add
      .text(480, 340, 'PRODUCTIVITY IS JOY.', {
        fontSize: '14px',
        color: '#537791',
        fontFamily: 'monospace',
      })
      .setOrigin(0.5);

    // Subscribe to Zustand store
    this.unsubscribe = useGameStore.subscribe((state) => {
      this.onStateChange(state);
    });

    // Signal scene ready
    useGameStore.getState().setSceneReady('OfficeScene');
  }

  update(_time: number, _delta: number) {
    // Game loop — zero allocations
  }

  private onStateChange(_state: GameState) {
    // React to Zustand state changes
  }

  shutdown() {
    this.unsubscribe?.();
  }
}
