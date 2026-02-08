-- Add 20 new items to the catalog.
-- Existing items: Coffee Mug, Wrench, Bucket, Matches (kept as-is).
-- Room spawns are managed via the admin panel room editor.

-- Office Staples
INSERT INTO items (id, name, tags) VALUES (gen_random_uuid(), 'Stapler', '{METALLIC,HEAVY}');
INSERT INTO items (id, name, tags) VALUES (gen_random_uuid(), 'Scissors', '{METALLIC,SHARP}');
INSERT INTO items (id, name, tags) VALUES (gen_random_uuid(), 'Sticky Notes', '{PAPER,STICKY}');
INSERT INTO items (id, name, tags) VALUES (gen_random_uuid(), 'Paperweight', '{GLASS,HEAVY}');
INSERT INTO items (id, name, tags) VALUES (gen_random_uuid(), 'Rubber Band', '{STICKY}');
INSERT INTO items (id, name, tags) VALUES (gen_random_uuid(), 'Binder Clip', '{METALLIC}');
INSERT INTO items (id, name, tags) VALUES (gen_random_uuid(), 'Folder', '{PAPER}');
INSERT INTO items (id, name, tags) VALUES (gen_random_uuid(), 'Pen', '{SHARP}');

-- Break Room / Kitchen
INSERT INTO items (id, name, tags) VALUES (gen_random_uuid(), 'Soda Can', '{METALLIC,COLD}');
INSERT INTO items (id, name, tags) VALUES (gen_random_uuid(), 'Sandwich', '{ORGANIC}');
INSERT INTO items (id, name, tags) VALUES (gen_random_uuid(), 'Ice Cube', '{WET,COLD}');
INSERT INTO items (id, name, tags) VALUES (gen_random_uuid(), 'Coffee Pot', '{GLASS,HOT,WET}');

-- Tools / Technical
INSERT INTO items (id, name, tags) VALUES (gen_random_uuid(), 'Screwdriver', '{METALLIC,SHARP}');
INSERT INTO items (id, name, tags) VALUES (gen_random_uuid(), 'Floppy Disk', '{MAGNETIC}');
INSERT INTO items (id, name, tags) VALUES (gen_random_uuid(), 'USB Cable', '{CONDUCTIVE}');
INSERT INTO items (id, name, tags) VALUES (gen_random_uuid(), 'Batteries', '{CONDUCTIVE,CHEMICAL}');

-- Fun / Weird
INSERT INTO items (id, name, tags) VALUES (gen_random_uuid(), 'Rubber Duck', '{ORGANIC}');
INSERT INTO items (id, name, tags) VALUES (gen_random_uuid(), 'Fire Extinguisher', '{CHEMICAL,HEAVY,COLD}');
INSERT INTO items (id, name, tags) VALUES (gen_random_uuid(), 'Mystery Liquid', '{WET,CHEMICAL}');
INSERT INTO items (id, name, tags) VALUES (gen_random_uuid(), 'Gold Trophy', '{METALLIC,HEAVY,CONDUCTIVE}');
