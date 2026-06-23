import type { Metadata } from 'next'
import Link from 'next/link'
import PublicNav from '@/components/PublicNav'
import PublicFooter from '@/components/PublicFooter'

export const metadata: Metadata = {
  title: 'Exclusive Estate Cleanout & Junk Hauling Leads — $15 Per Lead | Quotebox',
  description: 'Buy exclusive estate cleanout and junk hauling leads from Facebook & Instagram ads. Every estate cleanout and haul-away lead goes only to you — not shared with competitors. $15/lead, no monthly fees.',
  keywords: ['estate cleanout leads', 'junk hauling leads', 'cleanout leads', 'hoarding cleanup leads', 'property cleanout leads', 'haul away leads'],
  alternates: { canonical: 'https://quote-box.com/roofing-leads' },
  openGraph: {
    title: 'Exclusive Estate Cleanout Leads — $15 Per Lead | Quotebox',
    description: 'Stop sharing estate cleanout leads with competitors. $15/lead, exclusive, instant delivery, no monthly fees.',
    url: 'https://quote-box.com/roofing-leads',
  },
}

const faqs = [
  {
    q: 'How much do estate cleanout leads cost on Quotebox?',
    a: 'Every estate cleanout lead is $15 flat. No monthly fee, no subscription, no minimum spend. Buy credits when you need them.',
  },
  {
    q: 'Are estate cleanout leads exclusive?',
    a: 'Yes — 100%. When a customer submits your cleanout quote form, their details go only to you. No other junk removal or cleanout company on the platform receives the same lead.',
  },
  {
    q: 'What info do I get with each cleanout lead?',
    a: "You get the customer's name, phone number, email, and exactly what they selected in your form — property type, approximate volume, timeline, and any other questions you've added.",
  },
  {
    q: 'Can I target specific zip codes for estate cleanout leads?',
    a: 'Yes. You control the geographic targeting of your Facebook and Instagram ads — by city, zip code, or a radius around your business address.',
  },
  {
    q: 'How does this compare to Thumbtack for cleanout companies?',
    a: 'On Thumbtack you bid against up to five other companies per lead and pay a fee whether you win or lose. On Quotebox you pay $15 only when a real cleanout lead lands in your dashboard — exclusively yours.',
  },
]

export default function RoofingLeadsPage() {
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
    <div style={{ fontFamily: "'Nautic', sans-serif", color: '#0e0020', background: '#fff' }}>
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
            🏠 Exclusive estate cleanout leads
          </div>
          <h1 style={{
            fontFamily: "'Oswald', sans-serif",
            fontSize: 'clamp(2.4rem, 5vw, 3.8rem)',
            fontWeight: 800, lineHeight: 1.08, marginBottom: 24,
          }}>
            Estate Cleanout Leads That<br />
            <span style={{ color: '#FFE500' }}>Only Go to You.</span>
          </h1>
          <p style={{ fontSize: '1.05rem', color: 'rgba(255,255,255,0.7)', lineHeight: 1.75, marginBottom: 40, maxWidth: 580, margin: '0 auto 40px' }}>
            Facebook & Instagram ads driving customers directly to your branded cleanout quote form. $15 per lead. 100% exclusive. No bidding against four other junk haulers.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/signup" style={{
              background: '#FFE500', color: '#0e0020', fontWeight: 700,
              padding: '14px 32px', borderRadius: 10, textDecoration: 'none', fontSize: '1rem',
            }}>
              Get cleanout leads — free to start
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
            Built for estate cleanout & junk hauling companies
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 24 }}>
            {[
              { icon: '🔒', title: 'Every lead is exclusively yours', body: 'Your form, your customer. No other cleanout company on the platform ever sees the same lead.' },
              { icon: '💰', title: '$15 flat — win or lose nothing extra', body: 'Unlike Thumbtack where you pay to bid regardless of outcome, you only pay when a real lead arrives.' },
              { icon: '📍', title: 'Target your exact service area', body: 'Ads run only in the cities and zip codes where you actually do cleanout work.' },
              { icon: '⚡', title: 'Instant lead delivery', body: "The second a customer submits, you get their name, number, and job details in your dashboard." },
              { icon: '🏷️', title: 'Your brand, your form', body: 'Custom logo, brand color, and service options. Customers see your company, not a marketplace.' },
              { icon: '📱', title: 'Meta ads included', body: 'We run Facebook & Instagram ads targeting customers in your area — you just collect the leads.' },
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
            Estate Cleanout Lead FAQ
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

      {/* Internal links to other services */}
      <section style={{ padding: '48px 24px', background: '#fff' }}>
        <div style={{ maxWidth: 700, margin: '0 auto', textAlign: 'center' }}>
          <p style={{ color: '#9ca3af', fontSize: '0.88rem', marginBottom: 16 }}>Also looking for leads in another service?</p>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
            {[
              { label: 'Moving Leads', href: '/electrician-leads' },
              { label: 'Junk Removal Leads', href: '/hvac-leads' },
              { label: 'Local Moving Leads', href: '/plumbing-leads' },
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
            Start getting cleanout leads today
          </h2>
          <p style={{ color: '#0e0020', opacity: 0.7, marginBottom: 32, fontSize: '1rem', lineHeight: 1.65 }}>
            Build your branded cleanout quote form in 5 minutes. $15 per exclusive lead. No credit card to sign up.
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
