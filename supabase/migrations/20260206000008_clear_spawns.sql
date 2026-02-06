-- Clear Main Office spawns for a clean slate
update rooms
set item_spawns = '[]'::jsonb,
    object_placements = '[]'::jsonb
where name = 'Main Office';
