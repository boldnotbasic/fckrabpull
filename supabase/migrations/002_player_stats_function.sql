-- Function to get player statistics (goals and assists)
CREATE OR REPLACE FUNCTION public.get_player_stats()
RETURNS TABLE (
  player_id UUID,
  player_name TEXT,
  goals BIGINT,
  assists BIGINT,
  total_points BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id AS player_id,
    p.full_name AS player_name,
    COALESCE(COUNT(DISTINCT me_goals.id), 0) AS goals,
    COALESCE(COUNT(DISTINCT me_assists.id), 0) AS assists,
    COALESCE(COUNT(DISTINCT me_goals.id), 0) + COALESCE(COUNT(DISTINCT me_assists.id), 0) AS total_points
  FROM public.players p
  LEFT JOIN public.match_events me_goals ON me_goals.scorer_player_id = p.id
  LEFT JOIN public.match_events me_assists ON me_assists.assist_player_id = p.id
  WHERE p.active = true
  GROUP BY p.id, p.full_name
  HAVING COALESCE(COUNT(DISTINCT me_goals.id), 0) + COALESCE(COUNT(DISTINCT me_assists.id), 0) > 0
  ORDER BY total_points DESC, goals DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
