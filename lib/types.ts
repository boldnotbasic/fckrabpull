export type UserRole = 'admin' | 'manager' | 'player' | 'member'

export type MatchStatus = 'scheduled' | 'live' | 'finished' | 'cancelled'

export interface User {
  id: string
  email: string
  display_name: string | null
  role: UserRole
  created_at: string
  updated_at: string
}

export interface Player {
  id: string
  full_name: string
  shirt_number: number | null
  position: string | null
  user_id: string | null
  avatar_url: string | null
  active: boolean
  created_at: string
  updated_at: string
}

export interface Season {
  id: string
  name: string
  start_date: string
  end_date: string
  active: boolean
  created_at: string
  updated_at: string
}

export interface Match {
  id: string
  season_id: string
  date: string
  kickoff: string
  opponent: string
  venue: string | null
  is_home: boolean
  status: MatchStatus
  our_score: number | null
  opponent_score: number | null
  created_at: string
  updated_at: string
}

export interface MatchEvent {
  id: string
  match_id: string
  type: 'goal'
  scorer_player_id: string
  assist_player_id: string | null
  minute: number | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface MOTMVote {
  id: string
  match_id: string
  voter_user_id: string
  player_id: string
  created_at: string
}

export interface RefereePayment {
  id: string
  match_id: string
  payer_user_id: string
  amount: number
  method: string | null
  paid_at: string
  verified_by: string | null
  note: string | null
  created_at: string
  updated_at: string
}

export interface Setting {
  key: string
  value: string
  created_at: string
  updated_at: string
}

export interface PlayerStats {
  player_id: string
  player_name: string
  goals: number
  assists: number
  total_points: number
}
