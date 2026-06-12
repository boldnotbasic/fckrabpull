"use client"

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Shield, Trash2 } from 'lucide-react'
import AdminAuthBanner from '@/components/AdminAuthBanner'

const glass = {
  background: 'oklch(1 0 0 / 8%)',
  backdropFilter: 'blur(20px) saturate(180%)',
  WebkitBackdropFilter: 'blur(20px) saturate(180%)',
  border: '1px solid oklch(1 0 0 / 12%)',
} as const

interface Team { id: string; name: string; short_name: string | null; emblem_url: string | null }

export default function AdminTeamsPage() {
  const supabase = createClient()
  const [name, setName] = useState('')
  const [shortName, setShortName] = useState('')
  const [emblemFile, setEmblemFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [teams, setTeams] = useState<Team[]>([])

  async function loadTeams() {
    const { data } = await supabase.from('teams').select('id, name, short_name, emblem_url').eq('active', true).order('name')
    setTeams(data || [])
  }

  useEffect(() => { loadTeams() }, [])

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] || null
    setEmblemFile(f)
    setPreview(f ? URL.createObjectURL(f) : null)
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setMessage(null)
    try {
      let emblem_url: string | null = null
      if (emblemFile) {
        const filePath = `teams/${Date.now()}_${emblemFile.name}`
        const { error: uploadError } = await supabase.storage.from('teams').upload(filePath, emblemFile)
        if (uploadError) throw uploadError
        const { data } = supabase.storage.from('teams').getPublicUrl(filePath)
        emblem_url = data.publicUrl
      }
      const { error: insertError } = await supabase.from('teams').insert({ name, short_name: shortName || null, emblem_url, active: true })
      if (insertError) throw insertError
      setMessage('✓ Team toegevoegd!')
      setName(''); setShortName(''); setEmblemFile(null); setPreview(null)
      loadTeams()
    } catch (err: any) {
      setMessage('✗ ' + (err.message || 'Er ging iets mis'))
    } finally {
      setLoading(false)
    }
  }

  async function deleteTeam(id: string) {
    await supabase.from('teams').update({ active: false }).eq('id', id)
    loadTeams()
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <AdminAuthBanner />
      
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, oklch(0.5 0.18 220), oklch(0.4 0.2 240))' }}>
          <Shield className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold" style={{ color: '#d4a517' }}>Teams beheren</h1>
          <p className="text-sm" style={{ color: 'oklch(0.65 0.05 280)' }}>Voeg tegenstanders toe uit de competitie</p>
        </div>
      </div>

      <div className="rounded-2xl p-6" style={glass}>
        <h2 className="font-semibold text-white mb-5">Nieuw team toevoegen</h2>
        <form onSubmit={onSubmit} className="grid gap-4 md:grid-cols-2">
          {preview && (
            <div className="md:col-span-2 flex justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={preview} alt="preview" className="h-20 w-20 rounded-xl object-contain border" style={{ borderColor: 'oklch(1 0 0 / 15%)' }} />
            </div>
          )}
          <div className="space-y-1.5">
            <Label className="text-sm" style={{ color: 'oklch(0.75 0.05 280)' }}>Teamnaam *</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} required placeholder="Bv. FC Barcelona" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm" style={{ color: 'oklch(0.75 0.05 280)' }}>Afkorting</Label>
            <Input value={shortName} onChange={(e) => setShortName(e.target.value)} placeholder="FCB" maxLength={5} />
          </div>
          <div className="space-y-1.5 md:col-span-2">
            <Label className="text-sm" style={{ color: 'oklch(0.75 0.05 280)' }}>Teamembleem / logo</Label>
            <Input type="file" accept="image/*" onChange={handleFile} />
          </div>
          <div className="md:col-span-2 flex items-center gap-3">
            <Button type="submit" disabled={loading} style={{ background: 'linear-gradient(135deg, oklch(0.72 0.2 305), oklch(0.6 0.22 25))' }}>
              {loading ? 'Toevoegen...' : 'Team toevoegen'}
            </Button>
            {message && <span className="text-sm" style={{ color: message.startsWith('✓') ? 'oklch(0.7 0.18 160)' : 'oklch(0.7 0.2 25)' }}>{message}</span>}
          </div>
        </form>
      </div>

      <div className="rounded-2xl p-6" style={glass}>
        <h2 className="font-semibold text-white mb-5">Competitieteams ({teams.length})</h2>
        {teams.length === 0 ? (
          <p className="text-sm" style={{ color: 'oklch(0.65 0.05 280)' }}>Nog geen teams. Voeg hierboven een team toe.</p>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2">
            {teams.map((t) => (
              <div key={t.id} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'oklch(1 0 0 / 5%)', border: '1px solid oklch(1 0 0 / 8%)' }}>
                {t.emblem_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={t.emblem_url} alt={t.name} className="h-10 w-10 rounded-lg object-contain shrink-0" />
                ) : (
                  <div className="h-10 w-10 rounded-lg flex items-center justify-center text-xs font-bold shrink-0" style={{ background: 'oklch(1 0 0 / 10%)' }}>
                    {t.short_name || t.name.slice(0, 3).toUpperCase()}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-white text-sm truncate">{t.name}</div>
                  {t.short_name && <div className="text-xs" style={{ color: 'oklch(0.65 0.05 280)' }}>{t.short_name}</div>}
                </div>
                <button onClick={() => deleteTeam(t.id)} className="p-2 rounded-lg hover:bg-red-500/20 transition-colors shrink-0" style={{ color: 'oklch(0.65 0.05 280)' }}>
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
