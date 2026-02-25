'use client'

// MIGRATION REQUIRED — run once in the Supabase SQL editor before phone saving works:
//   ALTER TABLE accounts ADD COLUMN IF NOT EXISTS phone TEXT;

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '12px 14px',
  borderRadius: 10,
  border: '1.5px solid #e5e4e0',
  fontSize: '0.95rem',
  outline: 'none',
  boxSizing: 'border-box',
  fontFamily: 'inherit',
  color: '#1a1a2e',
  background: 'white',
}

const primaryBtn: React.CSSProperties = {
  width: '100%',
  padding: '14px',
  borderRadius: 10,
  border: 'none',
  background: '#1a1a2e',
  color: '#ffe500',
  fontSize: '1rem',
  fontWeight: 700,
  cursor: 'pointer',
  fontFamily: 'inherit',
  letterSpacing: '0.01em',
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '0.85rem',
  fontWeight: 600,
  color: '#334155',
  marginBottom: 8,
}

export default function OnboardingPage() {
  const supabase = createClient()
  const router = useRouter()

  const [step, setStep] = useState<0 | 1 | 2>(0)
  const [accountId, setAccountId] = useState('')
  const [authEmail, setAuthEmail] = useState('')
  const [businessName, setBusinessName] = useState('')
  const [phone, setPhone] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.replace('/login'); return }

      setAuthEmail(user.email ?? '')

      const { data: account } = await supabase
        .from('accounts')
        .select('id, business_name')
        .eq('owner_id', user.id)
        .single()

      if (!account) { router.replace('/dashboard'); return }

      setAccountId(account.id)
      setBusinessName(account.business_name ?? '')
      setLoading(false)
    }
    init()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function goToStep1() {
    if (!businessName.trim()) {
      setError('Please enter your company name')
      return
    }
    setError('')
    setStep(1)
  }

  async function handleFinish() {
    setSaving(true)
    setError('')

    // Always update business_name
    const { error: nameErr } = await supabase
      .from('accounts')
      .update({ business_name: businessName.trim() })
      .eq('id', accountId)

    if (nameErr) {
      setError(nameErr.message)
      setSaving(false)
      return
    }

    // Save phone if provided (requires `phone` column — see migration note at top)
    if (phone.trim()) {
      await supabase
        .from('accounts')
        .update({ phone: phone.trim() } as Record<string, string>)
        .eq('id', accountId)
      // Ignore error if column doesn't exist yet
    }

    setSaving(false)
    setStep(2)
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f7f6f3' }}>
        <div style={{ fontSize: '0.9rem', color: '#94a3b8' }}>Loading…</div>
      </div>
    )
  }

  const stepTitles = [
    "Welcome to Quote Box!",
    "Your contact details",
    "You're all set!",
  ]
  const stepSubtitles = [
    "Let's confirm your company info so clients know who they're getting a quote from.",
    "Add a phone number so leads know how to reach you.",
    `${businessName} is ready. Build your first instant quote form and start capturing leads.`,
  ]

  return (
    <div style={{
      minHeight: '100vh',
      background: '#f7f6f3',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 16px',
    }}>
      <div style={{
        width: '100%',
        maxWidth: 480,
        background: 'white',
        borderRadius: 20,
        boxShadow: '0 8px 40px rgba(0,0,0,0.10)',
        overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{ background: '#ffe500', padding: '28px 32px 24px' }}>
          <div style={{ fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' as const, color: 'rgba(26,26,46,0.5)', marginBottom: 10 }}>
            {step < 2 ? `Step ${step + 1} of 2` : 'Complete'}
          </div>
          {/* Progress bar */}
          {step < 2 && (
            <div style={{ height: 4, background: 'rgba(26,26,46,0.12)', borderRadius: 2, marginBottom: 20, overflow: 'hidden' }}>
              <div style={{
                height: '100%',
                background: '#1a1a2e',
                borderRadius: 2,
                width: step === 0 ? '50%' : '100%',
                transition: 'width 0.35s ease',
              }} />
            </div>
          )}
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1a1a2e', lineHeight: 1.2, marginBottom: 8 }}>
            {stepTitles[step]}
          </div>
          <div style={{ fontSize: '0.88rem', color: 'rgba(26,26,46,0.6)', lineHeight: 1.55 }}>
            {stepSubtitles[step]}
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: '28px 32px 32px', display: 'flex', flexDirection: 'column', gap: 18 }}>

          {/* ── Step 0: Company name ── */}
          {step === 0 && (
            <>
              <div>
                <label style={labelStyle}>Company Name *</label>
                <input
                  type="text"
                  value={businessName}
                  onChange={(e) => { setBusinessName(e.target.value); setError('') }}
                  placeholder="e.g. Acme Cleaning Co."
                  autoFocus
                  style={inputStyle}
                  onKeyDown={(e) => { if (e.key === 'Enter') goToStep1() }}
                />
              </div>

              <div>
                <label style={labelStyle}>Login Email</label>
                <input
                  type="email"
                  value={authEmail}
                  readOnly
                  style={{ ...inputStyle, background: '#f8fafc', color: '#64748b' }}
                />
                <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: 5 }}>
                  Your account email — used to log in
                </div>
              </div>

              {error && (
                <div style={{ fontSize: '0.84rem', color: '#ef4444', fontWeight: 500 }}>{error}</div>
              )}

              <button style={primaryBtn} onClick={goToStep1}>
                Continue →
              </button>
            </>
          )}

          {/* ── Step 1: Phone ── */}
          {step === 1 && (
            <>
              <div>
                <label style={labelStyle}>
                  Phone Number{' '}
                  <span style={{ fontWeight: 400, color: '#94a3b8' }}>(optional)</span>
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1 555 000 0000"
                  autoFocus
                  style={inputStyle}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleFinish() }}
                />
              </div>

              {error && (
                <div style={{ fontSize: '0.84rem', color: '#ef4444', fontWeight: 500 }}>{error}</div>
              )}

              <button
                style={{ ...primaryBtn, opacity: saving ? 0.6 : 1, cursor: saving ? 'not-allowed' : 'pointer' }}
                disabled={saving}
                onClick={handleFinish}
              >
                {saving ? 'Saving…' : 'Finish Setup'}
              </button>

              <button
                style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '0.82rem', cursor: 'pointer', padding: 0, fontFamily: 'inherit', alignSelf: 'flex-start' }}
                onClick={() => setStep(0)}
              >
                ← Back
              </button>
            </>
          )}

          {/* ── Step 2: Done ── */}
          {step === 2 && (
            <div style={{ textAlign: 'center', padding: '8px 0' }}>
              <div style={{
                width: 64, height: 64, borderRadius: '50%',
                background: '#f0fdf4', border: '2px solid #86efac',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 18px', fontSize: '1.6rem', color: '#16a34a',
              }}>
                ✓
              </div>
              <div style={{ fontSize: '0.9rem', color: '#64748b', lineHeight: 1.65, marginBottom: 28 }}>
                Your account is live. Create your first quote form to start capturing leads from your website.
              </div>
              <button
                style={{ ...primaryBtn, marginBottom: 12 }}
                onClick={() => router.push('/form-builder')}
              >
                Build my first form →
              </button>
              <button
                style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '0.82rem', cursor: 'pointer', padding: 0, fontFamily: 'inherit' }}
                onClick={() => router.push('/dashboard')}
              >
                Go to dashboard
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
