import Link from 'next/link'
import { Trophy, Calendar, Users, Award, Target, Zap, ArrowRight, MapPin, Medal, UserCheck } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { format } from 'date-fns'
import { nl } from 'date-fns/locale'

const glass = {
  background: 'oklch(1 0 0 / 8%)',
  backdropFilter: 'blur(20px) saturate(180%)',
  WebkitBackdropFilter: 'blur(20px) saturate(180%)',
  border: '1px solid oklch(1 0 0 / 12%)',
} as const

export default async function Home() {
  const supabase = await createClient()

  const { data: nextMatch } = await supabase
    .from('matches')
    .select('*, teams:opponent_team_id(name, emblem_url)')
    .eq('status', 'scheduled')
    .order('date', { ascending: true })
    .limit(1)
    .maybeSingle()

  const { count: playerCount } = await supabase
    .from('players').select('*', { count: 'exact', head: true }).eq('active', true)
  const { count: matchCount } = await supabase
    .from('matches').select('*', { count: 'exact', head: true })
  const { count: goalCount } = await supabase
    .from('match_events').select('*', { count: 'exact', head: true })

  // Leaderboard data
  const { data: stats } = await supabase.rpc('get_player_stats')
  // Determine topscorer strictly by goals (fallback tie-breaker: assists, then name)
  const sortedByGoals = stats ? [...stats].sort((a: any, b: any) => {
    const gDiff = Number(b.goals) - Number(a.goals)
    if (gDiff !== 0) return gDiff
    const aDiff = Number(b.assists) - Number(a.assists)
    if (aDiff !== 0) return aDiff
    return String(a.player_name).localeCompare(String(b.player_name))
  }) : []
  const topScorer = sortedByGoals.length > 0 && Number(sortedByGoals[0].goals) > 0 ? sortedByGoals[0] : null
  const topAssist = stats && stats.length > 0 ? [...stats].sort((a: any, b: any) => Number(b.assists) - Number(a.assists))[0] : null
  
  // Attendance data
  const { data: attendanceStats } = await supabase.rpc('get_player_attendance_stats')
  const topAttendance = attendanceStats && attendanceStats.length > 0 ? attendanceStats[0] : null

  // Fetch avatars for the top players (if any)
  const ids: string[] = [
    topScorer?.player_id,
    topAssist?.player_id,
    topAttendance?.player_id,
  ].filter(Boolean) as string[]
  const { data: avatarRows } = ids.length > 0
    ? await supabase.from('players').select('id, avatar_url, full_name').in('id', ids)
    : { data: [] as any[] }
  const avatarMap = new Map<string, string>((avatarRows || []).map((r: any) => [r.id, r.avatar_url]))

  // MOTM King (most titles)
  const { data: motmCounts } = await supabase
    .from('v_motm_title_counts')
    .select('*')
    .limit(1)
  const motmKing = motmCounts && motmCounts.length > 0 ? motmCounts[0] : null
  if (motmKing && !avatarMap.has(motmKing.player_id)) {
    const { data: extra } = await supabase.from('players').select('id, avatar_url').eq('id', motmKing.player_id).limit(1)
    if (extra && extra[0]) avatarMap.set(extra[0].id, extra[0].avatar_url)
  }

  // Trophies data
  const { data: trophies } = await supabase
    .from('trophies')
    .select('*')
    .order('display_order', { ascending: true })
    .order('date_won', { ascending: false })
    .limit(4)

  const navCards = [
    { href: '/players', icon: Users, label: 'Spelers', desc: 'Teamoverzicht', gradient: 'linear-gradient(135deg, oklch(0.5 0.2 270), oklch(0.4 0.22 290))' },
    { href: '/matches', icon: Calendar, label: 'Matchen', desc: 'Wedstrijdkalender', gradient: 'linear-gradient(135deg, oklch(0.45 0.18 220), oklch(0.4 0.2 240))' },
    { href: '/leaderboard', icon: Trophy, label: 'Leaderboard', desc: 'Topschutters & assists', gradient: 'linear-gradient(135deg, oklch(0.6 0.2 80), oklch(0.5 0.22 50))' },
    { href: '/motm', icon: Award, label: 'Man v/d Match', desc: 'Stem op de beste speler', gradient: 'linear-gradient(135deg, oklch(0.55 0.22 25), oklch(0.5 0.2 340))' },
  ]

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl md:text-5xl font-bold mb-2 gradient-text">
          Welkom terug! 👋
        </h1>
        <p className="text-base" style={{ color: 'oklch(0.65 0.05 280)' }}>
          Hier is een overzicht van je teamactiviteiten
        </p>
      </div>

      {/* Stat pills */}
      <div className="flex flex-wrap gap-3">
        {[
          { icon: Users, value: playerCount ?? 0, label: 'spelers' },
          { icon: Calendar, value: matchCount ?? 0, label: 'matchen' },
          { icon: Target, value: goalCount ?? 0, label: 'goals' },
        ].map(({ icon: Icon, value, label }) => (
          <div
            key={label}
            className="flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium"
            style={glass}
          >
            <Icon className="h-4 w-4" style={{ color: '#d4a517' }} />
            <span className="text-white font-semibold">{value}</span>
            <span style={{ color: 'oklch(0.65 0.05 280)' }}>{label}</span>
          </div>
        ))}
      </div>

      {/* Next match banner */}
      <div className="rounded-2xl p-5 md:p-6" style={glass}>
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#d4a517' }}>
            Volgende Match
          </span>
          <Link href="/matches" className="text-xs flex items-center gap-1 hover:text-white transition-colors" style={{ color: 'oklch(0.65 0.05 280)' }}>
            Alle matchen <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
        {nextMatch ? (
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="text-2xl font-bold text-white mb-1 flex items-center gap-3">
                FC Krabpull
                <span style={{ color: 'oklch(0.5 0.05 280)' }}>vs</span>
                {(nextMatch as any).teams?.name ?? (nextMatch as any).opponent ?? 'TBD'}
                {(nextMatch as any).teams?.emblem_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={(nextMatch as any).teams.emblem_url} alt="embleem" className="h-8 w-8 rounded-lg object-contain" />
                )}
              </div>
              <div className="flex gap-4 text-sm" style={{ color: 'oklch(0.65 0.05 280)' }}>
                <span className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  {format(new Date((nextMatch as any).date), 'EEE d MMM yyyy', { locale: nl })}
                  {' — '}{(nextMatch as any).kickoff?.slice(0, 5)}
                </span>
                {(nextMatch as any).venue && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" />
                    {(nextMatch as any).venue}
                  </span>
                )}
              </div>
            </div>
            <div
              className="shrink-0 px-3 py-1.5 rounded-full text-xs font-medium"
              style={{ background: 'rgba(212, 165, 23, 0.20)', color: '#f2cf50', border: '1px solid rgba(212, 165, 23, 0.30)' }}
            >
              {nextMatch.is_home ? 'Thuis' : 'Uit'}
            </div>
          </div>
        ) : (
          <p style={{ color: 'oklch(0.65 0.05 280)' }}>
            Geen aankomende matchen gepland.{' '}
            <Link href="/admin/matches" className="underline hover:text-white">Voeg een match toe</Link>
          </p>
        )}
      </div>

      {/* Nav cards grid */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {navCards.map(({ href, icon: Icon, label, desc, gradient }) => (
          <Link
            key={href}
            href={href}
            className="group rounded-2xl p-5 flex flex-col gap-4 transition-all duration-200 hover:scale-[1.02] hover:shadow-2xl block"
            style={glass}
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: gradient }}
            >
              <Icon className="h-5 w-5 text-white" />
            </div>
            <div>
              <div className="font-semibold text-white mb-0.5">{label}</div>
              <div className="text-xs" style={{ color: 'oklch(0.65 0.05 280)' }}>{desc}</div>
            </div>
            <div className="mt-auto flex items-center gap-1 text-xs font-medium transition-colors" style={{ color: '#d4a517' }}>
              Bekijk <ArrowRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>
        ))}
      </div>

      {/* Leaderboard widgets */}
      <div>
        <h2 className="text-2xl font-bold mb-4" style={{ color: '#d4a517' }}>Leaderboards</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Top Scorer */}
          <div className="rounded-2xl p-5" style={glass}>
            <div className="flex items-center gap-2 mb-3">
              <Target className="h-5 w-5" style={{ color: '#d4a517' }} />
              <h3 className="font-semibold text-white">Topschutter</h3>
            </div>
            {topScorer ? (
              <div className="flex items-center gap-3">
                {(() => {
                  const url = avatarMap.get(topScorer.player_id)
                  return url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={url} alt={topScorer.player_name} className="h-20 w-20 object-contain" />
                  ) : (
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold" style={{ background: 'linear-gradient(135deg, oklch(0.6 0.2 80), oklch(0.5 0.22 50))' }}>
                      {topScorer.player_name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                    </div>
                  )
                })()}
                <div className="flex-1">
                  <div className="font-medium text-white text-sm">{topScorer.player_name}</div>
                  <div className="text-xs" style={{ color: 'oklch(0.65 0.05 280)' }}>{topScorer.goals} goals</div>
                </div>
                <Medal className="h-5 w-5" style={{ color: '#d4a517' }} />
              </div>
            ) : (
              <p className="text-xs" style={{ color: 'oklch(0.65 0.05 280)' }}>Nog geen goals gescoord</p>
            )}
          </div>

          {/* Assist King */}
          <div className="rounded-2xl p-5" style={glass}>
            <div className="flex items-center gap-2 mb-3">
              <Zap className="h-5 w-5" style={{ color: '#d4a517' }} />
              <h3 className="font-semibold text-white">Assist King</h3>
            </div>
            {topAssist && Number(topAssist.assists) > 0 ? (
              <div className="flex items-center gap-3">
                {(() => {
                  const url = avatarMap.get(topAssist.player_id)
                  return url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={url} alt={topAssist.player_name} className="h-20 w-20 object-contain" />
                  ) : (
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold" style={{ background: 'linear-gradient(135deg, oklch(0.5 0.2 270), oklch(0.4 0.22 290))' }}>
                      {topAssist.player_name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                    </div>
                  )
                })()}
                <div className="flex-1">
                  <div className="font-medium text-white text-sm">{topAssist.player_name}</div>
                  <div className="text-xs" style={{ color: 'oklch(0.65 0.05 280)' }}>{topAssist.assists} assists</div>
                </div>
                <Medal className="h-5 w-5" style={{ color: '#d4a517' }} />
              </div>
            ) : (
              <p className="text-xs" style={{ color: 'oklch(0.65 0.05 280)' }}>Nog geen assists gegeven</p>
            )}
          </div>

          {/* Most Present */}
          <div className="rounded-2xl p-5" style={glass}>
            <div className="flex items-center gap-2 mb-3">
              <UserCheck className="h-5 w-5" style={{ color: '#d4a517' }} />
              <h3 className="font-semibold text-white">Meeste aanwezigheden</h3>
            </div>
            {topAttendance ? (
              <div className="flex items-center gap-3">
                {(() => {
                  const url = avatarMap.get(topAttendance.player_id)
                  return url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={url} alt={topAttendance.player_name} className="h-20 w-20 object-contain" />
                  ) : (
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold" style={{ background: 'linear-gradient(135deg, oklch(0.55 0.22 25), oklch(0.5 0.2 340))' }}>
                      {topAttendance.player_name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                    </div>
                  )
                })()}
                <div className="flex-1">
                  <div className="font-medium text-white text-sm">{topAttendance.player_name}</div>
                  <div className="text-xs" style={{ color: 'oklch(0.65 0.05 280)' }}>{topAttendance.attended}/{topAttendance.total_matches} ({topAttendance.attendance_rate}%)</div>
                </div>
                <Medal className="h-5 w-5" style={{ color: '#d4a517' }} />
              </div>
            ) : (
              <p className="text-xs" style={{ color: 'oklch(0.65 0.05 280)' }}>Nog geen aanwezigheden geregistreerd</p>
            )}
          </div>

          {/* Man v/d Match King */}
          <div className="rounded-2xl p-5" style={glass}>
            <div className="flex items-center gap-2 mb-3">
              <Award className="h-5 w-5" style={{ color: '#d4a517' }} />
              <h3 className="font-semibold text-white">Man v/d Match</h3>
            </div>
            {motmKing ? (
              <div className="flex items-center gap-3">
                {(() => {
                  const url = avatarMap.get(motmKing.player_id)
                  return url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={url} alt={motmKing.full_name} className="h-20 w-20 object-contain" />
                  ) : (
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold" style={{ background: 'linear-gradient(135deg, oklch(0.55 0.22 25), oklch(0.5 0.2 340))' }}>
                      {String(motmKing.full_name).split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                    </div>
                  )
                })()}
                <div className="flex-1">
                  <div className="font-medium text-white text-sm">{motmKing.full_name}</div>
                  <div className="text-xs" style={{ color: 'oklch(0.65 0.05 280)' }}>{motmKing.titles} titels</div>
                </div>
                <Medal className="h-5 w-5" style={{ color: '#d4a517' }} />
              </div>
            ) : (
              <p className="text-xs" style={{ color: 'oklch(0.65 0.05 280)' }}>Nog geen titels toegekend</p>
            )}
          </div>
        </div>
      </div>

      {/* Trophy Cabinet */}
      {trophies && trophies.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold flex items-center gap-2" style={{ color: '#d4a517' }}>
              <Trophy className="h-7 w-7" /> Trofeënkast
            </h2>
            <Link href="/admin/trophies" className="text-xs flex items-center gap-1 hover:text-white transition-colors" style={{ color: 'oklch(0.65 0.05 280)' }}>
              Beheer <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {trophies.map((trophy: any) => (
              <div key={trophy.id} className="rounded-2xl p-5 text-center" style={glass}>
                {trophy.image_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={trophy.image_url} alt={trophy.title} className="h-24 w-full object-contain mb-3" />
                )}
                <h3 className="font-semibold text-white text-sm mb-1">{trophy.title}</h3>
                {trophy.season && (
                  <p className="text-xs" style={{ color: 'oklch(0.65 0.05 280)' }}>{trophy.season}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer links */}
      <div className="flex gap-4 text-xs pt-2" style={{ color: 'oklch(0.55 0.05 280)' }}>
        <Link href="/about" className="hover:text-white transition-colors">Over ons</Link>
        <a href="https://instagram.com/fckrabpull" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Instagram</a>
        <a href="https://canva.com/design/your-design-id" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Social Media Design</a>
      </div>
    </div>
  )
}
