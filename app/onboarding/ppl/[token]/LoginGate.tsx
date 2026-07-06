'use client'

import { useState, type KeyboardEvent } from 'react'
import { createClient } from '@/lib/supabase/client'

const input: React.CSSProperties = {
  width: '100%', padding: '12px 14px', borderRadius: 10, border: '1.5px solid #e5e4e0',
  fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit', color: '#0e0020', background: 'white',
}
const label: React.CSSProperties = { display: 'block', fontSize: '0.88rem', fontWeight: 600, color: '#334155', marginBottom: 8 }
const btn: React.CSSProperties = {
  width: '100%', padding: '14px', borderRadius: 10, border: 'none', background: '#0e0020',
  color: '#ffe500', fontSize: '1rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
}

export default function LoginGate({ email }: { email: string }) {
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit() {
    setError(null)
    setLoading(true)
    const supabase = createClient()
    const { error: signInErr } = await supabase.auth.signInWithPassword({ email, password })
    if (signInErr) { setError('Incorrect password'); setLoading(false); return }

    // Full reload rather than router.refresh() — guarantees the server sees
    // the freshly-written session cookies instead of racing ahead of them.
    await supabase.auth.getSession()
    window.location.reload()
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') submit()
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f7f6f3', padding: '40px 20px' }}>
      <div style={{ width: '100%', maxWidth: 380, background: 'white', borderRadius: 20, padding: '36px 32px', boxShadow: '0 8px 40px rgba(0,0,0,0.08)' }}>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0e0020', margin: '0 0 6px' }}>
          Welcome back
        </h2>
        <p style={{ fontSize: '0.88rem', color: '#64748b', margin: '0 0 24px' }}>
          Log in as <strong>{email}</strong> to continue your onboarding.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={label}>Password</label>
            <input
              type="password" autoComplete="current-password" autoFocus
              value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={handleKeyDown}
              style={input}
            />
          </div>

          {error && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 14px' }}>
              <p style={{ fontSize: '0.84rem', color: '#dc2626', margin: 0 }}>{error}</p>
            </div>
          )}

          <button onClick={submit} disabled={loading} style={{ ...btn, opacity: loading ? 0.6 : 1 }}>
            {loading ? 'Logging in…' : 'Continue →'}
          </button>
        </div>
      </div>
    </div>
  )
}
