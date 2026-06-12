-- Teams table
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

CREATE POLICY "Teams are viewable by everyone" ON public.teams FOR SELECT USING (true);
CREATE POLICY "Admins and managers can manage teams" ON public.teams FOR ALL USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'manager'))
);

-- Link matches to teams (opponent)
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

-- Storage buckets for players and teams (if not present)
DO $$ BEGIN
  PERFORM 1 FROM storage.buckets WHERE name = 'players';
  IF NOT FOUND THEN
    PERFORM storage.create_bucket('players', public := true);
  END IF;
END $$;

DO $$ BEGIN
  PERFORM 1 FROM storage.buckets WHERE name = 'teams';
  IF NOT FOUND THEN
    PERFORM storage.create_bucket('teams', public := true);
  END IF;
END $$;

-- Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Policies: allow read for everyone on players & teams buckets
CREATE POLICY IF NOT EXISTS "Public read on players bucket" ON storage.objects
FOR SELECT USING (bucket_id = 'players');

CREATE POLICY IF NOT EXISTS "Public read on teams bucket" ON storage.objects
FOR SELECT USING (bucket_id = 'teams');

-- Allow authenticated users to upload/update/delete in players & teams buckets
CREATE POLICY IF NOT EXISTS "Authenticated write players" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'players') TO authenticated;

CREATE POLICY IF NOT EXISTS "Authenticated update players" ON storage.objects
FOR UPDATE USING (bucket_id = 'players') TO authenticated;

CREATE POLICY IF NOT EXISTS "Authenticated delete players" ON storage.objects
FOR DELETE USING (bucket_id = 'players') TO authenticated;

CREATE POLICY IF NOT EXISTS "Authenticated write teams" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'teams') TO authenticated;

CREATE POLICY IF NOT EXISTS "Authenticated update teams" ON storage.objects
FOR UPDATE USING (bucket_id = 'teams') TO authenticated;

CREATE POLICY IF NOT EXISTS "Authenticated delete teams" ON storage.objects
FOR DELETE USING (bucket_id = 'teams') TO authenticated;

-- Trigger for updated_at on teams
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.teams FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
