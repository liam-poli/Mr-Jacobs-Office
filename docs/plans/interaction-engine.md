# Interaction Engine with Hash-Based Caching

## Context
The core gameplay mechanic (Task 5 in the task list) is: **player uses an item on an object, the system resolves the outcome**. Inspired by the Infinite Kitchen project's hash-based DB cache: hash the inputs, check the DB, return instantly on cache hit, call AI only on cache miss, then store the result so it's instant next time.

This also wires up the `InteractionsTab` in the admin panel (currently a placeholder).

## Reference: How Kitchen Does It
- File: `infinite-kitchen/supabase/functions/cook/index.ts`
- Hash formula: `tool.toLowerCase() + '+' + sorted_ingredients.join('+')`
- Lookup: `SELECT * FROM recipes WHERE input_hash = ?` (indexed, ~50ms)
- Cache hit → instant return, skip AI entirely
- Cache miss → call AI → insert result into `recipes` table → return
- Result: **~50-200ms for known combos** vs **3-10s for novel ones**

## Implementation

### 1. New Migration: `interactions` Table

**File: `supabase/migrations/20260206000003_interactions.sql`**

```sql
create table interactions (
  id uuid primary key default gen_random_uuid(),
  input_hash text unique not null,        -- deterministic hash for cache lookup
  item_tags text[] not null default '{}',  -- the item's tags (sorted)
  object_tags text[] not null default '{}',-- the object's tags (sorted)
  required_state text,                     -- object state required (nullable = any state)
  result_state text,                       -- new object state (nullable = no change)
  output_item text,                        -- name of new item created (nullable = none)
  output_item_tags text[] default '{}',    -- tags for the output item
  description text not null,               -- what happens ("The water shorts the circuit")
  source text not null default 'ai',       -- 'manual' or 'ai'
  created_at timestamptz default now()
);

create index idx_interactions_hash on interactions (input_hash);

-- RLS (permissive for hackathon)
alter table interactions enable row level security;
create policy "Allow all on interactions" on interactions for all using (true) with check (true);
```

### 2. Hash Formula

Sort item_tags, sort object_tags, concatenate with state:

```
sorted_item_tags.join('+') + '|' + sorted_object_tags.join('+') + '|' + (state || 'ANY')
```

Example: `HOT+SHARP|ELECTRONIC+METALLIC|POWERED`

This ensures the same combination always produces the same hash regardless of input order.

### 3. Edge Function: `interact`

**File: `supabase/functions/interact/index.ts`**

**Request body:**
```json
{
  "item_tags": ["WET", "HEAVY"],
  "object_tags": ["CONDUCTIVE", "ELECTRONIC"],
  "object_state": "POWERED",
  "item_name": "Bucket of Water",
  "object_name": "Coffee Maker"
}
```

**Flow:**
1. Generate `input_hash` from sorted tags + state
2. `SELECT * FROM interactions WHERE input_hash = ?`
3. **Cache hit** → return instantly (~50ms) with `{ cached: true, ... }`
4. **Cache miss** → call AI to determine outcome
5. Insert result into `interactions` table (with `source: 'ai'`)
6. Return result with `{ cached: false, ... }`

**Response:**
```json
{
  "result_state": "BROKEN",
  "output_item": null,
  "output_item_tags": null,
  "description": "The water shorts out the coffee maker's electronics, sparks fly.",
  "cached": true
}
```

### 4. Shared AI Helper

**File: `supabase/functions/_shared/interactionAI.ts`**

- `resolveInteraction(itemTags, objectTags, objectState, itemName, objectName): Promise<InteractionResult>`
- Calls AI (Anthropic/OpenAI) with a structured prompt
- AI is constrained to pick from valid states and existing tag names
- Returns: `{ result_state, output_item, output_item_tags, description }`

**Prompt:**
```
You are the physics engine for a retro office simulation game.
A player used "{item_name}" (tags: {item_tags}) on "{object_name}" (tags: {object_tags}).
The object is currently in state: {object_state}.

Valid states: LOCKED, UNLOCKED, POWERED, UNPOWERED, BROKEN, BURNING, FLOODED, JAMMED, HACKED, CONTAMINATED
Valid item tags: METALLIC, CONDUCTIVE, WOODEN, GLASS, SHARP, WET, MAGNETIC, HOT, COLD, STICKY, FRAGILE, CHEMICAL, ORGANIC, PAPER

Determine:
1. Does the object state change? If so, to what valid state?
2. Is a new item created? If so, what is its name and which valid tags apply?
3. A brief, darkly humorous one-sentence description of what happens.

Respond as JSON: { "result_state": "...|null", "output_item": "...|null", "output_item_tags": ["..."]|null, "description": "..." }
```

