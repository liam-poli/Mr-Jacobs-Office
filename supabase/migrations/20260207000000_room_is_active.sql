-- Add is_active flag to rooms so the game knows which room to load.
-- Only one room should be active at a time (enforced by application logic).
ALTER TABLE rooms ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT false;

-- Mark the first existing room as active
UPDATE rooms SET is_active = true
WHERE id = (SELECT id FROM rooms ORDER BY created_at ASC LIMIT 1);
