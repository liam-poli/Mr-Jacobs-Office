# Database Schema

Supabase Postgres database. All tables use permissive RLS (hackathon mode).

## Tables

### `tags`
Reference list of valid tags. Not queried at runtime — exists for documentation and admin tooling.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK, auto |
| name | text | Unique. e.g. `METALLIC`, `WET`, `HOT` |
| applies_to | text | `'object'`, `'item'`, or `'both'` |
| description | text | Human-readable explanation |
| created_at | timestamptz | Auto |

**Valid tags (16):** METALLIC, CONDUCTIVE, WOODEN, GLASS, ELECTRONIC, HEAVY, SHARP, WET, MAGNETIC, HOT, COLD, STICKY, FRAGILE, CHEMICAL, ORGANIC, PAPER

---

### `objects`
Catalog of world object types. Each row defines a type (e.g. "Coffee Maker"), not an instance.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK, auto |
| name | text | e.g. `Coffee Maker` |
| tags | text[] | Permanent properties. e.g. `{METALLIC,ELECTRONIC,CONDUCTIVE}` |
| state | text | Default initial state. e.g. `POWERED`. Not read at runtime — placements carry their own states |
| sprite_url | text | URL in Supabase Storage (`sprites` bucket). Nullable |
| metadata | jsonb | Unused, reserved |
| created_at | timestamptz | Auto |

**Seeded:** Coffee Maker, Filing Cabinet, Door, Terminal, Vending Machine, Office Plant, Jacobs' Screen

---

### `items`
Catalog of portable item types. Each row defines a type (e.g. "Bucket"), not an instance.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK, auto |
| name | text | e.g. `Bucket` |
| tags | text[] | Properties. e.g. `{WET,HEAVY}` |
| sprite_url | text | URL in Supabase Storage. Nullable |
| created_at | timestamptz | Auto |

**Seeded:** Coffee Mug (WET,FRAGILE), Wrench (METALLIC,HEAVY), Bucket (WET,HEAVY), Matches (HOT)

---

### `rooms`
Room definitions. Each room has a tile map and lists of object/item spawns.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK, auto |
| name | text | Unique. e.g. `Main Office` |
| width | int | Tile columns (default 25) |
| height | int | Tile rows (default 18) |
| tile_map | jsonb | 2D array. `0`=floor, `1`=wall, `2`=carpet, `3`=desk (collision) |
| object_placements | jsonb | Array of `{object_id, tileX, tileY, states}` |
| item_spawns | jsonb | Array of `{item_id, tileX, tileY}` |
| created_at | timestamptz | Auto |

**object_placements format:**
```json
{ "object_id": "<uuid from objects table>", "tileX": 3, "tileY": 2, "states": ["POWERED"] }
```

**item_spawns format:**
```json
{ "item_id": "<uuid from items table>", "tileX": 5, "tileY": 3 }
```

At load time, `roomService.ts` joins these references against the `objects`/`items` catalog tables to resolve names, tags, and sprite URLs.

---

### `interactions`
Cache table for interaction outcomes. Hash-based lookup prevents redundant AI calls.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK, auto |
| input_hash | text | Unique. Deterministic key (see below) |
| item_tags | text[] | Sorted item tags used in this interaction |
| object_tags | text[] | Sorted object tags |
| required_state | text | Object state required for this result. Nullable (`null` = any state) |
| result_state | text | New object state after interaction. Nullable (`null` = no change) |
| output_item | text | Name of item created. Nullable |
| output_item_tags | text[] | Tags for the output item |
| description | text | Flavor text shown to the player |
| source | text | `'manual'` (seeded) or `'ai'` (generated) |
| created_at | timestamptz | Auto |

**Hash formula:**
```
sorted_item_tags.join('+') | sorted_object_tags.join('+') | (object_state ?? 'ANY')
```

Examples:
- `WET|CONDUCTIVE+ELECTRONIC|POWERED` — water on powered electronics
- `HOT|ORGANIC|ANY` — fire on anything organic (any state)
- `STICKY||ANY` — sticky item on any object (no object tags required)

**8 seeded interactions** cover common physical combos. Cache misses go to Gemini AI.

---

## Valid Object States

States are mutable and change via interactions. Defined in `interactionAI.ts`:

| State | Visual Effect |
|-------|--------------|
| LOCKED | Lock indicator (pulsing) |
| UNLOCKED | No indicator |
| POWERED | Cyan tint + power indicator |
| UNPOWERED | Gray tint |
| BROKEN | Red tint + broken indicator |
| BURNING | *(no visual yet)* |
| FLOODED | *(no visual yet)* |
| JAMMED | *(no visual yet)* |
| HACKED | *(no visual yet)* |
| CONTAMINATED | *(no visual yet)* |

Visual effects are applied in `OfficeScene.applyStateVisuals()` via tints and indicator overlays.

---

## Storage

**Bucket: `sprites`** — Public read, anon write. Stores AI-generated or uploaded sprite images for items/objects. Referenced by `sprite_url` columns.

---

## Data Flow

```
Room load:
  rooms.object_placements[].object_id → JOIN objects → ResolvedObject (name, tags, spriteUrl, states)
  rooms.item_spawns[].item_id         → JOIN items   → ResolvedItem   (name, tags, spriteUrl)

Interaction:
  Client sends: { item_tags, object_tags, object_state, item_name, object_name }
  Edge function: build hash → lookup interactions table → cache hit? return : call AI → store → return
  Client applies: result_state → Zustand → OfficeScene visuals, output_item → inventory
```
