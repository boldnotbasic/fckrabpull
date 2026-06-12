import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { ArrowLeft, Target, Zap, Square, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default async function PlayersPage() {
  const supabase = await createClient()
  
  const { data: players, error } = await supabase
    .from('players')
    .select('*')
    .eq('active', true)
    .order('shirt_number', { ascending: true })

  const { data: stats } = await supabase.rpc('get_player_stats')
  const statsMap = new Map<string, any>((stats || []).map((s: any) => [s.player_id, s]))

  if (error) {
    console.error('Error fetching players:', error)
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
          <h1 className="text-4xl font-bold mb-2 flex items-center gap-3" style={{ color: '#d4a517' }}>
            <Users className="h-10 w-10" /> Spelers
          </h1>
          <p className="text-sm" style={{ color: 'oklch(0.65 0.05 280)' }}>Ons team voor dit seizoen</p>
        </header>

        {!players || players.length === 0 ? (
          <Card className="backdrop-blur-xl bg-white/10 border-white/10">
            <CardContent className="py-8">
              <p className="text-center" style={{ color: 'oklch(0.65 0.05 280)' }}>
                Nog geen spelers toegevoegd. Admins kunnen spelers toevoegen via het admin panel.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 md:gap-6">
            {players.map((player) => {
              const s = statsMap.get(player.id) || { goals: 0, assists: 0 }
              const goals = Number(s.goals || 0)
              const assists = Number(s.assists || 0)
              const yellows = 0
              const reds = 0
              return (
                <Card key={player.id} className="hover:shadow-xl transition-all backdrop-blur-xl bg-white/10 border-white/10">
                  <CardHeader>
                    <div className="flex flex-col items-center text-center">
                      {/* avatar as large rectangle, centered */}
                      {player.avatar_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={player.avatar_url} alt={player.full_name} className="w-[80%] h-auto object-contain rounded-xl" />
                      ) : (
                        <div className="w-[80%] aspect-square rounded-xl flex items-center justify-center text-xl font-bold" style={{ background: 'linear-gradient(135deg, oklch(0.5 0.2 270), oklch(0.4 0.22 290))' }}>
                          {player.full_name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                        </div>
                      )}
                      <div className="mt-4">
                        <CardTitle className="text-xl text-white">{player.full_name}</CardTitle>
                        <div className="flex items-center justify-center gap-2 mt-2">
                          {player.shirt_number && (
                            <Badge variant="secondary" className="bg-white/15 border-white/15">#{player.shirt_number}</Badge>
                          )}
                          {player.position && (
                            <Badge variant="outline" className="border-white/15 text-white/90">{player.position}</Badge>
                          )}
                        </div>
                      </div>
                      <div className="grid grid-cols-4 gap-2 mt-4 w-full">
                        <div className="flex items-center justify-center gap-1 rounded-md px-2 py-1 text-xs" style={{ background: 'oklch(1 0 0 / 10%)', border: '1px solid oklch(1 0 0 / 12%)' }}>
                          <Target className="h-3 w-3" /> {goals}
                        </div>
                        <div className="flex items-center justify-center gap-1 rounded-md px-2 py-1 text-xs" style={{ background: 'oklch(1 0 0 / 10%)', border: '1px solid oklch(1 0 0 / 12%)' }}>
                          <Zap className="h-3 w-3" /> {assists}
                        </div>
                        <div className="flex items-center justify-center gap-1 rounded-md px-2 py-1 text-xs" style={{ background: 'oklch(1 0 0 / 10%)', border: '1px solid oklch(1 0 0 / 12%)' }}>
                          <Square className="h-3 w-3" style={{ color: '#f5d90a' }} /> {yellows}
                        </div>
                        <div className="flex items-center justify-center gap-1 rounded-md px-2 py-1 text-xs" style={{ background: 'oklch(1 0 0 / 10%)', border: '1px solid oklch(1 0 0 / 12%)' }}>
                          <Square className="h-3 w-3" style={{ color: '#e5484d' }} /> {reds}
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
