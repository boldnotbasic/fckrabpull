import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { ArrowLeft, MapPin, Calendar as CalendarIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { format } from 'date-fns'
import { nl } from 'date-fns/locale'

export default async function MatchesPage() {
  const supabase = await createClient()
  
  const { data: matches, error } = await supabase
    .from('matches')
    .select('*, seasons(name), teams:opponent_team_id(id, name, emblem_url)')
    .order('date', { ascending: false })
    .limit(20)

  if (error) {
    console.error('Error fetching matches:', error)
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      scheduled: 'outline',
      live: 'default',
      finished: 'secondary',
      cancelled: 'destructive'
    }
    const labels: Record<string, string> = {
      scheduled: 'Gepland',
      live: 'Live',
      finished: 'Afgelopen',
      cancelled: 'Geannuleerd'
    }
    return <Badge variant={variants[status] || 'outline'}>{labels[status] || status}</Badge>
  }

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
            <CalendarIcon className="h-10 w-10" /> Matchen
          </h1>
          <p className="text-sm" style={{ color: 'oklch(0.65 0.05 280)' }}>
            Wedstrijdkalender en resultaten
          </p>
        </header>

        {!matches || matches.length === 0 ? (
          <Card className="backdrop-blur-xl bg-white/10 border-white/10">
            <CardContent className="py-8">
              <p className="text-center" style={{ color: 'oklch(0.65 0.05 280)' }}>
                Nog geen matchen ingepland. Admins kunnen matchen toevoegen via het admin panel.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {matches.map((match: any) => (
              <Card key={match.id} className="hover:shadow-xl transition-all backdrop-blur-xl bg-white/10 border-white/10">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <CalendarIcon className="h-4 w-4" style={{ color: 'oklch(0.65 0.05 280)' }} />
                        <span className="text-sm" style={{ color: 'oklch(0.65 0.05 280)' }}>
                          {format(new Date(match.date), 'EEEE d MMMM yyyy', { locale: nl })} - {match.kickoff}
                        </span>
                      </div>
                      <CardTitle className="text-2xl mb-2 flex items-center gap-3 text-white">
                        {match.is_home ? 'FC Krabpull' : (match.teams?.name || match.opponent)}
                        <span style={{ color: 'oklch(0.65 0.05 280)' }}>vs</span>
                        {match.is_home ? (match.teams?.name || match.opponent) : 'FC Krabpull'}
                        {match.teams?.emblem_url && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={match.teams.emblem_url} alt="embleem" className="h-6 w-6 rounded" />
                        )}
                      </CardTitle>
                      {match.venue && (
                        <div className="flex items-center gap-2 text-sm" style={{ color: 'oklch(0.65 0.05 280)' }}>
                          <MapPin className="h-4 w-4" />
                          {match.venue}
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      {getStatusBadge(match.status)}
                      {match.status === 'finished' && match.our_score !== null && (
                        <div className="text-3xl font-bold mt-2 text-white">
                          {match.our_score} - {match.opponent_score}
                        </div>
                      )}
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
