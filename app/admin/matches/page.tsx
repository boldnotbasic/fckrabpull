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

const GENERATED_SEASONS = ['2024-2025', '2025-2026', '2026-2027', '2027-2028', '2028-2029', '2029-2030', '2030-2031']

interface Team { id: string; name: string }
interface Season { id: string; name: string }

interface IcsEvent {
  start: string
  end?: string
  summary: string
  location?: string
}

function parseIcs(text: string): IcsEvent[] {
  const lines = text.replace(/\r\n/g, '\n').split('\n')
  const unfolded: string[] = []
  for (const line of lines) {
    if (line.startsWith(' ') || line.startsWith('\t')) {
      unfolded[unfolded.length - 1] += line.slice(1)
    } else {
      unfolded.push(line)
    }
  }

  const events: IcsEvent[] = []
  let current: Partial<IcsEvent> = {}
  let inEvent = false

  for (const line of unfolded) {
    if (line === 'BEGIN:VEVENT') {
      inEvent = true
      current = {}
    } else if (line === 'END:VEVENT') {
      inEvent = false
      if (current.start && current.summary) {
        events.push(current as IcsEvent)
      }
      current = {}
    } else if (inEvent) {
      const [keyPart, ...valueParts] = line.split(':')
      const value = valueParts.join(':')
      const key = keyPart.split(';')[0]
      if (key === 'DTSTART') current.start = value
      if (key === 'DTEND') current.end = value
      if (key === 'SUMMARY') current.summary = value
      if (key === 'LOCATION') current.location = value
    }
  }

  return events
}

function parseDt(value: string) {
  const m = value.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})/)
  if (m) return { date: `${m[1]}-${m[2]}-${m[3]}`, time: `${m[4]}:${m[5]}` }
  const d = value.match(/^(\d{4})(\d{2})(\d{2})/)
  if (d) return { date: `${d[1]}-${d[2]}-${d[3]}`, time: '20:00' }
  return null
}

function seasonNameForDate(date: string) {
  const [yearStr, monthStr] = date.split('-')
  const year = Number(yearStr)
  const month = Number(monthStr)
  const startYear = month >= 7 ? year : year - 1
  return `${startYear}-${startYear + 1}`
}

function parseOpponent(summary: string) {
  const parts = summary.split(' - ').map(s => s.trim())
  if (parts.length >= 2) {
    const homeKrabpull = parts[0].toLowerCase().includes('krabpull')
    const awayKrabpull = parts[1].toLowerCase().includes('krabpull')
    if (homeKrabpull && !awayKrabpull) return { isHome: true, opponent: parts[1] }
    if (awayKrabpull && !homeKrabpull) return { isHome: false, opponent: parts[0] }
  }
  return { isHome: true, opponent: summary.trim() }
}

