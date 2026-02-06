import { useGameStore } from '../stores/gameStore';
import { useJacobsStore } from '../stores/jacobsStore';
import { Player } from '../entities/Player';
import { InteractionManager } from '../systems/InteractionManager';
import { fetchRoom } from '../services/roomService';
import { soundService } from '../services/soundService';
import { startJacobsLoop, stopJacobsLoop } from '../services/jacobsService';
import type { RoomDef, GameState } from '../types/game';
import type { JacobsMood } from '../types/jacobs';

const TILE_SIZE = 32;

// State → tint color mappings
const STATE_TINTS: Record<string, number> = {
  POWERED: 0xccffff,
  UNPOWERED: 0x666666,
  BROKEN: 0xff6666,
  BURNING: 0xff8844,
  FLOODED: 0x6688cc,
  JAMMED: 0xccaa44,
  HACKED: 0x44ff88,
  CONTAMINATED: 0xaa44cc,
};

// State → indicator texture mappings
const STATE_INDICATORS: Record<string, string> = {
  LOCKED: 'indicator-lock',
  POWERED: 'indicator-power',
  BROKEN: 'indicator-broken',
  BURNING: 'indicator-burning',
  FLOODED: 'indicator-flooded',
  JAMMED: 'indicator-jammed',
  HACKED: 'indicator-hacked',
  CONTAMINATED: 'indicator-contaminated',
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
  private interactionManager!: InteractionManager;
  private objectVisuals = new Map<string, ObjectVisual>();
  private unsubscribe?: () => void;
  private jacobsScreenSprite: Phaser.GameObjects.Image | null = null;
  private jacobsStaticOverlay: Phaser.GameObjects.Image | null = null;
  private jacobsUnsubscribe?: () => void;

  constructor() {
    super('OfficeScene');
  }

  async create() {
    const roomDef = await fetchRoom();

    // Load any sprites from the DB (server-hosted textures)
    await this.loadSprites(roomDef);

    // Build the room from the tile map
    this.buildRoom(roomDef);

    // Spawn local player at center of room
    const startX = Math.floor(roomDef.width / 2) * TILE_SIZE + TILE_SIZE / 2;
    const startY = Math.floor(roomDef.height / 2) * TILE_SIZE + TILE_SIZE / 2;
    this.player = new Player(this, startX, startY, 'player-0', 'PLAYER 1', true);

    // Collisions
    this.physics.add.collider(this.player, this.wallGroup);

    // Spawn objects and items
    this.spawnObjects(roomDef);
    this.spawnItems(roomDef);

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

    // Subscribe to Jacobs mood changes
    let prevMood = useJacobsStore.getState().mood;
    this.jacobsUnsubscribe = useJacobsStore.subscribe((state) => {
      if (state.mood !== prevMood) {
        prevMood = state.mood;
        this.onJacobsMoodChange(state.mood);
      }
    });

    // Extract Jacobs face textures as data URLs for the React speech panel
    const moods = ['PLEASED', 'NEUTRAL', 'SUSPICIOUS', 'DISAPPOINTED', 'UNHINGED'] as const;
    for (const m of moods) {
      const key = `jacobs-face-${m}`;
      if (this.textures.exists(key)) {
        const src = this.textures.get(key).getSourceImage() as HTMLCanvasElement;
        useJacobsStore.getState().setFaceDataUrl(m, src.toDataURL());
      }
    }

    // Start the Jacobs brain loop
    startJacobsLoop();

    // Clean up subscription when scene shuts down
    this.events.on(Phaser.Scenes.Events.SHUTDOWN, this.cleanup, this);

    // Initialize sound system and start ambient music
    soundService.init();
    soundService.playMusic('ambient-office');

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
        } else if (tile === 3) {
          // Desk: floor underneath + desk sprite with depth sorting + collision
          this.add.image(x, y, 'floor-tile');
          this.add.image(x, y, 'desk-tile').setDepth(y);
          const wall = this.wallGroup.create(x, y, 'desk-tile') as Phaser.Physics.Arcade.Sprite;
          wall.setVisible(false);
          wall.refreshBody();
        } else {
          this.add.image(x, y, 'wall-tile');
          const wall = this.wallGroup.create(x, y, 'wall-tile') as Phaser.Physics.Arcade.Sprite;
          wall.setVisible(false);
          wall.refreshBody();
        }
      }
    }
  }

  private async loadSprites(roomDef: RoomDef): Promise<void> {
    let loadCount = 0;

    for (const item of roomDef.itemSpawns) {
      if (!item.spriteUrl) continue;
      const key = `sprite-item-${item.item_id}`;
      if (!this.textures.exists(key)) {
        this.load.image(key, item.spriteUrl);
        loadCount++;
      }
    }

    for (const obj of roomDef.objectPlacements) {
      if (!obj.spriteUrl) continue;
      const key = `sprite-obj-${obj.object_id}`;
      if (!this.textures.exists(key)) {
        this.load.image(key, obj.spriteUrl);
        loadCount++;
      }
    }

    if (loadCount > 0) {
      await new Promise<void>((resolve) => {
        this.load.once('complete', resolve);
        this.load.start();
      });
    }
  }

  private spawnObjects(roomDef: RoomDef) {
    this.objectGroup = this.physics.add.staticGroup();

    for (const obj of roomDef.objectPlacements) {
      const px = obj.tileX * TILE_SIZE + TILE_SIZE / 2;
      const py = obj.tileY * TILE_SIZE + TILE_SIZE / 2;
      const textureKey = obj.spriteUrl
        ? `sprite-obj-${obj.object_id}`
        : 'obj-default';

      // Visible sprite
      const sprite = this.add.image(px, py, textureKey);
      sprite.setDepth(py);

      // Scale large textures to fit 32px
      const frame = sprite.frame;
      if (frame.width > TILE_SIZE || frame.height > TILE_SIZE) {
        sprite.setScale(TILE_SIZE / Math.max(frame.width, frame.height));
      }

      // Invisible collision body
      const collider = this.objectGroup.create(px, py, 'obj-default') as Phaser.Physics.Arcade.Sprite;
      collider.setVisible(false);
      collider.refreshBody();

      // Initialize state in Zustand
      useGameStore.getState().updateObjectState(obj.id, obj.states);

      // Register in Jacobs' name map for effect resolution
      useJacobsStore.getState().registerObject(obj.id, obj.name);

      // Override Jacobs Screen with procedural face texture
      if (obj.name.toLowerCase().includes('jacobs') && obj.name.toLowerCase().includes('screen')) {
        sprite.setTexture('jacobs-face-NEUTRAL');
        sprite.setScale(1);
        this.jacobsScreenSprite = sprite;
        this.jacobsStaticOverlay = this.add.image(px, py, 'jacobs-static');
        this.jacobsStaticOverlay.setDepth(py + 1);
        this.jacobsStaticOverlay.setAlpha(0.05);
      }

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
      const textureKey = item.spriteUrl
        ? `sprite-item-${item.item_id}`
        : 'item-default';

      const sprite = this.add.image(px, py, textureKey);
      sprite.setDepth(py);

      // Scale large textures (e.g. server sprites) to match 32px item size
      const frame = sprite.frame;
      if (frame.width > 32 || frame.height > 32) {
        sprite.setScale(32 / Math.max(frame.width, frame.height));
      }

      this.events.once('interaction-ready', () => {
        this.interactionManager.registerItem(item.id, sprite, {
          item_id: item.item_id,
          name: item.name,
          tags: item.tags,
          spriteUrl: item.spriteUrl,
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

  private onJacobsMoodChange(mood: JacobsMood): void {
    if (!this.jacobsScreenSprite) return;

    const textureKey = `jacobs-face-${mood}`;
    if (this.textures.exists(textureKey)) {
      this.jacobsScreenSprite.setTexture(textureKey);
    }

    // Static intensity scales with mood severity
    const staticAlpha: Record<string, number> = {
      PLEASED: 0.02,
      NEUTRAL: 0.05,
      SUSPICIOUS: 0.12,
      DISAPPOINTED: 0.25,
      UNHINGED: 0.45,
    };
    if (this.jacobsStaticOverlay) {
      this.jacobsStaticOverlay.setAlpha(staticAlpha[mood] ?? 0.05);
    }

    // Screen flicker for worse moods
    if (mood === 'DISAPPOINTED' || mood === 'UNHINGED') {
      this.tweens.add({
        targets: this.jacobsScreenSprite,
        alpha: { from: 1, to: 0.6 },
        duration: mood === 'UNHINGED' ? 80 : 150,
        yoyo: true,
        repeat: mood === 'UNHINGED' ? 5 : 2,
        ease: 'Sine.easeInOut',
      });
    }
  }

  private cleanup() {
    soundService.stopMusic();
    stopJacobsLoop();
    this.unsubscribe?.();
    this.jacobsUnsubscribe?.();
    this.interactionManager.destroy();
    for (const visual of this.objectVisuals.values()) {
      visual.tween?.destroy();
      visual.indicator?.destroy();
    }
    this.objectVisuals.clear();
  }
}
