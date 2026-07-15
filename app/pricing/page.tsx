import Link from 'next/link'
import PublicNav from '@/components/PublicNav'
import PublicFooter from '@/components/PublicFooter'

export const metadata = {
  title: 'Pricing — Quotebox',
  description: 'Software, paid ad campaign setup, or fully managed — pick the plan that fits how much of the work you want us to do.',
}

const PLANS = [
  {
    id: 'software_99',
    label: 'Software',
    price: '$99',
    cadence: '/month',
    detail: 'Everything you need to run instant quotes, CRM, and follow-up yourself.',
    features: [
      'Branded instant quote form',
      'Unlimited leads',
      'Instant SMS + email follow-up',
      'Full CRM & lead pipeline',
      'Route & pricing calculator',
      'iOS app access',
    ],
    cta: 'Get Started — $99/mo',
    highlight: false,
  },
  {
    id: 'ad_setup_350',
    label: 'Paid Ad Campaign Setup',
    price: '$350',
    cadence: 'one-time',
    detail: 'We build and launch your Meta/Google paid ad campaign so leads start showing up.',
    features: [
      'Campaign targeting & budget setup',
      'Ad creative built for your brand',
      'Conversion tracking wired into your CRM',
      'One-time payment — no subscription',
    ],
    cta: 'Get Started — $350',
    highlight: false,
  },
  {
    id: 'fully_managed_750',
    label: 'Fully Managed',
    price: '$750',
    cadence: '/month',
    detail: 'Software plus done-for-you ad management and lead follow-up — we run it for you.',
    features: [
      'Everything in Software',
      'Done-for-you paid ad management',
      'Ongoing CRM & pipeline upkeep',
      'Priority support',
    ],
    cta: 'Get Started — $750/mo',
    highlight: true,
  },
] as const

export default function PricingPage() {
  return (
    <>
      <PublicNav />

      <section style={{ background: '#201d3d', color: 'white', padding: '64px 32px 80px', textAlign: 'center' }}>
        <div
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(244,169,60,0.14)',
            border: '1px solid rgba(244,169,60,0.4)', color: '#f4a93c', padding: '7px 16px',
            borderRadius: 999, fontSize: '0.78rem', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 20,
          }}
        >
          Pricing
        </div>
        <h1 style={{ fontFamily: "'Nautic', sans-serif", fontSize: 'clamp(28px,4.5vw,44px)', margin: '0 0 14px', fontWeight: 700 }}>
          Pick how much of the work you want us to do.
        </h1>
        <p style={{ fontSize: '1.05rem', color: 'rgba(255,255,255,0.65)', maxWidth: 560, margin: '0 auto' }}>
          Run it yourself with the software, get your ad campaign built for you, or hand us the whole thing.
        </p>
      </section>

      <section style={{ maxWidth: 1100, margin: '-48px auto 80px', padding: '0 24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24 }}>
          {PLANS.map((plan) => (
            <div
              key={plan.id}
              style={{
                background: 'white', borderRadius: 20, padding: '36px 30px', display: 'flex', flexDirection: 'column',
                boxShadow: plan.highlight
                  ? '0 24px 60px -20px rgba(32,29,61,0.35), 0 0 0 2px #201d3d'
                  : '0 12px 40px -20px rgba(0,0,0,0.25)',
              }}
            >
              {plan.highlight && (
                <div
                  style={{
                    alignSelf: 'flex-start', background: '#201d3d', color: '#f4a93c', fontSize: '0.72rem',
                    fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', padding: '5px 12px',
                    borderRadius: 999, marginBottom: 16,
                  }}
                >
                  Most popular
                </div>
              )}
              <h2 style={{ fontFamily: "'Nautic', sans-serif", fontSize: '1.15rem', fontWeight: 700, color: '#201d3d', margin: '0 0 8px' }}>
                {plan.label}
              </h2>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, marginBottom: 10 }}>
                <span style={{ fontFamily: "'Nautic', sans-serif", fontSize: '2.4rem', fontWeight: 700, color: '#201d3d' }}>{plan.price}</span>
                <span style={{ color: '#9ca3af', marginBottom: 6, fontSize: '0.95rem' }}>{plan.cadence}</span>
              </div>
              <p style={{ color: '#6b7280', fontSize: '0.9rem', lineHeight: 1.6, margin: '0 0 24px' }}>{plan.detail}</p>

              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 28px', display: 'flex', flexDirection: 'column', gap: 12, flex: 1 }}>
                {plan.features.map((f) => (
                  <li key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: '0.88rem', color: '#374151' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ marginTop: 2, flexShrink: 0 }}>
                      <path d="M20 6L9 17l-5-5" stroke="#201d3d" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    {f}
                  </li>
                ))}
              </ul>

              <Link
                href={`/build?plan=${plan.id}`}
                style={{
                  textAlign: 'center', padding: '13px 20px', borderRadius: 10, fontWeight: 700, fontSize: '0.92rem',
                  textDecoration: 'none',
                  background: plan.highlight ? '#201d3d' : '#f4f4f6',
                  color: plan.highlight ? '#f4a93c' : '#201d3d',
                }}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>

        <p style={{ textAlign: 'center', color: '#9ca3af', fontSize: '0.82rem', marginTop: 36 }}>
          Cancel anytime, no contract. Have questions?{' '}
          <Link href="/agency" style={{ color: '#5b5bd6', textDecoration: 'underline' }}>Learn more about done-for-you</Link>.
        </p>
      </section>

      <PublicFooter />
    </>
  )
}
