"use client"

import { useEffect, useState } from 'react'

export default function PWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [show, setShow] = useState(false)

  useEffect(() => {
    // Service worker registratie
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {})
    }

    const handler = (e: any) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setShow(true)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const onInstall = async () => {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome) {
      setShow(false)
      setDeferredPrompt(null)
    }
  }

  if (!show) return null

  return (
    <div className="fixed bottom-4 right-4 z-[60]">
      <div className="rounded-xl px-4 py-3 shadow-xl border border-white/10"
           style={{ background: 'oklch(1 0 0 / 10%)', backdropFilter: 'blur(16px)' }}>
        <div className="text-sm mb-2" style={{ color: 'oklch(0.85 0.03 280)' }}>
          Voeg FC Krabpull toe aan je beginscherm
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShow(false)} className="text-xs px-2 py-1 rounded-md"
                  style={{ background: 'oklch(1 0 0 / 8%)', color: 'oklch(0.75 0.03 280)' }}>Later</button>
          <button onClick={onInstall} className="text-xs px-3 py-1 rounded-md font-medium"
                  style={{ background: 'rgba(212,165,23,.25)', color: '#f2cf50', border: '1px solid rgba(212,165,23,.35)' }}>
            Installeren
          </button>
        </div>
      </div>
    </div>
  )
}
