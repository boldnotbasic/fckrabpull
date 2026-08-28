import { createClient } from '@/lib/supabase/server'
import { buildStatsXlsx } from '@/lib/xlsx'
import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

const RECIPIENT = 'gijsvd_1993@hotmail.com'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    const authHeader = request.headers.get('Authorization')
    const token = new URL(request.url).searchParams.get('token')
    const cronSecret = process.env.CRON_SECRET

    let authorized = false

    if (cronSecret && (authHeader === `Bearer ${cronSecret}` || token === cronSecret)) {
      authorized = true
    }

    if (!authorized) {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: userRow } = await supabase
          .from('users')
          .select('role')
          .eq('id', user.id)
          .single()
        if (userRow?.role === 'admin' || userRow?.role === 'manager') {
          authorized = true
        }
      }
    }

    if (!authorized) {
      return NextResponse.json({ error: 'Niet geautoriseerd' }, { status: 403 })
    }

    const { data: stats, error: statsError } = await supabase.rpc('get_player_stats')
    const { data: attendance, error: attendanceError } = await supabase.rpc('get_player_attendance_stats')

    if (statsError || attendanceError) {
      return NextResponse.json(
        { error: statsError?.message || attendanceError?.message || 'Data ophalen mislukt' },
        { status: 500 }
      )
    }

    const xlsx = buildStatsXlsx(stats ?? [], attendance ?? [])
    const xlsxBase64 = xlsx.toString('base64')

    const resendKey = process.env.RESEND_API_KEY
    const fromEmail = process.env.FROM_EMAIL || 'no-reply@fckrabpull.be'
    const toEmail = process.env.WEEKLY_REPORT_RECIPIENT || RECIPIENT

    if (!resendKey) {
      return NextResponse.json(
        { error: 'RESEND_API_KEY ontbreekt; e-mail kan niet worden verstuurd.' },
        { status: 503 }
      )
    }

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: fromEmail,
        to: toEmail,
        subject: 'FC Krabpull - Wekelijks spelersrapport',
        html: '<p>Hierbij het wekelijkse overzicht van spelerstatistieken.</p>',
        attachments: [
          {
            filename: 'fc-krabpull-spelerstatistieken.xlsx',
            content: xlsxBase64,
          },
        ],
      }),
    })

    if (!res.ok) {
      const body = await res.text()
      return NextResponse.json(
        { error: 'E-mail verzenden mislukt', details: body },
        { status: 500 }
      )
    }

    const data = await res.json()
    return NextResponse.json({ success: true, id: data.id })
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Onbekende fout' },
      { status: 500 }
    )
  }
}