export default function AdminMatchesPage() {
  const supabase = createClient()
  const [date, setDate] = useState('')
  const [kickoff, setKickoff] = useState('20:00')
  const [isHome, setIsHome] = useState(true)
  const [opponentTeamId, setOpponentTeamId] = useState('')
  const [seasonId, setSeasonId] = useState('')
  const [teams, setTeams] = useState<Team[]>([])
  const [seasons, setSeasons] = useState<Season[]>([])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [recent, setRecent] = useState<any[]>([])
  const [icsFileName, setIcsFileName] = useState('')
  const [icsEvents, setIcsEvents] = useState<IcsEvent[]>([])
  const [icsImporting, setIcsImporting] = useState(false)
  const [icsStatus, setIcsStatus] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      const { data: t } = await supabase.from('teams').select('id, name').eq('active', true).order('name')
      setTeams(t || [])
      const { data: s } = await supabase.from('seasons').select('id, name, active').order('start_date', { ascending: false })
      setSeasons(s || [])
      const active = (s || []).find(x => (x as any).active)
      if (active) setSeasonId(active.id)
      const { data: r } = await supabase.from('matches').select('id, date, kickoff, is_home, opponent_team_id, teams:opponent_team_id(name)').order('created_at', { ascending: false }).limit(1000)
      setRecent(r || [])
    }
    load()
  }, [])

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setMessage(null)
    try {
      let finalSeasonId = seasonId
      const existingSeason = seasons.find(s => s.id === seasonId)
      if (!existingSeason) {
        const name = seasonId
        const { data: found } = await supabase
          .from('seasons')
          .select('id')
          .eq('name', name)
          .maybeSingle()
        if (found) {
          finalSeasonId = found.id
        } else {
          const [startYear] = name.split('-')
          const { data: inserted, error: seasonError } = await supabase
            .from('seasons')
            .insert({
              name,
              start_date: `${startYear}-07-01`,
              end_date: `${Number(startYear) + 1}-06-30`,
              active: false,
            })
            .select('id')
            .single()
          if (seasonError) throw seasonError
          finalSeasonId = inserted!.id
        }
      }

      const { error } = await supabase.from('matches').insert({
        season_id: finalSeasonId,
        date,
        kickoff,
        opponent: '',
        opponent_team_id: opponentTeamId || null,
        venue: isHome ? 'Sporthal De Kuip' : 'Uit',
        is_home: isHome,
        status: 'scheduled'
      })
      if (error) throw error
      setMessage('✓ Match toegevoegd!')
      setDate(''); setKickoff('20:00'); setIsHome(true); setOpponentTeamId('')
      const { data: r } = await supabase.from('matches').select('id, date, kickoff, is_home, teams:opponent_team_id(name)').order('created_at', { ascending: false }).limit(1000)
      setRecent(r || [])
    } catch (err: any) {
      setMessage('✗ ' + (err.message || 'Er ging iets mis'))
    } finally {
      setLoading(false)
    }
  }

  async function getOrCreateSeasonId(name: string) {
    const existing = seasons.find(s => s.name === name)
    if (existing) return existing.id
    const { data: found } = await supabase.from('seasons').select('id').eq('name', name).maybeSingle()
    if (found) return found.id
    const [startYear] = name.split('-')
    const { data: inserted, error } = await supabase.from('seasons').insert({
      name,
      start_date: `${startYear}-07-01`,
      end_date: `${Number(startYear) + 1}-06-30`,
      active: false,
    }).select('id').single()
    if (error) throw error
    setSeasons(prev => [...prev, { id: inserted!.id, name }])
    return inserted!.id
  }

  async function getOrCreateTeamId(name: string) {
    const normalized = name.trim()
    const existing = teams.find(t => t.name.toLowerCase().trim() === normalized.toLowerCase())
    if (existing) return existing.id
    const { data: found } = await supabase.from('teams').select('id').eq('name', normalized).maybeSingle()
    if (found) return found.id
    const { data: inserted, error } = await supabase.from('teams').insert({ name: normalized, active: true }).select('id').single()
    if (error) throw error
    setTeams(prev => [...prev, { id: inserted!.id, name: normalized }])
    return inserted!.id
  }

  function handleIcsFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setIcsFileName(file.name)
    setIcsStatus(null)
    setIcsEvents([])
    const reader = new FileReader()
    reader.onload = () => {
      const text = reader.result as string
      const events = parseIcs(text)
      setIcsEvents(events)
      setIcsStatus(`${events.length} matchen gevonden`)
    }
    reader.readAsText(file)
  }

  async function importIcs() {
    if (icsEvents.length === 0) return
    setIcsImporting(true)
    setIcsStatus(null)
    try {
      let imported = 0
      let skipped = 0
      for (const ev of icsEvents) {
        const parsed = parseDt(ev.start)
        if (!parsed) continue
        const { date, time } = parsed
        const { isHome, opponent } = parseOpponent(ev.summary)
        const venue = ev.location || (isHome ? 'Sporthal De Kuip' : 'Uit')
        const seasonName = seasonNameForDate(date)
        const seasonId = await getOrCreateSeasonId(seasonName)
        const opponentTeamId = await getOrCreateTeamId(opponent)
        const { data: existing } = await supabase
          .from('matches')
          .select('id')
          .eq('season_id', seasonId)
          .eq('date', date)
          .eq('kickoff', time)
          .eq('opponent_team_id', opponentTeamId)
          .eq('is_home', isHome)
          .maybeSingle()
        if (existing) { skipped++; continue }
        const { error } = await supabase.from('matches').insert({
          season_id: seasonId,
          date,
          kickoff: time,
          opponent,
          opponent_team_id: opponentTeamId,
          venue,
          is_home: isHome,
          status: 'scheduled',
        })
        if (error) throw error
        imported++
      }
      setIcsStatus(`✓ ${imported} matchen geïmporteerd${skipped > 0 ? ` (${skipped} overgeslagen)` : ''}`)
      setIcsEvents([])
      const { data: r } = await supabase.from('matches').select('id, date, kickoff, is_home, opponent_team_id, teams:opponent_team_id(name)').order('created_at', { ascending: false }).limit(1000)
      setRecent(r || [])
    } catch (err: any) {
      setIcsStatus('✗ ' + (err.message || 'Importeren mislukt'))
    } finally {
      setIcsImporting(false)
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
                {GENERATED_SEASONS.filter(name => !seasons.some(s => s.name === name)).map(name => (
                  <SelectItem key={name} value={name}>{name}</SelectItem>
                ))}
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
          <div className="space-y-1.5 md:col-start-2">
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

      {/* ICS import */}
      <div className="rounded-2xl p-6" style={glass}>
        <h2 className="font-semibold text-white mb-5">Matchen importeren via .ics</h2>
        <p className="text-sm mb-4" style={{ color: 'oklch(0.65 0.05 280)' }}>
          Kies een .ics-bestand (bijv. van Liga Keerbergen) om automatisch matchen toe te voegen.
        </p>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-sm" style={{ color: 'oklch(0.75 0.05 280)' }}>.ics-bestand</Label>
            <Input type="file" accept=".ics" onChange={handleIcsFile} />
            {icsFileName && <p className="text-xs" style={{ color: 'oklch(0.65 0.05 280)' }}>{icsFileName}</p>}
          </div>
          <div className="flex items-center gap-3">
            <Button
              onClick={importIcs}
              disabled={icsImporting || icsEvents.length === 0}
              style={{ background: 'linear-gradient(135deg, oklch(0.72 0.2 305), oklch(0.6 0.22 25))' }}
            >
              {icsImporting ? 'Importeren...' : 'Matchen importeren'}
            </Button>
            {icsStatus && (
              <span className="text-sm" style={{ color: icsStatus.startsWith('✓') ? 'oklch(0.7 0.18 160)' : 'oklch(0.7 0.2 25)' }}>
                {icsStatus}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
