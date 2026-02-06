-- Redesign interactions: FK-based lookup by item_id + object_id + state
-- Tags stored as context for AI, not used for matching

DROP TABLE IF EXISTS interactions;

CREATE TABLE interactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Primary lookup key (item_id NULL = bare hands)
  item_id uuid REFERENCES items(id) ON DELETE CASCADE,
  object_id uuid NOT NULL REFERENCES objects(id) ON DELETE CASCADE,
  required_state text,  -- NULL = any state

  -- Context stored alongside for AI and admin display
  item_tags text[] NOT NULL DEFAULT '{}',
  object_tags text[] NOT NULL DEFAULT '{}',

  -- Result
  result_state text,
  output_item text,
  output_item_tags text[] DEFAULT '{}',
  description text NOT NULL,
  source text NOT NULL DEFAULT 'ai',

  created_at timestamptz DEFAULT now()
);

-- Fast lookup by cache key
CREATE INDEX idx_interactions_lookup
  ON interactions (item_id, object_id, required_state);

-- RLS (permissive for hackathon)
ALTER TABLE interactions ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Allow all on interactions"
    ON interactions FOR ALL USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
