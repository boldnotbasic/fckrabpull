"use client"

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { UserPlus, Trash2, Pencil } from 'lucide-react'
import AdminAuthBanner from '@/components/AdminAuthBanner'

const glass = {
  background: 'oklch(1 0 0 / 8%)',
  backdropFilter: 'blur(20px) saturate(180%)',
  WebkitBackdropFilter: 'blur(20px) saturate(180%)',
  border: '1px solid oklch(1 0 0 / 12%)',
} as const

interface Player {
  id: string
  full_name: string
  shirt_number: number | null
  position: string | null
  avatar_url: string | null
}

export default function AdminPlayersPage() {
  const supabase = createClient()
  const [fullName, setFullName] = useState('')
  const [shirtNumber, setShirtNumber] = useState<number | ''>('')
  const [position, setPosition] = useState('')
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [currentAvatarUrl, setCurrentAvatarUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const [players, setPlayers] = useState<Player[]>([])
  const [preview, setPreview] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)

  async function loadPlayers() {
    const { data } = await supabase.from('players').select('id, full_name, shirt_number, position, avatar_url').eq('active', true).order('shirt_number')
    setPlayers(data || [])
  }

  useEffect(() => { loadPlayers() }, [])

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] || null
    setAvatarFile(f)
    if (f) setPreview(URL.createObjectURL(f))
    else setPreview(null)
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setMessage(null)
    try {
      let avatar_url: string | null = null
      if (avatarFile) {
        const filePath = `players/${Date.now()}_${avatarFile.name}`
        const { error: uploadError } = await supabase.storage.from('players').upload(filePath, avatarFile)
        if (uploadError) throw uploadError
        const { data } = supabase.storage.from('players').getPublicUrl(filePath)
        avatar_url = data.publicUrl
      }
      if (editingId) {
        const payload: any = {
          full_name: fullName,
          shirt_number: shirtNumber === '' ? null : Number(shirtNumber),
          position: position || null,
        }
        if (avatar_url) payload.avatar_url = avatar_url
        // if no new upload, keep current
        if (!avatar_url && currentAvatarUrl) payload.avatar_url = currentAvatarUrl
        const { error } = await supabase.from('players').update(payload).eq('id', editingId)
        if (error) throw error
        setMessage('✓ Speler bijgewerkt!')
      } else {
        const { error: insertError } = await supabase.from('players').insert({
          full_name: fullName,
          shirt_number: shirtNumber === '' ? null : Number(shirtNumber),
          position: position || null,
          avatar_url,
          active: true,
        })
        if (insertError) throw insertError
        setMessage('✓ Speler toegevoegd!')
      }
      setFullName(''); setShirtNumber(''); setPosition(''); setAvatarFile(null); setPreview(null); setEditingId(null); setCurrentAvatarUrl(null)
      loadPlayers()
    } catch (err: any) {
      setMessage('✗ ' + (err.message || 'Er ging iets mis'))
    } finally {
      setLoading(false)
    }
  }

  function startEdit(p: Player) {
    setEditingId(p.id)
    setFullName(p.full_name)
    setShirtNumber(p.shirt_number ?? '')
    setPosition(p.position ?? '')
    setCurrentAvatarUrl(p.avatar_url ?? null)
    setPreview(p.avatar_url ?? null)
    setAvatarFile(null)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function cancelEdit() {
    setEditingId(null)
    setFullName('')
    setShirtNumber('')
    setPosition('')
    setAvatarFile(null)
    setPreview(null)
    setCurrentAvatarUrl(null)
  }

  async function deletePlayer(id: string) {
    await supabase.from('players').update({ active: false }).eq('id', id)
    loadPlayers()
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <AdminAuthBanner />
      
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, oklch(0.5 0.2 270), oklch(0.4 0.22 290))' }}>
          <UserPlus className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold" style={{ color: '#d4a517' }}>Spelers beheren</h1>
          <p className="text-sm" style={{ color: 'oklch(0.65 0.05 280)' }}>Voeg spelers toe aan je team</p>
        </div>
      </div>

      {/* Form */}
      <div className="rounded-2xl p-6" style={glass}>
        <h2 className="font-semibold text-white mb-5 flex items-center gap-2">
          <UserPlus className="h-4 w-4" /> {editingId ? 'Speler bewerken' : 'Nieuwe speler'}
        </h2>
        <form onSubmit={onSubmit} className="grid gap-4 md:grid-cols-2">
          {/* Avatar preview */}
          {preview && (
            <div className="md:col-span-2 flex justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={preview} alt="preview" className="h-24 w-24 rounded-full object-cover border-2" style={{ borderColor: 'oklch(0.72 0.2 305 / 50%)' }} />
            </div>
          )}
          <div className="space-y-1.5">
            <Label className="text-sm" style={{ color: 'oklch(0.75 0.05 280)' }}>Volledige naam *</Label>
            <Input value={fullName} onChange={(e) => setFullName(e.target.value)} required placeholder="Jan Janssen" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm" style={{ color: 'oklch(0.75 0.05 280)' }}>Rugnummer</Label>
            <Input type="number" value={shirtNumber} onChange={(e) => setShirtNumber(e.target.value === '' ? '' : Number(e.target.value))} placeholder="10" min={1} max={99} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm" style={{ color: 'oklch(0.75 0.05 280)' }}>Positie</Label>
            <Select value={position} onValueChange={(v) => setPosition(v ?? '')}>
              <SelectTrigger><SelectValue placeholder="Kies positie" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="keeper">Keeper</SelectItem>
                <SelectItem value="verdediger">Verdediger</SelectItem>
                <SelectItem value="middenvelder">Middenvelder</SelectItem>
                <SelectItem value="aanvaller">Aanvaller</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm" style={{ color: 'oklch(0.75 0.05 280)' }}>Foto speler</Label>
            <Input type="file" accept="image/*" onChange={handleFile} />
          </div>
          <div className="md:col-span-2 flex items-center gap-3">
            <Button type="submit" disabled={loading} style={{ background: 'linear-gradient(135deg, oklch(0.72 0.2 305), oklch(0.6 0.22 25))' }}>
              {loading ? (editingId ? 'Opslaan...' : 'Toevoegen...') : (editingId ? 'Opslaan' : 'Speler toevoegen')}
            </Button>
            {editingId && (
              <button type="button" onClick={cancelEdit} className="px-4 py-2 rounded-lg text-sm font-medium" style={{ background: 'oklch(1 0 0 / 10%)', border: '1px solid oklch(1 0 0 / 12%)' }}>
                Annuleren
              </button>
            )}
            {message && (
              <span className="text-sm" style={{ color: message.startsWith('✓') ? 'oklch(0.7 0.18 160)' : 'oklch(0.7 0.2 25)' }}>
                {message}
              </span>
            )}
          </div>
        </form>
      </div>

      {/* Players list */}
      <div className="rounded-2xl p-6" style={glass}>
        <h2 className="font-semibold text-white mb-5">Huidige spelers ({players.length})</h2>
        {players.length === 0 ? (
          <p className="text-sm" style={{ color: 'oklch(0.65 0.05 280)' }}>Nog geen spelers. Voeg hierboven een speler toe.</p>
        ) : (
          <div className="space-y-2">
            {players.map((p) => (
              <div key={p.id} className="flex items-center gap-4 p-3 rounded-xl" style={{ background: 'oklch(1 0 0 / 5%)', border: '1px solid oklch(1 0 0 / 8%)' }}>
                {p.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.avatar_url} alt={p.full_name} className="h-10 w-10 rounded-full object-cover shrink-0" />
                ) : (
                  <div className="h-10 w-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0" style={{ background: 'linear-gradient(135deg, oklch(0.5 0.2 270), oklch(0.4 0.22 290))' }}>
                    {p.full_name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-white text-sm">{p.full_name}</div>
                  <div className="text-xs" style={{ color: 'oklch(0.65 0.05 280)' }}>
                    {p.shirt_number ? `#${p.shirt_number}` : ''} {p.position ? `· ${p.position}` : ''}
                  </div>
                </div>
                <button onClick={() => startEdit(p)} className="p-2 rounded-lg hover:bg-white/10 transition-colors" style={{ color: 'oklch(0.65 0.05 280)' }} aria-label="Bewerken">
                  <Pencil className="h-4 w-4" />
                </button>
                <button onClick={() => deletePlayer(p.id)} className="p-2 rounded-lg hover:bg-red-500/20 transition-colors" style={{ color: 'oklch(0.65 0.05 280)' }} aria-label="Verwijderen">
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
