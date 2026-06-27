import Link from 'next/link'

export default function PublicNav() {
  return (
    <>
      <div className="maze-dark" style={{
        background: '#0e0020', color: 'rgba(255,255,255,0.55)',
        textAlign: 'center', fontSize: '0.72rem', padding: '6px 16px',
        letterSpacing: '0.03em',
      }}>
        Quotebox is a product of{' '}
        <span style={{ color: 'rgba(255,255,255,0.8)', fontWeight: 600 }}>Arctic Reach LLC</span>
        {' '}·{' '}
        <Link href="/privacy" style={{ color: 'rgba(255,255,255,0.5)', textDecoration: 'underline' }}>Privacy Policy</Link>
        {' '}·{' '}
        <Link href="/terms" style={{ color: 'rgba(255,255,255,0.5)', textDecoration: 'underline' }}>Terms of Service</Link>
      </div>
    <nav style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 32px', height: 60, borderBottom: '1px solid #f0f0f0',
      position: 'sticky', top: 0, background: 'white', zIndex: 50,
    }}>
      <Link href="/" style={{ textDecoration: 'none' }}>
        <span style={{ fontFamily: "'Oswald', sans-serif", fontSize: '1.35rem', fontWeight: 700, letterSpacing: '0.01em', color: '#0e0020' }}>
          Quote<span style={{ color: '#FFE500', WebkitTextStroke: '1px #0e0020' }}>.</span>Box
        </span>
      </Link>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <Link href="/contractor-leads" style={{ fontSize: '0.88rem', fontWeight: 500, color: '#555', textDecoration: 'none' }}>
          Contractor Leads
        </Link>
        <Link href="/agency" style={{ fontSize: '0.88rem', fontWeight: 500, color: '#555', textDecoration: 'none' }}>
          Done for you
        </Link>
        <Link href="/login" style={{ fontSize: '0.88rem', fontWeight: 500, color: '#555', textDecoration: 'none' }}>
          Log in
        </Link>
        <Link href="/build" style={{
          fontSize: '0.88rem', fontWeight: 600, padding: '8px 18px',
          background: '#0e0020', color: '#FFE500', borderRadius: 8, textDecoration: 'none',
        }}>
          Get started free
        </Link>
      </div>
    </nav>
    </>
  )
}
