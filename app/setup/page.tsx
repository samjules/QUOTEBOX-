'use client'

import { useState } from 'react'
import { MEETING_TIME_SLOTS, getBookableWeekdays, isSlotBookable } from '@/lib/booking'

const REVENUE_OPTIONS = [
  'Under $10k/mo',
  '$10k–$50k/mo',
  '$50k–$100k/mo',
  '$100k+/mo',
]

export default function SetupBookingPage() {
  const [step, setStep] = useState(0)
  const [revenue, setRevenue] = useState<string | null>(null)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [selectedTime, setSelectedTime] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [smsConsent, setSmsConsent] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const weekdays = getBookableWeekdays(3)

  async function handleSubmit() {
    if (!name.trim() || !email.trim()) {
      setError('Name and email are required')
      return
    }
    if (!phone.trim()) {
      setError('Phone number is required')
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
          phone: phone.trim(),
          monthly_revenue: revenue,
          scheduled_date: selectedDate,
          scheduled_time: selectedTime,
          sms_consent: smsConsent,
        }),
      })
      if (!res.ok) {
        const d = await res.json()
        setError(d.error ?? 'Something went wrong')
        setSubmitting(false)
        return
      }
      ;(window as any).fbq?.('track', 'Schedule')
      setStep(2)
    } catch {
      setError('Network error. Please try again.')
    }
    setSubmitting(false)
  }

  const containerStyle: React.CSSProperties = {
    minHeight: '100vh',
    background: '#5b50d6',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    fontFamily: "'Nautic', sans-serif",
    color: 'white',
    padding: '40px 20px',
  }

  const cardStyle: React.CSSProperties = {
    background: '#201d3d',
    borderRadius: 16,
    padding: '40px 36px',
    maxWidth: 640,
    width: '100%',
  }

  const goldBtn: React.CSSProperties = {
    background: '#f4a93c',
    color: '#201d3d',
    fontWeight: 800,
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
    background: '#5b50d6',
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
          background: i <= step ? '#f4a93c' : 'rgba(255,255,255,0.25)',
          transition: 'background 0.3s',
        }} />
      ))}
    </div>
  )

  return (
    <div style={containerStyle}>
      <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center', gap: 10 }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/quotebox_icon.png" alt="Quotebox" style={{ width: 30, height: 30, borderRadius: 7 }} />
        <span style={{ fontFamily: "'Nautic', sans-serif", fontWeight: 700, fontSize: '1.4rem', color: 'white', letterSpacing: '0.01em' }}>
          Quote<span style={{ color: '#f4a93c' }}>.</span>Box
        </span>
      </div>
      <div style={{
        display: 'inline-flex', alignItems: 'center', gap: 8,
        background: '#f4a93c', color: '#201d3d',
        fontSize: '0.72rem', fontWeight: 800, letterSpacing: '0.08em',
        textTransform: 'uppercase', padding: '5px 14px', borderRadius: 99, marginBottom: 20,
      }}>
        $297 Consultation &amp; Ad Setup
      </div>

      {dots}

      <div style={cardStyle}>
        {/* Step 0: Monthly Revenue */}
        {step === 0 && (
          <>
            <h1 style={{ fontFamily: "'Nautic', sans-serif", fontSize: '1.8rem', fontWeight: 800, textAlign: 'center', margin: '0 0 8px', lineHeight: 1.2 }}>
              {"What's your monthly revenue?"}
            </h1>
            <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem', margin: '0 0 28px' }}>
              This helps us build the right ad strategy for your pledge.
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
                      border: isSelected ? '2px solid #f4a93c' : '2px solid rgba(255,255,255,0.12)',
                      background: isSelected ? 'rgba(244,169,60,0.1)' : 'rgba(255,255,255,0.04)',
                      cursor: 'pointer',
                      textAlign: 'center',
                      transition: 'all 0.2s',
                      fontFamily: "'Nautic', sans-serif",
                      fontSize: '1.3rem',
                      fontWeight: 800,
                      color: isSelected ? '#f4a93c' : 'white',
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
              style={{ ...goldBtn, opacity: revenue ? 1 : 0.4, cursor: revenue ? 'pointer' : 'not-allowed' }}
            >
              Continue
            </button>
          </>
        )}

        {/* Step 1: Schedule + Contact */}
        {step === 1 && (
          <>
            <h1 style={{ fontFamily: "'Nautic', sans-serif", fontSize: '1.8rem', fontWeight: 800, textAlign: 'center', margin: '0 0 8px' }}>
              Book Your Setup Call
            </h1>
            <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem', margin: '0 0 24px' }}>
              30 minutes. We&apos;ll build and launch your ad account together — the exact strategy behind your pledge.
            </p>

            {/* Date picker */}
            <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 10 }}>
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
                      border: isSel ? '2px solid #f4a93c' : '1px solid rgba(255,255,255,0.12)',
                      background: isSel ? 'rgba(244,169,60,0.12)' : 'transparent',
                      color: isSel ? '#f4a93c' : 'rgba(255,255,255,0.75)',
                      cursor: 'pointer',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      textAlign: 'center',
                      fontFamily: "'Nautic', sans-serif",
                    }}
                  >
                    <div style={{ fontSize: '0.65rem', color: isSel ? 'rgba(244,169,60,0.8)' : 'rgba(255,255,255,0.45)' }}>
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
            <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 10 }}>
              Select a Time <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(Alaska Time)</span>
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 28 }}>
              {MEETING_TIME_SLOTS.map((t) => {
                const isSel = selectedTime === t
                const bookable = !selectedDate || isSlotBookable(selectedDate, t)
                return (
                  <button
                    key={t}
                    onClick={() => bookable && setSelectedTime(t)}
                    disabled={!bookable}
                    style={{
                      padding: '8px 16px',
                      borderRadius: 99,
                      border: isSel ? '2px solid #f4a93c' : '1px solid rgba(255,255,255,0.12)',
                      background: isSel ? 'rgba(244,169,60,0.12)' : 'transparent',
                      color: !bookable ? 'rgba(255,255,255,0.25)' : isSel ? '#f4a93c' : 'rgba(255,255,255,0.75)',
                      cursor: bookable ? 'pointer' : 'not-allowed',
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      fontFamily: "'Nautic', sans-serif",
                      textDecoration: !bookable ? 'line-through' : 'none',
                    }}
                  >
                    {t}
                  </button>
                )
              })}
            </div>

            {/* Divider */}
            <div style={{ width: '100%', height: 1, background: 'rgba(255,255,255,0.1)', marginBottom: 24 }} />

            {/* Contact fields */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 8 }}>
              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'rgba(255,255,255,0.6)', display: 'block', marginBottom: 6 }}>Name *</label>
                <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your full name" style={inputStyle} />
              </div>
              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'rgba(255,255,255,0.6)', display: 'block', marginBottom: 6 }}>Email *</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" style={inputStyle} />
              </div>
              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'rgba(255,255,255,0.6)', display: 'block', marginBottom: 6 }}>Phone *</label>
                <input type="tel" required value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(555) 123-4567" style={inputStyle} />
              </div>
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: 9, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={smsConsent}
                  onChange={(e) => setSmsConsent(e.target.checked)}
                  style={{ marginTop: 3, flexShrink: 0, width: 15, height: 15, accentColor: '#f4a93c' }}
                />
                <span style={{ fontSize: '0.76rem', color: 'rgba(255,255,255,0.55)', lineHeight: 1.5 }}>
                  Text me updates about Quotebox. Message &amp; data rates may apply, message frequency varies. Reply STOP to opt out anytime.
                </span>
              </label>
            </div>

            {error && (
              <div style={{ color: '#ff8080', fontSize: '0.85rem', marginTop: 8, textAlign: 'center' }}>{error}</div>
            )}

            <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
              <button onClick={() => setStep(0)} style={{ flex: 1, padding: '14px 24px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.15)', background: 'transparent', color: 'white', fontWeight: 700, cursor: 'pointer', fontSize: '0.95rem', fontFamily: "'Nautic', sans-serif" }}>
                Back
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                style={{ ...goldBtn, flex: 2, marginTop: 0, opacity: submitting ? 0.6 : 1 }}
              >
                {submitting ? 'Booking…' : 'Book My $297 Setup →'}
              </button>
            </div>
          </>
        )}

        {/* Step 2: Confirmation */}
        {step === 2 && (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{
              width: 56, height: 56, borderRadius: '50%', background: 'rgba(244,169,60,0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px',
            }}>
              <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="#f4a93c" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round"><path d="M5 13l4 4L19 7" /></svg>
            </div>
            <h1 style={{ fontFamily: "'Nautic', sans-serif", fontSize: '1.8rem', fontWeight: 800, margin: '0 0 12px' }}>
              You&apos;re booked!
            </h1>
            {selectedDate && selectedTime ? (
              <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: '1rem', lineHeight: 1.6 }}>
                {"We'll call you on "}
                <span style={{ color: '#f4a93c', fontWeight: 700 }}>
                  {new Date(selectedDate + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                </span>
                {' at '}
                <span style={{ color: '#f4a93c', fontWeight: 700 }}>{selectedTime}</span>
                {' Alaska Time to build your ad setup.'}
              </p>
            ) : (
              <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: '1rem', lineHeight: 1.6 }}>
                {"We'll be in touch soon to lock in your setup call."}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
