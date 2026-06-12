import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { ArrowLeft, Award } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { format } from 'date-fns'
import { nl } from 'date-fns/locale'

export default async function MOTMPage() {
  const supabase = await createClient()

  // Haal de winnaars op
  const { data: winners, error: wErr } = await supabase
    .from('v_motm_winners')
    .select('*')
  if (wErr) console.error('Error fetching winners:', wErr)

  // Verzamel match-ids en haal match details op
  const matchIds = (winners || []).map((w: any) => w.match_id)
  let matchesMap = new Map<string, any>()
  if (matchIds.length > 0) {
    const { data: ms } = await supabase
      .from('matches')
      .select('id, date, our_score, opponent_score, opponent, teams:opponent_team_id(name, emblem_url)')
      .in('id', matchIds)
    matchesMap = new Map<string, any>((ms || []).map((m: any) => [m.id, m]))
  }

  // Haal (optioneel) poll ids per match op voor link naar pollpagina
  let pollMap = new Map<string, any>()
  if (matchIds.length > 0) {
    const { data: polls } = await supabase
      .from('motm_polls')
      .select('id, match_id, status, opens_at')
      .in('match_id', matchIds)
      .order('opens_at', { ascending: false })
    for (const p of polls || []) {
      if (!pollMap.has(p.match_id)) pollMap.set(p.match_id, p)
    }
  }

  // Sorteer aflopend op datum
  const items = (winners || []).slice().sort((a: any, b: any) => {
    const ma = matchesMap.get(a.match_id)
    const mb = matchesMap.get(b.match_id)
    return new Date(mb?.date || 0).getTime() - new Date(ma?.date || 0).getTime()
  })

  return (
    <div>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Link href="/">
            <Button variant="ghost" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Terug naar Home
            </Button>
          </Link>
        </div>

        <header className="mb-8">
          <h1 className="text-4xl font-bold mb-2 flex items-center gap-3 gradient-text">
            <Award className="h-10 w-10" /> Man van de Match
          </h1>
          <p className="text-sm" style={{ color: 'oklch(0.65 0.05 280)' }}>Bekijk de winnaars per wedstrijd en stem via de poll-link.</p>
        </header>

        {!items || items.length === 0 ? (
          <Card className="backdrop-blur-xl bg-white/10 border-white/10">
            <CardContent className="py-8">
              <p className="text-center" style={{ color: 'oklch(0.65 0.05 280)' }}>
                Nog geen Man v/d Match winnaars beschikbaar.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {items.map((w: any) => {
              const m = matchesMap.get(w.match_id)
              const opp = m?.teams?.name ?? m?.opponent ?? 'Tegenstander'
              const dateStr = m?.date ? format(new Date(m.date), 'eee d MMM yyyy', { locale: nl }) : ''
              const poll = pollMap.get(w.match_id)
              return (
                <Card key={`${w.match_id}-${w.player_id}`} className="backdrop-blur-xl bg-white/10 border-white/10">
                  <CardHeader>
                    <CardTitle className="text-white text-base">{dateStr} • FC Krabpull vs {opp}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-3">
                      {w.avatar_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={w.avatar_url} alt={w.full_name} className="h-10 w-10 rounded-full object-cover" />
                      ) : (
                        <div className="h-10 w-10 rounded-full flex items-center justify-center text-sm font-bold" style={{ background: 'oklch(0.5 0.05 280)' }}>
                          {w.full_name.split(' ').map((n: string) => n[0]).join('').slice(0,2).toUpperCase()}
                        </div>
                      )}
                      <div className="flex-1">
                        <div className="text-white font-medium">{w.full_name}</div>
                        <div className="text-xs" style={{ color: 'oklch(0.65 0.05 280)' }}>
                          Uitslag: {m?.our_score ?? '-'} - {m?.opponent_score ?? '-'} • {w.votes} stemmen
                        </div>
                      </div>
                      {poll ? (
                        <Link href={`/motm/${poll.id}`} className="text-xs underline" style={{ color: '#d4a517' }}>
                          Bekijk poll
                        </Link>
                      ) : null}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
