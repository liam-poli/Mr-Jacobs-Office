import { useGameStore } from '../stores/gameStore';
import { Player } from '../entities/Player';
import type { GameState } from '../types/game';

const TILE_SIZE = 32;

// Simple room layout: 0 = floor, 1 = wall
// 25 columns x 18 rows
const ROOM_MAP: number[][] = [
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
];

export class OfficeScene extends Phaser.Scene {
  private player!: Player;
  private wallGroup!: Phaser.Physics.Arcade.StaticGroup;
  private unsubscribe?: () => void;

  constructor() {
    super('OfficeScene');
  }

  create() {
    // Build the room from the tile map
    this.buildRoom();

    // Spawn local player at center of room
    const startX = 12 * TILE_SIZE + TILE_SIZE / 2;
    const startY = 9 * TILE_SIZE + TILE_SIZE / 2;
    this.player = new Player(this, startX, startY, 'player-0', 'PLAYER 1', true);

    // Player collides with walls
    this.physics.add.collider(this.player, this.wallGroup);

    // Set world bounds to room size
    const worldW = ROOM_MAP[0].length * TILE_SIZE;
    const worldH = ROOM_MAP.length * TILE_SIZE;
    this.physics.world.setBounds(0, 0, worldW, worldH);

    // Camera: instant follow + round pixels for crisp pixel art (no sub-pixel jitter)
    this.cameras.main.startFollow(this.player, true, 1, 1);
    this.cameras.main.setZoom(2);
    this.cameras.main.setBounds(0, 0, worldW, worldH);
    this.cameras.main.setRoundPixels(true);

    // Subscribe to Zustand store
    this.unsubscribe = useGameStore.subscribe((state) => {
      this.onStateChange(state);
    });

    // Clean up subscription when scene shuts down
    this.events.on(Phaser.Scenes.Events.SHUTDOWN, this.cleanup, this);

    // Wait for actual rendered frames + ScaleManager to settle before revealing.
    // delayedCall fires during update (BEFORE render), so we use the game-level
    // postrender event to guarantee the scene has actually been painted to canvas
    // and the ScaleManager has finished its FIT + CENTER_BOTH adjustments.
    const createTime = performance.now();
    const onPostRender = () => {
      if (performance.now() - createTime >= 400) {
        this.game.events.off('postrender', onPostRender);
        useGameStore.getState().setSceneReady('OfficeScene');
      }
    };
    this.game.events.on('postrender', onPostRender);
  }

  private buildRoom() {
    this.wallGroup = this.physics.add.staticGroup();

    for (let row = 0; row < ROOM_MAP.length; row++) {
      for (let col = 0; col < ROOM_MAP[row].length; col++) {
        const x = col * TILE_SIZE + TILE_SIZE / 2;
        const y = row * TILE_SIZE + TILE_SIZE / 2;

        if (ROOM_MAP[row][col] === 0) {
          this.add.image(x, y, 'floor-tile');
        } else {
          this.add.image(x, y, 'wall-tile');
          const wall = this.wallGroup.create(x, y, 'wall-tile') as Phaser.Physics.Arcade.Sprite;
          wall.setVisible(false);
          wall.refreshBody();
        }
      }
    }
  }

  update(_time: number, _delta: number) {
    this.player.update();
  }

  private onStateChange(_state: GameState) {
    // React to Zustand state changes (future: remote player positions)
  }

  private cleanup() {
    this.unsubscribe?.();
  }
}
