import { createClient } from '@/lib/supabase/server'
import { buildStatsXlsx } from '@/lib/xlsx'

export const runtime = 'nodejs'

export async function GET() {
  const supabase = await createClient()

  const { data: stats, error: statsError } = await supabase.rpc('get_player_stats')
  const { data: attendance, error: attendanceError } = await supabase.rpc('get_player_attendance_stats')

  if (statsError) {
    return new Response(JSON.stringify({ error: statsError.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  if (attendanceError) {
    return new Response(JSON.stringify({ error: attendanceError.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const xlsx = buildStatsXlsx(stats ?? [], attendance ?? [])

  return new Response(new Uint8Array(xlsx), {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="fc-krabpull-spelerstatistieken.xlsx"',
    },
  })
}
