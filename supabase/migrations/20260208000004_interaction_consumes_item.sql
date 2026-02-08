-- Add consumes_item boolean so the AI can decide whether using an item destroys it
ALTER TABLE interactions ADD COLUMN IF NOT EXISTS consumes_item boolean DEFAULT false;
