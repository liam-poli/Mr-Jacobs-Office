-- Switch interactions from tag-based to name-based hashing
-- Hash formula: lower(trim(item_name)) || '|' || lower(trim(object_name)) || '|' || (state or 'ANY')

-- Add name columns
alter table interactions add column if not exists item_name text;
alter table interactions add column if not exists object_name text;

-- Clear old tag-based rows (incompatible hash format)
delete from interactions;
