import type { Metadata } from 'next'
import Link from 'next/link'
import PublicNav from '@/components/PublicNav'
import PublicFooter from '@/components/PublicFooter'
import QualifyForm from './QualifyForm'

export const metadata: Metadata = {
  title: 'Moving Company Meta Ads Management — Monthly | Quotebox',
  description: 'We manage your Facebook & Instagram ads for your moving company. Exclusive leads delivered to your dashboard. Requires $50+/day ad spend. No long-term contracts.',
  keywords: ['moving company leads', 'moving company ads management', 'Facebook ads for movers', 'Meta ads moving company', 'moving leads'],
  alternates: { canonical: 'https://quote-box.com/moving-management' },
  openGraph: {
    title: 'Moving Company Meta Ads Management — Monthly | Quotebox',
    description: 'We manage your Facebook & Instagram ads for your moving company. Exclusive leads, no long-term contracts.',
    url: 'https://quote-box.com/moving-management',
  },
}

const faqs = [
  {
    q: 'What is included in monthly Meta ads management?',
    a: 'We handle everything: audience targeting, creative strategy, ad copywriting, campaign setup, ongoing optimization, and lead delivery to your Quotebox dashboard. You focus on booking jobs — we handle the ads.',
  },
  {
    q: 'Why do you require $50/day in ad spend?',
    a: "Meta's algorithm needs data to optimize. Accounts spending less than $50/day rarely exit the learning phase, which means higher costs and fewer leads. We require a minimum to protect your results and our reputation.",
  },
  {
    q: 'Are the moving leads exclusive to my company?',
    a: 'Yes. Every lead captured through your managed campaign goes only to you. We never resell or share leads with competing movers in your market.',
  },
  {
    q: 'How quickly can my ads go live?',
    a: 'Typically within 48 hours of onboarding. We build your lead form, configure targeting for your service area, and launch — fast.',
  },
  {
    q: 'Is there a long-term contract?',
    a: 'No. Management is month-to-month. You can pause or cancel with 30 days notice. We earn your business every month by delivering results.',
  },
]

