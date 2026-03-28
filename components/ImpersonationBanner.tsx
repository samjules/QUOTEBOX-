'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function ImpersonationBanner() {
  const searchParams = useSearchParams()
  const [isImpersonating, setIsImpersonating] = useState(false)
  const [dismissed, setDismissed] = useState(false)
  const [exiting, setExiting] = useState(false)

  useEffect(() => {
    if (searchParams.get('impersonating') === '1') {
      sessionStorage.setItem('admin_impersonating', '1')
    }
    if (sessionStorage.getItem('admin_impersonating') === '1') {
      setIsImpersonating(true)
    }
  }, [searchParams])

  async function handleExit() {
    setExiting(true)
    const supabase = createClient()
    const savedSession = localStorage.getItem('admin_session')
    if (savedSession) {
      // Same-tab impersonation: restore admin session and go back to /admin
      try {
        const { access_token, refresh_token } = JSON.parse(savedSession)
        await supabase.auth.setSession({ access_token, refresh_token })
      } catch { /* fallback below */ }
      localStorage.removeItem('admin_session')
      sessionStorage.removeItem('admin_impersonating')
      window.location.href = '/admin'
      return
    }
    // New-tab impersonation: sign out and close
    sessionStorage.removeItem('admin_impersonating')
    await supabase.auth.signOut()
    try { window.close() } catch {}
    window.location.href = '/login'
  }

  if (!isImpersonating || dismissed) return null

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 9999,
      background: '#f59e0b',
      color: '#1a1a2e',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 16,
      padding: '8px 20px',
      fontSize: '0.82rem',
      fontWeight: 600,
      boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
    }}>
      <span>&#9888; Admin view &mdash; you are browsing as this user</span>
      <button
        onClick={handleExit}
        disabled={exiting}
        style={{
          padding: '4px 14px',
          fontSize: '0.78rem',
          fontWeight: 700,
          borderRadius: 6,
          border: '2px solid #1a1a2e',
          background: '#1a1a2e',
          color: '#FFE500',
          cursor: 'pointer',
          opacity: exiting ? 0.6 : 1,
        }}
      >
        {exiting ? 'Exiting...' : 'Exit Admin View'}
      </button>
      <button
        onClick={() => setDismissed(true)}
        aria-label="Dismiss banner"
        style={{
          position: 'absolute',
          right: 12,
          top: '50%',
          transform: 'translateY(-50%)',
          background: 'none',
          border: 'none',
          color: '#1a1a2e',
          fontSize: '1.1rem',
          cursor: 'pointer',
          padding: '2px 6px',
          lineHeight: 1,
          opacity: 0.7,
        }}
      >
        ✕
      </button>
    </div>
  )
}
