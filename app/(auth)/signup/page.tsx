'use client'

import { useState, KeyboardEvent, Suspense } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

function SignupForm() {
  const router = useRouter()
  const [businessName, setBusinessName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit() {
    setError('')
    if (!businessName.trim()) { setError('Business name is required'); return }
    if (!email.trim()) { setError('Email is required'); return }
    if (password.length < 6) { setError('Password must be at least 6 characters'); return }

    setLoading(true)
    const supabase = createClient()

    const { data: authData, error: authError } = await supabase.auth.signUp({ email: email.trim(), password })
    if (authError) { setError(authError.message); setLoading(false); return }
    if (!authData.user) { setError('Could not create account. Please try again.'); setLoading(false); return }

    const { data: newAccount, error: accountError } = await supabase
      .from('accounts')
      .insert([{ business_name: businessName.trim(), owner_id: authData.user.id }])
      .select('id')
      .single()

    if (accountError || !newAccount) {
      setError(accountError?.message ?? 'Failed to create account')
      setLoading(false)
      return
    }

    await supabase
      .from('billing')
      .insert([{ account_id: newAccount.id, credit_balance: 0, total_spent: 0 }])

    router.push('/onboarding')
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') handleSubmit()
  }

  return (
    <div className="min-h-screen flex">
      {/* Left branding panel */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-center px-12 py-16" style={{ background: '#1a1a2e' }}>
        <div className="max-w-sm">
          <div style={{ width: 44, height: 44, background: '#ffe500', borderRadius: 10, marginBottom: 28 }} />
          <h1 style={{ fontSize: '2.5rem', fontWeight: 800, color: '#fff', letterSpacing: '-0.02em', marginBottom: 10, lineHeight: 1.1 }}>
            QuoteBox
          </h1>
          <p style={{ fontSize: '1.05rem', color: 'rgba(255,255,255,0.5)', marginBottom: 40, lineHeight: 1.6 }}>
            Turn clicks into customers, automatically.
          </p>
          <ul style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {[
              'Beautiful quote forms your customers love',
              'Connect Meta Ads without the complexity',
              'Know exactly what every lead costs',
            ].map((b) => (
              <li key={b} style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <span style={{
                  marginTop: 2, flexShrink: 0, width: 20, height: 20, borderRadius: '50%',
                  background: 'rgba(255,229,0,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <svg width="10" height="10" fill="none" viewBox="0 0 12 12" stroke="#ffe500" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2 6l3 3 5-5" />
                  </svg>
                </span>
                <span style={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.9rem', lineHeight: 1.55 }}>{b}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Right form panel */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '48px 24px', background: '#fff' }}>
        <div style={{ width: '100%', maxWidth: 420 }}>
          <h2 style={{ fontSize: '1.7rem', fontWeight: 800, color: '#1a1a2e', marginBottom: 6 }}>
            Create your account
          </h2>
          <p style={{ fontSize: '0.9rem', color: '#64748b', marginBottom: 32 }}>
            Get set up in minutes — no credit card required.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#374151', marginBottom: 6 }}>
                Business Name <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="text"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Acme Roofing Co."
                autoFocus
                style={{
                  width: '100%', padding: '11px 14px', borderRadius: 9,
                  border: '1.5px solid #e2e8f0', fontSize: '0.95rem', outline: 'none',
                  boxSizing: 'border-box', color: '#1a1a2e', fontFamily: 'inherit',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#374151', marginBottom: 6 }}>
                Email address <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="you@example.com"
                style={{
                  width: '100%', padding: '11px 14px', borderRadius: 9,
                  border: '1.5px solid #e2e8f0', fontSize: '0.95rem', outline: 'none',
                  boxSizing: 'border-box', color: '#1a1a2e', fontFamily: 'inherit',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#374151', marginBottom: 6 }}>
                Password <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="At least 6 characters"
                style={{
                  width: '100%', padding: '11px 14px', borderRadius: 9,
                  border: '1.5px solid #e2e8f0', fontSize: '0.95rem', outline: 'none',
                  boxSizing: 'border-box', color: '#1a1a2e', fontFamily: 'inherit',
                }}
              />
            </div>

            {error && (
              <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 14px' }}>
                <p style={{ fontSize: '0.84rem', color: '#dc2626', margin: 0 }}>{error}</p>
              </div>
            )}

            <button
              onClick={handleSubmit}
              disabled={loading}
              style={{
                width: '100%', padding: '13px', borderRadius: 9, border: 'none',
                background: '#1a1a2e', color: '#ffe500', fontSize: '0.95rem', fontWeight: 700,
                cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
                opacity: loading ? 0.6 : 1, letterSpacing: '0.01em', marginTop: 4,
              }}
            >
              {loading ? 'Creating account…' : 'Create account →'}
            </button>

            <p style={{ textAlign: 'center', fontSize: '0.84rem', color: '#94a3b8', margin: 0 }}>
              Already have an account?{' '}
              <Link href="/login" style={{ color: '#1a1a2e', fontWeight: 600, textDecoration: 'underline' }}>
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function SignupPage() {
  return (
    <Suspense fallback={null}>
      <SignupForm />
    </Suspense>
  )
}
