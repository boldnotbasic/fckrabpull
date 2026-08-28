"use client"

import { useState } from 'react'
import { Download, Mail } from 'lucide-react'
import { Button } from '@/components/ui/button'
import AdminAuthBanner from '@/components/AdminAuthBanner'

const glass = {
  background: 'oklch(1 0 0 / 8%)',
  backdropFilter: 'blur(20px) saturate(180%)',
  WebkitBackdropFilter: 'blur(20px) saturate(180%)',
  border: '1px solid oklch(1 0 0 / 12%)',
} as const

export default function AdminExportPage() {
  const [emailStatus, setEmailStatus] = useState<string | null>(null)
  const [sending, setSending] = useState(false)

  async function sendWeeklyReport() {
    setSending(true)
    setEmailStatus(null)
    try {
      const res = await fetch('/api/weekly-report', { method: 'POST' })
      const data = await res.json()
      if (res.ok) {
        setEmailStatus('Rapport verzonden.')
      } else {
        setEmailStatus(`Fout: ${data.error || 'Onbekend'}`)
      }
    } catch (err: any) {
      setEmailStatus(`Fout: ${err.message || 'Netwerkfout'}`)
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <AdminAuthBanner />

      <div className="flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg, oklch(0.6 0.2 80), oklch(0.5 0.22 50))' }}
        >
          <Download className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold" style={{ color: '#d4a517' }}>Exporteren</h1>
          <p className="text-sm" style={{ color: 'oklch(0.65 0.05 280)' }}>Excel-download en wekelijkse e-mail</p>
        </div>
      </div>

      <div className="rounded-2xl p-6" style={glass}>
        <h2 className="font-semibold text-white mb-4">Excel downloaden</h2>
        <p className="text-sm mb-4" style={{ color: 'oklch(0.65 0.05 280)' }}>
          Download spelerstatistieken als Excel-bestand met aparte tabs voor goals, assists en aanwezigheden.
        </p>
        <a href="/api/export" download>
          <Button style={{ background: 'linear-gradient(135deg, oklch(0.72 0.2 305), oklch(0.6 0.22 25))' }}>
            <Download className="h-4 w-4 mr-2" /> Download Excel (.xlsx)
          </Button>
        </a>
      </div>

      <div className="rounded-2xl p-6" style={glass}>
        <h2 className="font-semibold text-white mb-4">Wekelijks rapport versturen</h2>
        <p className="text-sm mb-4" style={{ color: 'oklch(0.65 0.05 280)' }}>
          Stuur nu hetzelfde Excel-rapport per e-mail. Voor automatisering kan je een cron job instellen die elke week POST doet naar <code className="text-xs bg-black/20 px-1 rounded">/api/weekly-report</code>.
        </p>
        <Button
          onClick={sendWeeklyReport}
          disabled={sending}
          style={{ background: 'linear-gradient(135deg, oklch(0.55 0.22 25), oklch(0.5 0.2 340))' }}
        >
          <Mail className="h-4 w-4 mr-2" />
          {sending ? 'Bezig...' : 'Nu versturen'}
        </Button>
        {emailStatus && (
          <p
            className="text-sm mt-3"
            style={{ color: emailStatus.startsWith('Fout') ? 'oklch(0.7 0.2 25)' : 'oklch(0.7 0.18 160)' }}
          >
            {emailStatus}
          </p>
        )}
      </div>
    </div>
  )
}
