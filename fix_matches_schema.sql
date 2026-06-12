-- Verify and fix matches table schema
-- Run this in Supabase SQL Editor if you get "opponent_team_id column not found" errors

-- Check if column exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'matches' 
    AND column_name = 'opponent_team_id'
  ) THEN
    -- Add the column if it doesn't exist
    ALTER TABLE public.matches ADD COLUMN opponent_team_id UUID REFERENCES public.teams(id);
    CREATE INDEX idx_matches_opponent_team_id ON public.matches(opponent_team_id);
    RAISE NOTICE 'Column opponent_team_id added to matches table';
  ELSE
    RAISE NOTICE 'Column opponent_team_id already exists';
  END IF;
END $$;
