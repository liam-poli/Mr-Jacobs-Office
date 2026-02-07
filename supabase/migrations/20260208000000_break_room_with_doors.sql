-- Create a Break Room and link it to the Main Office via bidirectional doors.
-- Door objects already exist in the objects catalog (name='Door').

DO $$
DECLARE
  main_room_id uuid;
  break_room_id uuid;
  door_object_id uuid;
BEGIN
  -- Look up the Door object in the catalog
  SELECT id INTO door_object_id FROM objects WHERE name = 'Door' LIMIT 1;
  IF door_object_id IS NULL THEN
    RAISE NOTICE 'No Door object found in catalog — skipping door linking';
    RETURN;
  END IF;

  -- Look up Main Office
  SELECT id INTO main_room_id FROM rooms WHERE name = 'Main Office' LIMIT 1;

  -- Create the Break Room (15x12, simple floor+walls)
  INSERT INTO rooms (name, width, height, tile_map, object_placements, item_spawns, is_active)
  VALUES (
    'Break Room',
    15, 12,
    '[[1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
      [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]]'::jsonb,
    '[]'::jsonb,
    '[]'::jsonb,
    false
  )
  RETURNING id INTO break_room_id;

  -- Link Main Office door (at 12,1) → Break Room (spawn at 7,10)
  IF main_room_id IS NOT NULL THEN
    UPDATE rooms
    SET object_placements = (
      SELECT COALESCE(jsonb_agg(
        CASE
          WHEN (elem->>'object_id') = door_object_id::text
          THEN elem || jsonb_build_object('door_target', jsonb_build_object(
            'room_id', break_room_id::text,
            'spawnX', 7,
            'spawnY', 10
          ))
          ELSE elem
        END
      ), '[]'::jsonb)
      FROM jsonb_array_elements(object_placements) AS elem
    )
    WHERE id = main_room_id;
  END IF;

  -- Add a door in Break Room (at 7,0 — top wall) pointing back to Main Office (spawn at 12,3)
  IF main_room_id IS NOT NULL THEN
    UPDATE rooms
    SET object_placements = object_placements || jsonb_build_array(
      jsonb_build_object(
        'object_id', door_object_id::text,
        'tileX', 7,
        'tileY', 0,
        'door_target', jsonb_build_object(
          'room_id', main_room_id::text,
          'spawnX', 12,
          'spawnY', 3
        )
      )
    )
    WHERE id = break_room_id;
  END IF;
END $$;
