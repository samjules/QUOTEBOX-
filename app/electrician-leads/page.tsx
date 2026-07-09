import type { Metadata } from 'next'
import Link from 'next/link'
import PublicNav from '@/components/PublicNav'
import PublicFooter from '@/components/PublicFooter'

export const metadata: Metadata = {
  title: 'Moving Company Lead Capture — Instant Quote Form & CRM | Quotebox',
  description: 'Stop losing moving leads to a slow callback. Quotebox gives your moving company a branded instant-quote form, automatic follow-up, and a CRM to track every lead — local, long-distance, or apartment — to booked. Try it for $1 your first month.',
  keywords: ['moving company software', 'moving quote form', 'moving company CRM', 'local moving software', 'long distance moving software', 'moving lead capture'],
  alternates: { canonical: 'https://quote-box.com/electrician-leads' },
  openGraph: {
    title: 'Moving Company Lead Capture — Instant Quote Form & CRM | Quotebox',
    description: 'A branded instant-quote form, automatic follow-up, and CRM built for moving companies. Try it for $1.',
    url: 'https://quote-box.com/electrician-leads',
  },
}

const faqs = [
  {
    q: 'How much does Quotebox cost?',
    a: 'Your first month is $1, full access, no feature limits. After that it renews at $34/month. No per-lead fees, no bidding, no contract — cancel anytime.',
  },
  {
    q: 'Are the leads exclusive to me?',
    a: 'Yes — 100% exclusive. When a customer fills out your moving quote form, you are the only moving company who receives their information.',
  },
  {
    q: 'What types of moves can I quote?',
    a: 'Local residential moves, long-distance moves, apartment moves, office and commercial moves, senior moves, and specialty moves like pianos or safes. You customize your form and pricing to show exactly the services you offer.',
  },
  {
    q: 'Can I quote long-distance moves?',
    a: 'Yes. Long-distance moving is one of the highest-value job types. Set up your drive-time and hourly pricing to capture customers planning an interstate or cross-country relocation, right alongside local jobs.',
  },
  {
    q: 'How does Quotebox compare to Thumbtack for movers?',
    a: 'Thumbtack charges you to send each quote, and sends your lead to up to five competing movers who all bid for it. Quotebox gives you your own quote form and CRM for a flat $34/month — no bidding, and every lead is exclusively yours.',
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
    <div style={{ fontFamily: "'Nautic', sans-serif", color: '#201d3d', background: '#fff' }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <PublicNav />

      {/* Hero */}
      <section style={{ background: '#453bc2', color: 'white', padding: '80px 24px 72px', textAlign: 'center' }}>
        <div style={{ maxWidth: 740, margin: '0 auto' }}>
          <div style={{
            display: 'inline-block', background: '#f4a93c', color: '#201d3d',
            fontSize: '0.73rem', fontWeight: 700, letterSpacing: '0.08em',
            textTransform: 'uppercase', padding: '5px 14px', borderRadius: 99, marginBottom: 28,
          }}>
            🚚 Instant quote forms for movers
          </div>
          <h1 style={{
            fontFamily: "'Nautic', sans-serif",
            fontSize: 'clamp(2.4rem, 5vw, 3.8rem)',
            fontWeight: 800, lineHeight: 1.08, marginBottom: 24,
          }}>
            Moving leads,<br />
            <span style={{ color: '#f4a93c' }}>tracked to booked.</span>
          </h1>
          <p style={{ fontSize: '1.05rem', color: 'rgba(255,255,255,0.75)', lineHeight: 1.75, marginBottom: 40, maxWidth: 580, margin: '0 auto 40px' }}>
            Local moves, long-distance, apartment moves — a branded instant-quote form for your moving company, connected to automatic SMS &amp; email follow-up and a full CRM.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/build" style={{
              background: '#f4a93c', color: '#201d3d', fontWeight: 800,
              padding: '14px 32px', borderRadius: 10, textDecoration: 'none', fontSize: '1rem',
            }}>
              Try Quotebox for $1 →
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
          <h2 style={{ fontFamily: "'Nautic', sans-serif", fontSize: 'clamp(1.8rem, 3.5vw, 2.6rem)', fontWeight: 700, textAlign: 'center', marginBottom: 48 }}>
            Why moving companies choose Quotebox
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 24 }}>
            {[
              { icon: '📋', title: 'Your own branded quote form', body: 'No marketplace, no bidding against other movers for the same customer.' },
              { icon: '📏', title: 'Capture long-distance moves', body: 'Set up drive-time pricing to quote cross-state or cross-country moves — the highest-value jobs in the industry.' },
              { icon: '💬', title: 'Automatic follow-up', body: 'Every new lead gets an instant SMS and email reply, even at 11pm on a Sunday.' },
              { icon: '📍', title: 'Hyper-local targeting', body: 'Connect your Meta ads and run campaigns only in the cities and zip codes your crews can service.' },
              { icon: '🏷️', title: 'Your branded quote form', body: 'Customers see your company name and logo — not a marketplace. Build trust before you even call back.' },
              { icon: '📊', title: 'Full CRM & pipeline', body: 'Every lead, quote, and job tracked from first contact to booked — no spreadsheets.' },
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
          <h2 style={{ fontFamily: "'Nautic', sans-serif", fontSize: 'clamp(1.7rem, 3vw, 2.2rem)', fontWeight: 700, marginBottom: 32, textAlign: 'center' }}>
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
          <p style={{ color: '#9ca3af', fontSize: '0.88rem', marginBottom: 16 }}>Also looking for a quote form for another service?</p>
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
      <section style={{ padding: '72px 24px', background: '#f4a93c' }}>
        <div style={{ maxWidth: 580, margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontFamily: "'Nautic', sans-serif", fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 800, color: '#201d3d', marginBottom: 16 }}>
            Book more moves
          </h2>
          <p style={{ color: '#201d3d', opacity: 0.75, marginBottom: 32, fontSize: '1rem', lineHeight: 1.65 }}>
            Build your branded moving quote form in 5 minutes. Try the full platform for $1 your first month.
          </p>
          <Link href="/build" style={{
            display: 'inline-block', background: '#201d3d', color: '#f4a93c',
            fontWeight: 800, padding: '16px 40px', borderRadius: 10,
            textDecoration: 'none', fontSize: '1.05rem',
          }}>
            Try Quotebox for $1 →
          </Link>
        </div>
      </section>

      <PublicFooter />
    </div>
  )
}
