'use client'

import { useState } from 'react'

const TIME_SLOTS = ['7:00 AM', '8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '1:00 PM']

const RESULTS = [
  { stat: '12', label: 'Booked jobs in week 1', sub: 'Junk removal company, first week on QuoteBox' },
  { stat: '55%', label: 'Close rate', sub: 'Up from ~20% before automated follow-up' },
  { stat: '4 → 20', label: 'Jobs per month', sub: 'Moving company, 6 weeks after setup' },
]

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

type Phase = 'landing' | 'q1' | 'q2' | 'q3' | 'unqualified' | 'booking' | 'done'

export default function FreeTrialPage() {
  const [phase, setPhase] = useState<Phase>('landing')
  const [hasCompany, setHasCompany] = useState<boolean | null>(null)
  const [canSpend, setCanSpend] = useState<boolean | null>(null)
  const [willingApp, setWillingApp] = useState<boolean | null>(null)

  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [selectedTime, setSelectedTime] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const weekdays = getWeekdays(3)

  function answerQ1(v: boolean) {
    setHasCompany(v)
    if (!v) { setPhase('unqualified'); return }
    setPhase('q2')
  }
  function answerQ2(v: boolean) {
    setCanSpend(v)
    if (!v) { setPhase('unqualified'); return }
    setPhase('q3')
  }
  function answerQ3(v: boolean) {
    setWillingApp(v)
    if (!v) { setPhase('unqualified'); return }
    setPhase('booking')
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
          hasJunkOrMovingCompany: hasCompany,
          canSpend50PerDay: canSpend,
          willingIosApp: willingApp,
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
      setPhase('done')
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

  const yesNoBtn = (selected: boolean | null, value: boolean): React.CSSProperties => ({
    flex: 1,
    padding: '20px',
    borderRadius: 12,
    border: selected === value ? '2px solid #FFE500' : '2px solid rgba(255,255,255,0.1)',
    background: selected === value ? 'rgba(255,229,0,0.08)' : 'rgba(255,255,255,0.03)',
    cursor: 'pointer',
    textAlign: 'center',
    fontFamily: "'Oswald', sans-serif",
    fontSize: '1.2rem',
    fontWeight: 700,
    color: selected === value ? '#FFE500' : 'white',
  })

  const logo = (
    <div style={{ marginBottom: 32 }}>
      <span style={{ fontFamily: "'Oswald', sans-serif", fontWeight: 700, fontSize: '1.6rem', color: 'white', letterSpacing: '0.02em' }}>
        Quote<span style={{ color: '#FFE500' }}>.</span>Box
      </span>
    </div>
  )

  const dotSteps = ['q1', 'q2', 'q3', 'booking']
  const dots = phase !== 'landing' && phase !== 'unqualified' && phase !== 'done' && (
    <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 32 }}>
      {dotSteps.map((s, i) => (
        <div key={s} style={{
          width: 10, height: 10, borderRadius: 99,
          background: dotSteps.indexOf(phase) >= i ? '#FFE500' : 'rgba(255,255,255,0.15)',
          transition: 'background 0.3s',
        }} />
      ))}
    </div>
  )

  return (
    <div style={containerStyle}>
      {logo}
      {dots}

      {/* Landing / results teaser */}
      {phase === 'landing' && (
        <div style={{ maxWidth: 720, width: '100%', textAlign: 'center' }}>
          <h1 style={{ fontFamily: "'Oswald', sans-serif", fontSize: '2.4rem', fontWeight: 700, lineHeight: 1.15, margin: '0 0 16px' }}>
            We&apos;ll Run Your Marketing <span style={{ color: '#FFE500' }}>Free for 14 Days</span>
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '1.05rem', lineHeight: 1.6, margin: '0 auto 40px', maxWidth: 560 }}>
            We&apos;re taking on 10 junk removal &amp; moving companies for a free 2-week trial. No setup fee. No contract. See real results before you pay a cent.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 40 }}>
            {RESULTS.map((r) => (
              <div key={r.label} style={{ background: '#0e0020', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: '24px 16px' }}>
                <div style={{ fontFamily: "'Oswald', sans-serif", fontSize: '2rem', fontWeight: 700, color: '#FFE500' }}>{r.stat}</div>
                <div style={{ fontSize: '0.9rem', fontWeight: 600, margin: '6px 0 4px' }}>{r.label}</div>
                <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.45)' }}>{r.sub}</div>
              </div>
            ))}
          </div>

          <button onClick={() => setPhase('q1')} style={{ ...yellowBtn, maxWidth: 340, margin: '0 auto' }}>
            See If You Qualify →
          </button>
          <p style={{ marginTop: 16, fontSize: '0.78rem', color: 'rgba(255,255,255,0.35)' }}>
            Takes 60 seconds. Only 10 spots available.
          </p>
        </div>
      )}

      {(phase === 'q1' || phase === 'q2' || phase === 'q3' || phase === 'unqualified' || phase === 'booking' || phase === 'done') && (
        <div style={cardStyle}>
          {phase === 'q1' && (
            <>
              <h1 style={{ fontFamily: "'Oswald', sans-serif", fontSize: '1.6rem', fontWeight: 700, textAlign: 'center', margin: '0 0 28px', lineHeight: 1.3 }}>
                Do you own a junk removal or moving company?
              </h1>
              <div style={{ display: 'flex', gap: 14 }}>
                <button style={yesNoBtn(hasCompany, true)} onClick={() => answerQ1(true)}>Yes</button>
                <button style={yesNoBtn(hasCompany, false)} onClick={() => answerQ1(false)}>No</button>
              </div>
            </>
          )}

          {phase === 'q2' && (
            <>
              <h1 style={{ fontFamily: "'Oswald', sans-serif", fontSize: '1.6rem', fontWeight: 700, textAlign: 'center', margin: '0 0 8px', lineHeight: 1.3 }}>
                Can you spend $50+ per day on Meta ads?
              </h1>
              <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem', margin: '0 0 28px' }}>
                We run the ads for free — you cover ad spend directly to Meta.
              </p>
              <div style={{ display: 'flex', gap: 14 }}>
                <button style={yesNoBtn(canSpend, true)} onClick={() => answerQ2(true)}>Yes</button>
                <button style={yesNoBtn(canSpend, false)} onClick={() => answerQ2(false)}>No</button>
              </div>
            </>
          )}

          {phase === 'q3' && (
            <>
              <h1 style={{ fontFamily: "'Oswald', sans-serif", fontSize: '1.6rem', fontWeight: 700, textAlign: 'center', margin: '0 0 8px', lineHeight: 1.3 }}>
                Will you download our iOS app to manage leads daily?
              </h1>
              <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem', margin: '0 0 28px' }}>
                This is how you&apos;ll see and respond to new leads in real time.
              </p>
              <div style={{ display: 'flex', gap: 14 }}>
                <button style={yesNoBtn(willingApp, true)} onClick={() => answerQ3(true)}>Yes</button>
                <button style={yesNoBtn(willingApp, false)} onClick={() => answerQ3(false)}>No</button>
              </div>
            </>
          )}

          {phase === 'unqualified' && (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <h1 style={{ fontFamily: "'Oswald', sans-serif", fontSize: '1.6rem', fontWeight: 700, margin: '0 0 12px' }}>
                Not a fit right now
              </h1>
              <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.95rem', lineHeight: 1.6 }}>
                This free trial is built specifically for junk removal &amp; moving companies who can run ad spend and manage leads daily. That doesn&apos;t sound like your current setup — but feel free to check back if things change.
              </p>
            </div>
          )}

          {phase === 'booking' && (
            <>
              <h1 style={{ fontFamily: "'Oswald', sans-serif", fontSize: '1.8rem', fontWeight: 700, textAlign: 'center', margin: '0 0 8px' }}>
                You Qualify! Book Your Zoom Call
              </h1>
              <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem', margin: '0 0 24px' }}>
                Pick a time and we&apos;ll walk you through your free 14-day trial
              </p>

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
                      <div>{d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
                    </button>
                  )
                })}
              </div>

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

              <div style={{ width: '100%', height: 1, background: 'rgba(255,255,255,0.08)', marginBottom: 24 }} />

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
                  <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'rgba(255,255,255,0.6)', display: 'block', marginBottom: 6 }}>Phone *</label>
                  <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(555) 123-4567" style={inputStyle} />
                  <p style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.4)', margin: '6px 0 0' }}>
                    We&apos;ll text you to confirm this call — reply Y to confirm or N to cancel.
                  </p>
                </div>
              </div>

              {error && (
                <div style={{ color: '#ef4444', fontSize: '0.85rem', marginTop: 8, textAlign: 'center' }}>{error}</div>
              )}

              <button
                onClick={handleSubmit}
                disabled={submitting}
                style={{ ...yellowBtn, opacity: submitting ? 0.6 : 1 }}
              >
                {submitting ? 'Booking...' : 'Book My Free Trial Call'}
              </button>
            </>
          )}

          {phase === 'done' && (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div style={{ fontSize: '3rem', marginBottom: 16 }}>&#10003;</div>
              <h1 style={{ fontFamily: "'Oswald', sans-serif", fontSize: '1.8rem', fontWeight: 700, margin: '0 0 12px' }}>
                You&apos;re Booked!
              </h1>
              {selectedDate && selectedTime && (
                <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '1rem', lineHeight: 1.6, margin: '0 0 16px' }}>
                  {"We'll see you on "}
                  <span style={{ color: '#FFE500', fontWeight: 600 }}>
                    {new Date(selectedDate + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                  </span>
                  {' at '}
                  <span style={{ color: '#FFE500', fontWeight: 600 }}>{selectedTime}</span>
                  {' Alaska Time'}
                </p>
              )}
              <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.85rem', lineHeight: 1.6 }}>
                The day before your call, we&apos;ll text and email you a reminder. Reply <strong style={{ color: '#FFE500' }}>Y</strong> to confirm or <strong style={{ color: '#FFE500' }}>N</strong> to cancel — if we don&apos;t hear back, your spot will be released.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
