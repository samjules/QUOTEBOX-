import type { Metadata } from 'next'
import Link from 'next/link'
import PublicNav from '@/components/PublicNav'
import PublicFooter from '@/components/PublicFooter'

export const metadata: Metadata = {
  title: 'Quotebox vs Thumbtack — Exclusive Moving & Junk Removal Leads Without the Bidding War',
  description: 'Thumbtack sends your lead to 5 movers and charges you to bid. Quotebox gives you exclusive moving and junk removal leads for $15 flat — no bidding, no sharing, no monthly fees. See the full comparison.',
  alternates: { canonical: 'https://quote-box.com/vs-thumbtack' },
  openGraph: {
    title: 'Quotebox vs Thumbtack | Quotebox',
    description: 'Thumbtack charges you just to send a bid and shares your lead with 5 competitors. Quotebox: $15 flat, exclusive leads, no bidding.',
    url: 'https://quote-box.com/vs-thumbtack',
  },
}

const faqs = [
  {
    q: 'Does Thumbtack share moving leads with multiple companies?',
    a: 'Yes. Thumbtack sends the same lead to up to five moving or junk removal companies simultaneously. You are competing against four other businesses the moment you receive that lead.',
  },
  {
    q: 'How much does Thumbtack charge per moving lead?',
    a: 'Thumbtack charges a "bid fee" of $3–$75+ per quote you send — and you pay that fee whether you win the job or not. Lead prices vary by market and service type and are not transparent upfront.',
  },
  {
    q: 'Does Thumbtack have a monthly fee?',
    a: 'Thumbtack Pro plans start at $0 but Thumbtack Promote (to appear at the top of search results) runs $119–$200+ per month on top of per-lead fees.',
  },
  {
    q: 'Are Quotebox leads exclusive?',
    a: 'Yes. When a customer fills out your Quotebox form they see only your company. No other mover or junk hauler on earth receives that same lead.',
  },
  {
    q: "What happens to my Thumbtack customers when I switch?",
    a: "Thumbtack owns the customer relationship. When you switch away, you lose access to those reviews and contacts. With Quotebox you collect the customer's direct contact info and they become your customer — not the platform's.",
  },
]

const rows = [
  { feature: 'Lead exclusivity', qb: 'Exclusive — only you', tt: 'Shared with up to 5 companies', qbWin: true },
  { feature: 'Cost per lead', qb: '$15 flat', tt: '$3–$75+ bid fee (win or lose)', qbWin: true },
  { feature: 'Monthly subscription', qb: '$0', tt: '$0–$200+ (Promote plan)', qbWin: true },
  { feature: 'Pay only when you get the lead', qb: 'Yes', tt: 'No — pay to bid', qbWin: true },
  { feature: 'Your own branded form', qb: 'Yes', tt: 'Generic Thumbtack profile', qbWin: true },
  { feature: 'You own the customer data', qb: 'Yes', tt: 'Thumbtack owns it', qbWin: true },
  { feature: 'Ad targeting control', qb: 'City / zip / radius', tt: 'Platform-controlled', qbWin: true },
  { feature: 'No contract required', qb: 'Yes', tt: 'Promote requires commitment', qbWin: true },
  { feature: 'Instant lead notification', qb: 'Yes', tt: 'Yes', qbWin: false },
  { feature: 'Works without a website', qb: 'Yes', tt: 'Yes', qbWin: false },
]

