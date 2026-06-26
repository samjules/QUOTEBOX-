'use client'

import { useState, KeyboardEvent, Suspense } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '11px 14px', borderRadius: 9,
  border: '1.5px solid #e2e8f0', fontSize: '0.95rem', outline: 'none',
  boxSizing: 'border-box', color: '#0e0020', fontFamily: 'inherit',
}

function SignupForm() {
  const router = useRouter()
  const [step, setStep] = useState<'account' | 'phone'>('account')
  const [businessName, setBusinessName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [phone, setPhone] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [hype, setHype] = useState(false)

  async function handleAccountSubmit() {
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

    setLoading(false)
    setStep('phone')
  }

  async function handlePhoneSubmit() {
    setLoading(true)
    try {
      await fetch('/api/auth/welcome', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phone.trim() || null }),
      })
    } catch {
      // non-fatal — continue to onboarding regardless
    }
    setLoading(false)
    setHype(true)
    setTimeout(() => router.push('/onboarding'), 2200)
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      if (step === 'account') handleAccountSubmit()
      else handlePhoneSubmit()
    }
  }

  if (hype) {
    return (
      <div style={{
        minHeight: '100vh', background: '#0e0020',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '40px 24px', textAlign: 'center',
      }}>
        <style>{`
          @keyframes hype-in {
            from { opacity: 0; transform: translateY(18px); }
            to   { opacity: 1; transform: translateY(0); }
          }
          @keyframes hype-sub {
            from { opacity: 0; transform: translateY(12px); }
            to   { opacity: 1; transform: translateY(0); }
          }
          @keyframes hype-bar {
            from { width: 0; }
            to   { width: 100%; }
          }
        `}</style>

        <div style={{ marginBottom: 32, animation: 'hype-in 0.5s ease both' }}>
          <svg width="72" height="52" viewBox="0 0 36 26" fill="none" stroke="#ffe500" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="1" y="2" width="19" height="15" rx="2" />
            <path d="M20 6h7l6 7v7H20V6z" />
            <circle cx="7" cy="22" r="3" />
            <circle cx="27" cy="22" r="3" />
          </svg>
        </div>

        <div style={{
          fontSize: 'clamp(2rem, 6vw, 3.2rem)', fontWeight: 900,
          color: '#ffe500', lineHeight: 1.05, letterSpacing: '-0.03em',
          marginBottom: 16,
          animation: 'hype-in 0.55s 0.1s ease both',
        }}>
          Account created.
        </div>

        <div style={{
          fontSize: 'clamp(1rem, 3vw, 1.35rem)', fontWeight: 600,
          color: 'rgba(255,255,255,0.85)', lineHeight: 1.4,
          maxWidth: 420, marginBottom: 8,
          animation: 'hype-sub 0.55s 0.3s ease both',
        }}>
          Get your first moving lead this week.
        </div>
        <div style={{
          fontSize: '0.9rem', color: 'rgba(255,255,255,0.38)', lineHeight: 1.5,
          animation: 'hype-sub 0.55s 0.45s ease both',
        }}>
          Setting up your dashboard now…
        </div>

        <div style={{
          marginTop: 40, width: 200, height: 3,
          background: 'rgba(255,255,255,0.1)', borderRadius: 2, overflow: 'hidden',
          animation: 'hype-sub 0.3s 0.6s ease both',
        }}>
          <div style={{
            height: '100%', background: '#ffe500', borderRadius: 2,
            animation: 'hype-bar 2s 0.65s ease forwards',
            width: 0,
          }} />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex">
      {/* Left branding panel */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-center px-12 py-16" style={{ background: '#0e0020' }}>
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

          {step === 'account' ? (
            <>
              {/* Step indicator */}
              <div style={{ display: 'flex', gap: 6, marginBottom: 28 }}>
                <div style={{ height: 3, flex: 1, borderRadius: 2, background: '#0e0020' }} />
                <div style={{ height: 3, flex: 1, borderRadius: 2, background: '#e2e8f0' }} />
              </div>

              <h2 style={{ fontSize: '1.7rem', fontWeight: 800, color: '#0e0020', marginBottom: 6 }}>
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
                    placeholder="Smith Moving Co."
                    autoFocus
                    style={inputStyle}
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
                    style={inputStyle}
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
                    style={inputStyle}
                  />
                </div>

                {error && (
                  <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 14px' }}>
                    <p style={{ fontSize: '0.84rem', color: '#dc2626', margin: 0 }}>{error}</p>
                  </div>
                )}

                <button
                  onClick={handleAccountSubmit}
                  disabled={loading}
                  style={{
                    width: '100%', padding: '13px', borderRadius: 9, border: 'none',
                    background: '#0e0020', color: '#ffe500', fontSize: '0.95rem', fontWeight: 700,
                    cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
                    opacity: loading ? 0.6 : 1, letterSpacing: '0.01em', marginTop: 4,
                  }}
                >
                  {loading ? 'Creating account…' : 'Continue →'}
                </button>

                <p style={{ textAlign: 'center', fontSize: '0.84rem', color: '#94a3b8', margin: 0 }}>
                  Already have an account?{' '}
                  <Link href="/login" style={{ color: '#0e0020', fontWeight: 600, textDecoration: 'underline' }}>
                    Sign in
                  </Link>
                </p>
              </div>
            </>
          ) : (
            <>
              {/* Step indicator */}
              <div style={{ display: 'flex', gap: 6, marginBottom: 28 }}>
                <div style={{ height: 3, flex: 1, borderRadius: 2, background: '#0e0020' }} />
                <div style={{ height: 3, flex: 1, borderRadius: 2, background: '#0e0020' }} />
              </div>

              <h2 style={{ fontSize: '1.7rem', fontWeight: 800, color: '#0e0020', marginBottom: 6 }}>
                One more thing
              </h2>
              <p style={{ fontSize: '0.9rem', color: '#64748b', marginBottom: 32 }}>
                Add your phone number so we can send you lead alerts and updates via SMS.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#374151', marginBottom: 6 }}>
                    Phone number
                  </label>
                  <input
                    type="tel"
                    autoComplete="tel"
                    autoFocus
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="(555) 867-5309"
                    style={inputStyle}
                  />
                  <p style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: 6 }}>
                    Optional — you can add this later in settings.
                  </p>
                </div>

                <button
                  onClick={handlePhoneSubmit}
                  disabled={loading}
                  style={{
                    width: '100%', padding: '13px', borderRadius: 9, border: 'none',
                    background: '#0e0020', color: '#ffe500', fontSize: '0.95rem', fontWeight: 700,
                    cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
                    opacity: loading ? 0.6 : 1, letterSpacing: '0.01em',
                  }}
                >
                  {loading ? 'Finishing up…' : 'Finish setup →'}
                </button>

                <button
                  onClick={() => handlePhoneSubmit()}
                  disabled={loading}
                  style={{
                    width: '100%', padding: '11px', borderRadius: 9, border: '1.5px solid #e2e8f0',
                    background: 'transparent', color: '#64748b', fontSize: '0.88rem', fontWeight: 600,
                    cursor: 'pointer', fontFamily: 'inherit',
                  }}
                >
                  Skip for now
                </button>
              </div>
            </>
          )}
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
