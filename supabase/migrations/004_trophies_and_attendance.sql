-- Trophies table for trophy cabinet
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

CREATE POLICY "Trophies are viewable by everyone" ON public.trophies FOR SELECT USING (true);
CREATE POLICY "Admins and managers can manage trophies" ON public.trophies FOR ALL USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'manager'))
);

CREATE TRIGGER set_updated_at_trophies BEFORE UPDATE ON public.trophies 
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Match attendance tracking
CREATE TABLE IF NOT EXISTS public.match_attendance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  match_id UUID NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
  present BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(match_id, player_id)
);

ALTER TABLE public.match_attendance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Match attendance viewable by everyone" ON public.match_attendance FOR SELECT USING (true);
CREATE POLICY "Admins and managers can manage attendance" ON public.match_attendance FOR ALL USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'manager'))
);

CREATE INDEX IF NOT EXISTS idx_match_attendance_match_id ON public.match_attendance(match_id);
CREATE INDEX IF NOT EXISTS idx_match_attendance_player_id ON public.match_attendance(player_id);

-- Storage bucket for trophies
DO $$ BEGIN
  PERFORM 1 FROM storage.buckets WHERE name = 'trophies';
  IF NOT FOUND THEN
    PERFORM storage.create_bucket('trophies', public := true);
  END IF;
END $$;

-- Storage policies for trophies bucket
CREATE POLICY IF NOT EXISTS "Public read on trophies bucket" ON storage.objects
FOR SELECT USING (bucket_id = 'trophies');

CREATE POLICY IF NOT EXISTS "Authenticated write trophies" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'trophies') TO authenticated;

CREATE POLICY IF NOT EXISTS "Authenticated update trophies" ON storage.objects
FOR UPDATE USING (bucket_id = 'trophies') TO authenticated;

CREATE POLICY IF NOT EXISTS "Authenticated delete trophies" ON storage.objects
FOR DELETE USING (bucket_id = 'trophies') TO authenticated;

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
