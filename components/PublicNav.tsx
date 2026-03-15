import Link from 'next/link'

export default function PublicNav() {
  return (
    <nav style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 32px', height: 60, borderBottom: '1px solid #f0f0f0',
      position: 'sticky', top: 0, background: 'white', zIndex: 50,
    }}>
      <Link href="/" style={{ textDecoration: 'none' }}>
        <span style={{ fontFamily: "'Oswald', sans-serif", fontSize: '1.35rem', fontWeight: 700, letterSpacing: '0.01em', color: '#1a1a2e' }}>
          Quote<span style={{ color: '#FFE500', WebkitTextStroke: '1px #1a1a2e' }}>.</span>Box
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
        <Link href="/signup" style={{
          fontSize: '0.88rem', fontWeight: 600, padding: '8px 18px',
          background: '#1a1a2e', color: '#FFE500', borderRadius: 8, textDecoration: 'none',
        }}>
          Get started free
        </Link>
      </div>
    </nav>
  )
}
