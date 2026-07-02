'use client'

import { useState, useRef, useEffect, CSSProperties } from 'react'
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

const RESULTS = [
  { num: '12', label: 'Booked jobs', sub: 'Junk removal co., first week' },
  { num: '55%', label: 'Close rate', sub: 'Up from ~20% before follow-up' },
  { num: '4→20', label: 'Jobs / month', sub: 'Moving co., 6 weeks in' },
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

const PHASE_PROGRESS: Record<Phase, number> = {
  landing: 0, q1: 1, q2: 2, q3: 3, unqualified: 0, booking: 4, done: 4,
}

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

function Choice({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) {
  const [hover, setHover] = useState(false)
  const [pressed, setPressed] = useState(false)
  const active = selected || hover
  const style: CSSProperties = {
    border: `1.5px solid ${active ? COLORS.purple : COLORS.line}`,
    background: active ? COLORS.purpleLight : COLORS.paper,
    borderRadius: 5,
    padding: 20,
    textAlign: 'center',
    fontWeight: 600,
    fontSize: 16,
    fontFamily: INTER,
    color: COLORS.ink,
    cursor: 'pointer',
    transition: 'border-color .15s ease, background .15s ease, transform .1s ease',
    transform: pressed ? 'scale(0.98)' : 'scale(1)',
  }
  return (
    <div
      style={style}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => { setHover(false); setPressed(false) }}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      onClick={onClick}
    >
      {label}
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

  const weekdaysRef = useRef(getWeekdays(3))
  const weekdays = weekdaysRef.current
  const [takenSlots, setTakenSlots] = useState<Set<string>>(new Set())

  async function refreshTakenSlots() {
    try {
      const res = await fetch('/api/free-trial/taken-slots')
      if (!res.ok) return
      const d = await res.json()
      setTakenSlots(new Set<string>(d.taken ?? []))
    } catch {
      // best-effort — leave calendar unrestricted if this fails
    }
  }

  useEffect(() => {
    if (phase === 'booking') refreshTakenSlots()
  }, [phase])

  function answerQ1(v: boolean) {
    setHasCompany(v)
    setPhase(v ? 'q2' : 'unqualified')
  }
  function answerQ2(v: boolean) {
    setCanSpend(v)
    setPhase(v ? 'q3' : 'unqualified')
  }
  function answerQ3(v: boolean) {
    setWillingApp(v)
    setPhase(v ? 'booking' : 'unqualified')
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
        if (res.status === 409) refreshTakenSlots()
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

  const step = PHASE_PROGRESS[phase]
  const showProgress = phase !== 'landing' && phase !== 'unqualified'

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

        {/* Progress */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 10, marginBottom: 26, minHeight: 20 }}>
          {showProgress && [1, 2, 3, 4].map((i) => (
            <div key={i} style={{
              width: 34, height: 8, borderRadius: 4,
              background: i < step ? COLORS.stamp : i === step ? COLORS.purple : COLORS.line,
              transition: 'background .25s ease',
            }} />
          ))}
        </div>

        {/* Landing */}
        {phase === 'landing' && (
          <Card>
            <Eyebrow>Pilot program · 10 spots open</Eyebrow>
            <h1 style={{ fontFamily: NAUTIC, fontSize: 42, lineHeight: 1.12, letterSpacing: 0.3, margin: '0 0 14px' }}>
              We&apos;ll run your marketing<br /><span style={{ color: COLORS.purple }}>free for 14 days</span>
            </h1>
            <p style={{ color: COLORS.inkSoft, fontSize: 15, lineHeight: 1.55, margin: '0 0 28px', maxWidth: 480 }}>
              We&apos;re taking on 10 junk removal and moving companies for a free two-week trial. No setup fee, no contract — see real results before you pay anything.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 30 }}>
              {RESULTS.map((r) => (
                <div key={r.label} style={{ borderLeft: `3px dashed ${COLORS.line}`, padding: '4px 0 4px 14px' }}>
                  <div style={{ fontFamily: NAUTIC, fontSize: 28, color: COLORS.purple, lineHeight: 1 }}>{r.num}</div>
                  <div style={{ fontSize: 12.5, fontWeight: 600, margin: '6px 0 2px' }}>{r.label}</div>
                  <div style={{ fontSize: 11.5, color: COLORS.inkSoft, lineHeight: 1.4 }}>{r.sub}</div>
                </div>
              ))}
            </div>

            <Cta onClick={() => setPhase('q1')}>See if you qualify →</Cta>
            <div style={{ textAlign: 'center', fontFamily: MONO, fontSize: 10.5, letterSpacing: 1, color: COLORS.inkSoft, marginTop: 14, textTransform: 'uppercase' }}>
              Takes 60 seconds · 10 spots available
            </div>
          </Card>
        )}

        {/* Q1 */}
        {phase === 'q1' && (
          <Card ticketNo="Est. No. 001">
            <Eyebrow>Qualifying question 1 of 4</Eyebrow>
            <h2 style={{ fontFamily: NAUTIC, fontSize: 30, lineHeight: 1.18, letterSpacing: 0.2, margin: '0 0 10px' }}>
              Do you own a junk removal or moving company?
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginTop: 6 }}>
              <Choice label="Yes" selected={hasCompany === true} onClick={() => answerQ1(true)} />
              <Choice label="No" selected={hasCompany === false} onClick={() => answerQ1(false)} />
            </div>
          </Card>
        )}

        {/* Q2 */}
        {phase === 'q2' && (
          <Card ticketNo="Est. No. 002">
            <Eyebrow>Qualifying question 2 of 4</Eyebrow>
            <h2 style={{ fontFamily: NAUTIC, fontSize: 30, lineHeight: 1.18, letterSpacing: 0.2, margin: '0 0 10px' }}>
              Can you spend $50+ per day on Meta ads?
            </h2>
            <p style={{ color: COLORS.inkSoft, fontSize: 15, lineHeight: 1.55, margin: '0 0 22px', maxWidth: 480 }}>
              We run the ads for free — you cover ad spend directly to Meta.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginTop: 6 }}>
              <Choice label="Yes" selected={canSpend === true} onClick={() => answerQ2(true)} />
              <Choice label="No" selected={canSpend === false} onClick={() => answerQ2(false)} />
            </div>
          </Card>
        )}

        {/* Q3 */}
        {phase === 'q3' && (
          <Card ticketNo="Est. No. 003">
            <Eyebrow>Qualifying question 3 of 4</Eyebrow>
            <h2 style={{ fontFamily: NAUTIC, fontSize: 30, lineHeight: 1.18, letterSpacing: 0.2, margin: '0 0 10px' }}>
              Will you check the app daily to manage new leads?
            </h2>
            <p style={{ color: COLORS.inkSoft, fontSize: 15, lineHeight: 1.55, margin: '0 0 22px', maxWidth: 480 }}>
              This is how you&apos;ll see and respond to leads in real time.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginTop: 6 }}>
              <Choice label="Yes" selected={willingApp === true} onClick={() => answerQ3(true)} />
              <Choice label="No" selected={willingApp === false} onClick={() => answerQ3(false)} />
            </div>
          </Card>
        )}

        {/* Disqualify */}
        {phase === 'unqualified' && (
          <Card>
            <Eyebrow>Not a fit right now</Eyebrow>
            <h2 style={{ fontFamily: NAUTIC, fontSize: 30, lineHeight: 1.18, letterSpacing: 0.2, margin: '0 0 10px' }}>
              Thanks for checking us out
            </h2>
            <p style={{ color: COLORS.inkSoft, fontSize: 15, lineHeight: 1.55, margin: '0 0 12px', maxWidth: 480 }}>
              This pilot is built for junk removal and moving companies that can run paid ads and manage leads daily — so it&apos;s not quite the right fit at the moment.
            </p>
            <p style={{ color: COLORS.inkSoft, fontSize: 15, lineHeight: 1.55, margin: '0 0 28px', maxWidth: 480 }}>
              If that changes, we&apos;d love to hear from you.
            </p>
            <Cta onClick={() => { setPhase('landing'); setHasCompany(null); setCanSpend(null); setWillingApp(null) }}>
              Back to homepage
            </Cta>
          </Card>
        )}

        {/* Booking */}
        {phase === 'booking' && (
          <Card ticketNo="Est. No. 004">
            <div style={{ textAlign: 'center', marginBottom: 18 }}>
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                border: `2.5px solid ${COLORS.stamp}`, color: COLORS.stamp, background: COLORS.stampLight,
                fontFamily: MONO, fontSize: 12, letterSpacing: 2, textTransform: 'uppercase',
                padding: '6px 14px', borderRadius: 3, transform: 'rotate(-3deg)',
              }}>
                ✓ You qualify
              </span>
            </div>
            <h2 style={{ fontFamily: NAUTIC, fontSize: 30, lineHeight: 1.18, letterSpacing: 0.2, margin: '0 0 10px', textAlign: 'center' }}>
              Book your setup call
            </h2>
            <p style={{ color: COLORS.inkSoft, fontSize: 15, lineHeight: 1.55, margin: '0 auto 26px', maxWidth: 480, textAlign: 'center' }}>
              Pick a time and we&apos;ll walk you through your free 14-day trial.
            </p>

            <label style={labelStyle}>Select a date</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 22 }}>
              {weekdays.slice(0, 9).map((d) => {
                const iso = d.toISOString().split('T')[0]
                const isSel = selectedDate === iso
                const isFull = TIME_SLOTS.every((t) => takenSlots.has(`${iso}|${t}`))
                return (
                  <div
                    key={iso}
                    onClick={() => !isFull && setSelectedDate(iso)}
                    style={{
                      border: `1.5px solid ${isSel ? COLORS.purple : COLORS.line}`,
                      borderRadius: 5, padding: '10px 6px', textAlign: 'center', fontSize: 13,
                      background: isSel ? COLORS.purpleLight : isFull ? COLORS.line : COLORS.paper,
                      cursor: isFull ? 'not-allowed' : 'pointer',
                      opacity: isFull ? 0.5 : 1,
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
                const isTaken = !!selectedDate && takenSlots.has(`${selectedDate}|${t}`)
                return (
                  <div
                    key={t}
                    onClick={() => !isTaken && setSelectedTime(t)}
                    style={{
                      border: `1.5px solid ${isSel ? COLORS.purple : COLORS.line}`,
                      borderRadius: 99, padding: '8px 16px', fontSize: 13, fontWeight: 600,
                      background: isSel ? COLORS.purpleLight : isTaken ? COLORS.line : COLORS.paper,
                      color: isSel ? COLORS.purple : isTaken ? COLORS.inkSoft : COLORS.ink,
                      cursor: isTaken ? 'not-allowed' : 'pointer',
                      opacity: isTaken ? 0.5 : 1,
                      textDecoration: isTaken ? 'line-through' : 'none',
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
              {submitting ? 'Booking...' : 'Book my free trial call'}
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
