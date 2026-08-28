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
  const [resetMode, setResetMode] = useState(false)

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

  async function sendResetEmail(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setMessage(null)
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    if (error) setMessage(`Fout: ${error.message}`)
    else setMessage('Reset-link verstuurd! Controleer je e-mail.')
    setLoading(false)
  }

  return (
    <div className="max-w-md mx-auto">
      <Card className="backdrop-blur-xl bg-white/10 border-white/10">
        <CardHeader>
          <CardTitle>Inloggen</CardTitle>
        </CardHeader>
        <CardContent>
          {!resetMode ? (
            <>
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
              <div className="flex gap-2 mt-4">
                <Button variant="ghost" onClick={signOut}>Uitloggen</Button>
                <Button variant="ghost" onClick={() => setResetMode(true)}>Wachtwoord vergeten?</Button>
              </div>
              {message && <p className="mt-4 text-sm">{message}</p>}
              <p className="mt-4 text-xs text-zinc-300">Maak een user in Supabase Auth en zet je rol op admin in de <code>users</code> tabel.</p>
            </>
          ) : (
            <>
              <form onSubmit={sendResetEmail} className="space-y-4">
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
                <Button type="submit" disabled={loading}>{loading ? 'Versturen...' : 'Reset-link versturen'}</Button>
              </form>
              <Button variant="ghost" className="mt-4" onClick={() => setResetMode(false)}>Terug naar inloggen</Button>
              {message && <p className="mt-4 text-sm">{message}</p>}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
