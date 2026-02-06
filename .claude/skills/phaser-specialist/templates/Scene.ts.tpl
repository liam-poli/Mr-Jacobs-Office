import { useGameStore } from '../../stores/gameStore';

export class __SCENE_NAME__ extends Phaser.Scene {
  private unsubscribe?: () => void;

  constructor() {
    super('__SCENE_NAME__');
  }

  preload() {
    // Assets loaded via pack.json in BootScene
    // Only load scene-specific dynamic assets here
  }

  create() {
    // Subscribe to Zustand store for state changes
    this.unsubscribe = useGameStore.subscribe((state) => {
      this.onStateChange(state);
    });

    // Notify React that scene is ready
    useGameStore.getState().setSceneReady('__SCENE_NAME__');
  }

  update(time: number, delta: number) {
    // Game loop — zero allocations here
  }

  private onStateChange(state: GameState) {
    // React to Zustand state changes
    // Update sprites, effects, etc.
  }

  shutdown() {
    // Clean up Zustand subscription
    this.unsubscribe?.();
  }
}
