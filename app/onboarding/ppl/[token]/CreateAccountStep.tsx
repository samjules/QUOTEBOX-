'use client'

import { useState, type KeyboardEvent } from 'react'
import { useRouter } from 'next/navigation'
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

interface Props {
  token: string
  businessName: string
  email: string
}

export default function CreateAccountStep({ token, businessName, email }: Props) {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit() {
    setError(null)
    if (password.length < 8) { setError('Password must be at least 8 characters'); return }
    if (password !== confirm) { setError('Passwords do not match'); return }

    setLoading(true)
    try {
      const res = await fetch(`/api/onboarding/${token}/create-account`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Something went wrong'); setLoading(false); return }

      const supabase = createClient()
      const { error: signInErr } = await supabase.auth.signInWithPassword({ email, password })
      if (signInErr) { setError(signInErr.message); setLoading(false); return }

      router.refresh()
    } catch {
      setError('Something went wrong — please try again')
      setLoading(false)
    }
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') submit()
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f7f6f3', padding: '40px 20px' }}>
      <div style={{ width: '100%', maxWidth: 420, background: 'white', borderRadius: 20, padding: '36px 32px', boxShadow: '0 8px 40px rgba(0,0,0,0.08)' }}>
        <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
          Step 1 of 3
        </div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0e0020', margin: '0 0 6px' }}>
          Create your account
        </h2>
        <p style={{ fontSize: '0.88rem', color: '#64748b', margin: '0 0 28px' }}>
          {businessName ? `Welcome, ${businessName}! ` : ''}Set a password for <strong>{email}</strong> to get started.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={label}>Password</label>
            <input
              type="password" autoComplete="new-password" autoFocus
              value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={handleKeyDown}
              placeholder="At least 8 characters" style={input}
            />
          </div>
          <div>
            <label style={label}>Confirm password</label>
            <input
              type="password" autoComplete="new-password"
              value={confirm} onChange={(e) => setConfirm(e.target.value)} onKeyDown={handleKeyDown}
              placeholder="Re-enter your password" style={input}
            />
          </div>

          {error && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 14px' }}>
              <p style={{ fontSize: '0.84rem', color: '#dc2626', margin: 0 }}>{error}</p>
            </div>
          )}

          <button onClick={submit} disabled={loading} style={{ ...btn, opacity: loading ? 0.6 : 1, marginTop: 4 }}>
            {loading ? 'Creating account…' : 'Continue →'}
          </button>
        </div>
      </div>
    </div>
  )
}
