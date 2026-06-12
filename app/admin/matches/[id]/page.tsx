"use client"

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Target, ArrowLeft, Trash2, UserCheck, Award } from 'lucide-react'
import Link from 'next/link'

const glass = {
  background: 'oklch(1 0 0 / 8%)',
  backdropFilter: 'blur(20px) saturate(180%)',
  WebkitBackdropFilter: 'blur(20px) saturate(180%)',
  border: '1px solid oklch(1 0 0 / 12%)',
} as const

interface Player { id: string; full_name: string; avatar_url: string | null }
interface GoalEvent { id: string; minute: number | null; scorer_player_id: string; assist_player_id: string | null; players_scorer: { full_name: string } | null; players_assist: { full_name: string } | null }
interface Match { our_score: number | null; opponent_score: number | null; status: string; is_home: boolean; teams: { name: string } | null; date: string; kickoff: string }
interface Attendance { player_id: string; present: boolean }

export default function AdminMatchDetailPage() {
  const supabase = createClient()
  const params = useParams<{ id: string }>()
  const matchId = params.id

  const [match, setMatch] = useState<Match | null>(null)
  const [players, setPlayers] = useState<Player[]>([])
  const [goals, setGoals] = useState<GoalEvent[]>([])
  const [attendance, setAttendance] = useState<Map<string, boolean>>(new Map())
  const [attendanceMsg, setAttendanceMsg] = useState<string | null>(null)
  const [ourScore, setOurScore] = useState('0')
  const [oppScore, setOppScore] = useState('0')
  const [scorerId, setScorerId] = useState('')
  const [assistId, setAssistId] = useState('')
  const [minute, setMinute] = useState('')
  const [scoreMsg, setScoreMsg] = useState<string | null>(null)
  const [goalMsg, setGoalMsg] = useState<string | null>(null)
  const [poll, setPoll] = useState<any | null>(null)
  const [pollMsg, setPollMsg] = useState<string | null>(null)
  const [motmResults, setMotmResults] = useState<any[]>([])

  const baseUrl = (typeof window !== 'undefined' && (window as any).location?.origin)
    ? (window as any).location.origin
    : (process.env.NEXT_PUBLIC_SITE_URL || '')

  async function loadAll() {
    const { data: p } = await supabase.from('players').select('id, full_name, avatar_url').eq('active', true).order('full_name')
    setPlayers(p || [])
    
    // Load attendance
    const { data: att } = await supabase
      .from('match_attendance')
      .select('player_id, present')
      .eq('match_id', matchId)
    const attMap = new Map<string, boolean>()
    att?.forEach((a: any) => attMap.set(a.player_id, a.present))
    setAttendance(attMap)
    const { data: m } = await supabase
      .from('matches')
      .select('our_score, opponent_score, status, is_home, date, kickoff, teams:opponent_team_id(name)')
      .eq('id', matchId)
      .single()
    if (m) {
      setMatch(m as any)
      setOurScore(m.our_score?.toString() ?? '0')
      setOppScore(m.opponent_score?.toString() ?? '0')
    }
    const { data: g } = await supabase
      .from('match_events')
      .select('id, minute, scorer_player_id, assist_player_id, players_scorer:scorer_player_id(full_name), players_assist:assist_player_id(full_name)')
      .eq('match_id', matchId)
      .order('minute')
    setGoals((g || []) as any)

    // Load open MOTM poll for this match
    const { data: pol } = await supabase
      .from('motm_polls')
      .select('*')
      .eq('match_id', matchId)
      .eq('status', 'open')
      .maybeSingle()
    setPoll(pol || null)

    // Load MOTM results for this match
    await loadMotmResults(matchId)
  }

  useEffect(() => { if (matchId) loadAll() }, [matchId])

  async function saveScore(e: React.FormEvent) {
    e.preventDefault()
    const { error } = await supabase.from('matches').update({
      our_score: Number(ourScore),
      opponent_score: Number(oppScore),
      status: 'finished'
    }).eq('id', matchId)
    if (error) setScoreMsg('✗ ' + error.message)
    else { setScoreMsg('✓ Uitslag opgeslagen!'); loadAll() }
  }

  async function addGoal(e: React.FormEvent) {
    e.preventDefault()
    if (!scorerId) return setGoalMsg('✗ Kies een doelpuntenmaker')
    const { error } = await supabase.from('match_events').insert({
      match_id: matchId,
      type: 'goal',
      scorer_player_id: scorerId,
      assist_player_id: assistId || null,
      minute: minute ? Number(minute) : null
    })
    if (error) setGoalMsg('✗ ' + error.message)
    else { setGoalMsg('✓ Goal toegevoegd!'); setScorerId(''); setAssistId(''); setMinute(''); loadAll() }
  }

  async function deleteGoal(id: string) {
    await supabase.from('match_events').delete().eq('id', id)
    loadAll()
  }

  async function openPoll() {
    setPollMsg(null)
    const { data, error } = await supabase
      .from('motm_polls')
      .insert({ match_id: matchId, status: 'open' })
      .select('*')
      .single()
    if (error) setPollMsg('✗ ' + error.message)
    else { setPoll(data); setPollMsg('✓ Poll geopend!') }
  }

  async function closePoll() {
    if (!poll) return
    setPollMsg(null)
    const { error } = await supabase
      .from('motm_polls')
      .update({ status: 'closed', closes_at: new Date().toISOString() })
      .eq('id', poll.id)
    if (error) setPollMsg('✗ ' + error.message)
    else { setPoll(null); setPollMsg('✓ Poll gesloten') }
  }

  async function loadMotmResults(mid: string) {
    const { data } = await supabase
      .from('v_motm_results')
      .select('match_id, player_id, full_name, avatar_url, votes')
      .eq('match_id', mid)
      .order('votes', { ascending: false })
    setMotmResults((data as any) || [])
  }

  async function toggleAttendance(playerId: string) {
    const currentStatus = attendance.get(playerId) ?? false
    const newStatus = !currentStatus
    
    const { error } = await supabase
      .from('match_attendance')
      .upsert({
        match_id: matchId,
        player_id: playerId,
        present: newStatus
      }, { onConflict: 'match_id,player_id' })
    
    if (error) {
      setAttendanceMsg('✗ ' + error.message)
    } else {
      setAttendanceMsg('✓ Aanwezigheid bijgewerkt')
      loadAll()
    }
  }

  const opponentName = (match as any)?.teams?.name ?? 'Tegenstander'

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-3">
        <Link href="/admin/matches" className="p-2 rounded-lg transition-colors hover:text-white" style={{ color: 'oklch(0.65 0.05 280)', background: 'oklch(1 0 0 / 8%)', border: '1px solid oklch(1 0 0 / 10%)' }}>
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, oklch(0.6 0.2 80), oklch(0.5 0.22 50))' }}>
          <Target className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold" style={{ color: '#d4a517' }}>
            {match ? (match.is_home ? `FC Krabpull vs ${opponentName}` : `${opponentName} vs FC Krabpull`) : 'Match details'}
          </h1>
          <p className="text-sm" style={{ color: 'oklch(0.65 0.05 280)' }}>{match?.date} — {match?.kickoff?.slice(0, 5)}</p>
        </div>
      </div>

      {/* Score */}
      <div className="rounded-2xl p-6" style={glass}>
        <h2 className="font-semibold text-white mb-5">Uitslag invoeren</h2>
        <form onSubmit={saveScore} className="flex flex-wrap items-end gap-4">
          <div className="space-y-1.5">
            <Label className="text-sm" style={{ color: 'oklch(0.75 0.05 280)' }}>FC Krabpull</Label>
            <Input type="number" value={ourScore} onChange={(e) => setOurScore(e.target.value)} min={0} className="w-20 text-center text-2xl font-bold" />
          </div>
          <div className="pb-2 text-xl font-bold" style={{ color: 'oklch(0.5 0.05 280)' }}>—</div>
          <div className="space-y-1.5">
            <Label className="text-sm" style={{ color: 'oklch(0.75 0.05 280)' }}>{opponentName}</Label>
            <Input type="number" value={oppScore} onChange={(e) => setOppScore(e.target.value)} min={0} className="w-20 text-center text-2xl font-bold" />
          </div>
          <Button type="submit" style={{ background: 'linear-gradient(135deg, oklch(0.72 0.2 305), oklch(0.6 0.22 25))' }}>Opslaan</Button>
          {scoreMsg && <span className="text-sm" style={{ color: scoreMsg.startsWith('✓') ? 'oklch(0.7 0.18 160)' : 'oklch(0.7 0.2 25)' }}>{scoreMsg}</span>}
        </form>
      </div>

      {/* Add goal */}
      <div className="rounded-2xl p-6" style={glass}>
        <h2 className="font-semibold text-white mb-5">Goal / assist toevoegen</h2>
        <form onSubmit={addGoal} className="grid gap-4 md:grid-cols-4">
          <div className="space-y-1.5 md:col-span-2">
            <Label className="text-sm" style={{ color: 'oklch(0.75 0.05 280)' }}>Doelpuntenmaker *</Label>
            <Select value={scorerId} onValueChange={(v) => setScorerId(v ?? '')}>
              <SelectTrigger><SelectValue placeholder="Kies speler" /></SelectTrigger>
              <SelectContent>
                {players.map(p => <SelectItem key={p.id} value={p.id}>{p.full_name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm" style={{ color: 'oklch(0.75 0.05 280)' }}>Assist</Label>
            <Select value={assistId} onValueChange={(v) => setAssistId(v ?? '')}>
              <SelectTrigger><SelectValue placeholder="Geen" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="">Geen</SelectItem>
                {players.map(p => <SelectItem key={p.id} value={p.id}>{p.full_name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm" style={{ color: 'oklch(0.75 0.05 280)' }}>Minuut</Label>
            <Input type="number" value={minute} onChange={(e) => setMinute(e.target.value)} min={0} max={60} placeholder="bv. 35" />
          </div>
          <div className="md:col-span-4 flex items-center gap-3">
            <Button type="submit" style={{ background: 'linear-gradient(135deg, oklch(0.72 0.2 305), oklch(0.6 0.22 25))' }}>Goal toevoegen</Button>
            {goalMsg && <span className="text-sm" style={{ color: goalMsg.startsWith('✓') ? 'oklch(0.7 0.18 160)' : 'oklch(0.7 0.2 25)' }}>{goalMsg}</span>}
          </div>
        </form>
      </div>

      {/* Attendance */}
      <div className="rounded-2xl p-6" style={glass}>
        <h2 className="font-semibold text-white mb-5 flex items-center gap-2">
          <UserCheck className="h-5 w-5" /> Aanwezigheden
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {players.map((player) => {
            const isPresent = attendance.get(player.id) ?? false
            return (
              <button
                key={player.id}
                onClick={() => toggleAttendance(player.id)}
                className="flex items-center gap-3 p-3 rounded-xl transition-all"
                style={{
                  background: isPresent ? 'oklch(0.7 0.18 160 / 15%)' : 'oklch(1 0 0 / 5%)',
                  border: isPresent ? '1px solid oklch(0.7 0.18 160 / 30%)' : '1px solid oklch(1 0 0 / 8%)'
                }}
              >
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                  style={{ background: isPresent ? 'oklch(0.7 0.18 160)' : 'oklch(0.5 0.05 280)' }}
                >
                  {isPresent ? '✓' : '−'}
                </div>
                <div className="flex-1 text-left">
                  <div className="text-sm font-medium text-white">{player.full_name}</div>
                </div>
              </button>
            )
          })}
        </div>
        {attendanceMsg && (
          <p className="text-sm mt-3" style={{ color: attendanceMsg.startsWith('✓') ? 'oklch(0.7 0.18 160)' : 'oklch(0.7 0.2 25)' }}>
            {attendanceMsg}
          </p>
        )}
      </div>

      {/* Man van de Match (poll) */}
      <div className="rounded-2xl p-6" style={glass}>
        <h2 className="font-semibold text-white mb-5 flex items-center gap-2">
          <Award className="h-5 w-5" /> Man van de Match (stemming)
        </h2>
        {poll ? (
          <div className="flex flex-col md:flex-row md:items-center gap-3">
            <div className="flex-1 text-sm" style={{ color: 'oklch(0.65 0.05 280)' }}>
              Poll is <span className="text-white font-medium">geopend</span>. Deel deze link om te stemmen:
              <div className="mt-1 break-all text-white">
                <a href={`${baseUrl}/motm/${poll.id}`} target="_blank" rel="noopener noreferrer" className="underline">
                  {`${baseUrl}/motm/${poll.id}`}
                </a>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                onClick={() => navigator.clipboard?.writeText(`${baseUrl}/motm/${poll.id}`)}
              >
                Kopieer link
              </Button>
              <Button onClick={closePoll} variant="destructive">Poll sluiten</Button>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <Button onClick={openPoll} style={{ background: 'linear-gradient(135deg, oklch(0.72 0.2 305), oklch(0.6 0.22 25))' }}>Poll openen</Button>
            <span className="text-sm" style={{ color: 'oklch(0.65 0.05 280)' }}>Open een stemming zodat supporters kunnen stemmen.</span>
          </div>
        )}
        {pollMsg && (
          <p className="text-sm mt-3" style={{ color: pollMsg.startsWith('✓') ? 'oklch(0.7 0.18 160)' : 'oklch(0.7 0.2 25)' }}>
            {pollMsg}
          </p>
        )}

        {/* Live resultaten */}
        <div className="mt-5 space-y-2">
          {motmResults.length === 0 ? (
            <p className="text-xs" style={{ color: 'oklch(0.65 0.05 280)' }}>Nog geen stemmen.</p>
          ) : (
            motmResults.map((r) => {
              const total = motmResults.reduce((s, x) => s + Number(x.votes || 0), 0)
              const pct = total > 0 ? Math.round((Number(r.votes || 0) / total) * 100) : 0
              return (
                <div key={r.player_id} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-white">{r.full_name}</span>
                    <span style={{ color: 'oklch(0.65 0.05 280)' }}>{r.votes} • {pct}%</span>
                  </div>
                  <div className="h-2 rounded-full overflow-hidden" style={{ background: 'oklch(1 0 0 / 8%)', border: '1px solid oklch(1 0 0 / 10%)' }}>
                    <div className="h-full" style={{ width: `${pct}%`, background: 'linear-gradient(135deg, oklch(0.6 0.2 80), oklch(0.5 0.22 50))' }} />
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* Goals list */}
      <div className="rounded-2xl p-6" style={glass}>
        <h2 className="font-semibold text-white mb-5">Goals ({goals.length})</h2>
        {goals.length === 0 ? (
          <p className="text-sm" style={{ color: 'oklch(0.65 0.05 280)' }}>Nog geen goals geregistreerd.</p>
        ) : (
          <div className="space-y-2">
            {goals.map((g) => (
              <div key={g.id} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'oklch(1 0 0 / 5%)', border: '1px solid oklch(1 0 0 / 8%)' }}>
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                  style={{ background: 'linear-gradient(135deg, oklch(0.6 0.2 80), oklch(0.5 0.22 50))' }}
                >
                  ⚽
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium text-white">
                    {(g.players_scorer as any)?.full_name ?? '?'}
                    {g.minute && <span className="ml-2 text-xs" style={{ color: 'oklch(0.65 0.05 280)' }}>{g.minute}&apos;</span>}
                  </div>
                  {g.assist_player_id && (
                    <div className="text-xs" style={{ color: 'oklch(0.65 0.05 280)' }}>
                      Assist: {(g.players_assist as any)?.full_name ?? '?'}
                    </div>
                  )}
                </div>
                <button onClick={() => deleteGoal(g.id)} className="p-2 rounded-lg hover:bg-red-500/20 transition-colors" style={{ color: 'oklch(0.65 0.05 280)' }}>
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
