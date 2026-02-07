-- Replace all rooms with 7 interconnected rooms:
--   Main Office ↔ North Hallway ↔ Break Room
--                                ↔ Supply Closet
--   Main Office ↔ South Hallway ↔ Server Room
--                                ↔ Boss's Office
--
-- Tile codes: 0=floor, 1=wall, 2=carpet, 3=desk (collision)

DO $$
DECLARE
  -- Object catalog IDs
  v_door uuid;
  v_coffee_maker uuid;
  v_filing_cabinet uuid;
  v_terminal uuid;
  v_vending uuid;
  v_plant uuid;
  v_jacobs uuid;
  -- Item catalog IDs
  v_mug uuid;
  v_wrench uuid;
  v_bucket uuid;
  v_matches uuid;
  -- Room IDs
  r_main uuid;
  r_north uuid;
  r_south uuid;
  r_break uuid;
  r_supply uuid;
  r_server uuid;
  r_boss uuid;
BEGIN
  -- =========================================================================
  -- LOOKUP CATALOG IDs
  -- =========================================================================
  SELECT id INTO v_door FROM objects WHERE name = 'Door' LIMIT 1;
  SELECT id INTO v_coffee_maker FROM objects WHERE name = 'Coffee Maker' LIMIT 1;
  SELECT id INTO v_filing_cabinet FROM objects WHERE name = 'Filing Cabinet' LIMIT 1;
  SELECT id INTO v_terminal FROM objects WHERE name = 'Terminal' LIMIT 1;
  SELECT id INTO v_vending FROM objects WHERE name = 'Vending Machine' LIMIT 1;
  SELECT id INTO v_plant FROM objects WHERE name = 'Office Plant' LIMIT 1;
  SELECT id INTO v_jacobs FROM objects WHERE name = 'Jacobs'' Screen' LIMIT 1;

  SELECT id INTO v_mug FROM items WHERE name = 'Coffee Mug' LIMIT 1;
  SELECT id INTO v_wrench FROM items WHERE name = 'Wrench' LIMIT 1;
  SELECT id INTO v_bucket FROM items WHERE name = 'Bucket' LIMIT 1;
  SELECT id INTO v_matches FROM items WHERE name = 'Matches' LIMIT 1;

  -- =========================================================================
  -- CLEAR OLD ROOMS
  -- =========================================================================
  DELETE FROM rooms;

  -- =========================================================================
  -- 1. MAIN OFFICE (12×10) — starting room, 4 desk clusters
  -- =========================================================================
  INSERT INTO rooms (name, width, height, is_active, tile_map, object_placements, item_spawns)
  VALUES ('Main Office', 12, 10, true,
    '[[1,1,1,1,1,0,0,1,1,1,1,1],
      [1,0,0,0,0,0,0,0,0,0,0,1],
      [1,0,3,3,0,0,0,0,3,3,0,1],
      [1,0,3,3,0,0,0,0,3,3,0,1],
      [1,0,0,0,0,0,0,0,0,0,0,1],
      [1,0,0,0,0,0,0,0,0,0,0,1],
      [1,0,3,3,0,0,0,0,3,3,0,1],
      [1,0,3,3,0,0,0,0,3,3,0,1],
      [1,0,0,0,0,0,0,0,0,0,0,1],
      [1,1,1,1,1,0,0,1,1,1,1,1]]'::jsonb,
    '[]'::jsonb, '[]'::jsonb
  ) RETURNING id INTO r_main;

  -- =========================================================================
  -- 2. NORTH HALLWAY (14×6) — left door to Break Room, top to Supply Closet
  -- =========================================================================
  INSERT INTO rooms (name, width, height, is_active, tile_map, object_placements, item_spawns)
  VALUES ('North Hallway', 14, 6, false,
    '[[1,1,1,1,1,1,0,0,1,1,1,1,1,1],
      [1,0,0,0,0,0,0,0,0,0,0,0,0,1],
      [0,0,0,0,0,0,0,0,0,0,0,0,0,1],
      [0,0,0,0,0,0,0,0,0,0,0,0,0,1],
      [1,0,0,0,0,0,0,0,0,0,0,0,0,1],
      [1,1,1,1,1,1,0,0,1,1,1,1,1,1]]'::jsonb,
    '[]'::jsonb, '[]'::jsonb
  ) RETURNING id INTO r_north;

  -- =========================================================================
  -- 3. SOUTH HALLWAY (14×6) — right door to Server Room, bottom to Boss
  -- =========================================================================
  INSERT INTO rooms (name, width, height, is_active, tile_map, object_placements, item_spawns)
  VALUES ('South Hallway', 14, 6, false,
    '[[1,1,1,1,1,1,0,0,1,1,1,1,1,1],
      [1,0,0,0,0,0,0,0,0,0,0,0,0,1],
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0],
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0],
      [1,0,0,0,0,0,0,0,0,0,0,0,0,1],
      [1,1,1,1,1,1,0,0,1,1,1,1,1,1]]'::jsonb,
    '[]'::jsonb, '[]'::jsonb
  ) RETURNING id INTO r_south;

  -- =========================================================================
  -- 4. BREAK ROOM (10×8) — table, coffee maker, vending machine
  -- =========================================================================
  INSERT INTO rooms (name, width, height, is_active, tile_map, object_placements, item_spawns)
  VALUES ('Break Room', 10, 8, false,
    '[[1,1,1,1,1,1,1,1,1,1],
      [1,0,0,0,0,0,0,0,0,1],
      [1,0,0,0,0,0,0,0,0,1],
      [1,0,0,3,3,3,3,0,0,1],
      [1,0,0,3,3,3,3,0,0,1],
      [1,0,0,0,0,0,0,0,0,1],
      [1,0,0,0,0,0,0,0,0,0],
      [1,1,1,1,1,1,1,1,1,1]]'::jsonb,
    '[]'::jsonb, '[]'::jsonb
  ) RETURNING id INTO r_break;

  -- =========================================================================
  -- 5. SUPPLY CLOSET (7×7) — filing cabinets, scavenging items
  -- =========================================================================
  INSERT INTO rooms (name, width, height, is_active, tile_map, object_placements, item_spawns)
  VALUES ('Supply Closet', 7, 7, false,
    '[[1,1,1,1,1,1,1],
      [1,0,0,0,0,0,1],
      [1,0,0,0,0,0,1],
      [1,0,0,0,0,0,1],
      [1,0,0,0,0,0,1],
      [1,0,0,0,0,0,1],
      [1,1,0,0,1,1,1]]'::jsonb,
    '[]'::jsonb, '[]'::jsonb
  ) RETURNING id INTO r_supply;

  -- =========================================================================
  -- 6. SERVER ROOM (10×8) — terminals, server racks
  -- =========================================================================
  INSERT INTO rooms (name, width, height, is_active, tile_map, object_placements, item_spawns)
  VALUES ('Server Room', 10, 8, false,
    '[[1,1,1,1,1,1,1,1,1,1],
      [1,0,0,0,0,0,0,0,0,1],
      [1,0,3,0,0,0,0,3,0,1],
      [1,0,3,0,0,0,0,3,0,1],
      [1,0,0,0,0,0,0,0,0,1],
      [0,0,0,0,0,0,0,0,0,1],
      [1,0,0,0,0,0,0,0,0,1],
      [1,1,1,1,1,1,1,1,1,1]]'::jsonb,
    '[]'::jsonb, '[]'::jsonb
  ) RETURNING id INTO r_server;

  -- =========================================================================
  -- 7. BOSS'S OFFICE (12×10) — full carpet, big desk, Jacobs screen
  -- =========================================================================
  INSERT INTO rooms (name, width, height, is_active, tile_map, object_placements, item_spawns)
  VALUES ('Boss''s Office', 12, 10, false,
    '[[1,1,1,1,1,0,0,1,1,1,1,1],
      [1,2,2,2,2,2,2,2,2,2,2,1],
      [1,2,2,2,2,2,2,2,2,2,2,1],
      [1,2,2,2,2,2,2,2,2,2,2,1],
      [1,2,2,2,2,2,2,2,2,2,2,1],
      [1,2,2,2,2,2,2,2,2,2,2,1],
      [1,2,2,3,3,3,3,3,3,2,2,1],
      [1,2,2,3,3,3,3,3,3,2,2,1],
      [1,2,2,2,2,2,2,2,2,2,2,1],
      [1,1,1,1,1,1,1,1,1,1,1,1]]'::jsonb,
    '[]'::jsonb, '[]'::jsonb
  ) RETURNING id INTO r_boss;

  -- =========================================================================
  -- OBJECT PLACEMENTS (with bidirectional door links)
  -- =========================================================================

  -- Main Office: 2 doors, Jacobs screen, terminal, filing cabinet, 2 plants
  UPDATE rooms SET object_placements = jsonb_build_array(
    jsonb_build_object('object_id', v_door, 'tileX', 5, 'tileY', 0,
      'door_target', jsonb_build_object('room_id', r_north, 'spawnX', 6, 'spawnY', 4)),
    jsonb_build_object('object_id', v_door, 'tileX', 5, 'tileY', 9,
      'door_target', jsonb_build_object('room_id', r_south, 'spawnX', 6, 'spawnY', 1)),
    jsonb_build_object('object_id', v_jacobs, 'tileX', 9, 'tileY', 1),
    jsonb_build_object('object_id', v_terminal, 'tileX', 7, 'tileY', 1),
    jsonb_build_object('object_id', v_filing_cabinet, 'tileX', 1, 'tileY', 1),
    jsonb_build_object('object_id', v_plant, 'tileX', 10, 'tileY', 1),
    jsonb_build_object('object_id', v_plant, 'tileX', 1, 'tileY', 8)
  ) WHERE id = r_main;

  -- North Hallway: 3 doors (→Main, →Supply, →Break), plant
  UPDATE rooms SET object_placements = jsonb_build_array(
    jsonb_build_object('object_id', v_door, 'tileX', 6, 'tileY', 5,
      'door_target', jsonb_build_object('room_id', r_main, 'spawnX', 5, 'spawnY', 1)),
    jsonb_build_object('object_id', v_door, 'tileX', 6, 'tileY', 0,
      'door_target', jsonb_build_object('room_id', r_supply, 'spawnX', 3, 'spawnY', 4)),
    jsonb_build_object('object_id', v_door, 'tileX', 0, 'tileY', 2,
      'door_target', jsonb_build_object('room_id', r_break, 'spawnX', 8, 'spawnY', 6)),
    jsonb_build_object('object_id', v_plant, 'tileX', 10, 'tileY', 1)
  ) WHERE id = r_north;

  -- South Hallway: 3 doors (→Main, →Boss, →Server), plant
  UPDATE rooms SET object_placements = jsonb_build_array(
    jsonb_build_object('object_id', v_door, 'tileX', 6, 'tileY', 0,
      'door_target', jsonb_build_object('room_id', r_main, 'spawnX', 5, 'spawnY', 8)),
    jsonb_build_object('object_id', v_door, 'tileX', 6, 'tileY', 5,
      'door_target', jsonb_build_object('room_id', r_boss, 'spawnX', 5, 'spawnY', 1)),
    jsonb_build_object('object_id', v_door, 'tileX', 13, 'tileY', 2,
      'door_target', jsonb_build_object('room_id', r_server, 'spawnX', 1, 'spawnY', 5)),
    jsonb_build_object('object_id', v_plant, 'tileX', 3, 'tileY', 1)
  ) WHERE id = r_south;

  -- Break Room: door back to North Hall, coffee maker, vending machine, plant
  UPDATE rooms SET object_placements = jsonb_build_array(
    jsonb_build_object('object_id', v_door, 'tileX', 9, 'tileY', 6,
      'door_target', jsonb_build_object('room_id', r_north, 'spawnX', 1, 'spawnY', 2)),
    jsonb_build_object('object_id', v_coffee_maker, 'tileX', 1, 'tileY', 1),
    jsonb_build_object('object_id', v_vending, 'tileX', 8, 'tileY', 1),
    jsonb_build_object('object_id', v_plant, 'tileX', 1, 'tileY', 5)
  ) WHERE id = r_break;

  -- Supply Closet: door back to North Hall, 2 filing cabinets
  UPDATE rooms SET object_placements = jsonb_build_array(
    jsonb_build_object('object_id', v_door, 'tileX', 2, 'tileY', 6,
      'door_target', jsonb_build_object('room_id', r_north, 'spawnX', 6, 'spawnY', 1)),
    jsonb_build_object('object_id', v_filing_cabinet, 'tileX', 1, 'tileY', 1),
    jsonb_build_object('object_id', v_filing_cabinet, 'tileX', 5, 'tileY', 1)
  ) WHERE id = r_supply;

  -- Server Room: door back to South Hall, 2 terminals
  UPDATE rooms SET object_placements = jsonb_build_array(
    jsonb_build_object('object_id', v_door, 'tileX', 0, 'tileY', 5,
      'door_target', jsonb_build_object('room_id', r_south, 'spawnX', 12, 'spawnY', 2)),
    jsonb_build_object('object_id', v_terminal, 'tileX', 3, 'tileY', 1),
    jsonb_build_object('object_id', v_terminal, 'tileX', 6, 'tileY', 1)
  ) WHERE id = r_server;

  -- Boss's Office: door back to South Hall, Jacobs screen, filing cabinet, terminal, 2 plants
  UPDATE rooms SET object_placements = jsonb_build_array(
    jsonb_build_object('object_id', v_door, 'tileX', 5, 'tileY', 0,
      'door_target', jsonb_build_object('room_id', r_south, 'spawnX', 6, 'spawnY', 4)),
    jsonb_build_object('object_id', v_jacobs, 'tileX', 5, 'tileY', 8),
    jsonb_build_object('object_id', v_filing_cabinet, 'tileX', 1, 'tileY', 1),
    jsonb_build_object('object_id', v_terminal, 'tileX', 9, 'tileY', 5),
    jsonb_build_object('object_id', v_plant, 'tileX', 10, 'tileY', 1),
    jsonb_build_object('object_id', v_plant, 'tileX', 1, 'tileY', 8)
  ) WHERE id = r_boss;

  -- =========================================================================
  -- ITEM SPAWNS
  -- =========================================================================

  -- Main Office: mug + wrench
  UPDATE rooms SET item_spawns = jsonb_build_array(
    jsonb_build_object('item_id', v_mug, 'tileX', 4, 'tileY', 4),
    jsonb_build_object('item_id', v_wrench, 'tileX', 8, 'tileY', 5)
  ) WHERE id = r_main;

  -- Break Room: mug + matches
  UPDATE rooms SET item_spawns = jsonb_build_array(
    jsonb_build_object('item_id', v_mug, 'tileX', 5, 'tileY', 2),
    jsonb_build_object('item_id', v_matches, 'tileX', 7, 'tileY', 5)
  ) WHERE id = r_break;

  -- Supply Closet: bucket + wrench
  UPDATE rooms SET item_spawns = jsonb_build_array(
    jsonb_build_object('item_id', v_bucket, 'tileX', 3, 'tileY', 3),
    jsonb_build_object('item_id', v_wrench, 'tileX', 4, 'tileY', 4)
  ) WHERE id = r_supply;

  -- Server Room: matches
  UPDATE rooms SET item_spawns = jsonb_build_array(
    jsonb_build_object('item_id', v_matches, 'tileX', 5, 'tileY', 4)
  ) WHERE id = r_server;

END $$;
