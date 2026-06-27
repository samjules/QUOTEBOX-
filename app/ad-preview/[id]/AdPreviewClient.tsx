'use client'

import { useState } from 'react'
import InstagramPhonePreview from '@/app/(admin)/admin/meta-mockup/InstagramPhonePreview'

type Mockup = {
  id: string
  page_name: string
  page_avatar_url: string | null
  ad_image_url: string | null
  ad_body: string
  cta_label: string
  target_form_slug: string
}

const SITE = 'https://quote-box.com'

export default function AdPreviewClient({ mockup }: { mockup: Mockup }) {
  const [launched, setLaunched] = useState(false)
  const destinationUrl = `${SITE}/${mockup.target_form_slug}`

  if (launched) {
    // Navigate to the actual form
    window.location.href = destinationUrl
    return (
      <div style={{ minHeight: '100vh', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: '#fff', fontSize: '0.9rem', opacity: 0.6 }}>Loading your quote form…</div>
      </div>
    )
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(160deg, #0f0f1a 0%, #1a1030 50%, #0f0f1a 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px 16px 48px',
      gap: 20,
    }}>
      {/* Label */}
      <div style={{ textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 99, padding: '6px 16px' }}>
          <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 6px #22c55e' }} />
          <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            Ad Funnel Preview
          </span>
        </div>
        <div style={{ marginTop: 12, fontSize: '0.85rem', color: 'rgba(255,255,255,0.35)', lineHeight: 1.5 }}>
          This is how your ad funnel will look on Instagram.
          <br />Tap the button to experience it like a customer would.
        </div>
      </div>

      {/* Phone preview — interactive on the public page */}
      <div onClick={() => setLaunched(true)} style={{ cursor: 'pointer' }}>
        <InstagramPhonePreview
          pageName={mockup.page_name}
          pageAvatarUrl={mockup.page_avatar_url}
          adImageUrl={mockup.ad_image_url}
          adBody={mockup.ad_body}
          ctaLabel={mockup.cta_label}
          destinationUrl={destinationUrl}
          interactive={true}
        />
      </div>

      {/* Tap hint */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'rgba(255,255,255,0.3)', fontSize: '0.75rem' }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 11V6a2 2 0 00-2-2v0a2 2 0 00-2 2v0M14 10V5a2 2 0 00-2-2v0a2 2 0 00-2 2v0M10 10V6a2 2 0 00-2-2v0a2 2 0 00-2 2v3"/>
          <path d="M6 16a6 6 0 0012 0v-4H6v4z"/>
        </svg>
        Tap the ad to experience the full funnel
      </div>

      {/* Powered by */}
      <div style={{ position: 'fixed', bottom: 16, right: 16 }}>
        <a href="https://quote-box.com" target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 6, textDecoration: 'none', opacity: 0.4 }}>
          <img src="/quotebox_icon.png" alt="" style={{ width: 18, height: 18, borderRadius: 4 }} />
          <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#fff', letterSpacing: '0.05em' }}>QuoteBox</span>
        </a>
      </div>
    </div>
  )
}