### 5. Admin Panel: InteractionsTab

**File: `src/components/admin/InteractionsTab.tsx`** (currently placeholder)

Replace with full CRUD table:
- Table columns: Item Tags, Object Tags, Required State, Result State, Output Item, Description, Source
- Source shown as badge: `manual` (blue) or `ai` (purple)
- Add interaction button → form with tag selectors + state dropdowns
- Edit/delete existing interactions
- Row count in header

### 6. Seed Data

Pre-populate 8-10 common interactions so the game works instantly without AI:

```sql
-- Water on powered electronics → BROKEN
insert into interactions (input_hash, item_tags, object_tags, required_state, result_state, description, source)
values ('WET|CONDUCTIVE+ELECTRONIC|POWERED', '{WET}', '{CONDUCTIVE,ELECTRONIC}', 'POWERED', 'BROKEN',
        'Water floods the circuitry — sparks fly and the machine dies.', 'manual');

-- Sharp item on locked wooden object → UNLOCKED
insert into interactions (input_hash, item_tags, object_tags, required_state, result_state, description, source)
values ('SHARP|WOODEN|LOCKED', '{SHARP}', '{WOODEN}', 'LOCKED', 'UNLOCKED',
        'You pry the wood apart with the blade. The lock gives way.', 'manual');

-- Magnetic item on metallic locked object → UNLOCKED
insert into interactions (input_hash, item_tags, object_tags, required_state, result_state, description, source)
values ('MAGNETIC|METALLIC|LOCKED', '{MAGNETIC}', '{METALLIC}', 'LOCKED', 'UNLOCKED',
        'The magnet pulls the latch mechanism open with a satisfying click.', 'manual');

-- Hot item on anything organic → BURNING
insert into interactions (input_hash, item_tags, object_tags, required_state, result_state, description, source)
values ('HOT|ORGANIC|ANY', '{HOT}', '{ORGANIC}', null, 'BURNING',
        'It catches fire immediately. The office smells like a barbecue.', 'manual');

-- Wet item on burning object → UNLOCKED (extinguished)
insert into interactions (input_hash, item_tags, object_tags, required_state, result_state, description, source)
values ('WET|ANY|BURNING', '{WET}', '{}', 'BURNING', 'UNPOWERED',
        'The flames hiss and die. Everything is soaked and sad.', 'manual');

-- Chemical item on electronic object → CONTAMINATED
insert into interactions (input_hash, item_tags, object_tags, required_state, result_state, description, source)
values ('CHEMICAL|ELECTRONIC|ANY', '{CHEMICAL}', '{ELECTRONIC}', null, 'CONTAMINATED',
        'The chemicals seep into the circuitry. It smells terrible and probably violates several regulations.', 'manual');

-- Conductive item on electronic unpowered object → POWERED
insert into interactions (input_hash, item_tags, object_tags, required_state, result_state, description, source)
values ('CONDUCTIVE|ELECTRONIC|UNPOWERED', '{CONDUCTIVE}', '{ELECTRONIC}', 'UNPOWERED', 'POWERED',
        'You jury-rig a connection. The machine whirs back to life.', 'manual');

-- Sticky item on any object → JAMMED
insert into interactions (input_hash, item_tags, object_tags, required_state, result_state, description, source)
values ('STICKY|ANY|ANY', '{STICKY}', '{}', null, 'JAMMED',
        'It is now thoroughly gummed up. HR would not approve.', 'manual');
```

### 7. File Structure (new/modified)

```
supabase/
  functions/
    _shared/
      interactionAI.ts           # NEW — AI fallback for unknown combos
    interact/
      index.ts                   # NEW — cache-first interaction resolver
  migrations/
    20260206000003_interactions.sql  # NEW — interactions table + seed data
src/
  components/
    admin/
      InteractionsTab.tsx        # MODIFIED — full CRUD table (replace placeholder)
```

### 8. Environment Variables Needed
- AI API key for the fallback (one of):
  - `ANTHROPIC_API_KEY` for Claude
  - `OPENAI_API_KEY` for GPT
- Already have: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` (auto-provided to edge functions)

### 9. Verification
1. `npx supabase db push` — interactions table created with seed data
2. `npx supabase functions deploy interact`
3. Admin panel → Interactions tab shows seeded rows
4. Can manually add a new interaction via the form
5. Test cached interaction → instant response (~50ms)
6. Test novel interaction → AI resolves it, appears in admin with source `ai`
