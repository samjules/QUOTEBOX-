'use client'

// Shared component used both in admin preview and the public /ad-preview/[id] page
export default function InstagramPhonePreview({
  pageName,
  pageAvatarUrl,
  adImageUrl,
  adHeadline,
  adBody,
  ctaLabel,
  destinationUrl,
  interactive = false,
}: {
  pageName: string
  pageAvatarUrl: string | null
  adImageUrl: string | null
  adHeadline: string
  adBody: string
  ctaLabel: string
  destinationUrl: string
  interactive?: boolean
}) {
  const avatarInitial = pageName.charAt(0).toUpperCase()

  return (
    // Phone outer shell
    <div style={{
      width: 320,
      height: 640,
      background: '#1a1a1a',
      borderRadius: 44,
      padding: '10px 6px',
      boxShadow: '0 0 0 1.5px #3a3a3a, 0 0 0 3px #222, 0 40px 80px rgba(0,0,0,0.7)',
      position: 'relative',
      flexShrink: 0,
    }}>
      {/* Side buttons */}
      <div style={{ position: 'absolute', left: -3, top: 100, width: 3, height: 32, background: '#333', borderRadius: '2px 0 0 2px' }} />
      <div style={{ position: 'absolute', left: -3, top: 144, width: 3, height: 54, background: '#333', borderRadius: '2px 0 0 2px' }} />
      <div style={{ position: 'absolute', left: -3, top: 210, width: 3, height: 54, background: '#333', borderRadius: '2px 0 0 2px' }} />
      <div style={{ position: 'absolute', right: -3, top: 160, width: 3, height: 64, background: '#333', borderRadius: '0 2px 2px 0' }} />

      {/* Screen */}
      <div style={{
        background: '#fff',
        borderRadius: 36,
        overflow: 'hidden',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
      }}>
        {/* Status bar */}
        <div style={{ background: '#fff', padding: '10px 20px 4px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#111' }}>9:41</span>
          <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
            <svg width="15" height="11" viewBox="0 0 15 11" fill="#111"><rect x="0" y="4" width="3" height="7" rx="0.5"/><rect x="4" y="2.5" width="3" height="8.5" rx="0.5"/><rect x="8" y="1" width="3" height="10" rx="0.5"/><rect x="12" y="0" width="3" height="11" rx="0.5" opacity="0.3"/></svg>
            <svg width="15" height="11" viewBox="0 0 20 14" fill="#111"><path d="M10 2.5C13.6 2.5 16.8 4 19 6.5L20 5.5C17.5 2.7 14 1 10 1S2.5 2.7 0 5.5l1 1C3.2 4 6.4 2.5 10 2.5z"/><path d="M10 5.5C12.6 5.5 14.9 6.7 16.5 8.5l1-1C15.7 5.5 13 4 10 4S4.3 5.5 2.5 6.5l1 1C5.1 6.7 7.4 5.5 10 5.5z"/><circle cx="10" cy="11" r="2"/></svg>
            <div style={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
              <div style={{ width: 22, height: 11, border: '1.5px solid #111', borderRadius: 3, display: 'flex', alignItems: 'center', padding: '1.5px', gap: 1 }}>
                <div style={{ flex: 1, height: '100%', background: '#111', borderRadius: 1.5 }} />
                <div style={{ width: 3, height: '100%', background: '#111', borderRadius: 1, opacity: 0.4 }} />
              </div>
            </div>
          </div>
        </div>

        {/* Instagram top nav */}
        <div style={{ background: '#fff', padding: '2px 16px 8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '0.5px solid #efefef', flexShrink: 0 }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#111" strokeWidth={1.8}><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
          <span style={{ fontFamily: '"Billabong", "Dancing Script", cursive, sans-serif', fontSize: 22, color: '#111', letterSpacing: '-0.5px', fontWeight: 400 }}>Instagram</span>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#111" strokeWidth={1.8}><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
        </div>

        {/* Feed — ad post only */}
        <div style={{ flex: 1, overflowY: 'auto', background: '#fff' }}>

          {/* ── THE AD POST ── */}
          <div style={{ background: '#fff' }}>
            {/* Ad header */}
            <div style={{ padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 9 }}>
              {pageAvatarUrl
                ? <img src={pageAvatarUrl} alt="" style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                : (
                  <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg, #5b5bd6, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <span style={{ fontSize: 13, fontWeight: 800, color: '#fff' }}>{avatarInitial}</span>
                  </div>
                )}
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12.5, fontWeight: 700, color: '#262626', lineHeight: 1.2 }}>{pageName}</div>
                <div style={{ fontSize: 10.5, color: '#8e8e8e', lineHeight: 1.2 }}>Sponsored · <span style={{ color: '#385185' }}>🌐</span></div>
              </div>
              <svg width="16" height="4" viewBox="0 0 16 4" fill="#262626"><circle cx="2" cy="2" r="2"/><circle cx="8" cy="2" r="2"/><circle cx="14" cy="2" r="2"/></svg>
            </div>

            {/* Ad body text */}
            {adBody && (
              <div style={{ padding: '0 12px 8px', fontSize: 12.5, color: '#262626', lineHeight: 1.5 }}>
                {adBody}
              </div>
            )}

            {/* Ad image */}
            <div style={{ width: '100%', aspectRatio: '1/1', background: 'linear-gradient(135deg, #1a1a2e, #16213e)', position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {adImageUrl
                ? <img src={adImageUrl} alt="Ad creative" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                : (
                  <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.4)' }}>
                    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.2} style={{ margin: '0 auto 8px', display: 'block' }}><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>
                    <span style={{ fontSize: 10 }}>Ad image will appear here</span>
                  </div>
                )
              }
            </div>

            {/* CTA strip */}
            <div style={{ padding: '10px 12px', borderTop: '0.5px solid #efefef', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 800, color: '#262626', lineHeight: 1.25, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{adHeadline || pageName}</div>
                <div style={{ fontSize: 10, color: '#8e8e8e' }}>quote-box.com</div>
              </div>
              <a
                href={interactive ? destinationUrl : undefined}
                target={interactive ? '_blank' : undefined}
                rel={interactive ? 'noreferrer' : undefined}
                onClick={interactive ? undefined : e => e.preventDefault()}
                style={{
                  padding: '8px 16px',
                  background: '#385185',
                  color: '#fff',
                  borderRadius: 6,
                  fontSize: 12,
                  fontWeight: 700,
                  textDecoration: 'none',
                  cursor: interactive ? 'pointer' : 'default',
                  flexShrink: 0,
                  display: 'block',
                }}
              >
                {ctaLabel}
              </a>
            </div>

            {/* Engagement row */}
            <div style={{ padding: '6px 12px 10px', display: 'flex', gap: 14, alignItems: 'center' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#262626" strokeWidth={1.6}><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#262626" strokeWidth={1.6}><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#262626" strokeWidth={1.6}><path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8M16 6l-4-4-4 4M12 2v13"/></svg>
              <div style={{ flex: 1 }} />
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#262626" strokeWidth={1.6}><path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"/></svg>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
