'use client'

import { useState } from 'react'

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

export default function CaseStudyPage() {
  // 'gate' -> collect email to unlock the video. 'unlocked' -> video + booking calendar.
  const [phase, setPhase] = useState<'gate' | 'unlocked' | 'booked'>('gate')

  const [gateName, setGateName] = useState('')
  const [gateEmail, setGateEmail] = useState('')
  const [gateSubmitting, setGateSubmitting] = useState(false)
  const [gateError, setGateError] = useState('')

  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [selectedTime, setSelectedTime] = useState<string | null>(null)
  const [phone, setPhone] = useState('')
  const [bookSubmitting, setBookSubmitting] = useState(false)
  const [bookError, setBookError] = useState('')

  const weekdays = getWeekdays(3)

  async function handleGateSubmit() {
    if (!gateName.trim() || !gateEmail.trim()) {
      setGateError('Name and email are required')
      return
    }
    if (!phone.trim()) {
      setGateError('Phone number is required')
      return
    }
    setGateError('')
    setGateSubmitting(true)
    try {
      const res = await fetch('/api/sales-leads/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: gateName.trim(),
          email: gateEmail.trim(),
          phone: phone.trim(),
          source: 'case_study',
        }),
      })
      if (!res.ok) {
        const d = await res.json()
        setGateError(d.error ?? 'Something went wrong')
        setGateSubmitting(false)
        return
      }
      ;(window as any).fbq?.('track', 'Lead')
      setPhase('unlocked')
    } catch {
      setGateError('Network error. Please try again.')
    }
    setGateSubmitting(false)
  }

  async function handleBookSubmit() {
    if (!selectedDate || !selectedTime) {
      setBookError('Pick a date and time')
      return
    }
    if (!phone.trim()) {
      setBookError('Phone number is required')
      return
    }
    setBookError('')
    setBookSubmitting(true)
    try {
      const res = await fetch('/api/sales-leads/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: gateName.trim(),
          email: gateEmail.trim(),
          phone: phone.trim(),
          scheduled_date: selectedDate,
          scheduled_time: selectedTime,
          source: 'case_study',
        }),
      })
      if (!res.ok) {
        const d = await res.json()
        setBookError(d.error ?? 'Something went wrong')
        setBookSubmitting(false)
        return
      }
      ;(window as any).fbq?.('track', 'Schedule')
      setPhase('booked')
    } catch {
      setBookError('Network error. Please try again.')
    }
    setBookSubmitting(false)
  }

  const pageStyle: React.CSSProperties = {
    minHeight: '100vh',
    background: '#5b50d6',
    fontFamily: "'Nautic', sans-serif",
    color: 'white',
  }

  const sectionInner: React.CSSProperties = { maxWidth: 720, margin: '0 auto', padding: '0 24px' }

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
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '12px 16px',
    fontSize: '0.95rem',
    borderRadius: 10,
    border: '1px solid rgba(255,255,255,0.18)',
    background: 'rgba(255,255,255,0.08)',
    color: 'white',
    outline: 'none',
    boxSizing: 'border-box',
    fontFamily: "'Nautic', sans-serif",
  }

  return (
    <div style={pageStyle} className="csbg">
      <style jsx>{`
        .csbg{ position: relative; }
        .csbg::before{
          content: '';
          position: absolute;
          inset: 0;
          background: url('/patterns/map-pattern-2.jpg') repeat;
          background-size: 340px;
          filter: invert(1);
          opacity: 0.07;
          pointer-events: none;
          z-index: 0;
        }
        .csbg > :global(*){ position: relative; z-index: 1; }
      `}</style>
      {/* Nav */}
      <div style={{ padding: '24px 24px 0' }}>
        <div style={{ maxWidth: 720, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/quotebox_icon.png" alt="Quotebox" style={{ width: 30, height: 30, borderRadius: 7 }} />
          <span style={{ fontFamily: "'Nautic', sans-serif", fontWeight: 700, fontSize: '1.3rem' }}>
            Quote<span style={{ color: '#f4a93c' }}>.</span>Box
          </span>
        </div>
      </div>

      {/* Hero */}
      <section style={{ padding: '48px 24px 40px', textAlign: 'center' }}>
        <div style={sectionInner}>
          <div style={{
            display: 'inline-block', background: '#f4a93c', color: '#201d3d',
            fontSize: '0.72rem', fontWeight: 800, letterSpacing: '0.08em',
            textTransform: 'uppercase', padding: '5px 14px', borderRadius: 99, marginBottom: 22,
          }}>
            Case Study
          </div>
          <h1 style={{ fontSize: 'clamp(1.9rem, 4.5vw, 2.9rem)', fontWeight: 800, lineHeight: 1.12, margin: '0 0 16px' }}>
            How Titan Tuff Moving turned <span style={{ color: '#f4a93c' }}>685 leads</span> into <span style={{ color: '#f4a93c' }}>$111,811</span> in pipeline
          </h1>
          <p style={{ fontSize: '1.02rem', color: 'rgba(255,255,255,0.75)', lineHeight: 1.7, maxWidth: 560, margin: '0 auto' }}>
            A 12-minute walkthrough of the exact quote form, follow-up sequence, and CRM setup one moving company used to hit a 2.88x return on ad spend.
          </p>
        </div>
      </section>

      <ScreenshotMarquee />

      {phase === 'gate' && (
        <section style={{ padding: '0 24px 64px' }}>
          <div style={{ ...sectionInner, maxWidth: 440 }}>
            <div style={{ background: '#201d3d', borderRadius: 16, padding: '32px 28px' }}>
              <h2 style={{ fontSize: '1.3rem', fontWeight: 800, textAlign: 'center', margin: '0 0 8px' }}>
                Enter your email to unlock the case study
              </h2>
              <p style={{ fontSize: '0.88rem', color: 'rgba(255,255,255,0.6)', textAlign: 'center', margin: '0 0 24px' }}>
                Free — no credit card, just the video.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 8 }}>
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'rgba(255,255,255,0.6)', display: 'block', marginBottom: 6 }}>Name</label>
                  <input value={gateName} onChange={(e) => setGateName(e.target.value)} placeholder="Your full name" style={inputStyle} />
                </div>
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'rgba(255,255,255,0.6)', display: 'block', marginBottom: 6 }}>Email</label>
                  <input type="email" value={gateEmail} onChange={(e) => setGateEmail(e.target.value)} placeholder="you@company.com" style={inputStyle} />
                </div>
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'rgba(255,255,255,0.6)', display: 'block', marginBottom: 6 }}>Phone *</label>
                  <input type="tel" required value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(555) 123-4567" style={inputStyle} />
                </div>
              </div>
              {gateError && <div style={{ color: '#ff8080', fontSize: '0.85rem', marginTop: 8, textAlign: 'center' }}>{gateError}</div>}
              <button
                onClick={handleGateSubmit}
                disabled={gateSubmitting}
                style={{ ...goldBtn, width: '100%', marginTop: 16, opacity: gateSubmitting ? 0.6 : 1 }}
              >
                {gateSubmitting ? 'Unlocking…' : 'Watch the case study →'}
              </button>
            </div>
          </div>
        </section>
      )}

      {phase !== 'gate' && (
        <>
          {/* Case study video — Loom embed */}
          <section style={{ padding: '0 24px 56px' }}>
            <div style={sectionInner}>
              <div style={{
                position: 'relative', paddingBottom: '49.895833333333336%', height: 0,
                borderRadius: 16, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.12)',
              }}>
                <iframe
                  src="https://www.loom.com/embed/875f38554a5548b08db520bfa7f2eb37"
                  allowFullScreen
                  style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
                />
              </div>
            </div>
          </section>

          {/* Stat strip */}
          <section style={{ padding: '0 24px 56px' }}>
            <div style={{ ...sectionInner, maxWidth: 640 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 20, textAlign: 'center' }}>
                {[
                  { n: '$111,811', l: 'Pipeline value tracked' },
                  { n: '685', l: 'Leads captured' },
                  { n: '41', l: 'Jobs booked' },
                  { n: '2.88x', l: 'Return on ad spend' },
                ].map((s) => (
                  <div key={s.l}>
                    <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#f4a93c' }}>{s.n}</div>
                    <div style={{ fontSize: '0.76rem', color: 'rgba(255,255,255,0.6)', marginTop: 4 }}>{s.l}</div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Booking calendar */}
          <section style={{ padding: '0 24px 64px' }}>
            <div style={sectionInner}>
              <div style={{ background: '#201d3d', borderRadius: 16, padding: '32px 28px' }}>
                {phase === 'unlocked' ? (
                  <>
                    <h2 style={{ fontSize: '1.3rem', fontWeight: 800, textAlign: 'center', margin: '0 0 8px' }}>
                      Want the same setup for your business?
                    </h2>
                    <p style={{ fontSize: '0.88rem', color: 'rgba(255,255,255,0.6)', textAlign: 'center', margin: '0 0 24px' }}>
                      Book a free walkthrough — we&apos;ll show you exactly how it&apos;d work for your company.
                    </p>

                    <label style={{ fontSize: '0.76rem', fontWeight: 700, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 10 }}>
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
                              padding: '10px 4px', borderRadius: 8,
                              border: isSel ? '2px solid #f4a93c' : '1px solid rgba(255,255,255,0.12)',
                              background: isSel ? 'rgba(244,169,60,0.12)' : 'transparent',
                              color: isSel ? '#f4a93c' : 'rgba(255,255,255,0.75)',
                              cursor: 'pointer', fontSize: '0.72rem', fontWeight: 700, textAlign: 'center',
                              fontFamily: "'Nautic', sans-serif",
                            }}
                          >
                            <div style={{ fontSize: '0.65rem', color: isSel ? 'rgba(244,169,60,0.8)' : 'rgba(255,255,255,0.45)' }}>
                              {d.toLocaleDateString('en-US', { weekday: 'short' })}
                            </div>
                            <div>{d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
                          </button>
                        )
                      })}
                    </div>

                    <label style={{ fontSize: '0.76rem', fontWeight: 700, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 10 }}>
                      Select a Time <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(Alaska Time)</span>
                    </label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 24 }}>
                      {TIME_SLOTS.map((t) => {
                        const isSel = selectedTime === t
                        return (
                          <button
                            key={t}
                            onClick={() => setSelectedTime(t)}
                            style={{
                              padding: '8px 16px', borderRadius: 99,
                              border: isSel ? '2px solid #f4a93c' : '1px solid rgba(255,255,255,0.12)',
                              background: isSel ? 'rgba(244,169,60,0.12)' : 'transparent',
                              color: isSel ? '#f4a93c' : 'rgba(255,255,255,0.75)',
                              cursor: 'pointer', fontSize: '0.82rem', fontWeight: 700,
                              fontFamily: "'Nautic', sans-serif",
                            }}
                          >
                            {t}
                          </button>
                        )
                      })}
                    </div>

                    <div style={{ width: '100%', height: 1, background: 'rgba(255,255,255,0.1)', marginBottom: 20 }} />

                    <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'rgba(255,255,255,0.6)', display: 'block', marginBottom: 6 }}>Phone *</label>
                    <input type="tel" required value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(555) 123-4567" style={{ ...inputStyle, marginBottom: 16 }} />

                    {bookError && <div style={{ color: '#ff8080', fontSize: '0.85rem', marginBottom: 8, textAlign: 'center' }}>{bookError}</div>}

                    <button
                      onClick={handleBookSubmit}
                      disabled={bookSubmitting}
                      style={{ ...goldBtn, width: '100%', opacity: bookSubmitting ? 0.6 : 1 }}
                    >
                      {bookSubmitting ? 'Booking…' : 'Book My Free Walkthrough →'}
                    </button>
                  </>
                ) : (
                  <div style={{ textAlign: 'center', padding: '12px 0' }}>
                    <div style={{
                      width: 56, height: 56, borderRadius: '50%', background: 'rgba(244,169,60,0.15)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px',
                    }}>
                      <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="#f4a93c" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round"><path d="M5 13l4 4L19 7" /></svg>
                    </div>
                    <h2 style={{ fontSize: '1.3rem', fontWeight: 800, margin: '0 0 10px' }}>You&apos;re booked!</h2>
                    {selectedDate && selectedTime && (
                      <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.95rem', lineHeight: 1.6 }}>
                        {"We'll call you on "}
                        <span style={{ color: '#f4a93c', fontWeight: 700 }}>
                          {new Date(selectedDate + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                        </span>
                        {' at '}
                        <span style={{ color: '#f4a93c', fontWeight: 700 }}>{selectedTime}</span>
                        {' Alaska Time.'}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  )
}

const MARQUEE_SHOTS = [
  { src: '/casestudy/dashboard-year.png', alt: 'Dashboard — $140,631 pipeline, 807 leads this year' },
  { src: '/casestudy/leadmap.png', alt: 'Live lead map with booked lead detail' },
  { src: '/casestudy/ltv-calculator.png', alt: 'LTV calculator — 2.65x ROAS' },
  { src: '/casestudy/leads-stats.png', alt: 'Leads dashboard — 807 total, 403 new, 48 booked' },
  { src: '/casestudy/lead-row.png', alt: 'A super lead row with quote and contact info' },
  { src: '/casestudy/dashboard-month.png', alt: 'Dashboard — $15,680 pipeline this month' },
]

// Real product screenshots, floating directly on the page background (no card),
// auto-panning left-to-right forever. The list is rendered twice back-to-back so
// the loop has no visible seam.
function ScreenshotMarquee() {
  return (
    <div className="marquee">
      <div className="marquee-track">
        {[...MARQUEE_SHOTS, ...MARQUEE_SHOTS].map((shot, i) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img key={i} src={shot.src} alt={shot.alt} />
        ))}
      </div>
      <style jsx>{`
        .marquee{ width: 100%; overflow: hidden; padding: 8px 0 64px; -webkit-mask-image: linear-gradient(90deg, transparent, #000 8%, #000 92%, transparent); mask-image: linear-gradient(90deg, transparent, #000 8%, #000 92%, transparent); }
        .marquee-track{ display: flex; align-items: center; gap: 28px; width: max-content; animation: pan 32s linear infinite; }
        .marquee-track img{ height: 130px; width: auto; border-radius: 10px; box-shadow: 0 18px 40px -18px rgba(0,0,0,0.45); flex-shrink: 0; }
        @keyframes pan{ from { transform: translateX(-50%); } to { transform: translateX(0%); } }
        @media (max-width: 640px){ .marquee-track img{ height: 90px; } }
      `}</style>
    </div>
  )
}
