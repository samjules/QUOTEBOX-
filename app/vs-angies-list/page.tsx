import type { Metadata } from 'next'
import Link from 'next/link'
import PublicNav from '@/components/PublicNav'
import PublicFooter from '@/components/PublicFooter'

export const metadata: Metadata = {
  title: "Quotebox vs Angi (Angie's List) — Better Moving & Junk Removal Leads for Less",
  description: "Angi charges $40–$100/month plus shared lead fees. Quotebox is $15 per exclusive moving or junk removal lead, no monthly subscription. See the full comparison of Angi vs Quotebox.",
  alternates: { canonical: 'https://quote-box.com/vs-angies-list' },
  openGraph: {
    title: "Quotebox vs Angi Leads | Quotebox",
    description: "Angi = monthly fees + shared leads. Quotebox = $15/lead, exclusive, no subscription. The better Angi alternative for movers and junk removal companies.",
    url: 'https://quote-box.com/vs-angies-list',
  },
}

const faqs = [
  {
    q: "How much does Angi (Angie's List) charge moving and junk removal companies?",
    a: "Angi charges a monthly membership fee of $40–$100+ per month, plus separate lead fees of $15–$85 per lead — and those leads are still shared with competing companies.",
  },
  {
    q: "Are Angi moving and junk removal leads exclusive?",
    a: "No. Angi sends the same lead to multiple companies. You are competing against other movers or junk haulers every time you receive a lead through Angi.",
  },
  {
    q: "Does Quotebox have a monthly fee?",
    a: "No. Quotebox has zero monthly fees. You pay a flat $15 per lead, and only when a real customer submits your form. No subscription, no retainer, no hidden charges.",
  },
  {
    q: "Can I cancel Angi easily?",
    a: "Angi contracts are notoriously difficult to cancel and many businesses report being billed for months after attempting to cancel. Quotebox has no contract — stop buying credits at any time with no penalty.",
  },
  {
    q: "What is a better alternative to Angi for movers and junk removal companies?",
    a: "Quotebox. You get a branded quote form, Facebook & Instagram ad campaigns targeting your exact service area, exclusive leads delivered instantly, and you pay only $15 per lead — no monthly fees.",
  },
]

const rows = [
  { feature: 'Monthly fee', qb: '$0', angi: '$40–$100+/month', qbWin: true },
  { feature: 'Lead exclusivity', qb: 'Exclusive — only you', angi: 'Shared with competitors', qbWin: true },
  { feature: 'Cost per lead', qb: '$15 flat', angi: '$15–$85 per shared lead', qbWin: true },
  { feature: 'Pay only when you get a lead', qb: 'Yes', angi: 'No — monthly fees apply regardless', qbWin: true },
  { feature: 'No contract required', qb: 'Yes', angi: 'Often 12-month contracts', qbWin: true },
  { feature: 'Your own branded form', qb: 'Yes', angi: 'Generic Angi profile listing', qbWin: true },
  { feature: 'You own the customer data', qb: 'Yes', angi: 'Angi owns it', qbWin: true },
  { feature: 'Ad targeting control', qb: 'City / zip / radius', angi: 'Platform-controlled', qbWin: true },
  { feature: 'Instant lead notification', qb: 'Yes', angi: 'Yes', qbWin: false },
  { feature: 'Works without a website', qb: 'Yes', angi: 'Yes', qbWin: false },
]

