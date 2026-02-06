-- Core Tables: tags, objects, items
-- Phase 1 of the J.A.C.O.B.S. Office schema

-- =============================================================================
-- 1. TAGS — predefined reference list of valid tags
-- =============================================================================
create table tags (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  applies_to text not null, -- 'object', 'item', or 'both'
  description text,
  created_at timestamptz default now()
);

-- =============================================================================
-- 2. OBJECTS — world fixture definitions (tags, default state, sprite)
-- =============================================================================
create table objects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  tags text[] not null default '{}',
  state text not null default 'UNLOCKED',
  sprite_url text,
  metadata jsonb default '{}',
  created_at timestamptz default now()
);

create index idx_objects_tags on objects using gin (tags);

-- =============================================================================
-- 3. ITEMS — portable resources with tags
-- =============================================================================
create table items (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  tags text[] not null default '{}',
  sprite_url text,
  created_at timestamptz default now()
);

create index idx_items_tags on items using gin (tags);

-- =============================================================================
-- SEED DATA — 15 tags from the GDD
-- =============================================================================
insert into tags (name, applies_to, description) values
  ('METALLIC',    'both',   'Made of metal. Conducts electricity, affected by magnets.'),
  ('CONDUCTIVE',  'both',   'Can carry electrical current.'),
  ('WOODEN',      'both',   'Made of wood. Flammable, insulates.'),
  ('GLASS',       'both',   'Fragile, transparent.'),
  ('ELECTRONIC',  'object', 'Has circuitry. Can be powered, hacked, or broken.'),
  ('HEAVY',       'both',   'Difficult to move. Can be used as a blocker or weapon.'),
  ('SHARP',       'item',   'Can cut, open, or damage.'),
  ('WET',         'item',   'Contains liquid. Can short-circuit, extinguish, or soak.'),
  ('MAGNETIC',    'item',   'Affects metallic objects. Can move or manipulate metal.'),
  ('HOT',         'item',   'High temperature. Can burn, melt, or heat.'),
  ('COLD',        'item',   'Low temperature. Can freeze, cool, or preserve.'),
  ('STICKY',      'item',   'Adheres to surfaces. Can trap or bind.'),
  ('FRAGILE',     'item',   'Breaks easily on impact.'),
  ('CHEMICAL',    'item',   'Reactive substance. Unpredictable interactions.'),
  ('ORGANIC',     'item',   'Food, plant matter. Can rot, attract pests, or be consumed.'),
  ('PAPER',       'item',   'Can be written on, burned, or folded.');
