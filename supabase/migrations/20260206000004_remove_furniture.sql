-- Remove furniture column: desks are now tile type 3 in tile_map,
-- plants and screen are now objects in object_placements.

-- 1. Drop the furniture column
alter table rooms drop column if exists furniture;

-- 2. Update Main Office tile_map: carpet (2) under desks → desk tiles (3)
update rooms
set tile_map = '[[1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,0,0,3,3,0,0,0,0,0,0,0,0,0,3,3,0,0,0,0,0,0,0,1],
  [1,0,0,0,3,3,0,0,0,0,0,0,0,0,0,3,3,0,0,0,0,0,0,0,1],
  [1,0,0,0,3,3,0,0,0,0,0,0,0,0,0,3,3,0,0,0,0,0,0,0,1],
  [1,0,0,0,3,3,0,0,0,0,0,0,0,0,0,3,3,0,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,0,0,3,3,0,0,0,0,0,0,0,0,0,3,3,0,0,0,0,0,0,0,1],
  [1,0,0,0,3,3,0,0,0,0,0,0,0,0,0,3,3,0,0,0,0,0,0,0,1],
  [1,0,0,0,3,3,0,0,0,0,0,0,0,0,0,3,3,0,0,0,0,0,0,0,1],
  [1,0,0,0,3,3,0,0,0,0,0,0,0,0,0,3,3,0,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]]'::jsonb
where name = 'Main Office';

-- 3. Update Main Office object_placements: add plants and Jacobs' screen
update rooms
set object_placements = '[
  {"id":"coffee-maker-1","name":"Coffee Maker","tags":["METALLIC","ELECTRONIC","CONDUCTIVE"],"states":["POWERED"],"textureKey":"obj-coffee-maker","tileX":3,"tileY":2},
  {"id":"filing-cabinet-1","name":"Filing Cabinet","tags":["METALLIC","HEAVY"],"states":["LOCKED"],"textureKey":"obj-filing-cabinet","tileX":21,"tileY":2},
  {"id":"door-1","name":"Door","tags":["METALLIC","ELECTRONIC"],"states":["LOCKED"],"textureKey":"obj-door","tileX":12,"tileY":1},
  {"id":"terminal-1","name":"Terminal","tags":["ELECTRONIC"],"states":["POWERED"],"textureKey":"obj-terminal","tileX":10,"tileY":9},
  {"id":"vending-machine-1","name":"Vending Machine","tags":["ELECTRONIC","HEAVY"],"states":["POWERED"],"textureKey":"obj-vending-machine","tileX":23,"tileY":9},
  {"id":"plant-1","name":"Office Plant","tags":["ORGANIC","FRAGILE"],"states":["UNLOCKED"],"textureKey":"obj-plant","tileX":1,"tileY":1},
  {"id":"plant-2","name":"Office Plant","tags":["ORGANIC","FRAGILE"],"states":["UNLOCKED"],"textureKey":"obj-plant","tileX":23,"tileY":1},
  {"id":"plant-3","name":"Office Plant","tags":["ORGANIC","FRAGILE"],"states":["UNLOCKED"],"textureKey":"obj-plant","tileX":1,"tileY":16},
  {"id":"plant-4","name":"Office Plant","tags":["ORGANIC","FRAGILE"],"states":["UNLOCKED"],"textureKey":"obj-plant","tileX":23,"tileY":16},
  {"id":"jacobs-screen-1","name":"Jacobs Screen","tags":["ELECTRONIC","CONDUCTIVE"],"states":["POWERED"],"textureKey":"obj-jacobs-screen","tileX":19,"tileY":1}
]'::jsonb
where name = 'Main Office';
