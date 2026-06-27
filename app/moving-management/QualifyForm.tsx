'use client'

import { useState } from 'react'
import Link from 'next/link'

const BUDGET_OPTIONS = [
  { label: 'Under $25/day', value: 'under25', tier: null },
  { label: '$25–$49/day', value: '25to49', tier: null },
  { label: '$50–$99/day', value: '50to99', tier: 25 },
  { label: '$100–$199/day', value: '100to199', tier: 50 },
  { label: '$200+/day', value: '200plus', tier: 100 },
]

export default function QualifyForm() {
  const [name, setName] = useState('')
  const [business, setBusiness] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [city, setCity] = useState('')
  const [budget, setBudget] = useState('')
  const [status, setStatus] = useState<'idle' | 'disqualified' | 'success' | 'loading' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const selected = BUDGET_OPTIONS.find(o => o.value === budget)
    if (!selected) return

    if (selected.tier === null) {
      setStatus('disqualified')
      return
    }

    setStatus('loading')
    try {
      const res = await fetch('/api/sales-leads/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, phone, tier: selected.tier }),
      })
      if (res.ok) {
        setStatus('success')
      } else {
        const data = await res.json()
        setErrorMsg(data.error || 'Something went wrong.')
        setStatus('error')
      }
    } catch {
      setErrorMsg('Network error. Please try again.')
      setStatus('error')
    }
  }

  if (status === 'disqualified') {
    return (
      <div style={{
        background: 'white', borderRadius: 14, padding: '36px 32px',
        border: '1px solid #e5e7eb', maxWidth: 520, margin: '0 auto', textAlign: 'center',
      }}>
        <div style={{ fontSize: '2rem', marginBottom: 16 }}>📋</div>
        <h3 style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: 12, color: '#0e0020' }}>
          Not quite the right fit — yet
        </h3>
        <p style={{ color: '#6b7280', lineHeight: 1.7, marginBottom: 24, fontSize: '0.93rem' }}>
          We specialize in accounts spending $50+/day on Meta. For smaller budgets, try our self-serve
          $15/lead option — no monthly commitment required.
        </p>
        <Link href="/build" style={{
          display: 'inline-block', background: '#0e0020', color: '#FFE500',
          fontWeight: 700, padding: '12px 28px', borderRadius: 10, textDecoration: 'none',
          fontSize: '0.95rem',
        }}>
          Try self-serve $15/lead →
        </Link>
      </div>
    )
  }

  if (status === 'success') {
    return (
      <div style={{
        background: 'white', borderRadius: 14, padding: '36px 32px',
        border: '1px solid #e5e7eb', maxWidth: 520, margin: '0 auto', textAlign: 'center',
      }}>
        <div style={{ fontSize: '2rem', marginBottom: 16 }}>✅</div>
        <h3 style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: 12, color: '#0e0020' }}>
          You're on the list!
        </h3>
        <p style={{ color: '#6b7280', lineHeight: 1.7, fontSize: '0.93rem' }}>
          We'll reach out within 1 business day to walk you through the setup and get your moving ads live.
        </p>
      </div>
    )
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '11px 14px', borderRadius: 8,
    border: '1px solid #d1d5db', fontSize: '0.95rem', outline: 'none',
    boxSizing: 'border-box', color: '#0e0020',
  }

  const labelStyle: React.CSSProperties = {
    display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: 6, color: '#374151',
  }

  return (
    <form onSubmit={handleSubmit} style={{
      background: 'white', borderRadius: 14, padding: '36px 32px',
      border: '1px solid #e5e7eb', maxWidth: 520, margin: '0 auto',
    }}>
      <h3 style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: 24, color: '#0e0020', textAlign: 'center' }}>
        See if we're a good fit
      </h3>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <label style={labelStyle}>Your Name *</label>
          <input style={inputStyle} type="text" required value={name} onChange={e => setName(e.target.value)} placeholder="Jane Smith" />
        </div>
        <div>
          <label style={labelStyle}>Business Name *</label>
          <input style={inputStyle} type="text" required value={business} onChange={e => setBusiness(e.target.value)} placeholder="Smith Moving Co." />
        </div>
        <div>
          <label style={labelStyle}>Phone *</label>
          <input style={inputStyle} type="tel" required value={phone} onChange={e => setPhone(e.target.value)} placeholder="(555) 000-0000" />
        </div>
        <div>
          <label style={labelStyle}>Email *</label>
          <input style={inputStyle} type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="jane@smithmoving.com" />
        </div>
        <div>
          <label style={labelStyle}>City / Market *</label>
          <input style={inputStyle} type="text" required value={city} onChange={e => setCity(e.target.value)} placeholder="Chicago, IL" />
        </div>
        <div>
          <label style={labelStyle}>Daily Meta Ad Budget *</label>
          <select
            style={{ ...inputStyle, background: 'white', cursor: 'pointer' }}
            required
            value={budget}
            onChange={e => setBudget(e.target.value)}
          >
            <option value="">Select your daily budget…</option>
            {BUDGET_OPTIONS.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
      </div>

      {status === 'error' && (
        <p style={{ color: '#ef4444', fontSize: '0.88rem', marginTop: 12 }}>{errorMsg}</p>
      )}

      <button
        type="submit"
        disabled={status === 'loading'}
        style={{
          marginTop: 24, width: '100%', background: '#0e0020', color: '#FFE500',
          fontWeight: 700, fontSize: '1rem', padding: '14px', borderRadius: 10,
          border: 'none', cursor: status === 'loading' ? 'not-allowed' : 'pointer',
          opacity: status === 'loading' ? 0.7 : 1,
        }}
      >
        {status === 'loading' ? 'Submitting…' : 'Apply for managed ads →'}
      </button>

      <p style={{ textAlign: 'center', fontSize: '0.78rem', color: '#9ca3af', marginTop: 12 }}>
        No commitment. We'll reach out within 1 business day.
      </p>
    </form>
  )
}
