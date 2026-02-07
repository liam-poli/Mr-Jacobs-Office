-- Add directional sprite URLs to objects catalog.
-- sprite_url remains the default fallback (front/down view).
-- directional_sprites stores optional per-direction overrides:
--   { "up": "...", "down": "...", "left": "...", "right": "..." }
ALTER TABLE objects ADD COLUMN directional_sprites jsonb NOT NULL DEFAULT '{}';
