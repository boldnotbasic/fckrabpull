-- MOTM Polls and Votes (basic, no login required)

-- Polls
CREATE TABLE IF NOT EXISTS public.motm_polls (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  match_id UUID NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','closed')),
  opens_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  closes_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Only one OPEN poll per match
CREATE UNIQUE INDEX IF NOT EXISTS uq_open_poll_per_match ON public.motm_polls(match_id) WHERE status = 'open';
CREATE INDEX IF NOT EXISTS idx_motm_polls_match_id ON public.motm_polls(match_id);

ALTER TABLE public.motm_polls ENABLE ROW LEVEL SECURITY;

-- Everyone can view polls
DROP POLICY IF EXISTS "Polls are viewable by everyone" ON public.motm_polls;
CREATE POLICY "Polls are viewable by everyone" ON public.motm_polls
FOR SELECT USING (true);

-- Only admins/managers can manage polls
DROP POLICY IF EXISTS "Admins manage polls" ON public.motm_polls;
CREATE POLICY "Admins manage polls" ON public.motm_polls
FOR ALL USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin','manager'))
);

-- Votes
CREATE TABLE IF NOT EXISTS public.motm_votes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  poll_id UUID NOT NULL REFERENCES public.motm_polls(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
  vote_token TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (poll_id, vote_token)
);

CREATE INDEX IF NOT EXISTS idx_motm_votes_poll_id ON public.motm_votes(poll_id);
CREATE INDEX IF NOT EXISTS idx_motm_votes_player_id ON public.motm_votes(player_id);

ALTER TABLE public.motm_votes ENABLE ROW LEVEL SECURITY;

-- Everyone can view votes (public results). If you want, you can later restrict to only aggregates in the API layer.
DROP POLICY IF EXISTS "Votes are viewable by everyone" ON public.motm_votes;
CREATE POLICY "Votes are viewable by everyone" ON public.motm_votes
FOR SELECT USING (true);

-- Anyone (anon or authenticated) can vote while the poll is open
DROP POLICY IF EXISTS "Anyone can vote on open polls" ON public.motm_votes;
CREATE POLICY "Anyone can vote on open polls" ON public.motm_votes
FOR INSERT TO anon, authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.motm_polls p
    WHERE p.id = public.motm_votes.poll_id AND p.status = 'open'
  )
);

-- Helper view (optional) to quickly aggregate results per poll
CREATE OR REPLACE VIEW public.v_motm_results AS
SELECT 
  v.poll_id,
  v.player_id,
  p.full_name,
  p.avatar_url,
  COUNT(*) AS votes
FROM public.motm_votes v
JOIN public.players p ON p.id = v.player_id
GROUP BY v.poll_id, v.player_id, p.full_name, p.avatar_url;
