interface StatsRow {
  player_id: string
  player_name: string
  goals: number
  assists: number
  total_points: number
}

interface AttendanceRow {
  player_id: string
  player_name: string
  total_matches: number
  attended: number
  attendance_rate: number
}

interface MergedRow {
  player_name: string
  goals: number
  assists: number
  total_points: number
  attended: number
  total_matches: number
  attendance_rate: number
}

function csvCell(value: string | number): string {
  const text = String(value)
  const needsQuotes = text.includes(',') || text.includes('"') || text.includes('\n') || text.includes('\r')
  const escaped = text.replace(/"/g, '""')
  return needsQuotes ? `"${escaped}"` : escaped
}

export function buildStatsCsv(
  stats: StatsRow[],
  attendance: AttendanceRow[]
): string {
  const attendanceByPlayer = new Map<string, AttendanceRow>()
  for (const a of attendance) {
    attendanceByPlayer.set(a.player_id, a)
  }

  const allIds = new Set<string>([
    ...stats.map((s) => s.player_id),
    ...attendance.map((a) => a.player_id),
  ])

  const rows: MergedRow[] = []
  for (const id of allIds) {
    const s = stats.find((x) => x.player_id === id)
    const a = attendanceByPlayer.get(id)
    rows.push({
      player_name: s?.player_name ?? a?.player_name ?? 'Onbekend',
      goals: s?.goals ?? 0,
      assists: s?.assists ?? 0,
      total_points: s?.total_points ?? 0,
      attended: a?.attended ?? 0,
      total_matches: a?.total_matches ?? 0,
      attendance_rate: a?.attendance_rate ?? 0,
    })
  }

  rows.sort((a, b) => b.total_points - a.total_points || b.goals - a.goals || a.player_name.localeCompare(b.player_name))

  const headers = ['Speler', 'Goals', 'Assists', 'Totaal punten', 'Aanwezig', 'Matchen', 'Aanwezigheid %']
  const lines: string[] = [headers.join(',')]

  for (const row of rows) {
    lines.push(
      [
        csvCell(row.player_name),
        csvCell(row.goals),
        csvCell(row.assists),
        csvCell(row.total_points),
        csvCell(row.attended),
        csvCell(row.total_matches),
        csvCell(row.attendance_rate),
      ].join(',')
    )
  }

  return lines.join('\n')
}
