'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

const btn: React.CSSProperties = {
  width: '100%', padding: '14px', borderRadius: 10, border: 'none', background: '#0e0020',
  color: '#ffe500', fontSize: '1rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
}

interface Props {
  token: string
  businessName: string
  initialSessionId: string | null
}

export default function PaymentStep({ token, businessName, initialSessionId }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [confirming, setConfirming] = useState(!!initialSessionId)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!initialSessionId) return
    async function confirm() {
      const res = await fetch(`/api/onboarding/${token}/confirm-payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: initialSessionId }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'We could not confirm your payment. Please try again.')
        setConfirming(false)
        return
      }
      router.refresh()
    }
    confirm()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialSessionId])

  async function startCheckout() {
    setError(null)
    setLoading(true)
    try {
      const res = await fetch(`/api/onboarding/${token}/create-checkout`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Could not start checkout'); setLoading(false); return }
      if (data.alreadyPaid) { router.refresh(); return }
      window.location.href = data.url
    } catch {
      setError('Something went wrong — please try again')
      setLoading(false)
    }
  }

  if (confirming) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f7f6f3' }}>
        <div style={{ textAlign: 'center', color: '#64748b' }}>
          <div style={{ fontSize: '1.4rem', marginBottom: 10 }}>⏳</div>
          Confirming your payment…
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f7f6f3', padding: '40px 20px' }}>
      <div style={{ width: '100%', maxWidth: 420, background: 'white', borderRadius: 20, padding: '36px 32px', boxShadow: '0 8px 40px rgba(0,0,0,0.08)' }}>
        <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
          Step 2 of 3
        </div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0e0020', margin: '0 0 6px' }}>
          Activate Your Account
        </h2>
        <p style={{ fontSize: '0.88rem', color: '#64748b', margin: '0 0 24px' }}>
          {businessName ? `${businessName} — ` : ''}subscribe to unlock your quote form and start receiving leads.
        </p>

        <div style={{ background: '#f8fafc', borderRadius: 14, padding: '20px 22px', marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
            <span style={{ fontSize: '2rem', fontWeight: 800, color: '#0e0020' }}>$750</span>
            <span style={{ fontSize: '0.9rem', color: '#94a3b8', fontWeight: 600 }}>/ month</span>
          </div>
          <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: 6 }}>Monthly retainer · cancel anytime</div>
        </div>

        {error && (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 14px', marginBottom: 16 }}>
            <p style={{ fontSize: '0.84rem', color: '#dc2626', margin: 0 }}>{error}</p>
          </div>
        )}

        <button onClick={startCheckout} disabled={loading} style={{ ...btn, opacity: loading ? 0.6 : 1 }}>
          {loading ? 'Redirecting to Stripe…' : 'Subscribe with Stripe →'}
        </button>
      </div>
    </div>
  )
}
