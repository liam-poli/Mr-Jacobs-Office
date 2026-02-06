-- Add output_item_id FK so output items are real catalog entries
ALTER TABLE interactions
  ADD COLUMN output_item_id uuid REFERENCES items(id) ON DELETE SET NULL;
