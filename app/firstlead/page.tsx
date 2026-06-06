'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const lessons = [
  { num: '01', title: 'Pick your niche & ideal customer', desc: 'Stop chasing everyone. Learn which customers are worth targeting and why it changes everything.' },
  { num: '02', title: 'Build a lead magnet in 60 minutes', desc: 'Create a simple offer that makes strangers want to give you their contact info.' },
  { num: '03', title: 'Set up your first quote form', desc: 'The exact form structure that pre-qualifies leads so you only talk to buyers, not tire-kickers.' },
  { num: '04', title: 'Drive traffic for free', desc: 'Organic strategies that actually work for local service businesses — no ad budget required.' },
  { num: '05', title: 'Follow up and close the job', desc: 'A simple 3-step follow-up sequence that converts more leads into booked jobs.' },
]

export default function FirstLeadPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || !email.trim()) {
      setError('Please enter your name and email.')
      return
    }
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/sales-leads/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), email: email.trim(), phone: phone.trim() || undefined }),
      })
      if (!res.ok) {
        const data = await res.json()
        setError(data.error || 'Something went wrong. Please try again.')
        setLoading(false)
        return
      }
      router.push('/firstlead/course')
    } catch {
      setError('Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", color: '#1a1a2e', background: '#fff', minHeight: '100vh' }}>

      {/* Nav */}
      <nav style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 32px', height: 60, borderBottom: '1px solid #f0f0f0',
        position: 'sticky', top: 0, background: 'white', zIndex: 50,
      }}>
        <Link href="/" style={{ textDecoration: 'none' }}>
          <span style={{ fontFamily: "'Oswald', sans-serif", fontSize: '1.35rem', fontWeight: 700, letterSpacing: '0.01em', color: '#1a1a2e' }}>
            Quote<span style={{ color: '#FFE500', WebkitTextStroke: '1px #1a1a2e' }}>.</span>Box
          </span>
        </Link>
        <Link href="/login" style={{ fontSize: '0.88rem', fontWeight: 500, color: '#555', textDecoration: 'none' }}>
          Log in
        </Link>
      </nav>

      {/* Hero */}
      <section style={{ background: '#1a1a2e', color: '#fff', padding: '72px 24px 80px' }}>
        <div style={{ maxWidth: 760, margin: '0 auto', textAlign: 'center' }}>
          <div style={{
            display: 'inline-block', background: '#FFE500', color: '#1a1a2e',
            fontSize: '0.78rem', fontWeight: 700, letterSpacing: '0.08em',
            textTransform: 'uppercase', padding: '6px 16px', borderRadius: 100, marginBottom: 24,
          }}>
            Free Video Course
          </div>
          <h1 style={{ fontSize: 'clamp(2rem, 5vw, 3.2rem)', fontWeight: 800, lineHeight: 1.15, margin: '0 0 20px' }}>
            How to Get Your<br />
            <span style={{ color: '#FFE500' }}>First Lead Online</span>
          </h1>
          <p style={{ fontSize: '1.15rem', color: '#b0b8cc', lineHeight: 1.7, maxWidth: 580, margin: '0 auto 40px' }}>
            A free 5-lesson video course for contractors and service businesses who want to start generating
            real leads online — without wasting money on ads or complicated software.
          </p>

          {/* Form card */}
          <div style={{
            background: '#fff', borderRadius: 16, padding: '36px 32px',
            maxWidth: 440, margin: '0 auto', boxShadow: '0 24px 60px rgba(0,0,0,0.25)',
          }}>
            <p style={{ fontSize: '1rem', fontWeight: 700, color: '#1a1a2e', margin: '0 0 6px' }}>
              Get instant free access
            </p>
            <p style={{ fontSize: '0.84rem', color: '#777', margin: '0 0 24px' }}>
              Enter your details and we'll send you the course link.
            </p>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <input
                type="text"
                placeholder="Your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                style={{
                  padding: '12px 16px', borderRadius: 8, border: '1.5px solid #e5e7eb',
                  fontSize: '0.95rem', color: '#1a1a2e', outline: 'none',
                  transition: 'border-color 0.15s',
                }}
                onFocus={(e) => (e.target.style.borderColor = '#1a1a2e')}
                onBlur={(e) => (e.target.style.borderColor = '#e5e7eb')}
              />
              <input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={{
                  padding: '12px 16px', borderRadius: 8, border: '1.5px solid #e5e7eb',
                  fontSize: '0.95rem', color: '#1a1a2e', outline: 'none',
                  transition: 'border-color 0.15s',
                }}
                onFocus={(e) => (e.target.style.borderColor = '#1a1a2e')}
                onBlur={(e) => (e.target.style.borderColor = '#e5e7eb')}
              />
              <input
                type="tel"
                placeholder="Phone (optional)"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                style={{
                  padding: '12px 16px', borderRadius: 8, border: '1.5px solid #e5e7eb',
                  fontSize: '0.95rem', color: '#1a1a2e', outline: 'none',
                  transition: 'border-color 0.15s',
                }}
                onFocus={(e) => (e.target.style.borderColor = '#1a1a2e')}
                onBlur={(e) => (e.target.style.borderColor = '#e5e7eb')}
              />
              {error && (
                <p style={{ color: '#dc2626', fontSize: '0.84rem', margin: 0 }}>{error}</p>
              )}
              <button
                type="submit"
                disabled={loading}
                style={{
                  marginTop: 4, padding: '14px 24px', borderRadius: 8, border: 'none',
                  background: loading ? '#ccc' : '#FFE500', color: '#1a1a2e',
                  fontSize: '0.95rem', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
                  transition: 'opacity 0.15s',
                }}
              >
                {loading ? 'Sending…' : 'Get Free Access →'}
              </button>
            </form>
            <p style={{ fontSize: '0.75rem', color: '#aaa', margin: '14px 0 0', textAlign: 'center' }}>
              No credit card required. No spam. Unsubscribe anytime.
            </p>
          </div>
        </div>
      </section>

      {/* What you'll learn */}
      <section style={{ padding: '72px 24px', background: '#fafafa' }}>
        <div style={{ maxWidth: 760, margin: '0 auto' }}>
          <h2 style={{ fontSize: 'clamp(1.5rem, 3vw, 2rem)', fontWeight: 800, textAlign: 'center', margin: '0 0 8px' }}>
            What's inside the course
          </h2>
          <p style={{ textAlign: 'center', color: '#666', fontSize: '0.95rem', margin: '0 0 48px' }}>
            5 short, practical lessons. No fluff. Just what works.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {lessons.map((l) => (
              <div key={l.num} style={{
                display: 'flex', gap: 20, alignItems: 'flex-start',
                background: '#fff', borderRadius: 12, padding: '24px 28px',
                border: '1px solid #e5e7eb',
              }}>
                <span style={{
                  flexShrink: 0, fontFamily: "'Oswald', sans-serif", fontSize: '1.4rem',
                  fontWeight: 700, color: '#FFE500', WebkitTextStroke: '1.5px #1a1a2e',
                  lineHeight: 1,
                }}>
                  {l.num}
                </span>
                <div>
                  <p style={{ fontWeight: 700, fontSize: '1rem', margin: '0 0 4px' }}>{l.title}</p>
                  <p style={{ color: '#666', fontSize: '0.88rem', margin: 0, lineHeight: 1.6 }}>{l.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Who this is for */}
      <section style={{ padding: '72px 24px' }}>
        <div style={{ maxWidth: 760, margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontSize: 'clamp(1.5rem, 3vw, 2rem)', fontWeight: 800, margin: '0 0 16px' }}>
            Who this is for
          </h2>
          <p style={{ color: '#555', fontSize: '0.95rem', lineHeight: 1.8, maxWidth: 580, margin: '0 auto 40px' }}>
            This course is built for contractors, tradespeople, and local service businesses — roofers,
            plumbers, movers, landscapers — who know their trade but aren't sure how to turn that into
            a steady stream of online leads.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16 }}>
            {['Contractors', 'Roofers', 'Plumbers', 'HVAC', 'Movers', 'Landscapers'].map((t) => (
              <div key={t} style={{
                background: '#1a1a2e', color: '#fff', borderRadius: 10,
                padding: '14px 20px', fontWeight: 600, fontSize: '0.9rem',
              }}>
                {t}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section style={{ background: '#1a1a2e', color: '#fff', padding: '72px 24px', textAlign: 'center' }}>
        <div style={{ maxWidth: 560, margin: '0 auto' }}>
          <h2 style={{ fontSize: 'clamp(1.5rem, 3vw, 2rem)', fontWeight: 800, margin: '0 0 16px' }}>
            Ready to get your first lead?
          </h2>
          <p style={{ color: '#b0b8cc', fontSize: '0.95rem', margin: '0 0 32px' }}>
            It's free. Takes 30 seconds to sign up. Start watching immediately.
          </p>
          <a href="#top" onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }) }} style={{
            display: 'inline-block', background: '#FFE500', color: '#1a1a2e',
            fontWeight: 700, fontSize: '0.95rem', padding: '14px 32px', borderRadius: 8,
            textDecoration: 'none',
          }}>
            Get Free Access →
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ padding: '24px 32px', borderTop: '1px solid #f0f0f0', textAlign: 'center' }}>
        <p style={{ color: '#aaa', fontSize: '0.8rem', margin: 0 }}>
          © {new Date().getFullYear()} Quote.Box · <Link href="/privacy" style={{ color: '#aaa' }}>Privacy</Link> · <Link href="/terms" style={{ color: '#aaa' }}>Terms</Link>
        </p>
      </footer>
    </div>
  )
}
