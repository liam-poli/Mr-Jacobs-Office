import { useGameStore } from '../stores/gameStore';
import { Player } from '../entities/Player';
import { InteractionManager } from '../systems/InteractionManager';
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

// Items on the floor (tile coordinates)
const ITEM_DEFS = [
  { id: 'item-1', name: 'Coffee Mug', tags: ['WET', 'FRAGILE'], textureKey: 'item-coffee-mug', tileX: 5, tileY: 4 },
  { id: 'item-2', name: 'Wrench', tags: ['METALLIC', 'HEAVY'], textureKey: 'item-wrench', tileX: 8, tileY: 12 },
  { id: 'item-3', name: 'Bucket', tags: ['WET', 'HEAVY'], textureKey: 'item-bucket', tileX: 18, tileY: 6 },
  { id: 'item-4', name: 'Matches', tags: ['HOT'], textureKey: 'item-matches', tileX: 15, tileY: 14 },
];

// Stationary objects (tile coordinates)
const OBJECT_DEFS = [
  { id: 'obj-1', name: 'Coffee Maker', tags: ['METALLIC', 'ELECTRONIC'], states: ['POWERED'], textureKey: 'obj-coffee-maker', tileX: 3, tileY: 3 },
  { id: 'obj-2', name: 'Filing Cabinet', tags: ['METALLIC'], states: ['LOCKED'], textureKey: 'obj-filing-cabinet', tileX: 20, tileY: 3 },
  { id: 'obj-3', name: 'Desk', tags: ['WOODEN'], states: ['UNLOCKED'], textureKey: 'obj-desk', tileX: 12, tileY: 14 },
];

export class OfficeScene extends Phaser.Scene {
  private player!: Player;
  private wallGroup!: Phaser.Physics.Arcade.StaticGroup;
  private objectGroup!: Phaser.Physics.Arcade.StaticGroup;
  private interactionManager!: InteractionManager;
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

    // Collisions
    this.physics.add.collider(this.player, this.wallGroup);

    // Spawn objects and items
    this.spawnObjects();
    this.spawnItems();

    // Player also collides with objects
    this.physics.add.collider(this.player, this.objectGroup);

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

  private spawnObjects() {
    this.objectGroup = this.physics.add.staticGroup();

    for (const obj of OBJECT_DEFS) {
      const px = obj.tileX * TILE_SIZE + TILE_SIZE / 2;
      const py = obj.tileY * TILE_SIZE + TILE_SIZE / 2;

      // Visible sprite
      const sprite = this.add.image(px, py, obj.textureKey);
      sprite.setDepth(py);

      // Invisible collision body
      const collider = this.objectGroup.create(px, py, obj.textureKey) as Phaser.Physics.Arcade.Sprite;
      collider.setVisible(false);
      collider.refreshBody();

      // Initialize state in Zustand
      useGameStore.getState().updateObjectState(obj.id, obj.states);

      // Register with interaction manager (created below, so defer)
      this.events.once('interaction-ready', () => {
        this.interactionManager.registerObject(obj.id, sprite, {
          name: obj.name,
          tags: obj.tags,
          states: obj.states,
        });
      });
    }
  }

  private spawnItems() {
    for (const item of ITEM_DEFS) {
      const px = item.tileX * TILE_SIZE + TILE_SIZE / 2;
      const py = item.tileY * TILE_SIZE + TILE_SIZE / 2;

      const sprite = this.add.image(px, py, item.textureKey);
      sprite.setDepth(py);

      this.events.once('interaction-ready', () => {
        this.interactionManager.registerItem(item.id, sprite, {
          name: item.name,
          tags: item.tags,
          textureKey: item.textureKey,
        });
      });
    }

    // Now create the InteractionManager and fire the registration event
    this.interactionManager = new InteractionManager(this, this.player);
    this.events.emit('interaction-ready');
  }

  update(_time: number, _delta: number) {
    this.player.update();
    this.interactionManager.update();

    // Depth sort player so it renders in front/behind objects correctly
    this.player.setDepth(this.player.y);
  }

  private onStateChange(_state: GameState) {
    // React to Zustand state changes (future: remote player positions)
  }

  private cleanup() {
    this.unsubscribe?.();
    this.interactionManager.destroy();
  }
}
