"use client"

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Calendar, ArrowRight } from 'lucide-react'
import AdminAuthBanner from '@/components/AdminAuthBanner'

const glass = {
  background: 'oklch(1 0 0 / 8%)',
  backdropFilter: 'blur(20px) saturate(180%)',
  WebkitBackdropFilter: 'blur(20px) saturate(180%)',
  border: '1px solid oklch(1 0 0 / 12%)',
} as const

interface Team { id: string; name: string }
interface Season { id: string; name: string }

export default function AdminMatchesPage() {
  const supabase = createClient()
  const [date, setDate] = useState('')
  const [kickoff, setKickoff] = useState('20:00')
  const [venue, setVenue] = useState('')
  const [isHome, setIsHome] = useState(true)
  const [opponentTeamId, setOpponentTeamId] = useState('')
  const [seasonId, setSeasonId] = useState('')
  const [teams, setTeams] = useState<Team[]>([])
  const [seasons, setSeasons] = useState<Season[]>([])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [recent, setRecent] = useState<any[]>([])

  useEffect(() => {
    async function load() {
      const { data: t } = await supabase.from('teams').select('id, name').eq('active', true).order('name')
      setTeams(t || [])
      const { data: s } = await supabase.from('seasons').select('id, name, active').order('start_date', { ascending: false })
      setSeasons(s || [])
      const active = (s || []).find(x => (x as any).active)
      if (active) setSeasonId(active.id)
      const { data: r } = await supabase.from('matches').select('id, date, kickoff, is_home, opponent_team_id, teams:opponent_team_id(name)').order('date', { ascending: false }).limit(10)
      setRecent(r || [])
    }
    load()
  }, [])

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setMessage(null)
    try {
      const { error } = await supabase.from('matches').insert({
        season_id: seasonId || null,
        date,
        kickoff,
        opponent: '',
        opponent_team_id: opponentTeamId || null,
        venue: venue || null,
        is_home: isHome,
        status: 'scheduled'
      })
      if (error) throw error
      setMessage('✓ Match toegevoegd!')
      setDate(''); setKickoff('20:00'); setVenue(''); setIsHome(true); setOpponentTeamId('')
      const { data: r } = await supabase.from('matches').select('id, date, kickoff, is_home, teams:opponent_team_id(name)').order('date', { ascending: false }).limit(10)
      setRecent(r || [])
    } catch (err: any) {
      setMessage('✗ ' + (err.message || 'Er ging iets mis'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <AdminAuthBanner />
      
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, oklch(0.45 0.18 220), oklch(0.4 0.2 240))' }}>
          <Calendar className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold" style={{ color: '#d4a517' }}>Matchen beheren</h1>
          <p className="text-sm" style={{ color: 'oklch(0.65 0.05 280)' }}>Plan en beheer wedstrijden</p>
        </div>
      </div>

      {/* Form */}
      <div className="rounded-2xl p-6" style={glass}>
        <h2 className="font-semibold text-white mb-5">Nieuwe match plannen</h2>
        <form onSubmit={onSubmit} className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1.5">
            <Label className="text-sm" style={{ color: 'oklch(0.75 0.05 280)' }}>Seizoen</Label>
            <Select value={seasonId} onValueChange={(v) => setSeasonId(v ?? '')}>
              <SelectTrigger><SelectValue placeholder="Kies seizoen" /></SelectTrigger>
              <SelectContent>
                {seasons.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm" style={{ color: 'oklch(0.75 0.05 280)' }}>Tegenstander *</Label>
            <Select value={opponentTeamId} onValueChange={(v) => setOpponentTeamId(v ?? '')}>
              <SelectTrigger><SelectValue placeholder="Kies team" /></SelectTrigger>
              <SelectContent>
                {teams.length === 0
                  ? <SelectItem value="none" disabled>Voeg eerst teams toe</SelectItem>
                  : teams.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)
                }
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm" style={{ color: 'oklch(0.75 0.05 280)' }}>Datum *</Label>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm" style={{ color: 'oklch(0.75 0.05 280)' }}>Aftrap *</Label>
            <Input type="time" value={kickoff} onChange={(e) => setKickoff(e.target.value)} required />
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm" style={{ color: 'oklch(0.75 0.05 280)' }}>Locatie</Label>
            <Input value={venue} onChange={(e) => setVenue(e.target.value)} placeholder="Sporthal De Kuip" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm" style={{ color: 'oklch(0.75 0.05 280)' }}>Thuis of Uit?</Label>
            <div className="flex items-center gap-3 h-9">
              <Switch checked={isHome} onCheckedChange={setIsHome} />
              <span className="text-sm text-white">{isHome ? 'Thuiswedstrijd' : 'Uitwedstrijd'}</span>
            </div>
          </div>
          <div className="md:col-span-2 flex items-center gap-3">
            <Button type="submit" disabled={loading} style={{ background: 'linear-gradient(135deg, oklch(0.72 0.2 305), oklch(0.6 0.22 25))' }}>
              {loading ? 'Toevoegen...' : 'Match plannen'}
            </Button>
            {message && (
              <span className="text-sm" style={{ color: message.startsWith('✓') ? 'oklch(0.7 0.18 160)' : 'oklch(0.7 0.2 25)' }}>
                {message}
              </span>
            )}
          </div>
        </form>
      </div>

      {/* Recent matches list */}
      <div className="rounded-2xl p-6" style={glass}>
        <h2 className="font-semibold text-white mb-5">Geplande & recente matchen</h2>
        {recent.length === 0 ? (
          <p className="text-sm" style={{ color: 'oklch(0.65 0.05 280)' }}>Nog geen matchen gepland.</p>
        ) : (
          <div className="space-y-2">
            {recent.map((m) => (
              <div key={m.id} className="flex items-center justify-between p-3 rounded-xl" style={{ background: 'oklch(1 0 0 / 5%)', border: '1px solid oklch(1 0 0 / 8%)' }}>
                <div>
                  <div className="font-medium text-white text-sm">
                    {m.is_home ? 'FC Krabpull' : (m.teams?.name || '?')}
                    <span className="mx-2" style={{ color: 'oklch(0.5 0.05 280)' }}>vs</span>
                    {m.is_home ? (m.teams?.name || '?') : 'FC Krabpull'}
                  </div>
                  <div className="text-xs mt-0.5" style={{ color: 'oklch(0.65 0.05 280)' }}>{m.date} — {m.kickoff?.slice(0, 5)}</div>
                </div>
                <a
                  href={`/admin/matches/${m.id}`}
                  className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
                  style={{ background: 'oklch(1 0 0 / 10%)', color: 'oklch(0.72 0.2 305)', border: '1px solid oklch(1 0 0 / 10%)' }}
                >
                  Beheren <ArrowRight className="h-3 w-3" />
                </a>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
