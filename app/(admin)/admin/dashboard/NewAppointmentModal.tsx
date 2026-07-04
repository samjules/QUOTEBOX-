'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

const TIME_SLOTS = ['11:00 AM', '12:00 PM', '1:00 PM']

function getWeekdays(weeks: number): Date[] {
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

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '9px 12px', borderRadius: 8,
  border: '1.5px solid #e2e8f0', fontSize: '0.86rem', outline: 'none',
  fontFamily: 'inherit', color: '#0e0020', boxSizing: 'border-box', background: '#fff',
}

const labelStyle: React.CSSProperties = { display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#374151', marginBottom: 5 }

export default function NewAppointmentModal() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedTime, setSelectedTime] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [takenSlots, setTakenSlots] = useState<Set<string>>(new Set())

  const weekdays = getWeekdays(4)

  useEffect(() => {
    if (!open) return
    fetch('/api/free-trial/taken-slots')
      .then((r) => r.json())
      .then((d) => setTakenSlots(new Set<string>(d.taken ?? [])))
      .catch(() => {})
  }, [open])

  function reset() {
    setName(''); setEmail(''); setPhone(''); setSelectedDate(''); setSelectedTime(''); setError('')
  }

  async function handleSubmit() {
    if (!name.trim() || !email.trim() || !phone.trim()) {
      setError('Name, email, and phone are required')
      return
    }
    if (!selectedDate || !selectedTime) {
      setError('Please pick a date and time')
      return
    }
    setError('')
    setSubmitting(true)
    try {
      const res = await fetch('/api/free-trial/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim(),
          hasJunkOrMovingCompany: true,
          canSpend50PerDay: true,
          willingIosApp: true,
          scheduled_date: selectedDate,
          scheduled_time: selectedTime,
          funnel: 'demo',
        }),
      })
      if (!res.ok) {
        const d = await res.json()
        setError(d.error ?? 'Something went wrong')
        setSubmitting(false)
        return
      }
      setOpen(false)
      reset()
      router.refresh()
    } catch {
      setError('Network error. Please try again.')
    }
    setSubmitting(false)
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        style={{
          padding: '8px 16px', borderRadius: 8, border: 'none', background: '#0e0020', color: '#ffe500',
          fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
        }}
      >
        + New Appointment
      </button>

      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ background: '#fff', borderRadius: 14, padding: 24, width: 420, maxHeight: '85vh', overflowY: 'auto' }}
          >
            <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0e0020', margin: '0 0 4px' }}>New Appointment</h2>
            <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '0 0 18px' }}>
              Creates a real booking — Zoom meeting, confirmation email/SMS, and 24h reminder, same as /demo.
            </p>

            <div style={{ marginBottom: 12 }}>
              <label style={labelStyle}>Name</label>
              <input style={inputStyle} value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" />
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={labelStyle}>Email</label>
              <input style={inputStyle} type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@example.com" />
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Phone</label>
              <input style={inputStyle} type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(555) 123-4567" />
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Date</label>
              <select style={inputStyle} value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)}>
                <option value="">Select a date…</option>
                {weekdays.map((d) => {
                  const iso = d.toISOString().split('T')[0]
                  return (
                    <option key={iso} value={iso}>
                      {d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                    </option>
                  )
                })}
              </select>
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={labelStyle}>Time <span style={{ fontWeight: 400, color: '#94a3b8' }}>(Alaska Time)</span></label>
              <div style={{ display: 'flex', gap: 8 }}>
                {TIME_SLOTS.map((t) => {
                  const isTaken = !!selectedDate && takenSlots.has(`${selectedDate}|${t}`)
                  const isSel = selectedTime === t
                  return (
                    <button
                      key={t}
                      onClick={() => !isTaken && setSelectedTime(t)}
                      disabled={isTaken}
                      style={{
                        flex: 1, padding: '8px 0', borderRadius: 8, fontSize: '0.82rem', fontWeight: 600,
                        border: `1.5px solid ${isSel ? '#5b50d6' : '#e2e8f0'}`,
                        background: isSel ? '#ede9fe' : isTaken ? '#f1f5f9' : '#fff',
                        color: isSel ? '#5b50d6' : isTaken ? '#94a3b8' : '#374151',
                        cursor: isTaken ? 'not-allowed' : 'pointer',
                        textDecoration: isTaken ? 'line-through' : 'none',
                        fontFamily: 'inherit',
                      }}
                    >
                      {t}
                    </button>
                  )
                })}
              </div>
            </div>

            {error && <div style={{ color: '#dc2626', fontSize: '0.8rem', marginBottom: 12 }}>{error}</div>}

            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => setOpen(false)}
                style={{ flex: 1, padding: '10px 0', borderRadius: 8, border: '1.5px solid #e2e8f0', background: '#fff', color: '#374151', fontSize: '0.86rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                style={{ flex: 1, padding: '10px 0', borderRadius: 8, border: 'none', background: '#0e0020', color: '#ffe500', fontSize: '0.86rem', fontWeight: 700, cursor: submitting ? 'not-allowed' : 'pointer', opacity: submitting ? 0.6 : 1, fontFamily: 'inherit' }}
              >
                {submitting ? 'Booking…' : 'Book It'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
