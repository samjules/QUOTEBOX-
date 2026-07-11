// Pure Alaska wall-clock <-> UTC time math, with zero server-only dependencies
// (no Resend/Twilio/Zoom) so it's safe to import from client components too.

function parseTime12h(time: string): { h: number; m: number } | null {
  const match = /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i.exec(time.trim())
  if (!match) return null
  let h = parseInt(match[1], 10)
  const m = parseInt(match[2], 10)
  const period = match[3].toUpperCase()
  if (period === 'PM' && h !== 12) h += 12
  if (period === 'AM' && h === 12) h = 0
  return { h, m }
}

function timeZoneOffsetMinutes(timeZone: string, date: Date): number {
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone, hour12: false,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  })
  const parts = dtf.formatToParts(date)
  const map: Record<string, string> = {}
  for (const p of parts) map[p.type] = p.value
  const hour = map.hour === '24' ? '0' : map.hour
  const asUTC = Date.UTC(Number(map.year), Number(map.month) - 1, Number(map.day), Number(hour), Number(map.minute), Number(map.second))
  return (asUTC - date.getTime()) / 60000
}

export function alaskaWallTimeToUTC(dateISO: string, time12h: string): Date | null {
  const t = parseTime12h(time12h)
  if (!t) return null
  const hh = String(t.h).padStart(2, '0')
  const mm = String(t.m).padStart(2, '0')
  const naiveUTC = new Date(`${dateISO}T${hh}:${mm}:00Z`)
  const offset = timeZoneOffsetMinutes('America/Anchorage', naiveUTC)
  return new Date(naiveUTC.getTime() - offset * 60000)
}
