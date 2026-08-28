"use client"

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useRouter } from 'next/navigation'

export default function ResetPasswordPage() {
  const supabase = createClient()
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [isRecovery, setIsRecovery] = useState(false)

  useEffect(() => {
    const hash = window.location.hash
    if (hash && hash.includes('type=recovery')) {
      setIsRecovery(true)
    }
  }, [])

  async function handleReset(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    if (password !== confirmPassword) {
      setMessage('Wachtwoorden komen niet overeen')
      setLoading(false)
      return
    }

    if (password.length < 6) {
      setMessage('Wachtwoord moet minimaal 6 karakters zijn')
      setLoading(false)
      return
    }

    const { error } = await supabase.auth.updateUser({ password })

    if (error) {
      setMessage(`Fout: ${error.message}`)
    } else {
      setMessage('Wachtwoord succesvol gewijzigd! Je wordt doorgestuurd...')
      setTimeout(() => {
        router.push('/login')
      }, 2000)
    }
    setLoading(false)
  }

  if (!isRecovery) {
    return (
      <div className="max-w-md mx-auto">
        <Card className="backdrop-blur-xl bg-white/10 border-white/10">
          <CardHeader>
            <CardTitle>Wachtwoord resetten</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm" style={{ color: 'oklch(0.65 0.05 280)' }}>
              Deze pagina is alleen toegankelijk via de reset-link in je e-mail.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto">
      <Card className="backdrop-blur-xl bg-white/10 border-white/10">
        <CardHeader>
          <CardTitle>Nieuw wachtwoord instellen</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleReset} className="space-y-4">
            <div className="space-y-2">
              <Label>Nieuw wachtwoord</Label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                placeholder="Minimaal 6 karakters"
              />
            </div>
            <div className="space-y-2">
              <Label>Bevestig wachtwoord</Label>
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
                placeholder="Herhaal wachtwoord"
              />
            </div>
            <Button type="submit" disabled={loading}>
              {loading ? 'Opslaan...' : 'Wachtwoord wijzigen'}
            </Button>
          </form>
          {message && (
            <p
              className="mt-4 text-sm"
              style={{
                color: message.startsWith('Fout') || message.includes('niet overeen')
                  ? 'oklch(0.7 0.2 25)'
                  : 'oklch(0.7 0.18 160)',
              }}
            >
              {message}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
