'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function SetupForm({ token, email }: { token: string; email: string }) {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }
    if (password !== confirm) {
      setError('Passwords do not match')
      return
    }

    setLoading(true)
    try {
      // Create account via API
      const res = await fetch('/api/sales-leads/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to create account')

      // Sign them in immediately
      const supabase = createClient()
      const { error: signInErr } = await supabase.auth.signInWithPassword({
        email: data.email,
        password,
      })

      if (signInErr) throw new Error('Account created but sign-in failed. Please log in manually.')

      window.location.href = '/dashboard'
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setLoading(false)
    }
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
    fontFamily: "'Inter', sans-serif",
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'rgba(255,255,255,0.6)', display: 'block', marginBottom: 6 }}>Email</label>
        <input type="email" value={email} readOnly style={{ ...inputStyle, color: 'rgba(255,255,255,0.4)', cursor: 'not-allowed' }} />
      </div>
      <div>
        <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'rgba(255,255,255,0.6)', display: 'block', marginBottom: 6 }}>Password</label>
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Min. 8 characters" autoComplete="new-password" style={inputStyle} />
      </div>
      <div>
        <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'rgba(255,255,255,0.6)', display: 'block', marginBottom: 6 }}>Confirm Password</label>
        <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Repeat password" autoComplete="new-password" style={inputStyle} />
      </div>

      {error && <div style={{ color: '#ef4444', fontSize: '0.85rem', textAlign: 'center' }}>{error}</div>}

      <button
        type="submit"
        disabled={loading}
        style={{
          background: '#FFE500',
          color: '#0d0d1a',
          fontWeight: 700,
          fontSize: '1rem',
          padding: '14px 32px',
          borderRadius: 10,
          border: 'none',
          cursor: loading ? 'not-allowed' : 'pointer',
          fontFamily: "'Inter', sans-serif",
          width: '100%',
          marginTop: 8,
          opacity: loading ? 0.6 : 1,
        }}
      >
        {loading ? 'Creating account...' : 'Create Account & Log In'}
      </button>
    </form>
  )
}
