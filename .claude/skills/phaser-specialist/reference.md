# Phaser 3 Reference — Deep Patterns

## Physics Typing in TypeScript

Phaser's collision callbacks have loose types by default. Always cast explicitly:

```typescript
// BAD — TS error when accessing custom methods
this.physics.add.collider(this.player, this.enemies, (player, enemy) => {
  enemy.takeDamage(10); // Property 'takeDamage' does not exist
});

// GOOD — explicit cast with typed callback
this.physics.add.collider(
  this.player,
  this.enemies,
  (obj1, obj2) => {
    const player = obj1 as Player;
    const enemy = obj2 as Enemy;
    enemy.takeDamage(10);
  } as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback
);
```

## Service Pattern (Avoid "God Scene")

Don't put all logic in Scene classes. Extract into services:

```typescript
// src/services/interactionService.ts
export class InteractionService {
  // Handles item + object tag resolution
  // Doesn't know about sprites or physics
  static async resolveInteraction(itemTags: string[], objectTags: string[], objectStates: string[]) {
    // Call Supabase Edge Function
    // Return state changes, new items, flavor text
  }
}

// Scene imports service, updates visuals based on result
const result = await InteractionService.resolveInteraction(item.tags, object.tags, object.states);
if (result.stateChanges) {
  // Update sprite visuals based on new states
}
```

## Object Pooling — When and How

Use pooling for ANY entity that spawns more than once:
- Items dropped on the ground
- Particle effects (sparks, smoke, glitch artifacts)
- Floating text (damage numbers, Bucks earned)
- Projectiles if any

```typescript
// Pre-allocate in create()
this.itemPool = this.add.group({
  classType: ItemSprite,
  maxSize: 30,
  runChildUpdate: true,
});

// Spawn — reuses inactive sprite
const item = this.itemPool.get(x, y, textureKey) as ItemSprite;
if (item) {
  item.spawn(x, y, itemData);
}

// Recycle — don't destroy()
item.killAndHide();
item.setActive(false);
```

## Parallel Scene Pattern for UI

```typescript
// In BootScene or after assets load:
this.scene.start('OfficeScene');
this.scene.launch('UIScene'); // Runs alongside, renders on top

// UIScene — no camera follow, stays fixed
export class UIScene extends Phaser.Scene {
  create() {
    // This scene's camera doesn't move
    // All UI elements stay in screen space
    // Reads state from Zustand stores
    const unsubscribe = useGameStore.subscribe((state) => {
      this.updateBucksDisplay(state.bucks);
      this.updateInventoryDisplay(state.inventory);
    });
  }
}
```

## CRT Shader Pipeline

Phaser's WebGL pipeline for the retro effect:

```typescript
export class CRTPostFX extends Phaser.Renderer.WebGL.Pipelines.PostFXPipeline {
  constructor(game: Phaser.Game) {
    super({
      game,
      name: 'CRTPostFX',
      fragShader: `
        precision mediump float;
        uniform sampler2D uMainSampler;
        uniform float uTime;
        varying vec2 outTexCoord;

        void main() {
          vec2 uv = outTexCoord;
          // Scanlines
          float scanline = sin(uv.y * 800.0) * 0.04;
          // Slight barrel distortion
          vec2 dc = abs(0.5 - uv);
          dc *= dc;
          uv.x -= 0.5; uv.x *= 1.0 + (dc.y * 0.3); uv.x += 0.5;
          uv.y -= 0.5; uv.y *= 1.0 + (dc.x * 0.3); uv.y += 0.5;
          // Chromatic aberration
          float r = texture2D(uMainSampler, uv + vec2(0.001, 0.0)).r;
          float g = texture2D(uMainSampler, uv).g;
          float b = texture2D(uMainSampler, uv - vec2(0.001, 0.0)).b;
          gl_FragColor = vec4(r, g, b, 1.0) - scanline;
        }
      `,
    });
  }
}

// Apply to camera in scene:
this.cameras.main.setPostPipeline(CRTPostFX);
```

## Supabase Realtime — Multiplayer Sync

```typescript
// src/services/realtimeService.ts
import { supabase } from './supabase';

export function joinRoom(roomId: string) {
  const channel = supabase.channel(`room:${roomId}`);

  // Broadcast player movement
  channel.on('broadcast', { event: 'player-move' }, ({ payload }) => {
    // Interpolate remote player to new position
    const store = useGameStore.getState();
    store.updateRemotePlayer(payload.playerId, payload.x, payload.y);
  });

  // Listen for world state changes (object states, item pickups)
  channel.on('broadcast', { event: 'state-change' }, ({ payload }) => {
    const store = useGameStore.getState();
    store.applyStateChange(payload);
  });

  channel.subscribe();
  return channel;
}

// Send local player position (throttle to ~15fps, not every frame)
let lastSent = 0;
function broadcastPosition(channel, x: number, y: number) {
  const now = Date.now();
  if (now - lastSent < 66) return; // ~15fps
  lastSent = now;
  channel.send({ type: 'broadcast', event: 'player-move', payload: { playerId, x, y } });
}
```

## Interaction Detection

For the item-on-object system, use Arcade Physics overlap zones:

```typescript
// Each interactable object has an invisible overlap zone
const zone = this.physics.add.existing(
  this.add.zone(object.x, object.y, object.width, object.height)
);

// When player overlaps + presses interact key
this.physics.add.overlap(this.player, zone, () => {
  this.nearbyObject = object;
});

// On interact key press, check if player is holding an item
if (this.nearbyObject && this.heldItem) {
  const result = await InteractionService.resolveInteraction(
    this.heldItem.tags,
    this.nearbyObject.tags,
    this.nearbyObject.states
  );
  // Apply result...
}
```
