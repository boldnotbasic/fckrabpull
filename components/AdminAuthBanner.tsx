"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { User } from "@supabase/supabase-js"
import { AlertCircle, CheckCircle, XCircle } from "lucide-react"
import Link from "next/link"

export default function AdminAuthBanner() {
  const [user, setUser] = useState<User | null>(null)
  const [role, setRole] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function loadUser() {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      if (user) {
        const { data } = await supabase.from('users').select('role').eq('id', user.id).single()
        setRole(data?.role || null)
      }
      setLoading(false)
    }
    loadUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        supabase.from('users').select('role').eq('id', session.user.id).single().then(({ data }) => {
          setRole(data?.role || null)
        })
      } else {
        setRole(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  if (loading) return null

  // Not logged in
  if (!user) {
    return (
      <div
        className="flex items-center gap-3 p-4 rounded-xl mb-6"
        style={{ background: 'oklch(0.6 0.2 25 / 15%)', border: '1px solid oklch(0.6 0.2 25 / 25%)' }}
      >
        <XCircle className="h-5 w-5 shrink-0" style={{ color: 'oklch(0.7 0.2 25)' }} />
        <div className="flex-1">
          <div className="font-medium text-white text-sm">Niet ingelogd</div>
          <div className="text-xs mt-0.5" style={{ color: 'oklch(0.75 0.1 25)' }}>
            Je moet inloggen om spelers, teams of matchen te beheren.
          </div>
        </div>
        <Link
          href="/login"
          className="px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors"
          style={{ background: 'linear-gradient(135deg, oklch(0.72 0.2 305), oklch(0.6 0.22 25))' }}
        >
          Inloggen
        </Link>
      </div>
    )
  }

  // Logged in but no admin/manager role
  if (!role || (role !== 'admin' && role !== 'manager')) {
    return (
      <div
        className="flex items-center gap-3 p-4 rounded-xl mb-6"
        style={{ background: 'oklch(0.65 0.2 60 / 15%)', border: '1px solid oklch(0.65 0.2 60 / 25%)' }}
      >
        <AlertCircle className="h-5 w-5 shrink-0" style={{ color: 'oklch(0.75 0.2 60)' }} />
        <div className="flex-1">
          <div className="font-medium text-white text-sm">Geen admin-rechten</div>
          <div className="text-xs mt-0.5" style={{ color: 'oklch(0.75 0.1 60)' }}>
            Je bent ingelogd als <strong>{user.email}</strong>, maar hebt geen admin of manager rol.
            Voeg jezelf toe aan de <code className="px-1 py-0.5 rounded bg-black/20">public.users</code> tabel met role = 'admin'.
          </div>
        </div>
      </div>
    )
  }

  // Logged in with admin/manager role
  return (
    <div
      className="flex items-center gap-3 p-4 rounded-xl mb-6"
      style={{ background: 'oklch(0.6 0.18 160 / 15%)', border: '1px solid oklch(0.6 0.18 160 / 25%)' }}
    >
      <CheckCircle className="h-5 w-5 shrink-0" style={{ color: 'oklch(0.7 0.18 160)' }} />
      <div className="flex-1">
        <div className="font-medium text-white text-sm">Ingelogd als {role}</div>
        <div className="text-xs mt-0.5" style={{ color: 'oklch(0.75 0.1 160)' }}>
          {user.email} — Je hebt volledige toegang tot admin functies.
        </div>
      </div>
    </div>
  )
}
