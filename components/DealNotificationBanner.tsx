'use client'

import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

interface DealNotification {
  id: string
  display_name: string
  amount: number
  created_at: string
}

export default function DealNotificationBanner({ position = 'bottom-left' }: { position?: 'bottom-left' | 'top' }) {
  const [notifications, setNotifications] = useState<DealNotification[]>([])
  const [current, setCurrent] = useState<DealNotification | null>(null)
  const [visible, setVisible] = useState(false)
  const indexRef = useRef(0)

  useEffect(() => {
    const supabase = createClient()
    supabase
      .from('deal_notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20)
      .then(({ data }) => {
        if (data && data.length > 0) setNotifications(data)
      })
  }, [])

  useEffect(() => {
    if (notifications.length === 0) return

    let hideTimer: ReturnType<typeof setTimeout>
    let nextTimer: ReturnType<typeof setTimeout>

    function showNext() {
      const notif = notifications[indexRef.current % notifications.length]
      indexRef.current += 1
      setCurrent(notif)
      setVisible(true)

      hideTimer = setTimeout(() => {
        setVisible(false)
        nextTimer = setTimeout(showNext, 2500)
      }, 5000)
    }

    // Initial delay before first notification
    const initialTimer = setTimeout(showNext, 3000)

    return () => {
      clearTimeout(initialTimer)
      clearTimeout(hideTimer)
      clearTimeout(nextTimer)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notifications])

  if (!current) return null

  return (
    <div
      style={
        position === 'top'
          ? {
              position: 'fixed',
              top: 20,
              left: '50%',
              transform: visible
                ? 'translateX(-50%) translateY(0) scale(1)'
                : 'translateX(-50%) translateY(-16px) scale(0.96)',
              zIndex: 1000,
              transition: 'opacity 0.35s ease, transform 0.45s cubic-bezier(0.34, 1.56, 0.64, 1)',
              opacity: visible ? 1 : 0,
              pointerEvents: visible ? 'auto' : 'none',
            }
          : {
              position: 'fixed',
              bottom: 28,
              left: 28,
              zIndex: 1000,
              transition: 'opacity 0.35s ease, transform 0.45s cubic-bezier(0.34, 1.56, 0.64, 1)',
              opacity: visible ? 1 : 0,
              transform: visible ? 'translateY(0) scale(1)' : 'translateY(16px) scale(0.96)',
              pointerEvents: visible ? 'auto' : 'none',
            }
      }
    >
      <div style={{
        background: 'white',
        borderRadius: 14,
        boxShadow: '0 8px 40px rgba(0,0,0,0.14)',
        padding: '14px 18px',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        maxWidth: 300,
        border: '1px solid rgba(0,0,0,0.07)',
      }}>
        <div style={{
          width: 40,
          height: 40,
          borderRadius: '50%',
          background: '#1a1a2e',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '1.1rem',
          flexShrink: 0,
        }}>
          🎉
        </div>
        <div>
          <div style={{ fontSize: '0.83rem', fontWeight: 700, color: '#1a1a2e', lineHeight: 1.3 }}>
            {current.display_name}
          </div>
          <div style={{ fontSize: '0.78rem', color: '#6b7280', marginTop: 3, lineHeight: 1.4 }}>
            Just closed a{' '}
            <span style={{ color: '#16a34a', fontWeight: 700 }}>
              ${current.amount.toLocaleString()}
            </span>{' '}
            deal
          </div>
        </div>
      </div>
    </div>
  )
}
