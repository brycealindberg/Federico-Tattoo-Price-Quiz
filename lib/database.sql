-- Run this in Supabase SQL Editor

CREATE TABLE tattoos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  image_url text NOT NULL,
  price integer NOT NULL CHECK (price > 0),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE tattoos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read access" ON tattoos
  FOR SELECT USING (true);

CREATE POLICY "Service role full access" ON tattoos
  FOR ALL USING (auth.role() = 'service_role');
