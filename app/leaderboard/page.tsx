import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { ArrowLeft, Trophy, Target, Zap, UserCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default async function LeaderboardPage() {
  const supabase = await createClient()
  
  const { data: stats, error } = await supabase
    .rpc('get_player_stats')

  if (error) {
    console.error('Error fetching leaderboard:', error)
  }

  const { data: attendanceStats } = await supabase.rpc('get_player_attendance_stats')

  const sortedByGoals = stats ? [...stats].sort((a, b) => b.goals - a.goals) : []
  const sortedByAssists = stats ? [...stats].sort((a, b) => b.assists - a.assists) : []

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
          <h1 className="text-4xl font-bold mb-2 flex items-center gap-3 gradient-text"><Trophy className="h-10 w-10" /> Leaderboard</h1>
          <p className="text-sm" style={{ color: 'oklch(0.65 0.05 280)' }}>Topschutters en assist-koningen</p>
        </header>

        {!stats || stats.length === 0 ? (
          <Card className="backdrop-blur-xl bg-white/10 border-white/10">
            <CardContent className="py-8">
              <p className="text-center" style={{ color: 'oklch(0.65 0.05 280)' }}>
                Nog geen statistieken beschikbaar. Voeg matchen en goals toe om de leaderboard te vullen.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 lg:grid-cols-3">
            <Card className="backdrop-blur-xl bg-white/10 border-white/10">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Trophy className="h-5 w-5 text-yellow-500" /> Topschutters
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">#</TableHead>
                      <TableHead>Speler</TableHead>
                      <TableHead className="text-right">Goals</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedByGoals.slice(0, 10).map((player: any, index: number) => (
                      <TableRow key={player.player_id}>
                        <TableCell className="font-medium">
                          {index === 0 && <Trophy className="h-4 w-4 text-yellow-500 inline" />}
                          {index === 1 && <Trophy className="h-4 w-4 text-zinc-400 inline" />}
                          {index === 2 && <Trophy className="h-4 w-4 text-amber-600 inline" />}
                          {index > 2 && <span>{index + 1}</span>}
                        </TableCell>
                        <TableCell>{player.player_name}</TableCell>
                        <TableCell className="text-right">
                          <Badge variant="secondary" className="gap-1">
                            <Target className="h-3 w-3" />
                            {player.goals}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <Card className="backdrop-blur-xl bg-white/10 border-white/10">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Zap className="h-5 w-5 text-blue-500" /> Assist-koningen
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">#</TableHead>
                      <TableHead>Speler</TableHead>
                      <TableHead className="text-right">Assists</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedByAssists.slice(0, 10).map((player: any, index: number) => (
                      <TableRow key={player.player_id}>
                        <TableCell className="font-medium">
                          {index === 0 && <Trophy className="h-4 w-4 text-yellow-500 inline" />}
                          {index === 1 && <Trophy className="h-4 w-4 text-zinc-400 inline" />}
                          {index === 2 && <Trophy className="h-4 w-4 text-amber-600 inline" />}
                          {index > 2 && <span>{index + 1}</span>}
                        </TableCell>
                        <TableCell>{player.player_name}</TableCell>
                        <TableCell className="text-right">
                          <Badge variant="secondary" className="gap-1">
                            <Zap className="h-3 w-3" />
                            {player.assists}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <Card className="backdrop-blur-xl bg-white/10 border-white/10">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <UserCheck className="h-5 w-5 text-green-500" /> Aanwezigheden
                </CardTitle>
              </CardHeader>
              <CardContent>
                {attendanceStats && attendanceStats.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">#</TableHead>
                        <TableHead>Speler</TableHead>
                        <TableHead className="text-right">Aanwezig</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {attendanceStats.slice(0, 10).map((player: any, index: number) => (
                        <TableRow key={player.player_id}>
                          <TableCell className="font-medium">
                            {index === 0 && <Trophy className="h-4 w-4 text-yellow-500 inline" />}
                            {index === 1 && <Trophy className="h-4 w-4 text-zinc-400 inline" />}
                            {index === 2 && <Trophy className="h-4 w-4 text-amber-600 inline" />}
                            {index > 2 && <span>{index + 1}</span>}
                          </TableCell>
                          <TableCell>{player.player_name}</TableCell>
                          <TableCell className="text-right">
                            <Badge variant="secondary" className="gap-1">
                              <UserCheck className="h-3 w-3" />
                              {player.attended}/{player.total_matches} ({player.attendance_rate}%)
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <p className="text-xs" style={{ color: 'oklch(0.65 0.05 280)' }}>
                    Nog geen aanwezigheden geregistreerd. Registreer aanwezigheden bij matchen.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
