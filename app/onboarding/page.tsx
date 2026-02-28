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

// Spinner SVG
function Spinner() {
  return (
    <svg
      style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: 8, animation: 'spin 0.8s linear infinite' }}
      width="18" height="18" viewBox="0 0 24 24" fill="none"
    >
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="31.4" strokeDashoffset="10" strokeLinecap="round" />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </svg>
  )
}

// Field type badge
function FieldBadge({ type }: { type: string }) {
  const colors: Record<string, { bg: string; text: string }> = {
    radio:    { bg: '#eff6ff', text: '#2563eb' },
    dropdown: { bg: '#f0fdf4', text: '#16a34a' },
    checkbox: { bg: '#fdf4ff', text: '#9333ea' },
    number:   { bg: '#fff7ed', text: '#ea580c' },
    textarea: { bg: '#f8fafc', text: '#475569' },
    route:    { bg: '#fef9c3', text: '#854d0e' },
    image:    { bg: '#fff1f2', text: '#be123c' },
  }
  const c = colors[type] || { bg: '#f1f5f9', text: '#475569' }
  return (
    <span style={{
      display: 'inline-block',
      padding: '2px 8px',
      borderRadius: 6,
      fontSize: '0.72rem',
      fontWeight: 600,
      letterSpacing: '0.03em',
      textTransform: 'uppercase' as const,
      background: c.bg,
      color: c.text,
    }}>
      {type}
    </span>
  )
}

