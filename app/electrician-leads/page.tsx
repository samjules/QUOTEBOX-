import type { Metadata } from 'next'
import Link from 'next/link'
import PublicNav from '@/components/PublicNav'
import PublicFooter from '@/components/PublicFooter'

export const metadata: Metadata = {
  title: 'Exclusive Moving Company Leads — $15 Per Lead | Quotebox',
  description: 'Buy exclusive moving leads from Facebook & Instagram ads. Local moves, long-distance moves, and apartment moves — every lead goes only to your moving company. $15/lead, no monthly fees.',
  keywords: ['moving leads', 'exclusive moving leads', 'buy moving leads', 'moving company leads', 'local moving leads', 'long distance moving leads'],
  alternates: { canonical: 'https://quote-box.com/electrician-leads' },
  openGraph: {
    title: 'Exclusive Moving Company Leads — $15 Per Lead | Quotebox',
    description: 'Stop sharing moving leads with competitors. $15/lead, exclusive, instant delivery, no monthly fees.',
    url: 'https://quote-box.com/electrician-leads',
  },
}

const faqs = [
  {
    q: 'How much do moving leads cost?',
    a: 'Every moving lead on Quotebox is $15 flat. No monthly fee, no per-bid charges, no subscription. Only pay when a real customer contacts you.',
  },
  {
    q: 'Are the moving leads exclusive?',
    a: 'Yes — 100% exclusive. When a customer fills out your moving quote form, you are the only moving company who receives their information.',
  },
  {
    q: 'What types of moves can I get leads for?',
    a: 'Local residential moves, long-distance moves, apartment moves, office and commercial moves, senior moves, and specialty moves like pianos or safes. You customize your form to show exactly the services you offer.',
  },
  {
    q: 'Can I get leads for long-distance moves?',
    a: 'Yes. Long-distance moving is one of the highest-value lead types. You can set up a dedicated quote form for long-distance moves and capture customers actively planning an interstate or cross-country relocation.',
  },
  {
    q: 'How does Quotebox compare to Thumbtack for movers?',
    a: 'Thumbtack charges you to send each quote, and sends your lead to up to five competing movers. Quotebox: you pay $15 only when a real customer submits your form — and no other moving company gets that lead.',
  },
]

