'use client'

import { useState } from 'react'

interface Props {
  token: string
  metaConnected: boolean
  onNext: () => void
  onSkip: () => void
  onBack: () => void
  saving: boolean
}

export default function StepMeta({ token, metaConnected, onNext, onSkip, onBack, saving }: Props) {
  const [redirecting, setRedirecting] = useState(false)

  function handleConnect() {
    setRedirecting(true)
    window.location.href = `/api/meta/connect?token=${encodeURIComponent(token)}`
  }

  if (metaConnected) {
    return (
      <div>
        <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#1e293b', marginBottom: 6 }}>
          Facebook Connected
        </h2>
        <p style={{ color: '#64748b', fontSize: '0.88rem', lineHeight: 1.6, marginBottom: 24 }}>
          Your Facebook account is connected. We&apos;ll use this to run ads and track leads for you.
        </p>

        <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 12, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
          <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', flexShrink: 0 }}>
            ✓
          </div>
          <div>
            <div style={{ fontWeight: 700, color: '#16a34a', fontSize: '0.88rem' }}>Facebook Connected</div>
            <div style={{ fontSize: '0.78rem', color: '#64748b' }}>Your ad account is linked and ready to go</div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button
            type="button"
            onClick={onBack}
            style={{ flex: '0 0 auto', padding: '14px 24px', borderRadius: 10, border: '1px solid #e2e8f0', background: 'white', color: '#475569', fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
          >
            ← Back
          </button>
          <button
            type="button"
            onClick={onNext}
            disabled={saving}
            style={{ flex: 1, padding: '14px', borderRadius: 10, border: 'none', background: '#0e0020', color: '#ffe500', fontSize: '0.95rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', opacity: saving ? 0.6 : 1 }}
          >
            {saving ? 'Saving…' : 'Continue →'}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div>
      <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#1e293b', marginBottom: 6 }}>
        Connect Facebook
      </h2>
      <p style={{ color: '#64748b', fontSize: '0.88rem', lineHeight: 1.6, marginBottom: 24 }}>
        Connect your Facebook account so we can run targeted ads and send leads directly to your quote form. This is optional — you can always set it up later.
      </p>

      <div style={{ background: '#f8fafc', borderRadius: 12, padding: '20px', marginBottom: 24 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[
            ['Run targeted local ads', 'We\u2019ll create and manage Facebook ads to drive customers to your quote form.'],
            ['Track conversions', 'See exactly which ads are generating leads and revenue.'],
            ['Automatic optimization', 'We continuously optimize your campaigns for the best cost per lead.'],
          ].map(([title, desc]) => (
            <div key={title} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <div style={{ width: 24, height: 24, borderRadius: 6, background: '#e0e7ff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                <svg width="14" height="14" fill="none" stroke="#4f46e5" viewBox="0 0 24 24" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M5 13l4 4L19 7" /></svg>
              </div>
              <div>
                <div style={{ fontWeight: 600, color: '#1e293b', fontSize: '0.85rem' }}>{title}</div>
                <div style={{ fontSize: '0.78rem', color: '#64748b', lineHeight: 1.5 }}>{desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <button
        type="button"
        onClick={handleConnect}
        disabled={redirecting}
        style={{ width: '100%', padding: '14px', borderRadius: 10, border: 'none', background: '#1877F2', color: 'white', fontSize: '0.95rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, opacity: redirecting ? 0.6 : 1, marginBottom: 12 }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="white"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
        {redirecting ? 'Redirecting to Facebook…' : 'Connect Facebook'}
      </button>

      <div style={{ display: 'flex', gap: 10 }}>
        <button
          type="button"
          onClick={onBack}
          style={{ flex: '0 0 auto', padding: '14px 24px', borderRadius: 10, border: '1px solid #e2e8f0', background: 'white', color: '#475569', fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
        >
          ← Back
        </button>
        <button
          type="button"
          onClick={onSkip}
          disabled={saving}
          style={{ flex: 1, padding: '14px', borderRadius: 10, border: '1px solid #e2e8f0', background: 'white', color: '#64748b', fontSize: '0.88rem', fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}
        >
          {saving ? 'Saving…' : 'Skip — I\'ll set this up later'}
        </button>
      </div>
    </div>
  )
}
