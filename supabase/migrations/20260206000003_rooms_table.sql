-- Rooms table: dynamic room layouts for J.A.C.O.B.S. Office
-- Each room defines its tile map, interactive objects, items, and furniture

create table rooms (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  width int not null default 25,
  height int not null default 18,
  tile_map jsonb not null,
  object_placements jsonb not null default '[]',
  item_spawns jsonb not null default '[]',
  furniture jsonb not null default '[]',
  created_at timestamptz default now()
);

-- Permissive RLS for hackathon
alter table rooms enable row level security;
create policy "Allow all on rooms" on rooms for all using (true) with check (true);

-- =============================================================================
-- SEED: Main Office
-- =============================================================================
insert into rooms (name, width, height, tile_map, object_placements, item_spawns, furniture)
values (
  'Main Office',
  25,
  18,
  -- tile_map: 0=floor, 1=wall, 2=carpet (desk areas)
  '[[1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,2,2,0,0,0,0,0,0,0,0,0,2,2,0,0,0,0,0,0,0,1],
    [1,0,0,0,2,2,0,0,0,0,0,0,0,0,0,2,2,0,0,0,0,0,0,0,1],
    [1,0,0,0,2,2,0,0,0,0,0,0,0,0,0,2,2,0,0,0,0,0,0,0,1],
    [1,0,0,0,2,2,0,0,0,0,0,0,0,0,0,2,2,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,2,2,0,0,0,0,0,0,0,0,0,2,2,0,0,0,0,0,0,0,1],
    [1,0,0,0,2,2,0,0,0,0,0,0,0,0,0,2,2,0,0,0,0,0,0,0,1],
    [1,0,0,0,2,2,0,0,0,0,0,0,0,0,0,2,2,0,0,0,0,0,0,0,1],
    [1,0,0,0,2,2,0,0,0,0,0,0,0,0,0,2,2,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]]'::jsonb,

  -- object_placements
  '[
    {"id":"coffee-maker-1","name":"Coffee Maker","tags":["METALLIC","ELECTRONIC","CONDUCTIVE"],"states":["POWERED"],"textureKey":"obj-coffee-maker","tileX":3,"tileY":2},
    {"id":"filing-cabinet-1","name":"Filing Cabinet","tags":["METALLIC","HEAVY"],"states":["LOCKED"],"textureKey":"obj-filing-cabinet","tileX":21,"tileY":2},
    {"id":"door-1","name":"Door","tags":["METALLIC","ELECTRONIC"],"states":["LOCKED"],"textureKey":"obj-door","tileX":12,"tileY":1},
    {"id":"terminal-1","name":"Terminal","tags":["ELECTRONIC"],"states":["POWERED"],"textureKey":"obj-terminal","tileX":10,"tileY":9},
    {"id":"vending-machine-1","name":"Vending Machine","tags":["ELECTRONIC","HEAVY"],"states":["POWERED"],"textureKey":"obj-vending-machine","tileX":23,"tileY":9}
  ]'::jsonb,

  -- item_spawns
  '[
    {"id":"item-1","name":"Coffee Mug","tags":["WET","FRAGILE"],"textureKey":"item-coffee-mug","tileX":5,"tileY":3},
    {"id":"item-2","name":"Wrench","tags":["METALLIC","HEAVY"],"textureKey":"item-wrench","tileX":8,"tileY":12},
    {"id":"item-3","name":"Bucket","tags":["WET","HEAVY"],"textureKey":"item-bucket","tileX":18,"tileY":8},
    {"id":"item-4","name":"Matches","tags":["HOT"],"textureKey":"item-matches","tileX":15,"tileY":14}
  ]'::jsonb,

  -- furniture
  '[
    {"textureKey":"furn-desk","tileX":4,"tileY":4,"hasCollision":true},
    {"textureKey":"furn-desk","tileX":5,"tileY":4,"hasCollision":true},
    {"textureKey":"furn-desk","tileX":4,"tileY":5,"hasCollision":true},
    {"textureKey":"furn-desk","tileX":5,"tileY":5,"hasCollision":true},
    {"textureKey":"furn-desk","tileX":15,"tileY":4,"hasCollision":true},
    {"textureKey":"furn-desk","tileX":16,"tileY":4,"hasCollision":true},
    {"textureKey":"furn-desk","tileX":15,"tileY":5,"hasCollision":true},
    {"textureKey":"furn-desk","tileX":16,"tileY":5,"hasCollision":true},
    {"textureKey":"furn-desk","tileX":4,"tileY":6,"hasCollision":true},
    {"textureKey":"furn-desk","tileX":5,"tileY":6,"hasCollision":true},
    {"textureKey":"furn-desk","tileX":4,"tileY":7,"hasCollision":true},
    {"textureKey":"furn-desk","tileX":5,"tileY":7,"hasCollision":true},
    {"textureKey":"furn-desk","tileX":15,"tileY":6,"hasCollision":true},
    {"textureKey":"furn-desk","tileX":16,"tileY":6,"hasCollision":true},
    {"textureKey":"furn-desk","tileX":15,"tileY":7,"hasCollision":true},
    {"textureKey":"furn-desk","tileX":16,"tileY":7,"hasCollision":true},
    {"textureKey":"furn-desk","tileX":4,"tileY":10,"hasCollision":true},
    {"textureKey":"furn-desk","tileX":5,"tileY":10,"hasCollision":true},
    {"textureKey":"furn-desk","tileX":4,"tileY":11,"hasCollision":true},
    {"textureKey":"furn-desk","tileX":5,"tileY":11,"hasCollision":true},
    {"textureKey":"furn-desk","tileX":15,"tileY":10,"hasCollision":true},
    {"textureKey":"furn-desk","tileX":16,"tileY":10,"hasCollision":true},
    {"textureKey":"furn-desk","tileX":15,"tileY":11,"hasCollision":true},
    {"textureKey":"furn-desk","tileX":16,"tileY":11,"hasCollision":true},
    {"textureKey":"furn-desk","tileX":4,"tileY":12,"hasCollision":true},
    {"textureKey":"furn-desk","tileX":5,"tileY":12,"hasCollision":true},
    {"textureKey":"furn-desk","tileX":4,"tileY":13,"hasCollision":true},
    {"textureKey":"furn-desk","tileX":5,"tileY":13,"hasCollision":true},
    {"textureKey":"furn-desk","tileX":15,"tileY":12,"hasCollision":true},
    {"textureKey":"furn-desk","tileX":16,"tileY":12,"hasCollision":true},
    {"textureKey":"furn-desk","tileX":15,"tileY":13,"hasCollision":true},
    {"textureKey":"furn-desk","tileX":16,"tileY":13,"hasCollision":true},
    {"textureKey":"furn-plant","tileX":1,"tileY":1,"hasCollision":false},
    {"textureKey":"furn-plant","tileX":23,"tileY":1,"hasCollision":false},
    {"textureKey":"furn-plant","tileX":1,"tileY":16,"hasCollision":false},
    {"textureKey":"furn-plant","tileX":23,"tileY":16,"hasCollision":false},
    {"textureKey":"furn-jacobs-screen","tileX":19,"tileY":1,"hasCollision":false}
  ]'::jsonb
);
