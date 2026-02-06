import { useGameStore } from '../stores/gameStore';
import { Player } from '../entities/Player';
import { InteractionManager } from '../systems/InteractionManager';
import { fetchRoom } from '../services/roomService';
import { fetchItemsByIds } from '../services/itemService';
import type { RoomDef, GameState, ItemSpawn } from '../types/game';

// Server item IDs to fetch from Supabase
const SERVER_ITEM_IDS = [
  'd636cf6a-6403-4b36-9336-6c8561794a47',
  '80fd53b3-1bd1-4f11-a050-a922ee08294f',
];

// Tile positions for server items (placed on open floor tiles)
const SERVER_ITEM_POSITIONS: Array<{ tileX: number; tileY: number }> = [
  { tileX: 10, tileY: 3 },
  { tileX: 13, tileY: 14 },
];

const TILE_SIZE = 32;

// State → tint color mappings
const STATE_TINTS: Record<string, number> = {
  POWERED: 0xccffff,
  BROKEN: 0xff6666,
  UNPOWERED: 0x666666,
};

// State → indicator texture mappings
const STATE_INDICATORS: Record<string, string> = {
  LOCKED: 'indicator-lock',
  POWERED: 'indicator-power',
  BROKEN: 'indicator-broken',
};

interface ObjectVisual {
  sprite: Phaser.GameObjects.Image;
  indicator?: Phaser.GameObjects.Image;
  tween?: Phaser.Tweens.Tween;
}

export class OfficeScene extends Phaser.Scene {
  private player!: Player;
  private wallGroup!: Phaser.Physics.Arcade.StaticGroup;
  private objectGroup!: Phaser.Physics.Arcade.StaticGroup;
  private furnitureGroup!: Phaser.Physics.Arcade.StaticGroup;
  private interactionManager!: InteractionManager;
  private objectVisuals = new Map<string, ObjectVisual>();
  private unsubscribe?: () => void;

  constructor() {
    super('OfficeScene');
  }

