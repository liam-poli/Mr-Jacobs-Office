-- Spawns by reference: seed items/objects catalog + update room spawns to use UUIDs
-- Item spawns become {item_id, tileX, tileY}
-- Object placements become {object_id, tileX, tileY, states}

-- =============================================================================
-- 1. SEED ITEMS CATALOG
-- =============================================================================
insert into items (name, tags) values
  ('Coffee Mug',  '{WET,FRAGILE}'),
  ('Wrench',      '{METALLIC,HEAVY}'),
  ('Bucket',      '{WET,HEAVY}'),
  ('Matches',     '{HOT}')
on conflict do nothing;

-- =============================================================================
-- 2. SEED OBJECTS CATALOG
-- =============================================================================
insert into objects (name, tags, state) values
  ('Coffee Maker',     '{METALLIC,ELECTRONIC,CONDUCTIVE}', 'POWERED'),
  ('Filing Cabinet',   '{METALLIC,HEAVY}',                 'LOCKED'),
  ('Door',             '{METALLIC,ELECTRONIC}',            'LOCKED'),
  ('Terminal',         '{ELECTRONIC}',                     'POWERED'),
  ('Vending Machine',  '{ELECTRONIC,HEAVY}',               'POWERED'),
  ('Office Plant',     '{ORGANIC,FRAGILE}',                'UNLOCKED'),
  ('Jacobs'' Screen',  '{ELECTRONIC,CONDUCTIVE}',          'POWERED')
on conflict do nothing;

-- =============================================================================
-- 3. UPDATE MAIN OFFICE — item_spawns → compact format
-- =============================================================================
update rooms
set item_spawns = (
  select jsonb_agg(spawn)
  from (
    select jsonb_build_object(
      'item_id', i.id,
      'tileX', s.tx,
      'tileY', s.ty
    ) as spawn
    from (values
      ('Coffee Mug', 5, 3),
      ('Wrench',     8, 12),
      ('Bucket',     18, 8),
      ('Matches',    15, 14)
    ) as s(name, tx, ty)
    join items i on i.name = s.name
  ) t
)
where name = 'Main Office';

-- =============================================================================
-- 4. UPDATE MAIN OFFICE — object_placements → compact format
-- =============================================================================
update rooms
set object_placements = (
  select jsonb_agg(placement)
  from (
    select jsonb_build_object(
      'object_id', o.id,
      'tileX', s.tx,
      'tileY', s.ty,
      'states', s.states::jsonb
    ) as placement
    from (values
      ('Coffee Maker',    3,  2,  '["POWERED"]'),
      ('Filing Cabinet',  21, 2,  '["LOCKED"]'),
      ('Door',            12, 1,  '["LOCKED"]'),
      ('Terminal',        10, 9,  '["POWERED"]'),
      ('Vending Machine', 23, 9,  '["POWERED"]'),
      ('Office Plant',    1,  1,  '["UNLOCKED"]'),
      ('Office Plant',    23, 1,  '["UNLOCKED"]'),
      ('Office Plant',    1,  16, '["UNLOCKED"]'),
      ('Office Plant',    23, 16, '["UNLOCKED"]'),
      ('Jacobs'' Screen', 19, 1,  '["POWERED"]')
    ) as s(name, tx, ty, states)
    join objects o on o.name = s.name
  ) t
)
where name = 'Main Office';
