import * as XLSX from 'xlsx'

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

export function buildStatsXlsx(
  stats: StatsRow[],
  attendance: AttendanceRow[]
): Buffer {
  const wb = XLSX.utils.book_new()

  const goalsRows = [...stats]
    .sort((a, b) => Number(b.goals) - Number(a.goals))
    .map((s) => [s.player_name, Number(s.goals)])
  const goalsSheet = XLSX.utils.aoa_to_sheet([
    ['Speler', 'Goals'],
    ...goalsRows,
  ])
  XLSX.utils.book_append_sheet(wb, goalsSheet, 'Doelpunten')

  const assistsRows = [...stats]
    .sort((a, b) => Number(b.assists) - Number(a.assists))
    .map((s) => [s.player_name, Number(s.assists)])
  const assistsSheet = XLSX.utils.aoa_to_sheet([
    ['Speler', 'Assists'],
    ...assistsRows,
  ])
  XLSX.utils.book_append_sheet(wb, assistsSheet, 'Assists')

  const attendanceRows = [...attendance]
    .sort((a, b) => Number(b.attended) - Number(a.attended))
    .map((a) => [
      a.player_name,
      Number(a.attended),
      Number(a.total_matches),
      Number(a.attendance_rate),
    ])
  const attendanceSheet = XLSX.utils.aoa_to_sheet([
    ['Speler', 'Aanwezig', 'Matchen', 'Aanwezigheid %'],
    ...attendanceRows,
  ])
  XLSX.utils.book_append_sheet(wb, attendanceSheet, 'Aanwezigheden')

  return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })
}
