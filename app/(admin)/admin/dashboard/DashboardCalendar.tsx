'use client'

import { useState, useMemo } from 'react'

export interface CalendarAppointment {
  source: 'Sales Lead' | 'Free Trial / Demo'
  name: string
  email: string
  scheduled_date: string
  scheduled_time: string
  href: string
}

const SOURCE_COLOR: Record<CalendarAppointment['source'], { bg: string; text: string }> = {
  'Sales Lead': { bg: '#ede9fe', text: '#6d28d9' },
  'Free Trial / Demo': { bg: '#dcfce7', text: '#15803d' },
}

export default function DashboardCalendar({ appointments }: { appointments: CalendarAppointment[] }) {
  const [monthOffset, setMonthOffset] = useState(0)
  const now = new Date()
  const viewMonth = new Date(now.getFullYear(), now.getMonth() + monthOffset, 1)
  const year = viewMonth.getFullYear()
  const month = viewMonth.getMonth()
  const firstDay = new Date(year, month, 1)
  const startWeekday = firstDay.getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const byDate = useMemo(() => {
    const map: Record<string, CalendarAppointment[]> = {}
    for (const a of appointments) {
      if (!map[a.scheduled_date]) map[a.scheduled_date] = []
      map[a.scheduled_date].push(a)
    }
    return map
  }, [appointments])

  const cells: (number | null)[] = [
    ...Array(startWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]

  return (
    <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <button onClick={() => setMonthOffset((n) => n - 1)} style={{ background: '#f1f5f9', border: 'none', color: '#374151', borderRadius: 6, padding: '6px 12px', cursor: 'pointer', fontFamily: 'inherit' }}>←</button>
        <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0e0020' }}>
          {viewMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </div>
        <button onClick={() => setMonthOffset((n) => n + 1)} style={{ background: '#f1f5f9', border: 'none', color: '#374151', borderRadius: 6, padding: '6px 12px', cursor: 'pointer', fontFamily: 'inherit' }}>→</button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6, marginBottom: 6 }}>
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
          <div key={d} style={{ fontSize: '0.68rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', textAlign: 'center' }}>{d}</div>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6 }}>
        {cells.map((day, i) => {
          if (day === null) return <div key={i} />
          const iso = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
          const dayAppointments = byDate[iso] ?? []
          return (
            <div key={i} style={{ minHeight: 74, background: '#f8fafc', borderRadius: 6, padding: 6 }}>
              <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginBottom: 4 }}>{day}</div>
              {dayAppointments.slice(0, 3).map((a, idx) => {
                const c = SOURCE_COLOR[a.source]
                return (
                  <a
                    key={idx}
                    href={a.href}
                    title={`${a.name} — ${a.scheduled_time} (${a.source})`}
                    style={{
                      display: 'block', fontSize: '0.62rem', fontWeight: 600, color: c.text, background: c.bg,
                      borderRadius: 4, padding: '2px 4px', marginBottom: 2, whiteSpace: 'nowrap', overflow: 'hidden',
                      textOverflow: 'ellipsis', textDecoration: 'none',
                    }}
                  >
                    {a.scheduled_time} {a.name}
                  </a>
                )
              })}
              {dayAppointments.length > 3 && (
                <div style={{ fontSize: '0.6rem', color: '#94a3b8' }}>+{dayAppointments.length - 3} more</div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
