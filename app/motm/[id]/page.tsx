"use client"

import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowLeft, Award } from 'lucide-react'

const glass = {
  background: 'oklch(1 0 0 / 8%)',
  backdropFilter: 'blur(20px) saturate(180%)',
  WebkitBackdropFilter: 'blur(20px) saturate(180%)',
  border: '1px solid oklch(1 0 0 / 12%)',
} as const

interface Player { id: string; full_name: string; avatar_url: string | null }
interface Result { player_id: string; full_name: string; avatar_url: string | null; votes: number }

export default function MotmPollPage() {
  const supabase = createClient()
  const params = useParams<{ id: string }>()
  const pollId = params.id

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [poll, setPoll] = useState<any | null>(null)
  const [players, setPlayers] = useState<Player[]>([])
  const [results, setResults] = useState<Result[]>([])
  const [hasVoted, setHasVoted] = useState(false)
  const [voteMsg, setVoteMsg] = useState<string | null>(null)

  const deviceToken = useMemo(() => {
    if (typeof window === 'undefined') return null
    const existing = localStorage.getItem('motm_token')
    if (existing) return existing
    // generate a simple device token
    const token = (crypto && 'randomUUID' in crypto) ? (crypto as any).randomUUID() : Math.random().toString(36).slice(2) + Date.now().toString(36)
    localStorage.setItem('motm_token', token)
    return token
  }, [])

  async function loadAll() {
    try {
      setLoading(true)
      setError(null)

      // Fetch poll by id
      const { data: pol, error: pe } = await supabase
        .from('motm_polls')
        .select('*')
        .eq('id', pollId)
        .maybeSingle()
      if (pe) throw pe
      if (!pol) { setError('Poll niet gevonden'); setLoading(false); return }
      setPoll(pol)

      // Load players
      const { data: p } = await supabase.from('players').select('id, full_name, avatar_url').eq('active', true).order('full_name')
      setPlayers(p || [])

      // Check if this device already voted
      if (deviceToken) {
        const { data: v } = await supabase
          .from('motm_votes')
          .select('id')
          .eq('match_id', pol.match_id)
          .eq('vote_token', deviceToken)
          .maybeSingle()
        if (v) setHasVoted(true)
      }

      // Load results
      await loadResults(pol.match_id)
    } catch (e: any) {
      setError(e.message || 'Er ging iets mis bij het laden')
    } finally {
      setLoading(false)
    }
  }

  async function loadResults(matchId: string) {
    const { data: r } = await supabase
      .from('v_motm_results')
      .select('match_id, player_id, full_name, avatar_url, votes')
      .eq('match_id', matchId)
      .order('votes', { ascending: false })
    setResults((r as any) || [])
  }

  async function castVote(playerId: string) {
    if (!poll) return
    if (hasVoted) return
    setVoteMsg(null)
    const token = deviceToken
    if (!token) return setVoteMsg('✗ Kan geen device token lezen')

    const { error } = await supabase.from('motm_votes').insert({
      match_id: poll.match_id,
      player_id: playerId,
      vote_token: token,
    })
    if (error) {
      setVoteMsg('✗ ' + (error.message || 'Stemmen mislukt'))
    } else {
      setHasVoted(true)
      setVoteMsg('✓ Stem geregistreerd!')
      loadResults(poll.match_id)
    }
  }

  useEffect(() => { if (pollId) loadAll() }, [pollId])

  const pollOpen = poll?.status === 'open'

  return (
    <div className="space-y-6 max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between">
        <Link href="/" className="text-sm hover:text-white transition-colors" style={{ color: 'oklch(0.65 0.05 280)' }}>
          <span className="inline-flex items-center gap-2"><ArrowLeft className="h-4 w-4" /> Terug naar Home</span>
        </Link>
      </div>

      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, oklch(0.55 0.22 25), oklch(0.5 0.2 340))' }}>
          <Award className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold" style={{ color: '#d4a517' }}>Man van de Match</h1>
          {poll && <p className="text-sm" style={{ color: 'oklch(0.65 0.05 280)' }}>Poll status: {poll.status}</p>}
        </div>
      </div>

      {loading && (
        <div className="rounded-2xl p-6" style={glass}>
          <p className="text-sm" style={{ color: 'oklch(0.65 0.05 280)' }}>Laden…</p>
        </div>
      )}

      {error && (
        <div className="rounded-2xl p-6" style={glass}>
          <p className="text-sm" style={{ color: 'oklch(0.7 0.2 25)' }}>{error}</p>
        </div>
      )}

      {!loading && !error && poll && (
        <>
          {/* Vote section */}
          <div className="rounded-2xl p-6" style={glass}>
            <h2 className="font-semibold text-white mb-5">Stem op je speler</h2>
            {pollOpen ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {players.map((pl) => (
                  <button
                    key={pl.id}
                    disabled={hasVoted}
                    onClick={() => castVote(pl.id)}
                    className={`flex items-center gap-3 p-3 rounded-xl text-left transition-colors ${hasVoted ? 'opacity-70 cursor-not-allowed' : 'hover:bg-white/10'}`}
                    style={{ background: 'oklch(1 0 0 / 6%)', border: '1px solid oklch(1 0 0 / 10%)' }}
                  >
                    {pl.avatar_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={pl.avatar_url} alt={pl.full_name} className="h-10 w-10 rounded-full object-cover" />
                    ) : (
                      <div className="h-10 w-10 rounded-full flex items-center justify-center text-sm font-bold" style={{ background: 'oklch(0.5 0.05 280)' }}>
                        {pl.full_name.split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase()}
                      </div>
                    )}
                    <div className="flex-1 text-white">{pl.full_name}</div>
                    <Button disabled={hasVoted} type="button" style={{ background: 'linear-gradient(135deg, oklch(0.72 0.2 305), oklch(0.6 0.22 25))' }}>Stem</Button>
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-sm" style={{ color: 'oklch(0.65 0.05 280)' }}>De poll is gesloten. Hieronder de resultaten.</p>
            )}
            {voteMsg && <p className="text-sm mt-3" style={{ color: voteMsg.startsWith('✓') ? 'oklch(0.7 0.18 160)' : 'oklch(0.7 0.2 25)' }}>{voteMsg}</p>}
          </div>

          {/* Results */}
          <div className="rounded-2xl p-6" style={glass}>
            <h2 className="font-semibold text-white mb-5">Tussenstand</h2>
            {results.length === 0 ? (
              <p className="text-sm" style={{ color: 'oklch(0.65 0.05 280)' }}>Nog geen stemmen.</p>
            ) : (
              <div className="space-y-2">
                {results.map((r) => (
                  <div key={r.player_id} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'oklch(1 0 0 / 5%)', border: '1px solid oklch(1 0 0 / 8%)' }}>
                    {r.avatar_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={r.avatar_url} alt={r.full_name} className="h-8 w-8 rounded-full object-cover" />
                    ) : (
                      <div className="h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: 'oklch(0.5 0.05 280)' }}>
                        {r.full_name.split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase()}
                      </div>
                    )}
                    <div className="flex-1">
                      <div className="text-sm text-white">{r.full_name}</div>
                    </div>
                    <div className="text-sm font-medium" style={{ color: '#d4a517' }}>{r.votes}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
