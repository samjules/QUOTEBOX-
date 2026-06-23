'use client'

import { useState } from 'react'

const REVENUE_OPTIONS = [
  'Under $10k/mo',
  '$10k–$50k/mo',
  '$50k–$100k/mo',
  '$100k+/mo',
]

const TIME_SLOTS = ['7:00 AM', '8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '1:00 PM']

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

export default function GetStartedPage() {
  const [step, setStep] = useState(0)
  const [revenue, setRevenue] = useState<string | null>(null)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [selectedTime, setSelectedTime] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const weekdays = getWeekdays(3)

  async function handleSubmit() {
    if (!name.trim() || !email.trim()) {
      setError('Name and email are required')
      return
    }
    setError('')
    setSubmitting(true)
    try {
      const res = await fetch('/api/sales-leads/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim() || null,
          monthly_revenue: revenue,
          scheduled_date: selectedDate,
          scheduled_time: selectedTime,
        }),
      })
      if (!res.ok) {
        const d = await res.json()
        setError(d.error ?? 'Something went wrong')
        setSubmitting(false)
        return
      }
      setStep(2)
    } catch {
      setError('Network error. Please try again.')
    }
    setSubmitting(false)
  }

  const containerStyle: React.CSSProperties = {
    minHeight: '100vh',
    background: '#0d0d1a',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    fontFamily: "'Nautic', sans-serif",
    color: 'white',
    padding: '40px 20px',
  }

  const cardStyle: React.CSSProperties = {
    background: '#0e0020',
    borderRadius: 16,
    padding: '40px 36px',
    maxWidth: 640,
    width: '100%',
  }

  const yellowBtn: React.CSSProperties = {
    background: '#FFE500',
    color: '#0d0d1a',
    fontWeight: 700,
    fontSize: '1rem',
    padding: '14px 32px',
    borderRadius: 10,
    border: 'none',
    cursor: 'pointer',
    fontFamily: "'Nautic', sans-serif",
    width: '100%',
    marginTop: 24,
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '12px 16px',
    fontSize: '0.95rem',
    borderRadius: 10,
    border: '1px solid rgba(255,255,255,0.15)',
    background: '#0d0d1a',
    color: 'white',
    outline: 'none',
    boxSizing: 'border-box',
    fontFamily: "'Nautic', sans-serif",
  }

  const dots = (
    <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 32 }}>
      {[0, 1, 2].map((i) => (
        <div key={i} style={{
          width: 10, height: 10, borderRadius: 99,
          background: i <= step ? '#FFE500' : 'rgba(255,255,255,0.15)',
          transition: 'background 0.3s',
        }} />
      ))}
    </div>
  )

  return (
    <div style={containerStyle}>
      <div style={{ marginBottom: 32 }}>
        <span style={{ fontFamily: "'Oswald', sans-serif", fontWeight: 700, fontSize: '1.6rem', color: 'white', letterSpacing: '0.02em' }}>
          Quote<span style={{ color: '#FFE500' }}>.</span>Box
        </span>
      </div>

      {dots}

      <div style={cardStyle}>
        {/* Step 0: Monthly Revenue */}
        {step === 0 && (
          <>
            <h1 style={{ fontFamily: "'Oswald', sans-serif", fontSize: '1.8rem', fontWeight: 700, textAlign: 'center', margin: '0 0 8px', lineHeight: 1.2 }}>
              {"What's your monthly revenue?"}
            </h1>
            <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem', margin: '0 0 28px' }}>
              This helps us understand the right fit for your business
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              {REVENUE_OPTIONS.map((opt) => {
                const isSelected = revenue === opt
                return (
                  <button
                    key={opt}
                    onClick={() => setRevenue(opt)}
                    style={{
                      padding: '28px 20px',
                      borderRadius: 12,
                      border: isSelected ? '2px solid #FFE500' : '2px solid rgba(255,255,255,0.1)',
                      background: isSelected ? 'rgba(255,229,0,0.08)' : 'rgba(255,255,255,0.03)',
                      cursor: 'pointer',
                      textAlign: 'center',
                      transition: 'all 0.2s',
                      fontFamily: "'Oswald', sans-serif",
                      fontSize: '1.4rem',
                      fontWeight: 700,
                      color: isSelected ? '#FFE500' : 'white',
                      lineHeight: 1.2,
                    }}
                  >
                    {opt}
                  </button>
                )
              })}
            </div>
            <button
              onClick={() => revenue && setStep(1)}
              disabled={!revenue}
              style={{ ...yellowBtn, opacity: revenue ? 1 : 0.4, cursor: revenue ? 'pointer' : 'not-allowed' }}
            >
              Continue
            </button>
          </>
        )}

        {/* Step 1: Schedule + Contact */}
        {step === 1 && (
          <>
            <h1 style={{ fontFamily: "'Oswald', sans-serif", fontSize: '1.8rem', fontWeight: 700, textAlign: 'center', margin: '0 0 8px' }}>
              Book Your Setup Call
            </h1>
            <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem', margin: '0 0 24px' }}>
              Pick a time and we{"'"}ll walk you through everything
            </p>

            {/* Date picker */}
            <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 10 }}>
              Select a Date
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 6, marginBottom: 20 }}>
              {weekdays.map((d) => {
                const iso = d.toISOString().split('T')[0]
                const isSel = selectedDate === iso
                return (
                  <button
                    key={iso}
                    onClick={() => setSelectedDate(iso)}
                    style={{
                      padding: '10px 4px',
                      borderRadius: 8,
                      border: isSel ? '2px solid #FFE500' : '1px solid rgba(255,255,255,0.1)',
                      background: isSel ? 'rgba(255,229,0,0.1)' : 'transparent',
                      color: isSel ? '#FFE500' : 'rgba(255,255,255,0.7)',
                      cursor: 'pointer',
                      fontSize: '0.72rem',
                      fontWeight: 600,
                      textAlign: 'center',
                      fontFamily: "'Nautic', sans-serif",
                    }}
                  >
                    <div style={{ fontSize: '0.65rem', color: isSel ? 'rgba(255,229,0,0.7)' : 'rgba(255,255,255,0.4)' }}>
                      {d.toLocaleDateString('en-US', { weekday: 'short' })}
                    </div>
                    <div>
                      {d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </div>
                  </button>
                )
              })}
            </div>

            {/* Time slots */}
            <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 10 }}>
              Select a Time <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(Alaska Time)</span>
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 28 }}>
              {TIME_SLOTS.map((t) => {
                const isSel = selectedTime === t
                return (
                  <button
                    key={t}
                    onClick={() => setSelectedTime(t)}
                    style={{
                      padding: '8px 16px',
                      borderRadius: 99,
                      border: isSel ? '2px solid #FFE500' : '1px solid rgba(255,255,255,0.1)',
                      background: isSel ? 'rgba(255,229,0,0.1)' : 'transparent',
                      color: isSel ? '#FFE500' : 'rgba(255,255,255,0.7)',
                      cursor: 'pointer',
                      fontSize: '0.82rem',
                      fontWeight: 600,
                      fontFamily: "'Nautic', sans-serif",
                    }}
                  >
                    {t}
                  </button>
                )
              })}
            </div>

            {/* Divider */}
            <div style={{ width: '100%', height: 1, background: 'rgba(255,255,255,0.08)', marginBottom: 24 }} />

            {/* Contact fields */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 8 }}>
              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'rgba(255,255,255,0.6)', display: 'block', marginBottom: 6 }}>Name *</label>
                <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your full name" style={inputStyle} />
              </div>
              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'rgba(255,255,255,0.6)', display: 'block', marginBottom: 6 }}>Email *</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" style={inputStyle} />
              </div>
              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'rgba(255,255,255,0.6)', display: 'block', marginBottom: 6 }}>Phone</label>
                <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(555) 123-4567" style={inputStyle} />
              </div>
            </div>

            {error && (
              <div style={{ color: '#ef4444', fontSize: '0.85rem', marginTop: 8, textAlign: 'center' }}>{error}</div>
            )}

            <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
              <button onClick={() => setStep(0)} style={{ flex: 1, padding: '14px 24px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.15)', background: 'transparent', color: 'white', fontWeight: 600, cursor: 'pointer', fontSize: '0.95rem', fontFamily: "'Nautic', sans-serif" }}>
                Back
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                style={{ ...yellowBtn, flex: 2, marginTop: 0, opacity: submitting ? 0.6 : 1 }}
              >
                {submitting ? 'Submitting...' : 'Book My Call'}
              </button>
            </div>
          </>
        )}

        {/* Step 2: Confirmation */}
        {step === 2 && (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ fontSize: '3rem', marginBottom: 16 }}>&#10003;</div>
            <h1 style={{ fontFamily: "'Oswald', sans-serif", fontSize: '1.8rem', fontWeight: 700, margin: '0 0 12px' }}>
              {"You're All Set!"}
            </h1>
            {selectedDate && selectedTime ? (
              <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '1rem', lineHeight: 1.6 }}>
                {"We'll call you on "}
                <span style={{ color: '#FFE500', fontWeight: 600 }}>
                  {new Date(selectedDate + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                </span>
                {' at '}
                <span style={{ color: '#FFE500', fontWeight: 600 }}>{selectedTime}</span>
                {' Alaska Time'}
              </p>
            ) : (
              <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '1rem', lineHeight: 1.6 }}>
                {"We'll be in touch soon to get you set up."}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
