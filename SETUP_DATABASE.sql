-- ============================================
-- FC KRABPULL - COMPLETE DATABASE SETUP
-- ============================================
-- Kopieer en plak dit VOLLEDIGE script in Supabase SQL Editor
-- Dit script maakt alle tabellen, functies en storage buckets aan

-- ============================================
-- STAP 1: STORAGE BUCKETS
-- ============================================

-- Create buckets
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('players', 'players', true),
  ('teams', 'teams', true),
  ('trophies', 'trophies', true)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS on storage.objects (if not already enabled)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Public read players" ON storage.objects;
DROP POLICY IF EXISTS "Public read teams" ON storage.objects;
DROP POLICY IF EXISTS "Public read trophies" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated write players" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated update players" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated delete players" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated write teams" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated update teams" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated delete teams" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated write trophies" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated update trophies" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated delete trophies" ON storage.objects;

-- Public read policies
CREATE POLICY "Public read players" ON storage.objects
FOR SELECT USING (bucket_id = 'players');

CREATE POLICY "Public read teams" ON storage.objects
FOR SELECT USING (bucket_id = 'teams');

CREATE POLICY "Public read trophies" ON storage.objects
FOR SELECT USING (bucket_id = 'trophies');

-- Authenticated write policies
CREATE POLICY "Authenticated write players" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'players' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated update players" ON storage.objects
FOR UPDATE USING (bucket_id = 'players' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated delete players" ON storage.objects
FOR DELETE USING (bucket_id = 'players' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated write teams" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'teams' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated update teams" ON storage.objects
FOR UPDATE USING (bucket_id = 'teams' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated delete teams" ON storage.objects
FOR DELETE USING (bucket_id = 'teams' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated write trophies" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'trophies' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated update trophies" ON storage.objects
FOR UPDATE USING (bucket_id = 'trophies' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated delete trophies" ON storage.objects
FOR DELETE USING (bucket_id = 'trophies' AND auth.role() = 'authenticated');

-- ============================================
-- STAP 2: TEAMS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.teams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  short_name TEXT,
  emblem_url TEXT,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Teams are viewable by everyone" ON public.teams;
DROP POLICY IF EXISTS "Admins and managers can manage teams" ON public.teams;

CREATE POLICY "Teams are viewable by everyone" ON public.teams FOR SELECT USING (true);
CREATE POLICY "Admins and managers can manage teams" ON public.teams FOR ALL USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'manager'))
);

-- ============================================
-- STAP 3: ADD OPPONENT_TEAM_ID TO MATCHES
-- ============================================

-- Add column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'matches' 
    AND column_name = 'opponent_team_id'
  ) THEN
    ALTER TABLE public.matches ADD COLUMN opponent_team_id UUID REFERENCES public.teams(id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_matches_opponent_team_id ON public.matches(opponent_team_id);

-- ============================================
-- STAP 4: TROPHIES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.trophies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  season TEXT,
  date_won DATE,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.trophies ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Trophies are viewable by everyone" ON public.trophies;
DROP POLICY IF EXISTS "Admins and managers can manage trophies" ON public.trophies;

CREATE POLICY "Trophies are viewable by everyone" ON public.trophies FOR SELECT USING (true);
CREATE POLICY "Admins and managers can manage trophies" ON public.trophies FOR ALL USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'manager'))
);

-- ============================================
-- STAP 5: MATCH ATTENDANCE TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.match_attendance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  match_id UUID NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
  present BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(match_id, player_id)
);

ALTER TABLE public.match_attendance ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Match attendance viewable by everyone" ON public.match_attendance;
DROP POLICY IF EXISTS "Admins and managers can manage attendance" ON public.match_attendance;

CREATE POLICY "Match attendance viewable by everyone" ON public.match_attendance FOR SELECT USING (true);
CREATE POLICY "Admins and managers can manage attendance" ON public.match_attendance FOR ALL USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'manager'))
);

CREATE INDEX IF NOT EXISTS idx_match_attendance_match_id ON public.match_attendance(match_id);
CREATE INDEX IF NOT EXISTS idx_match_attendance_player_id ON public.match_attendance(player_id);

-- ============================================
-- STAP 6: FUNCTIONS
-- ============================================

-- Function to get player attendance stats
CREATE OR REPLACE FUNCTION get_player_attendance_stats()
RETURNS TABLE (
  player_id UUID,
  player_name TEXT,
  total_matches BIGINT,
  attended BIGINT,
  attendance_rate NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id AS player_id,
    p.full_name AS player_name,
    COUNT(ma.id) AS total_matches,
    COUNT(ma.id) FILTER (WHERE ma.present = true) AS attended,
    ROUND(
      (COUNT(ma.id) FILTER (WHERE ma.present = true)::NUMERIC / NULLIF(COUNT(ma.id), 0)) * 100, 
      1
    ) AS attendance_rate
  FROM public.players p
  LEFT JOIN public.match_attendance ma ON p.id = ma.player_id
  WHERE p.active = true
  GROUP BY p.id, p.full_name
  HAVING COUNT(ma.id) > 0
  ORDER BY attended DESC, attendance_rate DESC;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================
-- KLAAR!
-- ============================================
-- Na het uitvoeren van dit script:
-- 1. Ga naar Storage in Supabase Dashboard
-- 2. Controleer of buckets 'players', 'teams', 'trophies' bestaan
-- 3. Test de app!
