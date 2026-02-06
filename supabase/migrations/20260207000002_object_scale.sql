-- Add scale multiplier to objects (1.0 = fit to one tile, 2.0 = span ~2 tiles)
ALTER TABLE objects ADD COLUMN scale float NOT NULL DEFAULT 1.0;
