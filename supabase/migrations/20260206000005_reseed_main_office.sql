-- Re-seed Main Office (post furniture removal schema)
insert into rooms (name, width, height, tile_map, object_placements, item_spawns)
values (
  'Main Office',
  25,
  18,
  '[[1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
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
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]]'::jsonb,

  '[
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
  ]'::jsonb,

  '[
    {"id":"item-1","name":"Coffee Mug","tags":["WET","FRAGILE"],"textureKey":"item-coffee-mug","tileX":5,"tileY":3},
    {"id":"item-2","name":"Wrench","tags":["METALLIC","HEAVY"],"textureKey":"item-wrench","tileX":8,"tileY":12},
    {"id":"item-3","name":"Bucket","tags":["WET","HEAVY"],"textureKey":"item-bucket","tileX":18,"tileY":8},
    {"id":"item-4","name":"Matches","tags":["HOT"],"textureKey":"item-matches","tileX":15,"tileY":14}
  ]'::jsonb
)
on conflict (name) do nothing;
