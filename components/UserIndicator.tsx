"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { User } from "@supabase/supabase-js"
import { LogIn, LogOut, User as UserIcon } from "lucide-react"
import Link from "next/link"

export default function UserIndicator() {
  const [user, setUser] = useState<User | null>(null)
  const [role, setRole] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    async function loadUser() {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      if (user) {
        const { data } = await supabase.from('users').select('role').eq('id', user.id).single()
        setRole(data?.role || null)
      }
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

  async function handleLogout() {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  if (!user) {
    return (
      <Link
        href="/login"
        className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-colors"
        style={{ background: 'oklch(1 0 0 / 8%)', color: 'oklch(0.75 0.05 280)' }}
      >
        <LogIn className="h-4 w-4" />
        Inloggen
      </Link>
    )
  }

  return (
    <div className="space-y-2">
      <div
        className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm"
        style={{ background: 'oklch(1 0 0 / 10%)', border: '1px solid oklch(1 0 0 / 12%)' }}
      >
        <div
          className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
          style={{ background: 'linear-gradient(135deg, oklch(0.6 0.2 160), oklch(0.5 0.22 180))' }}
        >
          <UserIcon className="h-4 w-4 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-xs font-medium text-white truncate">
            {user.email?.split('@')[0] || 'User'}
          </div>
          {role && (
            <div className="text-xs capitalize" style={{ color: 'oklch(0.65 0.05 280)' }}>
              {role}
            </div>
          )}
        </div>
      </div>
      <button
        onClick={handleLogout}
        className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-colors hover:text-white"
        style={{ color: 'oklch(0.75 0.05 280)' }}
      >
        <LogOut className="h-4 w-4" />
        Uitloggen
      </button>
    </div>
  )
}