export default function VsThumbthackPage() {
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
    <div style={{ fontFamily: "'Sanguard', sans-serif", color: '#0e0020', background: '#fff' }}>
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
            Thumbtack alternative
          </div>
          <h1 style={{
            fontFamily: "'Oswald', sans-serif",
            fontSize: 'clamp(2.2rem, 5vw, 3.6rem)',
            fontWeight: 800, lineHeight: 1.08, marginBottom: 24,
          }}>
            Why Movers & Junk Haulers Are<br />
            <span style={{ color: '#FFE500' }}>Ditching Thumbtack</span>
          </h1>
          <p style={{ fontSize: '1.05rem', color: 'rgba(255,255,255,0.7)', lineHeight: 1.75, marginBottom: 40, maxWidth: 580, margin: '0 auto 40px' }}>
            Thumbtack sends your lead to five competitors and charges you to bid whether you win or lose. Quotebox gives you the lead exclusively for $15 flat — guaranteed.
          </p>
          <Link href="/signup" style={{
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
          <h2 style={{
            fontFamily: "'Oswald', sans-serif", fontSize: 'clamp(1.7rem, 3vw, 2.4rem)',
            fontWeight: 700, textAlign: 'center', marginBottom: 40,
          }}>
            Quotebox vs Thumbtack — Full Comparison
          </h2>
          <div style={{ background: 'white', borderRadius: 14, overflow: 'hidden', border: '1px solid #e5e7eb', boxShadow: '0 2px 16px rgba(0,0,0,0.06)' }}>
            {/* Header row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', background: '#0e0020', color: 'white' }}>
              <div style={{ padding: '16px 20px', fontWeight: 600, fontSize: '0.88rem' }}>Feature</div>
              <div style={{ padding: '16px 20px', fontWeight: 700, fontSize: '0.88rem', color: '#FFE500', textAlign: 'center' }}>Quotebox</div>
              <div style={{ padding: '16px 20px', fontWeight: 600, fontSize: '0.88rem', color: 'rgba(255,255,255,0.55)', textAlign: 'center' }}>Thumbtack</div>
            </div>
            {rows.map(({ feature, qb, tt, qbWin }, i) => (
              <div key={feature} style={{
                display: 'grid', gridTemplateColumns: '1fr 1fr 1fr',
                background: i % 2 === 0 ? '#fff' : '#f9fafb',
                borderTop: '1px solid #e5e7eb',
              }}>
                <div style={{ padding: '14px 20px', fontSize: '0.91rem', fontWeight: 500 }}>{feature}</div>
                <div style={{ padding: '14px 20px', fontSize: '0.91rem', textAlign: 'center', color: qbWin ? '#059669' : '#374151', fontWeight: qbWin ? 600 : 400 }}>
                  {qbWin && <span style={{ marginRight: 6 }}>✓</span>}{qb}
                </div>
                <div style={{ padding: '14px 20px', fontSize: '0.91rem', textAlign: 'center', color: qbWin ? '#dc2626' : '#374151' }}>
                  {qbWin && <span style={{ marginRight: 6 }}>✗</span>}{tt}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* The real cost of Thumbtack */}
      <section style={{ padding: '72px 24px', background: '#fff' }}>
        <div style={{ maxWidth: 760, margin: '0 auto' }}>
          <h2 style={{
            fontFamily: "'Oswald', sans-serif", fontSize: 'clamp(1.7rem, 3vw, 2.4rem)',
            fontWeight: 700, marginBottom: 32,
          }}>
            The real cost of Thumbtack for movers
          </h2>
          <p style={{ color: '#4b5563', lineHeight: 1.75, fontSize: '1rem', marginBottom: 20 }}>
            Say you&apos;re a moving company looking for 10 jobs a month. On Thumbtack you might pay $20–$50 per bid — and if five other movers are also bidding, you&apos;re winning roughly one in five. That means you could spend $400–$1,000 in bid fees to land 10 jobs.
          </p>
          <p style={{ color: '#4b5563', lineHeight: 1.75, fontSize: '1rem', marginBottom: 20 }}>
            On Quotebox those same 10 leads cost <strong>$150 total</strong>. Every single one is yours — no bidding, no competition, no fees for leads you don&apos;t win.
          </p>
          <p style={{ color: '#4b5563', lineHeight: 1.75, fontSize: '1rem', margin: 0 }}>
            And unlike Thumbtack, your customers&apos; contact information is yours. You can follow up, re-market, and build a repeat-client base that no platform can ever take away.
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section style={{ padding: '72px 24px', background: '#f9fafb' }}>
        <div style={{ maxWidth: 700, margin: '0 auto' }}>
          <h2 style={{ fontFamily: "'Oswald', sans-serif", fontSize: 'clamp(1.7rem, 3vw, 2.2rem)', fontWeight: 700, marginBottom: 32, textAlign: 'center' }}>
            Common questions about switching from Thumbtack
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
            Ready to stop bidding?
          </h2>
          <p style={{ color: '#0e0020', opacity: 0.7, marginBottom: 32, fontSize: '1.05rem', lineHeight: 1.65 }}>
            Sign up free and get exclusive moving and junk removal leads for $15 each — without ever competing against five other companies for the same job.
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
