import Link from 'next/link'

const tradeLinks = [
  { label: 'Contractor Leads', href: '/contractor-leads' },
  { label: 'Roofing Leads', href: '/roofing-leads' },
  { label: 'HVAC Leads', href: '/hvac-leads' },
  { label: 'Plumbing Leads', href: '/plumbing-leads' },
  { label: 'Electrician Leads', href: '/electrician-leads' },
]

const compareLinks = [
  { label: 'vs Thumbtack', href: '/vs-thumbtack' },
  { label: 'vs Angi Leads', href: '/vs-angies-list' },
]

const companyLinks = [
  { label: 'Home', href: '/' },
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
    <footer style={{ background: '#1a1a2e', color: 'white', padding: '60px 32px 32px' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '48px 32px',
          marginBottom: 48,
        }}>

          {/* Brand */}
          <div>
            <div style={{ fontFamily: "'Oswald', sans-serif", fontSize: '1.4rem', fontWeight: 700, marginBottom: 12 }}>
              Quote<span style={{ color: '#FFE500' }}>.</span>Box
            </div>
            <p style={{ fontSize: '0.83rem', color: 'rgba(255,255,255,0.5)', lineHeight: 1.7, maxWidth: 220, margin: 0 }}>
              Exclusive contractor leads from Facebook & Instagram ads. Pay $15 per lead — no monthly fees, no contracts.
            </p>
          </div>

          {/* Leads by Trade */}
          <div>
            <div style={colTitle}>Leads by Trade</div>
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
              <Link href="/contractor-leads#faq" style={linkStyle}>Contractor Lead FAQ</Link>
              <Link href="/vs-thumbtack#compare" style={linkStyle}>Thumbtack vs Quote Box</Link>
              <Link href="/vs-angies-list#compare" style={linkStyle}>Angi vs Quote Box</Link>
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
            © 2025 Quote Box. All rights reserved.
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
