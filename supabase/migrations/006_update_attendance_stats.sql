-- Fix attendance stats to use ALL matches as denominator
-- so a player who was marked present in 2 matches out of 3 total
-- shows 2/3 (66.7%) instead of 2/2 (100%).

CREATE OR REPLACE FUNCTION public.get_player_attendance_stats()
RETURNS TABLE (
  player_id UUID,
  player_name TEXT,
  total_matches BIGINT,
  attended BIGINT,
  attendance_rate NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  WITH all_matches AS (
    SELECT id FROM public.matches
  )
  SELECT 
    p.id AS player_id,
    p.full_name AS player_name,
    COUNT(m.id) AS total_matches,
    COUNT(ma.*) FILTER (WHERE ma.present = true) AS attended,
    CASE WHEN COUNT(m.id) > 0
      THEN ROUND(((COUNT(ma.*) FILTER (WHERE ma.present = true))::NUMERIC / COUNT(m.id)) * 100, 1)
      ELSE 0 END AS attendance_rate
  FROM public.players p
  CROSS JOIN all_matches m
  LEFT JOIN public.match_attendance ma
    ON ma.match_id = m.id AND ma.player_id = p.id
  WHERE p.active = true
  GROUP BY p.id, p.full_name
  HAVING COUNT(m.id) > 0
  ORDER BY attended DESC, attendance_rate DESC, p.full_name;
END;
$$ LANGUAGE plpgsql STABLE;
