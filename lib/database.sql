-- Run this in Supabase SQL Editor

CREATE TABLE tattoos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  image_url text NOT NULL,
  price_min integer NOT NULL CHECK (price_min > 0),
  price_max integer NOT NULL CHECK (price_max >= price_min),
  created_at timestamptz DEFAULT now()
);

-- Migration: If you already have the old schema with a single `price` column, run:
-- ALTER TABLE tattoos ADD COLUMN price_min integer;
-- ALTER TABLE tattoos ADD COLUMN price_max integer;
-- UPDATE tattoos SET price_min = price, price_max = price;
-- ALTER TABLE tattoos ALTER COLUMN price_min SET NOT NULL;
-- ALTER TABLE tattoos ALTER COLUMN price_max SET NOT NULL;
-- ALTER TABLE tattoos ADD CHECK (price_min > 0);
-- ALTER TABLE tattoos ADD CHECK (price_max >= price_min);
-- ALTER TABLE tattoos DROP COLUMN price;

ALTER TABLE tattoos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read access" ON tattoos
  FOR SELECT USING (true);

CREATE POLICY "Service role full access" ON tattoos
  FOR ALL USING (auth.role() = 'service_role');
