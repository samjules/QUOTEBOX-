import { alaskaWallTimeToUTC } from '@/lib/alaska-time'

// Shared appointment rules for every "book a call" form on the site
// (/casestudy, /setup) — nothing before 10am, and always at least a
// 24-hour buffer from the moment of booking.
export const MEETING_TIME_SLOTS = ['10:00 AM', '11:00 AM', '12:00 PM', '1:00 PM']
export const BOOKING_BUFFER_HOURS = 24

export function getBookableWeekdays(weeks: number): Date[] {
  const dates: Date[] = []
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const start = new Date(today)
  start.setDate(start.getDate() + 1)
  const end = new Date(today)
  end.setDate(end.getDate() + weeks * 7)
  const d = new Date(start)
  while (d <= end) {
    const day = d.getDay()
    if (day !== 0 && day !== 6) dates.push(new Date(d))
    d.setDate(d.getDate() + 1)
  }
  return dates
}

// Whether a given Alaska-time wall-clock slot is at least BOOKING_BUFFER_HOURS
// away from right now — filters out "tomorrow at 10am" bookings made at
// 11pm tonight, which would violate the buffer despite "tomorrow" looking fine.
export function isSlotBookable(dateISO: string, timeLabel: string): boolean {
  const slotUTC = alaskaWallTimeToUTC(dateISO, timeLabel)
  if (!slotUTC) return false
  return slotUTC.getTime() - Date.now() >= BOOKING_BUFFER_HOURS * 60 * 60 * 1000
}
