'use client'

import { useMemo, useState } from 'react'
import { US_STATE_TIMEZONES } from '@/lib/us-state-timezones'
import { wallTimeToAlaskaWallTime } from '@/lib/alaska-time'

function to12h(time24: string): string {
  const [hStr, mStr] = time24.split(':')
  let h = parseInt(hStr, 10)
  const period = h >= 12 ? 'PM' : 'AM'
  h = h % 12
  if (h === 0) h = 12
  return `${h}:${mStr} ${period}`
}

function monthGrid(year: number, month: number): (Date | null)[] {
  const first = new Date(year, month, 1)
  const startDay = first.getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells: (Date | null)[] = []
  for (let i = 0; i < startDay; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d))
  return cells
}

export default function BookCallForm() {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const [viewYear, setViewYear] = useState(today.getFullYear())
  const [viewMonth, setViewMonth] = useState(today.getMonth())
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [time, setTime] = useState('14:00')

  const [stateCode, setStateCode] = useState('AK')
  const [clientTime, setClientTime] = useState('14:00')

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [notes, setNotes] = useState('')

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<{ zoomJoinUrl: string | null } | null>(null)

  const cells = monthGrid(viewYear, viewMonth)

  const stateTz = US_STATE_TIMEZONES.find((s) => s.code === stateCode)?.tz ?? 'America/Anchorage'
  const converted = useMemo(() => {
    const baseDate = selectedDate ?? `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
    return wallTimeToAlaskaWallTime(baseDate, clientTime, stateTz)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate, clientTime, stateTz])

  const dayShifted = !!(converted && selectedDate && converted.dateISO !== selectedDate)

  function applyConvertedTime() {
    if (!converted) return
    setTime(converted.time24h)
    if (converted.dateISO !== selectedDate) {
      const [y, m] = converted.dateISO.split('-').map(Number)
      setSelectedDate(converted.dateISO)
      setViewYear(y)
      setViewMonth(m - 1)
    }
  }

  async function handleSubmit() {
    if (!name.trim() || !email.trim()) {
      setError('Name and email are required')
      return
    }
    if (!selectedDate) {
      setError('Pick a date on the calendar')
      return
    }
    setError('')
    setSubmitting(true)
    try {
      const res = await fetch('/api/admin/book-call', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim() || null,
          scheduled_date: selectedDate,
          scheduled_time: to12h(time),
          notes: notes.trim() || null,
        }),
      })
      const d = await res.json()
      if (!res.ok) {
        setError(d.error ?? 'Something went wrong')
        setSubmitting(false)
        return
      }
      setResult({ zoomJoinUrl: d.zoomJoinUrl ?? null })
    } catch {
      setError('Network error. Please try again.')
    }
    setSubmitting(false)
  }

  function reset() {
    setResult(null)
    setName(''); setEmail(''); setPhone(''); setNotes('')
    setSelectedDate(null)
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '9px 12px', borderRadius: 8,
    border: '1px solid #e2e8f0', fontSize: '0.88rem', outline: 'none', boxSizing: 'border-box',
  }
  const labelStyle: React.CSSProperties = {
    fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase',
    letterSpacing: '0.05em', display: 'block', marginBottom: 6,
  }

  if (result) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6" style={{ maxWidth: 480 }}>
        <div style={{
          width: 48, height: 48, borderRadius: '50%', background: 'rgba(91,80,214,0.1)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14,
        }}>
          <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="#5b50d6" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><path d="M5 13l4 4L19 7" /></svg>
        </div>
        <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0e0020', marginBottom: 8 }}>Call booked</div>
        <div style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: 16 }}>
          Confirmation email{phone ? ' + text' : ''} sent to {name}.
        </div>
        {result.zoomJoinUrl && (
          <a href={result.zoomJoinUrl} target="_blank" rel="noreferrer" style={{
            display: 'block', padding: '10px 14px', background: '#f4f4f6', borderRadius: 8,
            fontSize: '0.82rem', color: '#5b50d6', fontWeight: 600, marginBottom: 16, wordBreak: 'break-all',
          }}>{result.zoomJoinUrl}</a>
        )}
        <button
          onClick={reset}
          style={{ padding: '9px 18px', borderRadius: 8, background: '#5b50d6', color: 'white', border: 'none', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer' }}
        >
          Book another call
        </button>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 gap-6" style={{ maxWidth: 900 }}>
      {/* Calendar */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => { const m = viewMonth === 0 ? 11 : viewMonth - 1; setViewMonth(m); if (viewMonth === 0) setViewYear(viewYear - 1) }}
            style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid #e2e8f0', background: 'none', cursor: 'pointer' }}
          >←</button>
          <div style={{ fontWeight: 700, fontSize: '0.92rem', color: '#0e0020' }}>
            {new Date(viewYear, viewMonth, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </div>
          <button
            onClick={() => { const m = viewMonth === 11 ? 0 : viewMonth + 1; setViewMonth(m); if (viewMonth === 11) setViewYear(viewYear + 1) }}
            style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid #e2e8f0', background: 'none', cursor: 'pointer' }}
          >→</button>
        </div>
        <div className="grid grid-cols-7 gap-1 mb-2">
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
            <div key={i} style={{ textAlign: 'center', fontSize: '0.68rem', fontWeight: 700, color: '#94a3b8' }}>{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {cells.map((d, i) => {
            if (!d) return <div key={i} />
            const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
            const isPast = d < today
            const isSelected = selectedDate === iso
            const isToday = d.getTime() === today.getTime()
            return (
              <button
                key={i}
                disabled={isPast}
                onClick={() => setSelectedDate(iso)}
                style={{
                  padding: '8px 0', borderRadius: 8, fontSize: '0.8rem', fontWeight: isToday ? 800 : 500,
                  border: isSelected ? '2px solid #5b50d6' : '1px solid transparent',
                  background: isSelected ? 'rgba(91,80,214,0.1)' : 'transparent',
                  color: isPast ? '#cbd5e1' : isSelected ? '#5b50d6' : '#334155',
                  cursor: isPast ? 'not-allowed' : 'pointer',
                }}
              >
                {d.getDate()}
              </button>
            )
          })}
        </div>

        <div style={{ marginTop: 20, padding: 12, background: '#f4f4f6', borderRadius: 10 }}>
          <label style={labelStyle}>Client&apos;s state</label>
          <select value={stateCode} onChange={(e) => setStateCode(e.target.value)} style={{ ...inputStyle, marginBottom: 12 }}>
            {US_STATE_TIMEZONES.map((s) => (
              <option key={s.code} value={s.code}>{s.name}</option>
            ))}
          </select>

          <label style={labelStyle}>Client&apos;s local time</label>
          <input type="time" value={clientTime} onChange={(e) => setClientTime(e.target.value)} style={inputStyle} />

          {converted && (
            <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
              <div style={{ fontSize: '0.8rem', color: '#334155' }}>
                = <strong style={{ color: '#5b50d6' }}>{to12h(converted.time24h)}</strong> Alaska Time
                {dayShifted && <span style={{ color: '#94a3b8' }}> ({converted.dateISO > (selectedDate ?? '') ? 'next day' : 'prior day'})</span>}
              </div>
              <button
                type="button"
                onClick={applyConvertedTime}
                style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid #5b50d6', background: 'white', color: '#5b50d6', fontWeight: 700, fontSize: '0.75rem', cursor: 'pointer', whiteSpace: 'nowrap' }}
              >
                Use this time →
              </button>
            </div>
          )}
        </div>

        <div style={{ marginTop: 16 }}>
          <label style={labelStyle}>Time (Alaska Time)</label>
          <input type="time" value={time} onChange={(e) => setTime(e.target.value)} style={inputStyle} />
        </div>
      </div>

      {/* Contact info */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={labelStyle}>Name *</label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Client's full name" style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Email *</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="client@company.com" style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Phone</label>
            <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(555) 123-4567" style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Notes</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} placeholder="Anything worth remembering before the call" style={{ ...inputStyle, resize: 'vertical' as const }} />
          </div>

          {selectedDate && (
            <div style={{ fontSize: '0.8rem', color: '#64748b', background: '#f4f4f6', borderRadius: 8, padding: '8px 12px' }}>
              Booking for <strong style={{ color: '#0e0020' }}>{new Date(selectedDate + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</strong> at <strong style={{ color: '#0e0020' }}>{to12h(time)}</strong> (Alaska Time)
            </div>
          )}

          {error && <div style={{ fontSize: '0.82rem', color: '#ef4444' }}>{error}</div>}

          <button
            onClick={handleSubmit}
            disabled={submitting}
            style={{
              padding: '11px 0', borderRadius: 8, background: '#5b50d6', color: 'white', border: 'none',
              fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer', opacity: submitting ? 0.6 : 1,
            }}
          >
            {submitting ? 'Booking…' : 'Book Zoom call →'}
          </button>
        </div>
      </div>
    </div>
  )
}
