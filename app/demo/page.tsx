'use client'

import { useState, useRef, CSSProperties } from 'react'
import { Inter, IBM_Plex_Mono } from 'next/font/google'

const inter = Inter({ subsets: ['latin'], weight: ['400', '500', '600', '700'], variable: '--font-inter' })
const mono = IBM_Plex_Mono({ subsets: ['latin'], weight: ['500'], variable: '--font-mono' })

const COLORS = {
  paper: '#F4EEE0',
  paperLight: '#FBF7EC',
  ink: '#211F3D',
  inkSoft: '#615E7E',
  line: '#DCD5C4',
  purple: '#5C51D6',
  purpleLight: '#EBE8FA',
  purpleDark: '#443BA8',
  stamp: '#2F6E4F',
  stampLight: '#DCEBE1',
}

const NAUTIC = "'Nautic', sans-serif"
const INTER = 'var(--font-inter), sans-serif'
const MONO = 'var(--font-mono), monospace'

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

type Phase = 'landing' | 'booking' | 'done'

function Card({ children, ticketNo }: { children: React.ReactNode; ticketNo?: string }) {
  const cardStyle: CSSProperties = {
    position: 'relative',
    background: COLORS.paperLight,
    border: `1px solid ${COLORS.line}`,
    borderRadius: 6,
    boxShadow: '0 10px 30px rgba(33,31,61,0.10)',
    padding: '44px 40px 40px',
  }
  return (
    <div style={cardStyle}>
      <div style={{ position: 'absolute', top: 0, left: 24, right: 24, height: 0, borderTop: `2px dashed ${COLORS.line}` }} />
      {ticketNo && (
        <div style={{ position: 'absolute', top: 16, right: 20, fontFamily: MONO, fontSize: 10, color: COLORS.inkSoft, letterSpacing: 1 }}>
          {ticketNo}
        </div>
      )}
      {children}
    </div>
  )
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', color: COLORS.purple, margin: '0 0 14px' }}>
      {children}
    </div>
  )
}

function Cta({ children, onClick, disabled }: { children: React.ReactNode; onClick?: () => void; disabled?: boolean }) {
  const [hover, setHover] = useState(false)
  const [pressed, setPressed] = useState(false)
  const style: CSSProperties = {
    display: 'block',
    width: '100%',
    border: 'none',
    background: hover ? COLORS.purpleDark : COLORS.purple,
    color: '#fff',
    fontFamily: NAUTIC,
    fontSize: 19,
    letterSpacing: 0.4,
    padding: 18,
    borderRadius: 5,
    cursor: disabled ? 'default' : 'pointer',
    textAlign: 'center',
    marginTop: 6,
    opacity: disabled ? 0.6 : 1,
    transition: 'transform .1s ease, background .15s ease',
    transform: pressed ? 'scale(0.99)' : 'scale(1)',
  }
  return (
    <button
      style={style}
      disabled={disabled}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => { setHover(false); setPressed(false) }}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      onClick={onClick}
    >
      {children}
    </button>
  )
}

