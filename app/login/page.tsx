"use client"

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function LoginPage() {
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function signIn(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setMessage(null)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setMessage(error.message)
    else setMessage('Ingelogd. Herlaad de pagina of ga naar Admin.')
    setLoading(false)
  }

  async function signOut() {
    await supabase.auth.signOut()
    setMessage('Uitgelogd')
  }

  return (
    <div className="max-w-md mx-auto">
      <Card className="backdrop-blur-xl bg-white/10 border-white/10">
        <CardHeader>
          <CardTitle>Inloggen</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={signIn} className="space-y-4">
            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>Wachtwoord</Label>
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            <Button type="submit" disabled={loading}>{loading ? 'Inloggen...' : 'Inloggen'}</Button>
          </form>
          <Button variant="ghost" className="mt-4" onClick={signOut}>Uitloggen</Button>
          {message && <p className="mt-4 text-sm">{message}</p>}
          <p className="mt-4 text-xs text-zinc-300">Maak een user in Supabase Auth en zet je rol op admin in de <code>users</code> tabel.</p>
        </CardContent>
      </Card>
    </div>
  )
}
