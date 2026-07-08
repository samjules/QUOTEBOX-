'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

export default function ConfirmClient() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [error, setError] = useState('')

  useEffect(() => {
    const sessionId = searchParams.get('session_id')
    const accountId = searchParams.get('account_id')

    if (!sessionId || !accountId) {
      setError('Missing checkout details. If you completed payment, your dashboard should already work.')
      return
    }

    fetch('/api/build/verify-payment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, accountId }),
    })
      .then(async (res) => {
        const data = await res.json()
        if (!res.ok) {
          setError(data.error ?? 'We could not confirm your payment.')
          return
        }
        // Fires only here — after the server has actually verified the Stripe
        // payment — so this marks a real account creation, not just a page visit.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ;(window as any).fbq?.('track', 'CompleteRegistration')
        router.push('/dashboard?new=1')
      })
      .catch(() => setError('Network error confirming your payment.'))
  }, [searchParams, router])

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0e0b1a', color: '#f4f2fb', padding: 24 }}>
      <div style={{ textAlign: 'center', maxWidth: 420 }}>
        {!error ? (
          <>
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#34d399', color: '#fff', fontSize: 26, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px' }}>✓</div>
            <h1 style={{ fontSize: 24, margin: '0 0 8px' }}>You&apos;re in!</h1>
            <p style={{ color: '#a79fc7', fontSize: 14.5, margin: 0 }}>Redirecting you to your Quotebox dashboard…</p>
          </>
        ) : (
          <>
            <h1 style={{ fontSize: 22, margin: '0 0 10px' }}>Almost there</h1>
            <p style={{ color: '#a79fc7', fontSize: 14.5, margin: '0 0 20px', lineHeight: 1.5 }}>{error}</p>
            <a href="/dashboard" style={{ display: 'inline-block', background: '#5c51d6', color: '#fff', padding: '12px 24px', borderRadius: 10, fontWeight: 700, fontSize: 14.5, textDecoration: 'none' }}>
              Go to my dashboard →
            </a>
          </>
        )}
      </div>
    </div>
  )
}