export default function VsAngiesListPage() {
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
            Angi / Angie&apos;s List alternative
          </div>
          <h1 style={{
            fontFamily: "'Oswald', sans-serif",
            fontSize: 'clamp(2.2rem, 5vw, 3.6rem)',
            fontWeight: 800, lineHeight: 1.08, marginBottom: 24,
          }}>
            Stop Paying Angi<br />
            <span style={{ color: '#FFE500' }}>Every Month for Shared Leads</span>
          </h1>
          <p style={{ fontSize: '1.05rem', color: 'rgba(255,255,255,0.7)', lineHeight: 1.75, marginBottom: 40, maxWidth: 580, margin: '0 auto 40px' }}>
            Angi charges a monthly subscription <em>and</em> per-lead fees for leads shared with competing movers and junk haulers. Quotebox is $15 flat per exclusive lead — no monthly fee, no sharing, no contracts.
          </p>
          <Link href="/build" style={{
            background: '#FFE500', color: '#0e0020', fontWeight: 700,
            padding: '14px 32px', borderRadius: 10, textDecoration: 'none', fontSize: '1rem',
          }}>
            Start getting exclusive leads — free
          </Link>
        </div>
      </section>

      {/* Comparison Table */}
      <section id="compare" style={{ padding: '72px 24px', background: '#f9fafb' }}>
        <div style={{ maxWidth: 840, margin: '0 auto' }}>
          <h2 style={{ fontFamily: "'Oswald', sans-serif", fontSize: 'clamp(1.7rem, 3vw, 2.4rem)', fontWeight: 700, textAlign: 'center', marginBottom: 40 }}>
            Quotebox vs Angi — Full Comparison
          </h2>
          <div style={{ background: 'white', borderRadius: 14, overflow: 'hidden', border: '1px solid #e5e7eb', boxShadow: '0 2px 16px rgba(0,0,0,0.06)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', background: '#0e0020', color: 'white' }}>
              <div style={{ padding: '16px 20px', fontWeight: 600, fontSize: '0.88rem' }}>Feature</div>
              <div style={{ padding: '16px 20px', fontWeight: 700, fontSize: '0.88rem', color: '#FFE500', textAlign: 'center' }}>Quotebox</div>
              <div style={{ padding: '16px 20px', fontWeight: 600, fontSize: '0.88rem', color: 'rgba(255,255,255,0.55)', textAlign: 'center' }}>Angi Leads</div>
            </div>
            {rows.map(({ feature, qb, angi, qbWin }, i) => (
              <div key={feature} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', background: i % 2 === 0 ? '#fff' : '#f9fafb', borderTop: '1px solid #e5e7eb' }}>
                <div style={{ padding: '14px 20px', fontSize: '0.91rem', fontWeight: 500 }}>{feature}</div>
                <div style={{ padding: '14px 20px', fontSize: '0.91rem', textAlign: 'center', color: qbWin ? '#059669' : '#374151', fontWeight: qbWin ? 600 : 400 }}>
                  {qbWin && <span style={{ marginRight: 6 }}>✓</span>}{qb}
                </div>
                <div style={{ padding: '14px 20px', fontSize: '0.91rem', textAlign: 'center', color: qbWin ? '#dc2626' : '#374151' }}>
                  {qbWin && <span style={{ marginRight: 6 }}>✗</span>}{angi}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Cost breakdown */}
      <section style={{ padding: '72px 24px', background: '#fff' }}>
        <div style={{ maxWidth: 760, margin: '0 auto' }}>
          <h2 style={{ fontFamily: "'Oswald', sans-serif", fontSize: 'clamp(1.7rem, 3vw, 2.4rem)', fontWeight: 700, marginBottom: 32 }}>
            What Angi really costs movers per month
          </h2>
          <p style={{ color: '#4b5563', lineHeight: 1.75, fontSize: '1rem', marginBottom: 20 }}>
            A typical moving company on Angi pays $60/month in subscription fees plus $30–$50 per lead — and shares those leads with two or three competitors. If you receive 15 leads in a month, that&apos;s <strong>$60 + $675 = $735</strong> minimum, and you&apos;re still racing other movers to follow up first.
          </p>
          <p style={{ color: '#4b5563', lineHeight: 1.75, fontSize: '1rem', marginBottom: 20 }}>
            On Quotebox those same 15 leads cost <strong>$225 total</strong> — and every single one is exclusively yours. No monthly fee, no bidding war.
          </p>
          <p style={{ color: '#4b5563', lineHeight: 1.75, fontSize: '1rem', margin: 0 }}>
            And if business slows down, you simply stop buying credits. No cancellation headaches, no 12-month contracts, no calls to a retention team.
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section style={{ padding: '72px 24px', background: '#f9fafb' }}>
        <div style={{ maxWidth: 700, margin: '0 auto' }}>
          <h2 style={{ fontFamily: "'Oswald', sans-serif", fontSize: 'clamp(1.7rem, 3vw, 2.2rem)', fontWeight: 700, marginBottom: 32, textAlign: 'center' }}>
            Frequently asked questions about switching from Angi
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {faqs.map(({ q, a }, i) => (
              <details key={i} style={{ background: 'white', borderRadius: 10, overflow: 'hidden', border: '1px solid #e5e7eb' }}>
                <summary style={{ padding: '18px 22px', fontWeight: 600, cursor: 'pointer', fontSize: '0.97rem', listStyle: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  {q}
                  <span style={{ fontSize: '1.1rem', color: '#9ca3af', flexShrink: 0, marginLeft: 12 }}>+</span>
                </summary>
                <div style={{ padding: '0 22px 18px', color: '#4b5563', lineHeight: 1.7, fontSize: '0.93rem' }}>{a}</div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: '80px 24px', background: '#FFE500' }}>
        <div style={{ maxWidth: 600, margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontFamily: "'Oswald', sans-serif", fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 800, color: '#0e0020', marginBottom: 16 }}>
            Cancel Angi. Keep the leads.
          </h2>
          <p style={{ color: '#0e0020', opacity: 0.7, marginBottom: 32, fontSize: '1.05rem', lineHeight: 1.65 }}>
            Sign up free, build your form in 5 minutes, and replace your Angi spend with $15 exclusive moving and junk removal leads.
          </p>
          <Link href="/build" style={{
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