  async create() {
    // Fetch room definition and server items in parallel
    const [roomDef, serverItems] = await Promise.all([
      fetchRoom('Main Office'),
      fetchItemsByIds(SERVER_ITEM_IDS),
    ]);

    // Dynamically load server item sprite textures
    const serverItemSpawns = await this.loadServerItems(serverItems);

    // Build the room from the tile map
    this.buildRoom(roomDef);

    // Place furniture (desks, plants, screen)
    this.placeFurniture(roomDef);

    // Spawn local player at center of room
    const startX = Math.floor(roomDef.width / 2) * TILE_SIZE + TILE_SIZE / 2;
    const startY = Math.floor(roomDef.height / 2) * TILE_SIZE + TILE_SIZE / 2;
    this.player = new Player(this, startX, startY, 'player-0', 'PLAYER 1', true);

    // Collisions
    this.physics.add.collider(this.player, this.wallGroup);
    this.physics.add.collider(this.player, this.furnitureGroup);

    // Merge server items into room item spawns
    const allItems: RoomDef = {
      ...roomDef,
      itemSpawns: [...roomDef.itemSpawns, ...serverItemSpawns],
    };

    // Spawn objects and items
    this.spawnObjects(roomDef);
    this.spawnItems(allItems);

    // Player also collides with objects
    this.physics.add.collider(this.player, this.objectGroup);

    // Set world bounds to room size
    const worldW = roomDef.width * TILE_SIZE;
    const worldH = roomDef.height * TILE_SIZE;
    this.physics.world.setBounds(0, 0, worldW, worldH);

    // Camera: instant follow + round pixels for crisp pixel art (no sub-pixel jitter)
    // Follow offset pushes the player up on screen; extra camera bounds below the room
    // give scroll room so the bottom wall stays visible above the inventory bar overlay.
    this.cameras.main.startFollow(this.player, true, 1, 1);
    this.cameras.main.setFollowOffset(0, 30);
    this.cameras.main.setZoom(2);
    this.cameras.main.setBounds(0, 0, worldW, worldH + 48);
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

  private buildRoom(roomDef: RoomDef) {
    this.wallGroup = this.physics.add.staticGroup();

    for (let row = 0; row < roomDef.tileMap.length; row++) {
      for (let col = 0; col < roomDef.tileMap[row].length; col++) {
        const x = col * TILE_SIZE + TILE_SIZE / 2;
        const y = row * TILE_SIZE + TILE_SIZE / 2;
        const tile = roomDef.tileMap[row][col];

        if (tile === 0) {
          this.add.image(x, y, 'floor-tile');
        } else if (tile === 2) {
          this.add.image(x, y, 'carpet-tile');
        } else {
          this.add.image(x, y, 'wall-tile');
          const wall = this.wallGroup.create(x, y, 'wall-tile') as Phaser.Physics.Arcade.Sprite;
          wall.setVisible(false);
          wall.refreshBody();
        }
      }
    }
  }

  private placeFurniture(roomDef: RoomDef) {
    this.furnitureGroup = this.physics.add.staticGroup();

    for (const furn of roomDef.furniture) {
      const px = furn.tileX * TILE_SIZE + TILE_SIZE / 2;
      const py = furn.tileY * TILE_SIZE + TILE_SIZE / 2;

      const sprite = this.add.image(px, py, furn.textureKey);
      sprite.setDepth(py);

      if (furn.hasCollision) {
        const body = this.furnitureGroup.create(px, py, furn.textureKey) as Phaser.Physics.Arcade.Sprite;
        body.setVisible(false);
        body.refreshBody();
      }
    }
  }

  private async loadServerItems(
    serverItems: Awaited<ReturnType<typeof fetchItemsByIds>>,
  ): Promise<ItemSpawn[]> {
    const spawns: ItemSpawn[] = [];
    let loadCount = 0;

    for (let i = 0; i < serverItems.length; i++) {
      const item = serverItems[i];
      if (!item.sprite_url) continue;

      const pos = SERVER_ITEM_POSITIONS[i] ?? { tileX: 12 + i, tileY: 9 };
      const textureKey = `server-item-${item.id}`;

      this.load.image(textureKey, item.sprite_url);
      loadCount++;

      spawns.push({
        id: item.id,
        name: item.name,
        tags: item.tags,
        textureKey,
        tileX: pos.tileX,
        tileY: pos.tileY,
        imageUrl: item.sprite_url,
      });
    }

    // Start the dynamic load and wait for completion
    if (loadCount > 0) {
      await new Promise<void>((resolve) => {
        this.load.once('complete', resolve);
        this.load.start();
      });
    }

    return spawns;
  }

  private spawnObjects(roomDef: RoomDef) {
    this.objectGroup = this.physics.add.staticGroup();

    for (const obj of roomDef.objectPlacements) {
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

      // Apply initial visual state
      const visual: ObjectVisual = { sprite };
      this.objectVisuals.set(obj.id, visual);
      this.applyStateVisuals(obj.id, obj.states);

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

  private spawnItems(roomDef: RoomDef) {
    for (const item of roomDef.itemSpawns) {
      const px = item.tileX * TILE_SIZE + TILE_SIZE / 2;
      const py = item.tileY * TILE_SIZE + TILE_SIZE / 2;

      const sprite = this.add.image(px, py, item.textureKey);
      sprite.setDepth(py);

      // Scale large textures (e.g. server sprites) to match 32px item size
      const frame = sprite.frame;
      if (frame.width > 32 || frame.height > 32) {
        sprite.setScale(32 / Math.max(frame.width, frame.height));
      }

      this.events.once('interaction-ready', () => {
        this.interactionManager.registerItem(item.id, sprite, {
          name: item.name,
          tags: item.tags,
          textureKey: item.textureKey,
          imageUrl: item.imageUrl,
        });
      });
    }

    // Now create the InteractionManager and fire the registration event
    this.interactionManager = new InteractionManager(this, this.player);
    this.events.emit('interaction-ready');
  }

  private applyStateVisuals(objectId: string, states: string[]) {
    const visual = this.objectVisuals.get(objectId);
    if (!visual) return;

    // Apply tint based on first matching state
    let tintApplied = false;
    for (const state of states) {
      if (STATE_TINTS[state]) {
        visual.sprite.setTint(STATE_TINTS[state]);
        tintApplied = true;
        break;
      }
    }
    if (!tintApplied) {
      visual.sprite.clearTint();
    }

    // Remove old indicator + tween
    if (visual.tween) {
      visual.tween.destroy();
      visual.tween = undefined;
    }
    if (visual.indicator) {
      visual.indicator.destroy();
      visual.indicator = undefined;
    }

    // Add indicator for first matching state
    for (const state of states) {
      if (STATE_INDICATORS[state] && this.textures.exists(STATE_INDICATORS[state])) {
        const ind = this.add.image(
          visual.sprite.x + 12,
          visual.sprite.y - 12,
          STATE_INDICATORS[state],
        );
        ind.setDepth(visual.sprite.depth + 1);

        // Pulse animation
        visual.tween = this.tweens.add({
          targets: ind,
          alpha: { from: 1, to: 0.3 },
          duration: 800,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut',
        });

        visual.indicator = ind;
        break;
      }
    }
  }

  update(_time: number, _delta: number) {
    if (!this.player) return; // async create() still loading
    this.player.update();
    this.interactionManager.update();

    // Depth sort player so it renders in front/behind objects correctly
    this.player.setDepth(this.player.y);
  }

  private onStateChange(state: GameState) {
    // Update object visuals when states change
    for (const [objectId, objectState] of Object.entries(state.objectStates)) {
      this.applyStateVisuals(objectId, objectState.states);
    }
  }

  private cleanup() {
    this.unsubscribe?.();
    this.interactionManager.destroy();
    for (const visual of this.objectVisuals.values()) {
      visual.tween?.destroy();
      visual.indicator?.destroy();
    }
    this.objectVisuals.clear();
  }
}
