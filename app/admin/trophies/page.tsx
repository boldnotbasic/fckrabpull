'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Trophy, Trash2, Pencil } from 'lucide-react'
import AdminAuthBanner from '@/components/AdminAuthBanner'

const glass = {
  background: 'oklch(1 0 0 / 8%)',
  backdropFilter: 'blur(20px) saturate(180%)',
  WebkitBackdropFilter: 'blur(20px) saturate(180%)',
  border: '1px solid oklch(1 0 0 / 12%)',
} as const

type Trophy = {
  id: string
  title: string
  description: string | null
  image_url: string | null
  season: string | null
  date_won: string | null
  display_order: number
}

export default function TrophiesAdminPage() {
  const supabase = createClient()
  const [trophies, setTrophies] = useState<Trophy[]>([])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const [editingId, setEditingId] = useState<string | null>(null)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [season, setSeason] = useState('')
  const [dateWon, setDateWon] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(null)

  useEffect(() => {
    loadTrophies()
  }, [])

  async function loadTrophies() {
    const { data } = await supabase
      .from('trophies')
      .select('*')
      .order('display_order', { ascending: true })
      .order('date_won', { ascending: false })
    setTrophies(data || [])
  }

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) {
      setImageFile(file)
      const reader = new FileReader()
      reader.onloadend = () => setPreview(reader.result as string)
      reader.readAsDataURL(file)
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    try {
      let image_url: string | null = null

      if (imageFile) {
        const filePath = `trophies/${Date.now()}_${imageFile.name}`
        const { error: uploadError } = await supabase.storage
          .from('trophies')
          .upload(filePath, imageFile)
        if (uploadError) throw uploadError

        const { data } = supabase.storage.from('trophies').getPublicUrl(filePath)
        image_url = data.publicUrl
      }

      if (editingId) {
        const payload: any = {
          title,
          description: description || null,
          season: season || null,
          date_won: dateWon || null,
        }
        if (image_url) payload.image_url = image_url
        else if (currentImageUrl) payload.image_url = currentImageUrl

        const { error } = await supabase
          .from('trophies')
          .update(payload)
          .eq('id', editingId)
        if (error) throw error
        setMessage('✓ Trofee bijgewerkt!')
      } else {
        const { error } = await supabase.from('trophies').insert({
          title,
          description: description || null,
          season: season || null,
          date_won: dateWon || null,
          image_url,
          display_order: trophies.length,
        })
        if (error) throw error
        setMessage('✓ Trofee toegevoegd!')
      }

      resetForm()
      loadTrophies()
    } catch (err: any) {
      setMessage('✗ ' + (err.message || 'Er ging iets mis'))
    } finally {
      setLoading(false)
    }
  }

  function resetForm() {
    setTitle('')
    setDescription('')
    setSeason('')
    setDateWon('')
    setImageFile(null)
    setPreview(null)
    setEditingId(null)
    setCurrentImageUrl(null)
  }

  function startEdit(trophy: Trophy) {
    setEditingId(trophy.id)
    setTitle(trophy.title)
    setDescription(trophy.description || '')
    setSeason(trophy.season || '')
    setDateWon(trophy.date_won || '')
    setCurrentImageUrl(trophy.image_url)
    setPreview(trophy.image_url)
    setImageFile(null)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function deleteTrophy(id: string) {
    if (!confirm('Weet je zeker dat je deze trofee wilt verwijderen?')) return
    const { error } = await supabase.from('trophies').delete().eq('id', id)
    if (error) {
      setMessage('✗ ' + error.message)
    } else {
      setMessage('✓ Trofee verwijderd')
      loadTrophies()
    }
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <AdminAuthBanner />

      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, oklch(0.6 0.2 80), oklch(0.5 0.22 50))' }}>
          <Trophy className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold" style={{ color: '#d4a517' }}>Trofeënkast beheren</h1>
          <p className="text-sm" style={{ color: 'oklch(0.65 0.05 280)' }}>Voeg trofeeën toe aan de trofeënkast</p>
        </div>
      </div>

      <div className="rounded-2xl p-6" style={glass}>
        <h2 className="font-semibold text-white mb-5 flex items-center gap-2">
          <Trophy className="h-4 w-4" /> {editingId ? 'Trofee bewerken' : 'Nieuwe trofee'}
        </h2>
        <form onSubmit={onSubmit} className="grid gap-4 md:grid-cols-2">
          {preview && (
            <div className="md:col-span-2 flex justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={preview} alt="Preview" className="h-40 w-40 object-contain rounded-xl" />
            </div>
          )}

          <div className="space-y-1.5 md:col-span-2">
            <Label className="text-sm" style={{ color: 'oklch(0.75 0.05 280)' }}>Titel *</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Bv. Kampioen 2024-2025"
              required
            />
          </div>

          <div className="space-y-1.5 md:col-span-2">
            <Label className="text-sm" style={{ color: 'oklch(0.75 0.05 280)' }}>Beschrijving</Label>
            <Textarea
              value={description}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDescription(e.target.value)}
              placeholder="Optionele beschrijving"
              rows={3}
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm" style={{ color: 'oklch(0.75 0.05 280)' }}>Seizoen</Label>
            <Input
              value={season}
              onChange={(e) => setSeason(e.target.value)}
              placeholder="Bv. 2024-2025"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm" style={{ color: 'oklch(0.75 0.05 280)' }}>Datum gewonnen</Label>
            <Input
              type="date"
              value={dateWon}
              onChange={(e) => setDateWon(e.target.value)}
            />
          </div>

          <div className="space-y-1.5 md:col-span-2">
            <Label className="text-sm" style={{ color: 'oklch(0.75 0.05 280)' }}>Afbeelding</Label>
            <Input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
            />
          </div>

          <div className="md:col-span-2 flex gap-3">
            <Button type="submit" disabled={loading} style={{ background: 'linear-gradient(135deg, oklch(0.6 0.2 80), oklch(0.5 0.22 50))' }}>
              {loading ? 'Bezig...' : editingId ? 'Bijwerken' : 'Toevoegen'}
            </Button>
            {editingId && (
              <Button type="button" variant="outline" onClick={resetForm}>
                Annuleren
              </Button>
            )}
          </div>

          {message && (
            <p className="md:col-span-2 text-sm" style={{ color: message.startsWith('✓') ? 'oklch(0.7 0.18 160)' : 'oklch(0.7 0.2 25)' }}>
              {message}
            </p>
          )}
        </form>
      </div>

      <div className="rounded-2xl p-6" style={glass}>
        <h2 className="font-semibold text-white mb-5">Huidige trofeeën</h2>
        {trophies.length === 0 ? (
          <p className="text-sm" style={{ color: 'oklch(0.65 0.05 280)' }}>Nog geen trofeeën toegevoegd.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {trophies.map((trophy) => (
              <Card key={trophy.id} className="backdrop-blur-xl bg-white/10 border-white/10">
                <CardContent className="p-4">
                  {trophy.image_url && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={trophy.image_url} alt={trophy.title} className="h-32 w-full object-contain rounded-lg mb-3" />
                  )}
                  <h3 className="font-semibold text-white text-sm mb-1">{trophy.title}</h3>
                  {trophy.season && (
                    <p className="text-xs mb-2" style={{ color: 'oklch(0.65 0.05 280)' }}>{trophy.season}</p>
                  )}
                  <div className="flex gap-2 mt-3">
                    <Button size="sm" variant="ghost" onClick={() => startEdit(trophy)} className="gap-1">
                      <Pencil className="h-3 w-3" /> Bewerk
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => deleteTrophy(trophy.id)} className="gap-1 text-red-400">
                      <Trash2 className="h-3 w-3" /> Verwijder
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
