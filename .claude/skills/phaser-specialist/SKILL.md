---
name: phaser-specialist
description: Expert Phaser 3 game engine development for J.A.C.O.B.S. Office. Use when building scenes, player movement, object rendering, tilemaps, physics, shaders, or the Phaser-React-Zustand bridge.
user-invocable: false
---

# Phaser 3 Specialist — J.A.C.O.B.S. Office

You are an expert in Phaser 3.80+, TypeScript 5.x, and Vite, specifically for the J.A.C.O.B.S. Office game architecture.

## Project Architecture

This project uses a **Phaser + React + Zustand** architecture:
- **Phaser 3** renders the 2D office world (rooms, players, objects, items)
- **React** overlays UI panels (Terminal, Inventory, HUD, Vending Machine)
- **Zustand** bridges state between Phaser and React (player stats, Bucks, inventory, world state)
- **Supabase Realtime** syncs state across 4 players via WebSockets
- **Howler.js** handles all audio (spatial audio, ambience, SFX)

Phaser owns the canvas. React owns the DOM. They never directly reference each other — Zustand is the only bridge.

## Strict TypeScript Rules

- **Never use `any`**. Use specific Phaser types (`Phaser.Physics.Arcade.Sprite`, `Phaser.Tilemaps.Tilemap`, etc.)
- **Handle nulls**. Physics bodies can be `null` — always guard: `if (this.body)`
- **Type collision callbacks** by casting to specific types, not `GameObjectWithBody`
- **Use interfaces** for all custom data (room definitions, object configs, item configs)

## Performance Rules

- **Zero allocation in `update()`**. Never use `new` inside the game loop.
- **Object Pooling** via `Phaser.GameObjects.Group` for any entity that spawns repeatedly (items, particles, effects). Use `get()` to retrieve, `killAndHide()` + `setActive(false)` to recycle. See [templates/ObjectPool.ts.tpl](templates/ObjectPool.ts.tpl).
- **Texture Atlases** over individual images. Pack sprites into atlases to reduce draw calls.
- **Reuse vectors**. Create `Phaser.Math.Vector2` instances as class properties, not in loops.

## Scene Architecture

- **One scene per purpose**: `OfficeScene` (game world), `UIScene` (HUD overlay), `BootScene` (asset loading)
- **Parallel scenes**: Launch UI scene alongside game scene with `this.scene.launch('UIScene')`. UI stays fixed on screen while the game camera moves.
- **Scene communication**: Scenes talk through Zustand stores, never direct references.
- Emit `scene-ready` from `create()` so React knows when to show UI.
- See [templates/Scene.ts.tpl](templates/Scene.ts.tpl) for the standard scene template.

## Phaser <-> React <-> Zustand Bridge

- Phaser reads/writes stores via `useGameStore.getState()` and `useGameStore.subscribe()`
- React uses hooks: `useGameStore((s) => s.bucks)`
- **Never** import React hooks into Phaser code
- See [templates/EventBridge.ts.tpl](templates/EventBridge.ts.tpl) for the full store template with all interfaces

## Room & Tilemap System

- Rooms are preloaded tilemap layouts (Tiled JSON format) stitched together dynamically
- Each room has connection points (doors) for linking to adjacent rooms
- Objects in rooms are Phaser sprites with tag/state metadata stored in Zustand
- Use Phaser's `Tilemap` and `TilemapLayer` for floor/wall rendering
- Object interaction zones use Arcade Physics overlap detection

## Visual Effects

- **CRT/Scanline shader**: Use Phaser's WebGL Pipeline for post-processing. NOT the `postprocessing` npm package (that's Three.js).
- **State effectors**: Object states trigger visual changes (e.g., `[BROKEN]` -> spark particles, `[POWERED]` -> glow tint)
- **Mr. Jacobs screens**: Animated sprite sheets for his face/emotion states on in-world monitors
- **Glitch effects**: Camera shake, chromatic aberration via custom pipeline, screen flash

## Multiplayer Considerations

- Player movement and actions sync through Supabase Realtime channels
- Interpolate remote player positions — don't snap
- Local player is authoritative for own movement, server validates interactions
- Camera follows local player only

## Additional Resources

- For physics typing, service extraction, object pooling, CRT shaders, realtime sync, and interaction detection patterns, see [reference.md](reference.md). Load when implementing any of these systems.
- [templates/Scene.ts.tpl](templates/Scene.ts.tpl) — standard scene skeleton with Zustand lifecycle. Use when creating a new scene.
- [templates/ObjectPool.ts.tpl](templates/ObjectPool.ts.tpl) — generic object pool with typed sprite and group. Use when adding pooled entities (items, particles, effects).
- [templates/EventBridge.ts.tpl](templates/EventBridge.ts.tpl) — Zustand store template with all game interfaces. Use when adding new shared state between Phaser and React.
