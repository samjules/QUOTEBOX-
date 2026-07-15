import type { Metadata } from 'next'
import Link from 'next/link'
import PublicNav from '@/components/PublicNav'
import PublicFooter from '@/components/PublicFooter'

export const metadata: Metadata = {
  title: "Quotebox vs Angi (Angie's List) — Your Own Quote Form & CRM",
  description: "Angi charges monthly fees and shares your lead with competitors. Quotebox gives your moving or junk removal company its own branded instant-quote form, automatic follow-up, and CRM — for $1 your first month. See the full comparison.",
  alternates: { canonical: 'https://quote-box.com/vs-angies-list' },
  openGraph: {
    title: "Quotebox vs Angi | Quotebox",
    description: "Angi = monthly fees + shared leads. Quotebox = your own instant-quote form, automatic follow-up, and CRM. The better Angi alternative for movers and junk removal companies.",
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
    q: "How much does Quotebox cost?",
    a: "Your first month is $1, full access, no feature limits. After that it renews at a flat $34/month, no matter how many leads come in — no per-lead fees, no sharing.",
  },
  {
    q: "Can I cancel Quotebox easily?",
    a: "Yes. Angi contracts are notoriously difficult to cancel and many businesses report being billed for months after attempting to cancel. Quotebox has no contract — cancel anytime from your dashboard in a couple of clicks.",
  },
  {
    q: "What is a better alternative to Angi for movers and junk removal companies?",
    a: "Quotebox. You get your own branded quote form, automatic SMS & email follow-up, a full CRM, and a mobile app for a flat $34/month — no shared leads, no monthly fee stacked on top of per-lead charges.",
  },
]

const rows = [
  { feature: 'Monthly fee', qb: '$1 first month, then $34/mo flat', angi: '$40–$100+/month', qbWin: true },
  { feature: 'Lead exclusivity', qb: 'Exclusive — only you', angi: 'Shared with competitors', qbWin: true },
  { feature: 'Per-lead fees', qb: 'None', angi: '$15–$85 per shared lead, on top of the monthly fee', qbWin: true },
  { feature: 'Contract required', qb: 'None — cancel anytime', angi: 'Often 12-month contracts', qbWin: true },
  { feature: 'Your own branded form', qb: 'Yes', angi: 'Generic Angi profile listing', qbWin: true },
  { feature: 'You own the customer data', qb: 'Yes', angi: 'Angi owns it', qbWin: true },
  { feature: 'Automatic SMS & email follow-up', qb: 'Built in', angi: 'Not included', qbWin: true },
  { feature: 'CRM & lead pipeline', qb: 'Built in', angi: 'Not included', qbWin: true },
  { feature: 'Ad targeting control', qb: 'City / zip / radius, your own Meta account', angi: 'Platform-controlled', qbWin: true },
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
            Angi / Angie&apos;s List alternative
          </div>
          <h1 style={{
            fontFamily: "'Nautic', sans-serif",
            fontSize: 'clamp(2.2rem, 5vw, 3.6rem)',
            fontWeight: 800, lineHeight: 1.08, marginBottom: 24,
          }}>
            Stop Paying Angi<br />
            <span style={{ color: '#f4a93c' }}>Every Month for Shared Leads</span>
          </h1>
          <p style={{ fontSize: '1.05rem', color: 'rgba(255,255,255,0.75)', lineHeight: 1.75, marginBottom: 40, maxWidth: 580, margin: '0 auto 40px' }}>
            Angi charges a monthly subscription <em>and</em> per-lead fees for leads shared with competing movers and junk haulers. Quotebox gives you your own exclusive quote form, automatic follow-up, and CRM for a flat $34/month — no sharing, no contracts.
          </p>
          <Link href="/pricing" style={{
            background: '#f4a93c', color: '#201d3d', fontWeight: 800,
            padding: '14px 32px', borderRadius: 10, textDecoration: 'none', fontSize: '1rem',
          }}>
            See Pricing →
          </Link>
        </div>
      </section>

      {/* Comparison Table */}
      <section id="compare" style={{ padding: '72px 24px', background: '#f9fafb' }}>
        <div style={{ maxWidth: 840, margin: '0 auto' }}>
          <h2 style={{ fontFamily: "'Nautic', sans-serif", fontSize: 'clamp(1.7rem, 3vw, 2.4rem)', fontWeight: 700, textAlign: 'center', marginBottom: 40 }}>
            Quotebox vs Angi — Full Comparison
          </h2>
          <div style={{ background: 'white', borderRadius: 14, overflow: 'hidden', border: '1px solid #e5e7eb', boxShadow: '0 2px 16px rgba(0,0,0,0.06)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', background: '#201d3d', color: 'white' }}>
              <div style={{ padding: '16px 20px', fontWeight: 600, fontSize: '0.88rem' }}>Feature</div>
              <div style={{ padding: '16px 20px', fontWeight: 700, fontSize: '0.88rem', color: '#f4a93c', textAlign: 'center' }}>Quotebox</div>
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
          <h2 style={{ fontFamily: "'Nautic', sans-serif", fontSize: 'clamp(1.7rem, 3vw, 2.4rem)', fontWeight: 700, marginBottom: 32 }}>
            What Angi really costs movers per month
          </h2>
          <p style={{ color: '#4b5563', lineHeight: 1.75, fontSize: '1rem', marginBottom: 20 }}>
            A typical moving company on Angi pays $60/month in subscription fees plus $30–$50 per lead — and shares those leads with two or three competitors. If you receive 15 leads in a month, that&apos;s <strong>$60 + $675 = $735</strong> minimum, and you&apos;re still racing other movers to follow up first.
          </p>
          <p style={{ color: '#4b5563', lineHeight: 1.75, fontSize: '1rem', marginBottom: 20 }}>
            On Quotebox, that same month costs a flat <strong>$34</strong> — however many leads come in, and every single one is exclusively yours.
          </p>
          <p style={{ color: '#4b5563', lineHeight: 1.75, fontSize: '1rem', margin: 0 }}>
            And if business slows down, you just keep the same $34/month — no per-lead surprises. If you want to stop entirely, cancel anytime with no cancellation headaches, no 12-month contracts, no calls to a retention team.
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section style={{ padding: '72px 24px', background: '#f9fafb' }}>
        <div style={{ maxWidth: 700, margin: '0 auto' }}>
          <h2 style={{ fontFamily: "'Nautic', sans-serif", fontSize: 'clamp(1.7rem, 3vw, 2.2rem)', fontWeight: 700, marginBottom: 32, textAlign: 'center' }}>
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
      <section style={{ padding: '80px 24px', background: '#f4a93c' }}>
        <div style={{ maxWidth: 600, margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontFamily: "'Nautic', sans-serif", fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 800, color: '#201d3d', marginBottom: 16 }}>
            Cancel Angi. Keep the leads.
          </h2>
          <p style={{ color: '#201d3d', opacity: 0.75, marginBottom: 32, fontSize: '1.05rem', lineHeight: 1.65 }}>
            Build your form in under 10 minutes, starting at $99/month, and replace your Angi spend with your own exclusive quote form and CRM.
          </p>
          <Link href="/pricing" style={{
            display: 'inline-block', background: '#201d3d', color: '#f4a93c',
            fontWeight: 800, padding: '16px 40px', borderRadius: 10,
            textDecoration: 'none', fontSize: '1.05rem',
          }}>
            See Pricing →
          </Link>
        </div>
      </section>

      <PublicFooter />
    </div>
  )
}
