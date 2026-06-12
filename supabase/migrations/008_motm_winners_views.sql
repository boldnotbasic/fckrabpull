-- Views voor Man van de Match

-- 1) Resultaten per match en speler (bestaat mogelijk al)
CREATE OR REPLACE VIEW public.v_motm_results AS
SELECT 
  v.match_id,
  v.player_id,
  p.full_name,
  p.avatar_url,
  COUNT(*) AS votes
FROM public.motm_votes v
JOIN public.players p ON p.id = v.player_id
GROUP BY v.match_id, v.player_id, p.full_name, p.avatar_url;

-- 2) Winnaar per match (DISTINCT ON, tie-break op naam)
CREATE OR REPLACE VIEW public.v_motm_winners AS
SELECT DISTINCT ON (r.match_id)
  r.match_id,
  r.player_id,
  r.full_name,
  r.avatar_url,
  r.votes
FROM public.v_motm_results r
ORDER BY r.match_id, r.votes DESC, r.full_name ASC;

-- 3) Aantal titels per speler
CREATE OR REPLACE VIEW public.v_motm_title_counts AS
SELECT 
  w.player_id,
  w.full_name,
  w.avatar_url,
  COUNT(*) AS titles
FROM public.v_motm_winners w
GROUP BY w.player_id, w.full_name, w.avatar_url
ORDER BY titles DESC;

-- Schema cache herladen
NOTIFY pgrst, 'reload schema';
