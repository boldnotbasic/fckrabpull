-- Create storage buckets if they don't exist
-- Run this in Supabase Dashboard SQL Editor

-- Players bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('players', 'players', true)
ON CONFLICT (id) DO NOTHING;

-- Teams bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('teams', 'teams', true)
ON CONFLICT (id) DO NOTHING;

-- Trophies bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('trophies', 'trophies', true)
ON CONFLICT (id) DO NOTHING;

-- Public read policies
CREATE POLICY IF NOT EXISTS "Public read players" ON storage.objects
FOR SELECT USING (bucket_id = 'players');

CREATE POLICY IF NOT EXISTS "Public read teams" ON storage.objects
FOR SELECT USING (bucket_id = 'teams');

CREATE POLICY IF NOT EXISTS "Public read trophies" ON storage.objects
FOR SELECT USING (bucket_id = 'trophies');

-- Authenticated users can upload/update/delete
CREATE POLICY IF NOT EXISTS "Authenticated write players" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'players' AND auth.role() = 'authenticated');

CREATE POLICY IF NOT EXISTS "Authenticated update players" ON storage.objects
FOR UPDATE USING (bucket_id = 'players' AND auth.role() = 'authenticated');

CREATE POLICY IF NOT EXISTS "Authenticated delete players" ON storage.objects
FOR DELETE USING (bucket_id = 'players' AND auth.role() = 'authenticated');

CREATE POLICY IF NOT EXISTS "Authenticated write teams" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'teams' AND auth.role() = 'authenticated');

CREATE POLICY IF NOT EXISTS "Authenticated update teams" ON storage.objects
FOR UPDATE USING (bucket_id = 'teams' AND auth.role() = 'authenticated');

CREATE POLICY IF NOT EXISTS "Authenticated delete teams" ON storage.objects
FOR DELETE USING (bucket_id = 'teams' AND auth.role() = 'authenticated');

CREATE POLICY IF NOT EXISTS "Authenticated write trophies" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'trophies' AND auth.role() = 'authenticated');

CREATE POLICY IF NOT EXISTS "Authenticated update trophies" ON storage.objects
FOR UPDATE USING (bucket_id = 'trophies' AND auth.role() = 'authenticated');

CREATE POLICY IF NOT EXISTS "Authenticated delete trophies" ON storage.objects
FOR DELETE USING (bucket_id = 'trophies' AND auth.role() = 'authenticated');
