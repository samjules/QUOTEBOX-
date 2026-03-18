'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function ImpersonationBanner() {
  const searchParams = useSearchParams()
  const [isImpersonating, setIsImpersonating] = useState(false)
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
    sessionStorage.removeItem('admin_impersonating')
    const supabase = createClient()
    await supabase.auth.signOut()
    try { window.close() } catch {}
    window.location.href = '/login'
  }

  if (!isImpersonating) return null

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
    </div>
  )
}