export default function ElectricianLeadsPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(({ q, a }) => ({
      '@type': 'Question',
      name: q,
      acceptedAnswer: { '@type': 'Answer', text: a },
    })),
  }

  return (
    <div style={{ fontFamily: "'Brraelyn', sans-serif", color: '#0e0020', background: '#fff' }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <PublicNav />

      {/* Hero */}
      <section style={{ background: '#0e0020', color: 'white', padding: '80px 24px 72px', textAlign: 'center' }}>
        <div style={{ maxWidth: 740, margin: '0 auto' }}>
          <div style={{
            display: 'inline-block', background: '#FFE500', color: '#0e0020',
            fontSize: '0.73rem', fontWeight: 700, letterSpacing: '0.08em',
            textTransform: 'uppercase', padding: '5px 14px', borderRadius: 99, marginBottom: 28,
          }}>
            🚚 Exclusive moving leads
          </div>
          <h1 style={{
            fontFamily: "'Oswald', sans-serif",
            fontSize: 'clamp(2.4rem, 5vw, 3.8rem)',
            fontWeight: 800, lineHeight: 1.08, marginBottom: 24,
          }}>
            Moving Leads Delivered<br />
            <span style={{ color: '#FFE500' }}>Directly to You.</span>
          </h1>
          <p style={{ fontSize: '1.05rem', color: 'rgba(255,255,255,0.7)', lineHeight: 1.75, marginBottom: 40, maxWidth: 580, margin: '0 auto 40px' }}>
            Local moves, long-distance, apartment moves — your branded moving quote form captures customers from Facebook & Instagram and delivers each lead exclusively to you. $15 per lead, no monthly fee.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/signup" style={{
              background: '#FFE500', color: '#0e0020', fontWeight: 700,
              padding: '14px 32px', borderRadius: 10, textDecoration: 'none', fontSize: '1rem',
            }}>
              Get moving leads — free to start
            </Link>
            <Link href="/contractor-leads" style={{
              background: 'rgba(255,255,255,0.1)', color: 'white', fontWeight: 600,
              padding: '14px 32px', borderRadius: 10, textDecoration: 'none', fontSize: '1rem',
              border: '1px solid rgba(255,255,255,0.2)',
            }}>
              See all services →
            </Link>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section style={{ padding: '72px 24px', background: '#fff' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <h2 style={{ fontFamily: "'Oswald', sans-serif", fontSize: 'clamp(1.8rem, 3.5vw, 2.6rem)', fontWeight: 700, textAlign: 'center', marginBottom: 48 }}>
            Why moving companies choose Quotebox
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 24 }}>
            {[
              { icon: '🔒', title: '100% exclusive leads', body: 'No other moving company on the platform receives the same lead. Full stop.' },
              { icon: '📏', title: 'Capture long-distance moves', body: 'Target customers planning cross-state or cross-country moves — the highest-value jobs in the moving industry.' },
              { icon: '📍', title: 'Hyper-local targeting', body: 'Your ads only run in the cities and zip codes your crews can service — no wasted spend on leads too far away.' },
              { icon: '💰', title: '$15 per lead, zero monthly fee', body: 'Pay only when a real customer contacts you. No monthly subscription, no bid fees, no contracts.' },
              { icon: '🏷️', title: 'Your branded quote form', body: 'Customers see your company name and logo — not a marketplace. Build trust before you even call back.' },
              { icon: '📱', title: 'Meta ads — we handle it', body: 'We run Facebook and Instagram campaigns in your service area. You focus on the moves, we send you the customers.' },
            ].map(({ icon, title, body }) => (
              <div key={title} style={{ background: '#f9fafb', borderRadius: 12, padding: '24px 20px', border: '1px solid #e5e7eb' }}>
                <div style={{ fontSize: '1.6rem', marginBottom: 10 }}>{icon}</div>
                <h3 style={{ fontWeight: 700, fontSize: '1rem', marginBottom: 8 }}>{title}</h3>
                <p style={{ color: '#6b7280', lineHeight: 1.65, fontSize: '0.9rem', margin: 0 }}>{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section style={{ padding: '72px 24px', background: '#f9fafb' }}>
        <div style={{ maxWidth: 700, margin: '0 auto' }}>
          <h2 style={{ fontFamily: "'Oswald', sans-serif", fontSize: 'clamp(1.7rem, 3vw, 2.2rem)', fontWeight: 700, marginBottom: 32, textAlign: 'center' }}>
            Moving Lead FAQ
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {faqs.map(({ q, a }, i) => (
              <details key={i} style={{ background: 'white', borderRadius: 10, overflow: 'hidden', border: '1px solid #e5e7eb' }}>
                <summary style={{ padding: '18px 22px', fontWeight: 600, cursor: 'pointer', fontSize: '0.97rem', listStyle: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  {q}<span style={{ fontSize: '1.1rem', color: '#9ca3af', flexShrink: 0, marginLeft: 12 }}>+</span>
                </summary>
                <div style={{ padding: '0 22px 18px', color: '#4b5563', lineHeight: 1.7, fontSize: '0.93rem' }}>{a}</div>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section style={{ padding: '48px 24px', background: '#fff' }}>
        <div style={{ maxWidth: 700, margin: '0 auto', textAlign: 'center' }}>
          <p style={{ color: '#9ca3af', fontSize: '0.88rem', marginBottom: 16 }}>Also looking for leads in another service?</p>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
            {[
              { label: 'Junk Removal Leads', href: '/hvac-leads' },
              { label: 'Local Moving Leads', href: '/plumbing-leads' },
              { label: 'Estate Cleanout Leads', href: '/roofing-leads' },
              { label: 'All Moving & Junk Leads', href: '/contractor-leads' },
            ].map(({ label, href }) => (
              <Link key={href} href={href} style={{
                padding: '8px 18px', borderRadius: 99, border: '1px solid #e5e7eb',
                fontSize: '0.88rem', color: '#374151', textDecoration: 'none', fontWeight: 500,
              }}>{label}</Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: '72px 24px', background: '#FFE500' }}>
        <div style={{ maxWidth: 580, margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontFamily: "'Oswald', sans-serif", fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 800, color: '#0e0020', marginBottom: 16 }}>
            Book more moves
          </h2>
          <p style={{ color: '#0e0020', opacity: 0.7, marginBottom: 32, fontSize: '1rem', lineHeight: 1.65 }}>
            Build your branded moving quote form in 5 minutes. $15 per exclusive lead. Free to sign up.
          </p>
          <Link href="/signup" style={{
            display: 'inline-block', background: '#0e0020', color: '#FFE500',
            fontWeight: 700, padding: '16px 40px', borderRadius: 10,
            textDecoration: 'none', fontSize: '1.05rem',
          }}>
            Get started free
          </Link>
        </div>
      </section>

      <PublicFooter />
    </div>
  )
}
