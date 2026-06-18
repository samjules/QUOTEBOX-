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
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>

      {/* ── Guaranteed marketing banner ── */}
      <div style={{
        background: '#ffe500', padding: '0 24px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        gap: 16, height: 48, flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
          {/* Shield check icon */}
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="#1a1a2e" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
            <path d="M12 2l7 3v6c0 5-3.5 9.5-7 11-3.5-1.5-7-6-7-11V5l7-3z" />
            <path d="M9 12l2 2 4-4" />
          </svg>
          <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#1a1a2e', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            Guaranteed marketing results from $350/month — we run the ads, you answer the calls
          </span>
        </div>
        <a
          href="mailto:sales@quote-box.com"
          style={{
            flexShrink: 0, padding: '6px 14px', borderRadius: 7,
            background: '#1a1a2e', color: '#ffe500',
            fontSize: '0.76rem', fontWeight: 800, textDecoration: 'none',
            letterSpacing: '0.01em', whiteSpace: 'nowrap',
          }}
        >
          Book a call →
        </a>
      </div>

      {/* ── Main split layout ── */}
      <div style={{ flex: 1, display: 'flex' }}>

        {/* Left branding panel — desktop only */}
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
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '40px 24px', background: '#fff', overflowY: 'auto' }}>
          <div style={{ width: '100%', maxWidth: 420 }}>

            {/* ── Welcome gift card ── */}
            <div style={{
              marginBottom: 28,
              border: '2px dashed #1a1a2e',
              borderRadius: 14,
              padding: '16px 18px',
              background: '#fffef0',
              position: 'relative',
            }}>
              {/* Badge */}
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                background: '#1a1a2e', color: '#ffe500',
                fontSize: '0.6rem', fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase' as const,
                padding: '3px 10px', borderRadius: 20, marginBottom: 10,
              }}>
                {/* Gift box icon */}
                <svg width="10" height="10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="8" width="18" height="14" rx="1" />
                  <path d="M21 8H3V5a1 1 0 011-1h16a1 1 0 011 1v3z" />
                  <path d="M12 8V22" />
                  <path d="M12 4c0-1.5-1-2-2-2s-2 1.5-2 3h4z" />
                  <path d="M12 4c0-1.5 1-2 2-2s2 1.5 2 3h-4z" />
                </svg>
                New member offer
              </div>

              <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#1a1a2e', lineHeight: 1.2, marginBottom: 6 }}>
                Your first month, on us.
              </div>
              <div style={{ fontSize: '0.84rem', color: '#374151', lineHeight: 1.6, marginBottom: 10 }}>
                Add a payment card after signup and get your first Meta lead within{' '}
                <strong style={{ color: '#1a1a2e' }}>7 days</strong> — we&apos;ll credit your entire first month free.
              </div>
              <div style={{ fontSize: '0.72rem', color: '#94a3b8', lineHeight: 1.5 }}>
                Card required to activate offer. Credit applied automatically to your first paid month. New accounts only.
              </div>

              {/* Corner ribbon accent */}
              <div style={{
                position: 'absolute', top: 0, right: 0,
                width: 0, height: 0,
                borderStyle: 'solid',
                borderWidth: '0 36px 36px 0',
                borderColor: `transparent #ffe500 transparent transparent`,
                borderRadius: '0 12px 0 0',
              }} />
            </div>

            {/* Form header */}
            <h2 style={{ fontSize: '1.55rem', fontWeight: 800, color: '#1a1a2e', marginBottom: 4 }}>
              Create your account
            </h2>
            <p style={{ fontSize: '0.88rem', color: '#64748b', marginBottom: 24 }}>
              Get set up in minutes — no credit card required to start.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#374151', marginBottom: 6 }}>
                  Business Name <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Smith Moving Co."
                  autoFocus
                  style={{
                    width: '100%', padding: '11px 14px', borderRadius: 9,
                    border: '1.5px solid #e2e8f0', fontSize: '0.95rem', outline: 'none',
                    boxSizing: 'border-box' as const, color: '#1a1a2e', fontFamily: 'inherit',
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
                    boxSizing: 'border-box' as const, color: '#1a1a2e', fontFamily: 'inherit',
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
                    boxSizing: 'border-box' as const, color: '#1a1a2e', fontFamily: 'inherit',
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
                  opacity: loading ? 0.6 : 1, letterSpacing: '0.01em', marginTop: 2,
                }}
              >
                {loading ? 'Creating account…' : 'Claim your free month →'}
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
