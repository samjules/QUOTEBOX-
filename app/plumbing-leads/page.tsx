import type { Metadata } from 'next'
import Link from 'next/link'
import PublicNav from '@/components/PublicNav'
import PublicFooter from '@/components/PublicFooter'

export const metadata: Metadata = {
  title: 'Exclusive Local Moving Leads — $15 Per Lead | Quotebox',
  description: 'Buy exclusive local moving leads from Facebook & Instagram ads. Every local move, apartment move, and small move lead goes only to you. $15 per lead, no monthly fees, no sharing.',
  keywords: ['local moving leads', 'exclusive local moving leads', 'buy moving leads', 'apartment moving leads', 'residential moving leads', 'same city moving leads'],
  alternates: { canonical: 'https://quote-box.com/plumbing-leads' },
  openGraph: {
    title: 'Exclusive Local Moving Leads — $15 Per Lead | Quotebox',
    description: 'Stop sharing local moving leads with competitors. $15/lead, exclusive, instant delivery, no monthly fees.',
    url: 'https://quote-box.com/plumbing-leads',
  },
}

const faqs = [
  {
    q: 'How much do local moving leads cost on Quotebox?',
    a: 'A flat $15 per lead — regardless of move size or type. No monthly fee, no subscription, no bidding. You only pay when a real customer contacts you.',
  },
  {
    q: 'Are local moving leads exclusive?',
    a: 'Yes. When a customer fills out your local moving quote form, you are the only mover who receives their details. No other moving company on Quotebox sees that lead.',
  },
  {
    q: 'What types of local moves can I get leads for?',
    a: 'Any local move — apartment moves, house moves, studio moves, office relocations, last-minute moves, and more. You customize the form to match the services you offer.',
  },
  {
    q: 'How does Quotebox compare to HomeAdvisor / Angi for movers?',
    a: 'HomeAdvisor (now Angi) charges a monthly fee plus $20–$60 per moving lead — and those leads are shared. Quotebox charges $15 per exclusive lead with zero monthly fees.',
  },
  {
    q: 'Can I get same-day or last-minute moving leads?',
    a: "Yes. You can add an 'urgency' field to your form so customers can flag last-minute or same-day jobs. You'll see it instantly in your dashboard and can follow up within minutes.",
  },
]

export default function PlumbingLeadsPage() {
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
    <div style={{ fontFamily: "'Brraelyn', sans-serif", color: '#1a1a2e', background: '#fff' }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <PublicNav />

      {/* Hero */}
      <section style={{ background: '#1a1a2e', color: 'white', padding: '80px 24px 72px', textAlign: 'center' }}>
        <div style={{ maxWidth: 740, margin: '0 auto' }}>
          <div style={{
            display: 'inline-block', background: '#FFE500', color: '#1a1a2e',
            fontSize: '0.73rem', fontWeight: 700, letterSpacing: '0.08em',
            textTransform: 'uppercase', padding: '5px 14px', borderRadius: 99, marginBottom: 28,
          }}>
            📦 Exclusive local moving leads
          </div>
          <h1 style={{
            fontFamily: "'Oswald', sans-serif",
            fontSize: 'clamp(2.4rem, 5vw, 3.8rem)',
            fontWeight: 800, lineHeight: 1.08, marginBottom: 24,
          }}>
            Local Moving Leads Sent<br />
            <span style={{ color: '#FFE500' }}>Only to Your Phone.</span>
          </h1>
          <p style={{ fontSize: '1.05rem', color: 'rgba(255,255,255,0.7)', lineHeight: 1.75, marginBottom: 40, maxWidth: 580, margin: '0 auto 40px' }}>
            Facebook & Instagram ads drive customers to your branded local moving quote form. You get each lead exclusively — no other mover competes for the same customer. $15 per lead, no monthly fees.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/signup" style={{
              background: '#FFE500', color: '#1a1a2e', fontWeight: 700,
              padding: '14px 32px', borderRadius: 10, textDecoration: 'none', fontSize: '1rem',
            }}>
              Get local moving leads — free to start
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
            Why local movers choose Quotebox
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 24 }}>
            {[
              { icon: '🔒', title: '100% exclusive — no shared leads', body: 'Every customer who fills out your form is talking to you and only you.' },
              { icon: '⏰', title: 'Capture last-minute jobs', body: 'Add urgency fields to your form so you can identify and call back same-day or last-minute moves within minutes.' },
              { icon: '📍', title: 'Only your service area', body: "Your ads run in the exact zip codes your moving crew covers — no wasted spend or leads you can't reach." },
              { icon: '⚡', title: 'Real-time lead alerts', body: 'Instant notification the moment a customer hits submit — name, number, move details.' },
              { icon: '💰', title: '$15 per lead, zero monthly fee', body: 'No subscription. No bidding against other movers. Pay only when a real lead arrives.' },
              { icon: '🏷️', title: 'Your logo, your brand', body: 'Professional branded quote form — customers trust your company name, not a generic marketplace.' },
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
            Local Moving Lead FAQ
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
              { label: 'Moving Leads', href: '/electrician-leads' },
              { label: 'Junk Removal Leads', href: '/hvac-leads' },
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
          <h2 style={{ fontFamily: "'Oswald', sans-serif", fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 800, color: '#1a1a2e', marginBottom: 16 }}>
            Keep your moving crew busy
          </h2>
          <p style={{ color: '#1a1a2e', opacity: 0.7, marginBottom: 32, fontSize: '1rem', lineHeight: 1.65 }}>
            Build your branded local moving quote form in 5 minutes. $15 per exclusive lead. Free to sign up.
          </p>
          <Link href="/signup" style={{
            display: 'inline-block', background: '#1a1a2e', color: '#FFE500',
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