export default function DemoPage() {
  const [phase, setPhase] = useState<Phase>('landing')

  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [selectedTime, setSelectedTime] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const weekdaysRef = useRef(getWeekdays(3))
  const weekdays = weekdaysRef.current

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

  const outerStyle: CSSProperties = {
    minHeight: '100vh',
    background: COLORS.paper,
    backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(33,31,61,0.05) 1px, transparent 0)',
    backgroundSize: '22px 22px',
    fontFamily: INTER,
    color: COLORS.ink,
    padding: '56px 20px 40px',
  }

  const appStyle: CSSProperties = { maxWidth: 640, margin: '0 auto' }

  const inputStyle: CSSProperties = {
    width: '100%',
    border: `1.5px solid ${COLORS.line}`,
    background: COLORS.paper,
    borderRadius: 5,
    padding: '12px 14px',
    fontFamily: INTER,
    fontSize: 14,
    color: COLORS.ink,
    outline: 'none',
    boxSizing: 'border-box',
  }

  const labelStyle: CSSProperties = { display: 'block', fontSize: 12.5, fontWeight: 600, marginBottom: 6, color: COLORS.ink }

  return (
    <div className={`${inter.variable} ${mono.variable}`} style={outerStyle}>
      <div style={appStyle}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 6 }}>
          <img src="/quotebox_icon.png" alt="Quote.Box logo" width={32} height={32} style={{ borderRadius: 8, display: 'block' }} />
          <span style={{ fontFamily: NAUTIC, fontSize: 28, letterSpacing: 0.5, color: COLORS.ink }}>
            Quote<span style={{ color: COLORS.purple }}>.</span>Box
          </span>
        </div>

        <div style={{ minHeight: 20, marginBottom: 26 }} />

        {/* Landing */}
        {phase === 'landing' && (
          <Card>
            <Eyebrow>Live demo</Eyebrow>
            <h1 style={{ fontFamily: NAUTIC, fontSize: 42, lineHeight: 1.12, letterSpacing: 0.3, margin: '0 0 14px' }}>
              See Quote.Box<br /><span style={{ color: COLORS.purple }}>in action</span>
            </h1>
            <p style={{ color: COLORS.inkSoft, fontSize: 15, lineHeight: 1.55, margin: '0 0 28px', maxWidth: 480 }}>
              Book a quick call and we&apos;ll walk you through the platform live — no pressure, no obligation.
            </p>

            <Cta onClick={() => setPhase('booking')}>Book a demo call →</Cta>
            <div style={{ textAlign: 'center', fontFamily: MONO, fontSize: 10.5, letterSpacing: 1, color: COLORS.inkSoft, marginTop: 14, textTransform: 'uppercase' }}>
              Takes 30 seconds
            </div>
          </Card>
        )}

        {/* Booking */}
        {phase === 'booking' && (
          <Card ticketNo="Est. No. 001">
            <h2 style={{ fontFamily: NAUTIC, fontSize: 30, lineHeight: 1.18, letterSpacing: 0.2, margin: '0 0 10px', textAlign: 'center' }}>
              Book your demo call
            </h2>
            <p style={{ color: COLORS.inkSoft, fontSize: 15, lineHeight: 1.55, margin: '0 auto 26px', maxWidth: 480, textAlign: 'center' }}>
              Pick a time and we&apos;ll walk you through the platform.
            </p>

            <label style={labelStyle}>Select a date</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 22 }}>
              {weekdays.slice(0, 9).map((d) => {
                const iso = d.toISOString().split('T')[0]
                const isSel = selectedDate === iso
                return (
                  <div
                    key={iso}
                    onClick={() => setSelectedDate(iso)}
                    style={{
                      border: `1.5px solid ${isSel ? COLORS.purple : COLORS.line}`,
                      borderRadius: 5, padding: '10px 6px', textAlign: 'center', fontSize: 13,
                      background: isSel ? COLORS.purpleLight : COLORS.paper, cursor: 'pointer',
                    }}
                  >
                    <div style={{ color: COLORS.inkSoft, fontSize: 10.5, textTransform: 'uppercase', letterSpacing: 1 }}>
                      {d.toLocaleDateString('en-US', { weekday: 'short' })}
                    </div>
                    <div style={{ fontWeight: 600, marginTop: 2 }}>
                      {d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </div>
                  </div>
                )
              })}
            </div>

            <label style={labelStyle}>Select a time <span style={{ fontWeight: 400 }}>(Alaska Time)</span></label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 22 }}>
              {TIME_SLOTS.map((t) => {
                const isSel = selectedTime === t
                return (
                  <div
                    key={t}
                    onClick={() => setSelectedTime(t)}
                    style={{
                      border: `1.5px solid ${isSel ? COLORS.purple : COLORS.line}`,
                      borderRadius: 99, padding: '8px 16px', fontSize: 13, fontWeight: 600,
                      background: isSel ? COLORS.purpleLight : COLORS.paper,
                      color: isSel ? COLORS.purple : COLORS.ink,
                      cursor: 'pointer',
                    }}
                  >
                    {t}
                  </div>
                )
              })}
            </div>

            <fieldset style={{ border: 'none', padding: 0, margin: '0 0 18px' }}>
              <label style={labelStyle}>Name</label>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your full name" style={inputStyle} />
            </fieldset>
            <fieldset style={{ border: 'none', padding: 0, margin: '0 0 18px' }}>
              <label style={labelStyle}>Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" style={inputStyle} />
            </fieldset>
            <fieldset style={{ border: 'none', padding: 0, margin: '0 0 18px' }}>
              <label style={labelStyle}>Phone</label>
              <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(555) 123-4567" style={inputStyle} />
            </fieldset>

            {error && (
              <div style={{ color: '#B3261E', fontSize: 13, marginBottom: 12, textAlign: 'center' }}>{error}</div>
            )}

            <Cta onClick={handleSubmit} disabled={submitting}>
              {submitting ? 'Booking...' : 'Book my demo call'}
            </Cta>
            <div style={{ textAlign: 'center', fontFamily: MONO, fontSize: 10.5, letterSpacing: 1, color: COLORS.inkSoft, marginTop: 14, textTransform: 'uppercase' }}>
              We&apos;ll text to confirm — reply Y or N
            </div>
          </Card>
        )}

        {/* Done */}
        {phase === 'done' && (
          <Card>
            <div style={{ textAlign: 'center', marginBottom: 18 }}>
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                border: `2.5px solid ${COLORS.stamp}`, color: COLORS.stamp, background: COLORS.stampLight,
                fontFamily: MONO, fontSize: 12, letterSpacing: 2, textTransform: 'uppercase',
                padding: '6px 14px', borderRadius: 3, transform: 'rotate(-3deg)',
              }}>
                ✓ You&apos;re booked
              </span>
            </div>
            <h2 style={{ fontFamily: NAUTIC, fontSize: 30, lineHeight: 1.18, letterSpacing: 0.2, margin: '0 0 10px', textAlign: 'center' }}>
              See you soon
            </h2>
            {selectedDate && selectedTime && (
              <p style={{ color: COLORS.inkSoft, fontSize: 15, lineHeight: 1.55, margin: '0 auto 16px', maxWidth: 480, textAlign: 'center' }}>
                {"Your call is set for "}
                <span style={{ color: COLORS.purple, fontWeight: 600 }}>
                  {new Date(selectedDate + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                </span>
                {' at '}
                <span style={{ color: COLORS.purple, fontWeight: 600 }}>{selectedTime}</span>
                {' Alaska Time'}
              </p>
            )}
            <p style={{ color: COLORS.inkSoft, fontSize: 13, lineHeight: 1.55, margin: 0, textAlign: 'center' }}>
              The day before your call, we&apos;ll text and email you a reminder. Reply <strong style={{ color: COLORS.ink }}>Y</strong> to confirm or <strong style={{ color: COLORS.ink }}>N</strong> to cancel — if we don&apos;t hear back, your spot will be released.
            </p>
          </Card>
        )}
      </div>
    </div>
  )
}
