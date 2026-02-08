import { useGameStore } from '../stores/gameStore';
import { useJacobsStore } from '../stores/jacobsStore';
import { Player } from '../entities/Player';
import { InteractionManager } from '../systems/InteractionManager';
import { fetchRoom } from '../services/roomService';
import { soundService } from '../services/soundService';
import { startJacobsLoop, stopJacobsLoop } from '../services/jacobsService';
import { startJobCycle, stopJobCycle } from '../services/jobService';
import { MatrixBackground } from '../effects/MatrixBackground';
import type { RoomDef, GameState, DoorTarget } from '../types/game';
import type { JacobsMood } from '../types/jacobs';
import { ALL_MOODS, MOOD_SEVERITY } from '../utils/moodUtils';

const TILE_SIZE = 32;

// State → tint color mappings
const STATE_TINTS: Record<string, number> = {
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
  UNPOWERED: 'indicator-unpowered',
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

interface SceneData {
  roomId?: string;
  spawnX?: number;
  spawnY?: number;
}

interface DoorZone {
  zone: Phaser.GameObjects.Zone;
  objectId: string;
  doorTarget: DoorTarget;
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
  private jacobsBaseY = 0;
  private jacobsCurrentMood: JacobsMood = 'NEUTRAL';
  private jacobsBobTween?: Phaser.Tweens.Tween;
  private jacobsBlinkTimer?: Phaser.Time.TimerEvent;
  private jacobsGlitchTimer?: Phaser.Time.TimerEvent;
  private sceneData: SceneData = {};
  private doorZones: DoorZone[] = [];
  private transitioning = false;
  private doorGraceUntil = 0;
  private matrixBg: MatrixBackground | null = null;
  private worldStripped = false;

  constructor() {
    super('OfficeScene');
  }

  init(data?: SceneData) {
    this.sceneData = data ?? {};
    this.doorZones = [];
    this.transitioning = false;
    this.matrixBg = null;
    this.objectVisuals = new Map();
    this.player = null!;
    this.worldStripped = false;
  }

  async create() {
   try {
    const roomDef = this.sceneData.roomId
      ? await fetchRoom({ id: this.sceneData.roomId })
      : await fetchRoom();

    // Track current room
    useGameStore.getState().setCurrentRoomId(roomDef.id);

    // Load any sprites from the DB (server-hosted textures)
    await this.loadSprites(roomDef);

    // Build the room from the tile map
    this.buildRoom(roomDef);

    // Ambient matrix background effect (renders behind room tiles)
    this.matrixBg = new MatrixBackground(this);

    // Spawn local player — use scene data position if provided (room transition), otherwise center
    const spawnTileX = this.sceneData.spawnX ?? Math.floor(roomDef.width / 2);
    const spawnTileY = this.sceneData.spawnY ?? Math.floor(roomDef.height / 2);
    const startX = spawnTileX * TILE_SIZE + TILE_SIZE / 2;
    const startY = spawnTileY * TILE_SIZE + TILE_SIZE / 2;
    this.player = new Player(this, startX, startY, 'player-0', 'PLAYER 1', true);

    // Collisions
    this.physics.add.collider(this.player, this.wallGroup);

    // Spawn objects and items
    this.spawnObjects(roomDef);
    this.spawnItems(roomDef);

    // Restore cached object states from previous visits (overrides DB defaults)
    useGameStore.getState().restoreRoomStates(roomDef.id);

    // Player also collides with objects
    this.physics.add.collider(this.player, this.objectGroup);

    // Set world bounds to room size
    const worldW = roomDef.width * TILE_SIZE;
    const worldH = roomDef.height * TILE_SIZE;
    this.physics.world.setBounds(0, 0, worldW, worldH);

    // Camera: instant follow + round pixels for crisp pixel art (no sub-pixel jitter)
    const cam = this.cameras.main;
    cam.startFollow(this.player, true, 1, 1);
    cam.setFollowOffset(0, 30);
    cam.setZoom(2);
    cam.setRoundPixels(true);

    // Center small rooms: if the room is smaller than the viewport (at zoom),
    // expand the bounds so the room content sits in the middle of the screen.
    const viewW = cam.width / cam.zoom;
    const viewH = cam.height / cam.zoom;
    const roomH = worldH + 48; // extra padding for inventory overlay
    const boundsW = Math.max(worldW, viewW);
    const boundsH = Math.max(roomH, viewH);
    const boundsX = (worldW - boundsW) / 2;
    const boundsY = (roomH - boundsH) / 2;
    cam.setBounds(boundsX, boundsY, boundsW, boundsH);

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
    for (const m of ALL_MOODS) {
      const key = `jacobs-face-${m}`;
      if (this.textures.exists(key)) {
        const src = this.textures.get(key).getSourceImage() as HTMLCanvasElement;
        useJacobsStore.getState().setFaceDataUrl(m, src.toDataURL());
      }
      const blinkKey = `jacobs-face-${m}-blink`;
      if (this.textures.exists(blinkKey)) {
        const blinkSrc = this.textures.get(blinkKey).getSourceImage() as HTMLCanvasElement;
        useJacobsStore.getState().setBlinkFaceDataUrl(m, blinkSrc.toDataURL());
      }
    }

    // Start the Jacobs brain loop and job cycle
    startJacobsLoop();
    startJobCycle();

    // Clean up subscription when scene shuts down
    this.events.on(Phaser.Scenes.Events.SHUTDOWN, this.cleanup, this);

    // Initialize sound system and start ambient music
    soundService.init();
    soundService.setMusicLevel(1);

    // Wait for actual rendered frames + ScaleManager to settle before revealing.
    const createTime = performance.now();
    const onPostRender = () => {
      if (performance.now() - createTime >= 400) {
        this.game.events.off('postrender', onPostRender);
        useGameStore.getState().setSceneReady('OfficeScene');
      }
    };
    this.game.events.on('postrender', onPostRender);

    // Grace period: don't trigger door overlaps for 500ms after spawn
    // (prevents instant bounce-back when spawning on/near a door)
    this.doorGraceUntil = Date.now() + 500;

    // Fade in camera on room entry (smooth transition between rooms)
    this.cameras.main.fadeIn(400, 0, 0, 0);
   } catch (err) {
    console.error('OfficeScene create() failed:', err);
   }
  }

  private buildRoom(roomDef: RoomDef) {
    this.wallGroup = this.physics.add.staticGroup();

    for (let row = 0; row < roomDef.tileMap.length; row++) {
      for (let col = 0; col < roomDef.tileMap[row].length; col++) {
        const x = col * TILE_SIZE + TILE_SIZE / 2;
        const y = row * TILE_SIZE + TILE_SIZE / 2;
        const tile = roomDef.tileMap[row][col];

        if (tile === 0) {
          const fl = this.add.image(x, y, 'floor-tile');
          fl.setDisplaySize(TILE_SIZE, TILE_SIZE);
        } else if (tile === 2) {
          const carpet = this.add.image(x, y, 'carpet-tile');
          carpet.setDisplaySize(TILE_SIZE, TILE_SIZE);
        } else if (tile === 3) {
          // Desk: floor underneath + desk top with depth sorting + collision
          const fl = this.add.image(x, y, 'floor-tile');
          fl.setDisplaySize(TILE_SIZE, TILE_SIZE);
          const dk = this.add.image(x, y, 'desk-tile');
          dk.setDisplaySize(TILE_SIZE, TILE_SIZE);
          dk.setDepth(y);
          const wall = this.wallGroup.create(x, y, 'desk-tile') as Phaser.Physics.Arcade.Sprite;
          wall.setVisible(false);
          wall.setDisplaySize(TILE_SIZE, TILE_SIZE);
          wall.refreshBody();
        } else {
          this.add.image(x, y, 'wall-tile');
          // Top-side cap for wall tiles (adds height illusion)
          const hasWallAbove = row > 0 && roomDef.tileMap[row - 1][col] === 1;
          if (!hasWallAbove && this.textures.exists('wall-cap')) {
            const cap = this.add.image(x, y, 'wall-cap');
            cap.setDisplaySize(TILE_SIZE, TILE_SIZE);
          }
          // Baseboard/shadow at floor edge for wall tiles
          const tileBelow = row + 1 < roomDef.tileMap.length ? roomDef.tileMap[row + 1][col] : -1;
          const isWallBelow = tileBelow === 1;
          if (!isWallBelow && this.textures.exists('wall-base')) {
            const base = this.add.image(x, y, 'wall-base');
            base.setDisplaySize(TILE_SIZE, TILE_SIZE);
          }
          const wall = this.wallGroup.create(x, y, 'wall-tile') as Phaser.Physics.Arcade.Sprite;
          wall.setVisible(false);
          wall.refreshBody();
        }
      }
    }

    // Second pass: add desk faces where desk tiles border non-desk tiles below
    const map = roomDef.tileMap;
    for (let row = 0; row < map.length; row++) {
      for (let col = 0; col < map[row].length; col++) {
        if (map[row][col] !== 3) continue;
        const tileBelow = row + 1 < map.length ? map[row + 1][col] : -1;
        if (tileBelow !== 3 && tileBelow !== -1 && this.textures.exists('desk-face')) {
          const x = col * TILE_SIZE + TILE_SIZE / 2;
          const faceY = (row + 1) * TILE_SIZE + TILE_SIZE / 2;
          const df = this.add.image(x, faceY, 'desk-face');
          df.setDisplaySize(TILE_SIZE, TILE_SIZE);
          df.setDepth(faceY);
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
      const key = `sprite-obj-${obj.object_id}-${obj.direction}`;
      if (!this.textures.exists(key)) {
        this.load.image(key, obj.spriteUrl);
        loadCount++;
      }
    }

    if (loadCount > 0) {
      await new Promise<void>((resolve) => {
        this.load.once('complete', () => {
          // Ensure all dynamically loaded sprites use nearest-neighbor filtering
          for (const item of roomDef.itemSpawns) {
            if (!item.spriteUrl) continue;
            const key = `sprite-item-${item.item_id}`;
            this.textures.get(key)?.setFilter(Phaser.Textures.FilterMode.NEAREST);
          }
          for (const obj of roomDef.objectPlacements) {
            if (!obj.spriteUrl) continue;
            const key = `sprite-obj-${obj.object_id}-${obj.direction}`;
            this.textures.get(key)?.setFilter(Phaser.Textures.FilterMode.NEAREST);
          }
          resolve();
        });
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
        ? `sprite-obj-${obj.object_id}-${obj.direction}`
        : 'obj-default';

      // Visible sprite
      const sprite = this.add.image(px, py, textureKey);
      sprite.setDepth(py);

      // Normalize sprite to 1-tile size, then apply catalog scale multiplier
      const frame = sprite.frame;
      const baseScale = TILE_SIZE / Math.max(frame.width, frame.height);
      sprite.setScale(baseScale * obj.scale);

      // Shift upward so scaled objects bleed up (perspective), not down
      const extraHeight = sprite.displayHeight - TILE_SIZE;
      if (extraHeight > 0) {
        sprite.y -= extraHeight / 2;
      }

      // Nudge doors to align with walls based on facing direction
      if (obj.door_target) {
        if (obj.direction === 'left') {
          sprite.x += TILE_SIZE / 2;
        } else if (obj.direction === 'right') {
          sprite.x -= TILE_SIZE / 2;
        } else if (obj.direction === 'down') {
          sprite.x -= 1;
          sprite.y += 15;
        }
      }

      // Shadow FX — subtle ground shadow beneath object (skip for doors)
      if (!obj.door_target) {
        sprite.postFX?.addShadow(0, 4, 0.02, 0.5, 0x000000, 6, 0.4);
      }

      // Door objects with a target: use overlap zone (walkable portal)
      // Non-door objects: normal collision body
      if (obj.door_target) {
        const zone = this.add.zone(px, py, TILE_SIZE, TILE_SIZE);
        this.physics.add.existing(zone, true);
        this.doorZones.push({ zone, objectId: obj.id, doorTarget: obj.door_target });
      } else {
        const collider = this.objectGroup.create(px, py, 'obj-default') as Phaser.Physics.Arcade.Sprite;
        collider.setVisible(false);
        collider.refreshBody();
      }

      // Initialize state in Zustand
      useGameStore.getState().updateObjectState(obj.id, obj.states);

      // Register in Jacobs' name map for effect resolution
      useJacobsStore.getState().registerObject(obj.id, obj.name);

      // J.A.C.O.B.S. Core: keep the DB sprite as the monitor, overlay the face on top
      if (obj.name === 'J.A.C.O.B.S. Core') {
        const faceY = sprite.y - 4;
        const currentMood = useJacobsStore.getState().mood;
        const faceKey = `jacobs-face-${currentMood}`;
        const faceOverlay = this.add.image(px, faceY, this.textures.exists(faceKey) ? faceKey : 'jacobs-face-NEUTRAL');
        faceOverlay.setScale(0.9);
        faceOverlay.setDepth(py + 0.5);
        this.jacobsScreenSprite = faceOverlay;
        this.jacobsStaticOverlay = this.add.image(px, faceY, 'jacobs-static');
        this.jacobsStaticOverlay.setScale(0.9);
        this.jacobsStaticOverlay.setDepth(py + 1);
        this.jacobsStaticOverlay.setAlpha(0.05);
        this.jacobsBaseY = faceY;
        this.startJacobsAnimations();
        // Sync face to current mood (static alpha, glitch timer, etc.)
        this.onJacobsMoodChange(currentMood);
      }

      // Apply initial visual state
      const visual: ObjectVisual = { sprite };
      this.objectVisuals.set(obj.id, visual);
      this.applyStateVisuals(obj.id, obj.states);

      // Register with interaction manager (created below, so defer)
      this.events.once('interaction-ready', () => {
        this.interactionManager.registerObject(obj.id, sprite, {
          object_id: obj.object_id,
          name: obj.name,
          tags: obj.tags,
          states: obj.states,
        });
      });
    }
  }

  private spawnItems(roomDef: RoomDef) {
    const collected = useGameStore.getState().collectedSpawns;

    for (const item of roomDef.itemSpawns) {
      // Skip items the player already picked up
      const spawnKey = `${roomDef.id}:${item.item_id}:${item.tileX}:${item.tileY}`;
      if (collected.has(spawnKey)) continue;

      const px = item.tileX * TILE_SIZE + TILE_SIZE / 2;
      const py = item.tileY * TILE_SIZE + TILE_SIZE / 2;
      const textureKey = item.spriteUrl
        ? `sprite-item-${item.item_id}`
        : 'item-default';

      // Floor glow behind the item
      const glow = this.add.image(px, py + 2, 'item-glow');
      glow.setDepth(py - 1);
      glow.setAlpha(0.6);
      this.tweens.add({
        targets: glow,
        alpha: { from: 0.4, to: 0.7 },
        scale: { from: 0.9, to: 1.05 },
        duration: 1200,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });

      // Bouncing arrow above the item
      const arrow = this.add.image(px, py - 18, 'item-arrow');
      arrow.setDepth(py + 1);
      this.tweens.add({
        targets: arrow,
        y: { from: py - 20, to: py - 14 },
        duration: 800,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });

      const sprite = this.add.image(px, py, textureKey);
      sprite.setDepth(py);
      sprite.setData('highlight', [glow, arrow]);

      // Scale large textures to match item size (smaller than objects for perspective)
      const frame = sprite.frame;
      const itemScale = 32 / Math.max(frame.width, frame.height) * 0.8;
      if (frame.width > 32 || frame.height > 32) {
        sprite.setScale(itemScale);
      } else {
        sprite.setScale(0.8);
      }

      this.events.once('interaction-ready', () => {
        this.interactionManager.registerItem(item.id, sprite, {
          item_id: item.item_id,
          name: item.name,
          tags: item.tags,
          spriteUrl: item.spriteUrl,
          spawnKey,
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
        // Position indicator at top-right corner of the sprite (tucked in)
        const halfW = visual.sprite.displayWidth / 2;
        const halfH = visual.sprite.displayHeight / 2;
        const ind = this.add.image(
          visual.sprite.x + halfW - 6,
          visual.sprite.y - halfH + 6,
          STATE_INDICATORS[state],
        );
        ind.setDepth(visual.sprite.depth + 2);

        // Pulse animation
        visual.tween = this.tweens.add({
          targets: ind,
          alpha: { from: 1, to: 0.4 },
          duration: 900,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut',
        });

        visual.indicator = ind;
        break;
      }
    }
  }

  update(_time: number, delta: number) {
    this.matrixBg?.update(_time, delta);
    if (this.worldStripped || !this.player) return;

    this.player.update();
    this.interactionManager.update();

    // Depth sort player so it renders in front/behind objects correctly
    this.player.setDepth(this.player.y);

    // Check if player stepped onto a door portal
    if (!this.transitioning) {
      this.checkDoorOverlaps();
    }
  }

  private checkDoorOverlaps(): void {
    if (Date.now() < this.doorGraceUntil) return;
    const playerBody = this.player.body as Phaser.Physics.Arcade.Body;
    const store = useGameStore.getState();
    const pRect = new Phaser.Geom.Rectangle(playerBody.x, playerBody.y, playerBody.width, playerBody.height);

    for (const door of this.doorZones) {
      const zb = door.zone.body as Phaser.Physics.Arcade.StaticBody;
      const zRect = new Phaser.Geom.Rectangle(zb.x, zb.y, zb.width, zb.height);

      if (Phaser.Geom.Intersects.RectangleToRectangle(pRect, zRect)) {
        const objState = store.objectStates[door.objectId];
        const isLocked = objState?.states.includes('LOCKED');

        if (!isLocked) {
          this.transitionToRoom(door.doorTarget);
          return;
        }
      }
    }
  }

  private transitionToRoom(target: DoorTarget): void {
    this.transitioning = true;

    // Freeze player movement
    const body = this.player.body as Phaser.Physics.Arcade.Body;
    body.setVelocity(0, 0);

    soundService.playSfx('interact');

    useJacobsStore.getState().logEvent({
      type: 'ROOM_CHANGE',
      timestamp: Date.now(),
      player: 'PLAYER 1',
      details: { targetRoomId: target.room_id },
    });

    const cam = this.cameras.main;
    cam.fadeOut(400, 0, 0, 0);

    cam.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      const store = useGameStore.getState();
      if (store.currentRoomId) {
        store.saveRoomStates(store.currentRoomId);
      }
      store.clearObjectStates();
      this.scene.restart({
        roomId: target.room_id,
        spawnX: target.spawnX,
        spawnY: target.spawnY,
      } as SceneData);
    });
  }

  private onStateChange(state: GameState) {
    // Disable Phaser keyboard when React needs text input (terminal chat, end screen name entry).
    // clearCaptures() removes keycodes from the KeyboardManager capture set so
    // preventDefault() is no longer called — letting WASD/E flow into the <input>.
    if (this.input.keyboard) {
      const needsKeyboard = !state.terminalChatOpen && state.sessionStatus === 'PLAYING';
      if (!needsKeyboard && this.input.keyboard.enabled) {
        this.input.keyboard.clearCaptures();
        this.input.keyboard.enabled = false;
      } else if (needsKeyboard && !this.input.keyboard.enabled) {
        this.input.keyboard.enabled = true;
        const K = Phaser.Input.Keyboard.KeyCodes;
        this.input.keyboard.addCapture([
          K.W, K.A, K.S, K.D, K.E,
          K.UP, K.DOWN, K.LEFT, K.RIGHT, K.SPACE,
        ]);
      }
    }

    // Strip the world when the session ends — leave only the matrix background
    if (state.sessionStatus !== 'PLAYING') {
      this.stripWorld();
      return;
    }

    // Update object visuals when states change
    for (const [objectId, objectState] of Object.entries(state.objectStates)) {
      this.applyStateVisuals(objectId, objectState.states);
    }
  }

  /** Destroy all game world content but keep the matrix background running. */
  private stripWorld(): void {
    if (this.worldStripped) return;
    this.worldStripped = true;

    // Stop game services and unsubscribe from stores to prevent stale callbacks
    stopJacobsLoop();
    stopJobCycle();
    this.jacobsUnsubscribe?.();
    this.jacobsUnsubscribe = undefined;

    // Kill all tweens and timers
    this.tweens.killAll();
    this.jacobsBobTween?.destroy();
    this.jacobsBlinkTimer?.destroy();
    this.jacobsGlitchTimer?.destroy();
    this.interactionManager?.destroy();

    // Clean up visual tracking
    for (const visual of this.objectVisuals.values()) {
      visual.tween?.destroy();
      visual.indicator?.destroy();
    }
    this.objectVisuals.clear();
    for (const door of this.doorZones) {
      door.zone.destroy();
    }
    this.doorZones = [];

    // Preserve matrix background reference, destroy everything else
    const matrixRef = this.matrixBg;
    this.matrixBg = null;

    // Destroy all scene children (tiles, sprites, physics bodies)
    this.children.removeAll(true);
    this.physics.world.shutdown();

    // Re-create the matrix background on the now-empty scene
    this.matrixBg = matrixRef ? new MatrixBackground(this) : null;

    // Reset camera
    this.cameras.main.stopFollow();
    this.cameras.main.setZoom(1);
    this.cameras.main.centerOn(0, 0);

    this.player = null!;
    this.jacobsScreenSprite = null;
    this.jacobsStaticOverlay = null;
  }

  private startJacobsAnimations(): void {
    if (!this.jacobsScreenSprite) return;

    // 1. Idle bob — gentle y-oscillation on face + static overlay
    this.jacobsBobTween = this.tweens.add({
      targets: [this.jacobsScreenSprite, this.jacobsStaticOverlay].filter(Boolean),
      y: { from: this.jacobsBaseY - 0.8, to: this.jacobsBaseY + 0.8 },
      duration: 3000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // 2. Eye blink — periodic texture swap
    this.scheduleNextBlink();

    // 3. Glitch effects — mood-scaled periodic distortion
    this.restartGlitchTimer();
  }

  private scheduleNextBlink(): void {
    const delay = Phaser.Math.Between(3000, 7000);
    this.jacobsBlinkTimer = this.time.addEvent({
      delay,
      callback: () => {
        if (!this.jacobsScreenSprite) return;
        // Skip blinks during UNHINGED — too glitchy
        if (this.jacobsCurrentMood === 'UNHINGED') {
          this.scheduleNextBlink();
          return;
        }
        const blinkKey = `jacobs-face-${this.jacobsCurrentMood}-blink`;
        const openKey = `jacobs-face-${this.jacobsCurrentMood}`;
        if (this.textures.exists(blinkKey)) {
          this.jacobsScreenSprite.setTexture(blinkKey);
          this.time.delayedCall(120, () => {
            if (this.jacobsScreenSprite) {
              this.jacobsScreenSprite.setTexture(openKey);
            }
          });
        }
        this.scheduleNextBlink();
      },
    });
  }

  private restartGlitchTimer(): void {
    this.jacobsGlitchTimer?.destroy();
    const delays: Record<string, number> = {
      PLEASED: 15000, PROUD: 14000, AMUSED: 13000, IMPRESSED: 14000, GENEROUS: 15000,
      NEUTRAL: 8000, BORED: 9000,
      SUSPICIOUS: 4000, SMUG: 5000,
      DISAPPOINTED: 1500, SAD: 2000, PARANOID: 1200, FURIOUS: 1000,
      UNHINGED: 500, MANIC: 400, GLITCHING: 300,
    };
    const delay = delays[this.jacobsCurrentMood] ?? 8000;
    this.jacobsGlitchTimer = this.time.addEvent({
      delay,
      loop: true,
      callback: () => this.fireGlitch(),
    });
  }

  private fireGlitch(): void {
    if (!this.jacobsScreenSprite) return;
    const type = Phaser.Math.Between(0, 2);
    const face = this.jacobsScreenSprite;
    const baseX = face.x;

    if (type === 0) {
      // X-jitter: shift face left/right briefly
      const offset = Phaser.Math.Between(-2, 2) || 1;
      face.x += offset;
      this.jacobsStaticOverlay && (this.jacobsStaticOverlay.x += offset);
      this.time.delayedCall(80, () => {
        face.x = baseX;
        if (this.jacobsStaticOverlay) this.jacobsStaticOverlay.x = baseX;
      });
    } else if (type === 1) {
      // Tint flash: brief red or green tint
      const tint = Math.random() > 0.5 ? 0xff4444 : 0x44ff88;
      face.setTint(tint);
      this.time.delayedCall(60, () => face.clearTint());
    } else {
      // Static burst: spike static overlay alpha
      if (this.jacobsStaticOverlay) {
        const prevAlpha = this.jacobsStaticOverlay.alpha;
        this.jacobsStaticOverlay.setAlpha(0.5);
        this.time.delayedCall(100, () => {
          if (this.jacobsStaticOverlay) this.jacobsStaticOverlay.setAlpha(prevAlpha);
        });
      }
    }
  }

  private onJacobsMoodChange(mood: JacobsMood): void {
    if (!this.sys || !this.jacobsScreenSprite || !this.jacobsScreenSprite.scene) return;

    this.jacobsCurrentMood = mood;

    const textureKey = `jacobs-face-${mood}`;
    if (this.textures.exists(textureKey)) {
      this.jacobsScreenSprite.setTexture(textureKey);
    }

    // Static intensity scales with mood severity
    const staticAlpha: Record<string, number> = {
      PLEASED: 0.01, PROUD: 0.02, AMUSED: 0.02, IMPRESSED: 0.02, GENEROUS: 0.01,
      NEUTRAL: 0.05, BORED: 0.06,
      SUSPICIOUS: 0.12, SMUG: 0.10,
      DISAPPOINTED: 0.25, SAD: 0.22, PARANOID: 0.28, FURIOUS: 0.30,
      UNHINGED: 0.45, MANIC: 0.40, GLITCHING: 0.50,
    };
    if (this.jacobsStaticOverlay) {
      this.jacobsStaticOverlay.setAlpha(staticAlpha[mood] ?? 0.05);
    }

    // Restart glitch timer with new mood-appropriate frequency
    this.restartGlitchTimer();

    // Screen flicker for severity 4+ moods
    const sev = MOOD_SEVERITY[mood] ?? 2;
    if (sev >= 4) {
      const dur = sev >= 5 ? 80 : 150;
      const rep = sev >= 5 ? 5 : 2;
      this.tweens.add({
        targets: this.jacobsScreenSprite,
        alpha: { from: 1, to: 0.6 },
        duration: dur,
        yoyo: true,
        repeat: rep,
        ease: 'Sine.easeInOut',
      });
    }
  }

  private cleanup() {
    // Music intentionally NOT stopped here — persists across room transitions.
    if (!this.worldStripped) {
      stopJacobsLoop();
      stopJobCycle();
      this.jacobsBobTween?.destroy();
      this.jacobsBlinkTimer?.destroy();
      this.jacobsGlitchTimer?.destroy();
      this.interactionManager?.destroy();
      for (const visual of this.objectVisuals.values()) {
        visual.tween?.destroy();
        visual.indicator?.destroy();
      }
      this.objectVisuals.clear();
      for (const door of this.doorZones) {
        door.zone.destroy();
      }
      this.doorZones = [];
    }

    this.unsubscribe?.();
    this.jacobsUnsubscribe?.();
    this.matrixBg?.destroy();
    this.matrixBg = null;
  }
}
