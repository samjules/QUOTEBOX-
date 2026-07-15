import Link from 'next/link'

const tradeLinks = [
  { label: 'Moving & Junk Removal Leads', href: '/contractor-leads' },
  { label: 'Moving Company Leads', href: '/electrician-leads' },
  { label: 'Junk Removal Leads', href: '/hvac-leads' },
  { label: 'Local Moving Leads', href: '/plumbing-leads' },
  { label: 'Estate Cleanout Leads', href: '/roofing-leads' },
]

const compareLinks = [
  { label: 'vs Thumbtack', href: '/vs-thumbtack' },
  { label: 'vs Angi Leads', href: '/vs-angies-list' },
]

const companyLinks = [
  { label: 'Home', href: '/' },
  { label: 'Pricing', href: '/pricing' },
  { label: 'Done for You', href: '/agency' },
  { label: 'Moving Management', href: '/moving-management' },
  { label: 'Log in', href: '/login' },
  { label: 'Sign up', href: '/signup' },
  { label: 'Privacy Policy', href: '/privacy' },
  { label: 'Terms of Service', href: '/terms' },
]

const colTitle: React.CSSProperties = {
  fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.1em',
  textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', marginBottom: 16,
}

const linkStyle: React.CSSProperties = {
  fontSize: '0.86rem', color: 'rgba(255,255,255,0.65)', textDecoration: 'none', display: 'block',
}

export default function PublicFooter() {
  return (
    <footer className="maze-dark" style={{ background: '#201d3d', color: 'white', padding: '60px 32px 32px' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '48px 32px',
          marginBottom: 48,
        }}>

          {/* Brand */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 4 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/quotebox_icon.png" alt="QuoteBox" style={{ width: 26, height: 26, borderRadius: 6, objectFit: 'cover', display: 'block' }} />
              <div style={{ fontFamily: "'Nautic', sans-serif", fontSize: '1.4rem', fontWeight: 700 }}>
                Quote<span style={{ color: '#f4a93c' }}>.</span>Box
              </div>
            </div>
            <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.35)', marginBottom: 12, letterSpacing: '0.03em' }}>
              A product of Arctic Reach LLC
            </div>
            <p style={{ fontSize: '0.83rem', color: 'rgba(255,255,255,0.5)', lineHeight: 1.7, maxWidth: 220, margin: 0 }}>
              Instant quote forms, CRM, and mobile app for moving, junk removal, pressure washing, and auto detailing businesses. Plans from $99/mo.
            </p>
          </div>

          {/* Leads by Service */}
          <div>
            <div style={colTitle}>Leads by Service</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {tradeLinks.map(({ label, href }) => (
                <Link key={href} href={href} style={linkStyle}>{label}</Link>
              ))}
            </div>
          </div>

          {/* Compare */}
          <div>
            <div style={colTitle}>Compare</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {compareLinks.map(({ label, href }) => (
                <Link key={href} href={href} style={linkStyle}>{label}</Link>
              ))}
            </div>
            <div style={{ ...colTitle, marginTop: 28 }}>Resources</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <Link href="/contractor-leads#faq" style={linkStyle}>Moving & Junk Removal FAQ</Link>
              <Link href="/vs-thumbtack#compare" style={linkStyle}>Thumbtack vs Quotebox</Link>
              <Link href="/vs-angies-list#compare" style={linkStyle}>Angi vs Quotebox</Link>
            </div>
          </div>

          {/* Company */}
          <div>
            <div style={colTitle}>Company</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {companyLinks.map(({ label, href }) => (
                <Link key={href} href={href} style={linkStyle}>{label}</Link>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div style={{
          borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 24,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexWrap: 'wrap', gap: 12,
        }}>
          <span style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.35)' }}>
            © 2026 Arctic Reach LLC. Quotebox is a product of Arctic Reach LLC. All rights reserved.
          </span>
          <div style={{ display: 'flex', gap: 20 }}>
            <Link href="/privacy" style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.35)', textDecoration: 'none' }}>Privacy</Link>
            <Link href="/terms" style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.35)', textDecoration: 'none' }}>Terms</Link>
            <Link href="/sitemap.xml" style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.35)', textDecoration: 'none' }}>Sitemap</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