export default function OnboardingPage() {
  const supabase = createClient()
  const router = useRouter()

  // Steps: 0=company, 1=phone, 2=AI form gen, 3=done
  const [step, setStep] = useState<0 | 1 | 2 | 3>(0)
  const [accountId, setAccountId] = useState('')
  const [authEmail, setAuthEmail] = useState('')
  const [businessName, setBusinessName] = useState('')
  const [phone, setPhone] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  // AI form gen state
  const [businessDescription, setBusinessDescription] = useState('')
  const [generating, setGenerating] = useState(false)
  const [generatedFormId, setGeneratedFormId] = useState('')
  const [generatedFormName, setGeneratedFormName] = useState('')
  const [generatedFields, setGeneratedFields] = useState<Array<{ type: string; label: string }>>([])

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

    const { error: nameErr } = await supabase
      .from('accounts')
      .update({ business_name: businessName.trim() })
      .eq('id', accountId)

    if (nameErr) {
      setError(nameErr.message)
      setSaving(false)
      return
    }

    if (phone.trim()) {
      await supabase
        .from('accounts')
        .update({ phone: phone.trim() } as Record<string, string>)
        .eq('id', accountId)
    }

    setSaving(false)
    setStep(2)
  }

  async function handleGenerateForm() {
    if (!businessDescription.trim()) {
      setError('Please describe your business')
      return
    }
    setError('')
    setGenerating(true)

    try {
      const res = await fetch('/api/onboarding/generate-form', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessDescription: businessDescription.trim(),
          businessName: businessName.trim(),
          accountId,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Failed to generate form')
        setGenerating(false)
        return
      }

      setGeneratedFormId(data.formId)
      setGeneratedFormName(data.formName)
      // Extract a summary of the generated fields to show the user
      const fields = data.formConfig?.fields ?? []
      setGeneratedFields(fields.map((f: { type: string; label: string }) => ({ type: f.type, label: f.label })))
      setStep(3)
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setGenerating(false)
    }
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f7f6f3' }}>
        <div style={{ fontSize: '0.9rem', color: '#94a3b8' }}>Loading…</div>
      </div>
    )
  }

  const totalSteps = 3
  const progressPct = step === 0 ? 33 : step === 1 ? 66 : step === 2 ? 100 : 100

  const stepTitles = [
    'Welcome to Quote Box!',
    'Your contact details',
    'Build your first form with AI',
    "You're all set!",
  ]
  const stepSubtitles = [
    "Let's confirm your company info so clients know who they're getting a quote from.",
    'Add a phone number so leads know how to reach you.',
    `Tell us what ${businessName} does and our AI will build a ready-to-use quote form for you.`,
    `${businessName} is ready. Your AI-generated form is live and ready to capture leads.`,
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
        maxWidth: step === 2 ? 540 : 480,
        background: 'white',
        borderRadius: 20,
        boxShadow: '0 8px 40px rgba(0,0,0,0.10)',
        overflow: 'hidden',
        transition: 'max-width 0.3s ease',
      }}>
        {/* Header */}
        <div style={{ background: '#ffe500', padding: '28px 32px 24px' }}>
          <div style={{ fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' as const, color: 'rgba(26,26,46,0.5)', marginBottom: 10 }}>
            {step < 3 ? `Step ${step + 1} of ${totalSteps}` : 'Complete'}
          </div>
          {step < 3 && (
            <div style={{ height: 4, background: 'rgba(26,26,46,0.12)', borderRadius: 2, marginBottom: 20, overflow: 'hidden' }}>
              <div style={{
                height: '100%',
                background: '#1a1a2e',
                borderRadius: 2,
                width: `${progressPct}%`,
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
                {saving ? 'Saving…' : 'Continue →'}
              </button>

              <button
                style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '0.82rem', cursor: 'pointer', padding: 0, fontFamily: 'inherit', alignSelf: 'flex-start' }}
                onClick={() => setStep(0)}
              >
                ← Back
              </button>
            </>
          )}

          {/* ── Step 2: AI Form Generator ── */}
          {step === 2 && (
            <>
              {/* AI badge */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '10px 14px',
                background: 'linear-gradient(135deg, #f0f4ff 0%, #faf5ff 100%)',
                borderRadius: 10,
                border: '1px solid #e0e7ff',
              }}>
                <span style={{ fontSize: '1.1rem' }}>✦</span>
                <span style={{ fontSize: '0.8rem', color: '#4338ca', fontWeight: 600 }}>
                  Powered by Claude AI — your form will be ready in seconds
                </span>
              </div>

              <div>
                <label style={labelStyle}>Describe your business and services *</label>
                <textarea
                  value={businessDescription}
                  onChange={(e) => { setBusinessDescription(e.target.value); setError('') }}
                  placeholder={`e.g. "We're a residential cleaning company. We offer standard cleans, deep cleans, and move-in/out cleans. We also offer add-ons like oven cleaning and laundry."`}
                  autoFocus
                  rows={5}
                  style={{
                    ...inputStyle,
                    resize: 'vertical',
                    lineHeight: 1.55,
                    minHeight: 110,
                  }}
                />
                <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: 5 }}>
                  The more detail you give, the better the form. Include services, pricing tiers, add-ons, or anything customers typically ask about.
                </div>
              </div>

              {error && (
                <div style={{ fontSize: '0.84rem', color: '#ef4444', fontWeight: 500 }}>{error}</div>
              )}

              <button
                style={{
                  ...primaryBtn,
                  opacity: generating ? 0.7 : 1,
                  cursor: generating ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                disabled={generating}
                onClick={handleGenerateForm}
              >
                {generating ? (
                  <><Spinner />Generating your form…</>
                ) : (
                  '✦ Generate My Form'
                )}
              </button>

              <button
                style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '0.82rem', cursor: 'pointer', padding: 0, fontFamily: 'inherit', alignSelf: 'center' }}
                onClick={() => setStep(3)}
              >
                Skip, I'll build it manually →
              </button>

              <button
                style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '0.82rem', cursor: 'pointer', padding: 0, fontFamily: 'inherit', alignSelf: 'flex-start' }}
                onClick={() => setStep(1)}
              >
                ← Back
              </button>
            </>
          )}

          {/* ── Step 3: Done ── */}
          {step === 3 && (
            <div style={{ textAlign: 'center', padding: '8px 0' }}>
              <div style={{
                width: 64, height: 64, borderRadius: '50%',
                background: '#f0fdf4', border: '2px solid #86efac',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 18px', fontSize: '1.6rem', color: '#16a34a',
              }}>
                ✓
              </div>

              {generatedFormId ? (
                <>
                  {/* Show generated field summary */}
                  {generatedFields.length > 0 && (
                    <div style={{ textAlign: 'left', marginBottom: 22 }}>
                      <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' as const, letterSpacing: '0.06em', marginBottom: 10 }}>
                        AI generated {generatedFields.length} fields:
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                        {generatedFields.map((f, i) => (
                          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', background: '#f8fafc', borderRadius: 8 }}>
                            <FieldBadge type={f.type} />
                            <span style={{ fontSize: '0.85rem', color: '#1a1a2e', fontWeight: 500 }}>{f.label}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  <div style={{ fontSize: '0.9rem', color: '#64748b', lineHeight: 1.65, marginBottom: 24 }}>
                    Your AI-generated form is live. Open the form builder to preview it, tweak pricing, or add more fields.
                  </div>
                  <button
                    style={{ ...primaryBtn, marginBottom: 12 }}
                    onClick={() => router.push(`/form-builder?id=${generatedFormId}`)}
                  >
                    Open in Form Builder →
                  </button>
                </>
              ) : (
                <>
                  <div style={{ fontSize: '0.9rem', color: '#64748b', lineHeight: 1.65, marginBottom: 28 }}>
                    Your account is live. Create your first quote form to start capturing leads from your website.
                  </div>
                  <button
                    style={{ ...primaryBtn, marginBottom: 12 }}
                    onClick={() => router.push('/form-builder')}
                  >
                    Build my first form →
                  </button>
                </>
              )}

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
