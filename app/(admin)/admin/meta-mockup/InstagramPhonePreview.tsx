'use client'

// Shared component used both in admin preview and the public /ad-preview/[id] page
export default function InstagramPhonePreview({
  pageName,
  pageAvatarUrl,
  adImageUrl,
  adBody,
  ctaLabel,
  destinationUrl,
  interactive = false,
}: {
  pageName: string
  pageAvatarUrl: string | null
  adImageUrl: string | null
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

        {/* Scrollable feed */}
        <div style={{ flex: 1, overflowY: 'auto', background: '#fafafa' }}>

          {/* Stories row */}
          <div style={{ background: '#fff', padding: '10px 12px', display: 'flex', gap: 12, overflowX: 'auto', borderBottom: '0.5px solid #efefef', scrollbarWidth: 'none' }}>
            {['You', 'sarah_m', 'jdev23', 'movers_co', 'cleanup'].map((name, i) => (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, flexShrink: 0 }}>
                <div style={{
                  width: 54, height: 54, borderRadius: '50%',
                  background: i === 0 ? '#f3f4f6' : 'linear-gradient(45deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888)',
                  padding: i === 0 ? 0 : 2.5, display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <div style={{ width: i === 0 ? 54 : 46, height: i === 0 ? 54 : 46, borderRadius: '50%', background: `hsl(${i * 60},50%,75%)`, border: i === 0 ? 'none' : '2px solid white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {i === 0
                      ? <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth={1.5}><path d="M12 13a4 4 0 100-8 4 4 0 000 8z"/><path d="M6 21v-1a6 6 0 0112 0v1"/></svg>
                      : <span style={{ fontSize: 10, fontWeight: 700, color: '#fff' }}>{name[0].toUpperCase()}</span>
                    }
                  </div>
                </div>
                <span style={{ fontSize: 9.5, color: '#262626', maxWidth: 54, textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</span>
              </div>
            ))}
          </div>

          {/* Generic post above the ad */}
          <div style={{ background: '#fff', marginBottom: 8 }}>
            <div style={{ padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'linear-gradient(135deg, #667eea, #764ba2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#fff' }}>A</span>
              </div>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#262626', flex: 1 }}>alexsmith_real</span>
              <svg width="16" height="4" viewBox="0 0 16 4" fill="#262626"><circle cx="2" cy="2" r="2"/><circle cx="8" cy="2" r="2"/><circle cx="14" cy="2" r="2"/></svg>
            </div>
            <div style={{ height: 130, background: 'linear-gradient(135deg, #e2e8f0, #cbd5e0)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.8)" strokeWidth={1.5}><path d="M3 9l4-4 4 4 4-4 4 4M3 15l4-4 4 4 4-4 4 4"/></svg>
              </div>
            </div>
            <div style={{ padding: '6px 12px 10px' }}>
              <div style={{ display: 'flex', gap: 12, marginBottom: 5 }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#262626" strokeWidth={1.6}><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#262626" strokeWidth={1.6}><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
              </div>
              <div style={{ height: 9, width: 120, background: '#f3f4f6', borderRadius: 4, marginBottom: 5 }} />
              <div style={{ height: 9, width: 180, background: '#f3f4f6', borderRadius: 4 }} />
            </div>
          </div>

          {/* ── THE AD POST ── */}
          <div style={{ background: '#fff', border: '0.5px solid #efefef', marginBottom: 8 }}>
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
            <div style={{ padding: '10px 12px', borderTop: '0.5px solid #efefef', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#262626' }}>{pageName}</div>
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

          {/* Generic post below */}
          <div style={{ background: '#fff' }}>
            <div style={{ padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'linear-gradient(135deg, #f093fb, #f5576c)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#fff' }}>T</span>
              </div>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#262626', flex: 1 }}>tasha.designs</span>
            </div>
            <div style={{ height: 100, background: 'linear-gradient(135deg, #ffecd2, #fcb69f)' }} />
            <div style={{ padding: '6px 12px 14px' }}>
              <div style={{ height: 9, width: 90, background: '#f3f4f6', borderRadius: 4, marginBottom: 5 }} />
              <div style={{ height: 9, width: 160, background: '#f3f4f6', borderRadius: 4 }} />
            </div>
          </div>
        </div>

        {/* Bottom nav */}
        <div style={{ background: '#fff', borderTop: '0.5px solid #efefef', padding: '8px 20px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="#262626"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#8e8e8e" strokeWidth={1.8}><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
          <div style={{ width: 22, height: 22, border: '2px solid #8e8e8e', borderRadius: 6 }} />
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#8e8e8e" strokeWidth={1.8}><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>
          <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#8e8e8e', overflow: 'hidden' }}>
            <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #667eea, #764ba2)' }} />
          </div>
        </div>
      </div>
    </div>
  )
}