export default function MovingManagementPage() {
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
            📦 Monthly Meta Ads Management
          </div>
          <h1 style={{
            fontFamily: "'Oswald', sans-serif",
            fontSize: 'clamp(2.4rem, 5vw, 3.8rem)',
            fontWeight: 800, lineHeight: 1.08, marginBottom: 24,
          }}>
            We Run Your Moving<br />
            <span style={{ color: '#FFE500' }}>Company's Meta Ads.</span>
          </h1>
          <p style={{ fontSize: '1.05rem', color: 'rgba(255,255,255,0.7)', lineHeight: 1.75, marginBottom: 40, maxWidth: 580, margin: '0 auto 40px' }}>
            Done-for-you Facebook & Instagram ad management for moving companies. Exclusive leads delivered to your dashboard every day. No long-term contracts.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <a href="#qualify" style={{
              background: '#FFE500', color: '#0e0020', fontWeight: 700,
              padding: '14px 32px', borderRadius: 10, textDecoration: 'none', fontSize: '1rem',
            }}>
              See if we're a fit →
            </a>
            <Link href="/agency" style={{
              background: 'rgba(255,255,255,0.1)', color: 'white', fontWeight: 600,
              padding: '14px 32px', borderRadius: 10, textDecoration: 'none', fontSize: '1rem',
              border: '1px solid rgba(255,255,255,0.2)',
            }}>
              Learn about our agency
            </Link>
          </div>
        </div>
      </section>

      {/* Social proof strip */}
      <section style={{ background: '#FFE500', padding: '16px 24px' }}>
        <div style={{
          maxWidth: 800, margin: '0 auto',
          display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '8px 32px',
        }}>
          {['Ads live in 48 hrs', 'Exclusive moving leads', 'Cancel anytime'].map(text => (
            <span key={text} style={{ fontWeight: 700, color: '#0e0020', fontSize: '0.9rem' }}>
              ✓ {text}
            </span>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section style={{ padding: '72px 24px', background: '#fff' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <h2 style={{ fontFamily: "'Oswald', sans-serif", fontSize: 'clamp(1.8rem, 3.5vw, 2.6rem)', fontWeight: 700, textAlign: 'center', marginBottom: 48 }}>
            How It Works
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 24 }}>
            {[
              { step: '1', title: 'We build your form', body: 'A branded moving quote form tailored to your services and service area — ready to capture real move requests.' },
              { step: '2', title: 'Ads go live', body: 'We launch targeted Facebook & Instagram campaigns in your market within 48 hours of onboarding.' },
              { step: '3', title: 'Leads hit your dashboard', body: 'Every submission lands in your Quotebox dashboard in real time — name, phone, move date, origin and destination.' },
              { step: '4', title: 'You close jobs', body: 'Call the lead, give a quote, book the move. We keep the pipeline full so you can focus on your crew.' },
            ].map(({ step, title, body }) => (
              <div key={step} style={{ textAlign: 'center', padding: '24px 16px' }}>
                <div style={{
                  width: 48, height: 48, borderRadius: '50%', background: '#FFE500',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: "'Oswald', sans-serif", fontWeight: 800, fontSize: '1.3rem',
                  color: '#0e0020', margin: '0 auto 16px',
                }}>
                  {step}
                </div>
                <h3 style={{ fontWeight: 700, fontSize: '1rem', marginBottom: 8 }}>{title}</h3>
                <p style={{ color: '#6b7280', lineHeight: 1.65, fontSize: '0.88rem', margin: 0 }}>{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits grid */}
      <section style={{ padding: '72px 24px', background: '#fff', borderTop: '1px solid #f3f4f6' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <h2 style={{ fontFamily: "'Oswald', sans-serif", fontSize: 'clamp(1.8rem, 3.5vw, 2.6rem)', fontWeight: 700, textAlign: 'center', marginBottom: 48 }}>
            Built for moving companies
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 24 }}>
            {[
              { icon: '🔒', title: 'Exclusive leads — always', body: 'No other mover in your market gets the same lead. Every form submission is 100% yours.' },
              { icon: '🗺️', title: 'Your service area only', body: 'Ads target the exact cities and zip codes your trucks serve — no wasted spend on out-of-range moves.' },
              { icon: '⚡', title: 'Real-time dashboard delivery', body: 'Lead details hit your dashboard instantly — name, phone, move date, and origin/destination zip.' },
              { icon: '📅', title: 'Scale with moving season', body: 'Increase ad spend in spring and summer, pull back in winter. We optimize as you scale.' },
              { icon: '🏷️', title: 'Branded to your company', body: 'Customers see your logo and name — not a marketplace. Higher trust, higher close rate.' },
              { icon: '📞', title: 'No long-term contract', body: 'Month-to-month management. Pause or cancel anytime with 30 days notice.' },
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

      {/* Qualification Form */}
      <section id="qualify" style={{ padding: '72px 24px', background: '#f9fafb' }}>
        <div style={{ maxWidth: 580, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 36 }}>
            <h2 style={{ fontFamily: "'Oswald', sans-serif", fontSize: 'clamp(1.8rem, 3.5vw, 2.6rem)', fontWeight: 700, marginBottom: 12 }}>
              Apply for managed ads
            </h2>
            <p style={{ color: '#6b7280', fontSize: '0.95rem', lineHeight: 1.7 }}>
              We work with moving companies spending $50+/day on Meta. Fill out the form below and we'll reach out within 1 business day.
            </p>
          </div>
          <QualifyForm />
        </div>
      </section>

      {/* FAQ */}
      <section style={{ padding: '72px 24px', background: '#fff' }}>
        <div style={{ maxWidth: 700, margin: '0 auto' }}>
          <h2 style={{ fontFamily: "'Oswald', sans-serif", fontSize: 'clamp(1.7rem, 3vw, 2.2rem)', fontWeight: 700, marginBottom: 32, textAlign: 'center' }}>
            Moving Management FAQ
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {faqs.map(({ q, a }, i) => (
              <details key={i} style={{ background: '#f9fafb', borderRadius: 10, overflow: 'hidden', border: '1px solid #e5e7eb' }}>
                <summary style={{ padding: '18px 22px', fontWeight: 600, cursor: 'pointer', fontSize: '0.97rem', listStyle: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  {q}<span style={{ fontSize: '1.1rem', color: '#9ca3af', flexShrink: 0, marginLeft: 12 }}>+</span>
                </summary>
                <div style={{ padding: '0 22px 18px', color: '#4b5563', lineHeight: 1.7, fontSize: '0.93rem' }}>{a}</div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section style={{ padding: '72px 24px', background: '#FFE500' }}>
        <div style={{ maxWidth: 580, margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontFamily: "'Oswald', sans-serif", fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 800, color: '#0e0020', marginBottom: 16 }}>
            Ready to fill your moving schedule?
          </h2>
          <p style={{ color: '#0e0020', opacity: 0.7, marginBottom: 32, fontSize: '1rem', lineHeight: 1.65 }}>
            Ads live in 48 hours. Exclusive leads. No long-term contract.
          </p>
          <a href="#qualify" style={{
            display: 'inline-block', background: '#0e0020', color: '#FFE500',
            fontWeight: 700, padding: '16px 40px', borderRadius: 10,
            textDecoration: 'none', fontSize: '1.05rem',
          }}>
            Apply for managed ads →
          </a>
        </div>
      </section>

      <PublicFooter />
    </div>
  )
}
