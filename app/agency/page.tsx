import Link from 'next/link'
import DealNotificationBanner from '@/components/DealNotificationBanner'

const faqs = [
  {
    q: 'What exactly is Fully Managed?',
    a: 'Fully Managed means you hand us the keys. We build your branded quote form, set up and run your paid Meta ads, and deliver warm leads directly to your dashboard. You do nothing except follow up and close the jobs.',
  },
  {
    q: 'How much does it cost?',
    a: 'You pay $15 per lead received — nothing else. No setup fee, no monthly retainer, no ad spend on top. We absorb the ad cost and only charge you when a real customer submits their details.',
  },
  {
    q: 'Do I need to do anything to get started?',
    a: 'Very little. We need your business name, service area, what services you offer, and any pricing information you want to show. We handle the form, the ads, the copy, and the targeting — typically live within 48 hours.',
  },
  {
    q: 'What kind of leads will I get?',
    a: 'People in your service area who clicked a targeted Facebook or Instagram ad, filled in a quote form with their service requirements, and saw an estimated price before submitting. These are warm, self-qualified leads — not scraped contacts or shared lists.',
  },
  {
    q: 'How is this different from other lead gen services?',
    a: 'Most services sell you shared leads — the same contact goes to 5 competitors. With Quotebox, every lead is exclusive to you. They came through your form, saw your prices, and are waiting to hear from your business specifically.',
  },
  {
    q: "What if I'm not happy with lead quality?",
    a: "We review every lead source and continuously optimise targeting. If a lead is clearly invalid (wrong area, wrong service, spam), flag it and we'll credit it back. We're only paid when it works, so lead quality is as important to us as it is to you.",
  },
  {
    q: 'Is there a contract or minimum spend?',
    a: 'No contract, no minimum. Top up credits when you need them and pause whenever you like. We want to earn your business every month.',
  },
  {
    q: 'How quickly will I start receiving leads?',
    a: 'Most clients receive their first lead within 24–72 hours of the campaign going live. Volume picks up as Meta\'s algorithm optimises your ads over the first week.',
  },
]

export default function AgencyPage() {
  return (
    <div style={{ fontFamily: "'Brraelyn', sans-serif", color: '#1a1a2e', background: '#fff' }}>

      {/* ── Arctic Reach banner ── */}
      <div style={{
        background: '#1a1a2e', color: 'rgba(255,255,255,0.55)',
        textAlign: 'center', fontSize: '0.72rem', padding: '6px 16px',
        letterSpacing: '0.03em',
      }}>
        Quotebox is a product of{' '}
        <span style={{ color: 'rgba(255,255,255,0.8)', fontWeight: 600 }}>Arctic Reach LLC</span>
        {' '}·{' '}
        <Link href="/privacy" style={{ color: 'rgba(255,255,255,0.5)', textDecoration: 'underline' }}>Privacy Policy</Link>
        {' '}·{' '}
        <Link href="/terms" style={{ color: 'rgba(255,255,255,0.5)', textDecoration: 'underline' }}>Terms of Service</Link>
      </div>

      {/* ── Nav ── */}
      <nav style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 32px', height: 60, borderBottom: '1px solid #f0f0f0',
        position: 'sticky', top: 0, background: 'white', zIndex: 50,
      }}>
        <Link href="/" style={{ fontFamily: "'Oswald', sans-serif", fontSize: '1.35rem', fontWeight: 700, letterSpacing: '0.01em', textDecoration: 'none', color: '#1a1a2e' }}>
          Quote<span style={{ color: '#FFE500', WebkitTextStroke: '1px #1a1a2e' }}>.</span>Box
        </Link>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <Link href="/" style={{ fontSize: '0.88rem', fontWeight: 500, color: '#555', textDecoration: 'none' }}>
            Self-serve
          </Link>
          <Link href="/login" style={{ fontSize: '0.88rem', fontWeight: 500, color: '#555', textDecoration: 'none' }}>
            Log in
          </Link>
          <a href="mailto:sales@quote-box.com?subject=Fully%20Managed%20Inquiry" style={{
            fontSize: '0.88rem', fontWeight: 600, padding: '8px 18px',
            background: '#1a1a2e', color: '#FFE500', borderRadius: 8, textDecoration: 'none',
          }}>
            Get started
          </a>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section style={{
        background: '#1a1a2e', color: 'white',
        padding: '90px 24px 80px', textAlign: 'center',
      }}>
        <div style={{ maxWidth: 760, margin: '0 auto' }}>
          <div style={{
            display: 'inline-block', background: '#FFE500', color: '#1a1a2e',
            fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.08em',
            textTransform: 'uppercase', padding: '5px 14px', borderRadius: 99, marginBottom: 28,
          }}>
            Fully managed — $15 per lead
          </div>
          <h1 style={{
            fontFamily: "'Oswald', sans-serif", fontSize: 'clamp(2.4rem, 6vw, 4rem)',
            fontWeight: 800, lineHeight: 1.1, marginBottom: 22,
          }}>
            We handle everything.<br />You just answer the phone.
          </h1>
          <p style={{ fontSize: '1.1rem', color: 'rgba(255,255,255,0.7)', lineHeight: 1.7, marginBottom: 40, maxWidth: 600, margin: '0 auto 40px' }}>
            We build your quote form, write your ad copy, run your Meta campaigns, and send warm leads with instant price estimates straight to your dashboard. You pay $15 per lead — only when it works.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <a href="mailto:sales@quote-box.com?subject=Fully%20Managed%20Inquiry" style={{
              padding: '15px 32px', background: '#FFE500', color: '#1a1a2e',
              fontWeight: 700, fontSize: '1rem', borderRadius: 10, textDecoration: 'none',
              fontFamily: "'Oswald', sans-serif", letterSpacing: '0.02em',
            }}>
              Get your first leads in 48hrs
            </a>
            <Link href="/#pricing" style={{
              padding: '15px 28px', background: 'rgba(255,255,255,0.08)', color: 'white',
              fontWeight: 600, fontSize: '0.92rem', borderRadius: 10, textDecoration: 'none',
              border: '1px solid rgba(255,255,255,0.18)',
            }}>
              Compare plans
            </Link>
          </div>
          <p style={{ marginTop: 22, fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)' }}>
            No setup fee · No monthly retainer · No ad spend to manage
          </p>
        </div>
      </section>

      {/* ── Social proof strip ── */}
      <div style={{
        background: '#FFE500', padding: '14px 24px', textAlign: 'center',
        fontSize: '0.88rem', fontWeight: 600, color: '#1a1a2e', letterSpacing: '0.01em',
      }}>
        Running done-for-you campaigns for cleaners, movers, landscapers, painters, photographers &amp; more
      </div>

      {/* ── What we do ── */}
      <section style={{ padding: '80px 24px', background: '#f9fafb' }}>
        <div style={{ maxWidth: 960, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 52 }}>
            <h2 style={{ fontFamily: "'Oswald', sans-serif", fontSize: '2rem', fontWeight: 700, marginBottom: 10 }}>
              From zero to leads in 48 hours.
            </h2>
            <p style={{ color: '#6b7280', fontSize: '1rem', maxWidth: 520, margin: '0 auto' }}>
              Tell us about your business. We do the rest.
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 28 }}>
            {[
              { n: '1', title: 'You tell us about your business', body: 'Your services, your area, your typical prices. A quick call or a few messages. That\'s all we need from you.' },
              { n: '2', title: 'We build and launch everything', body: 'We create your branded quote form with real pricing, write ad copy, and launch targeted campaigns on Facebook and Instagram.' },
              { n: '3', title: 'Customers land on your form', body: 'Ads go straight to your Quotebox form. Customers fill it in, see an instant price estimate, and submit their details.' },
              { n: '4', title: 'Leads land in your dashboard', body: 'Every submission arrives instantly with the customer\'s name, contact info, and quoted price. Follow up and close the job.' },
            ].map(({ n, title, body }) => (
              <div key={n} style={{ background: 'white', borderRadius: 14, padding: '32px 28px', boxShadow: '0 1px 6px rgba(0,0,0,0.06)' }}>
                <div style={{
                  width: 40, height: 40, borderRadius: '50%', background: '#1a1a2e',
                  color: '#FFE500', fontFamily: "'Oswald', sans-serif", fontSize: '1.1rem',
                  fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 18,
                }}>
                  {n}
                </div>
                <h3 style={{ fontFamily: "'Oswald', sans-serif", fontSize: '1.15rem', fontWeight: 700, marginBottom: 10 }}>{title}</h3>
                <p style={{ color: '#6b7280', fontSize: '0.92rem', lineHeight: 1.65 }}>{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── We handle the hard part ── */}
      <section style={{ padding: '72px 24px', background: '#1a1a2e' }}>
        <div style={{ maxWidth: 860, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 48, alignItems: 'center' }}>
          <div>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: 'rgba(255,229,0,0.12)', border: '1px solid rgba(255,229,0,0.3)',
              borderRadius: 99, padding: '5px 14px', marginBottom: 22,
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="#FFE500" xmlns="http://www.w3.org/2000/svg">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
              <span style={{ color: '#FFE500', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase' }}>
                Powered by Meta Ads
              </span>
            </div>
            <h2 style={{ fontFamily: "'Oswald', sans-serif", fontSize: '2rem', fontWeight: 800, color: 'white', lineHeight: 1.15, marginBottom: 18 }}>
              Running ads is a full-time job.<br />Let us do it for you.
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.97rem', lineHeight: 1.75, marginBottom: 24 }}>
              Most business owners set up a Facebook ad, spend $300, get nothing, and give up. Effective Meta campaigns require ongoing creative testing, audience refinement, bid optimisation, and constant monitoring. That&apos;s a full-time job.
            </p>
            <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.97rem', lineHeight: 1.75 }}>
              We handle all of it. Your job is to answer calls and close jobs. You only pay <strong style={{ color: '#FFE500' }}>$15 per lead</strong> — no retainer, no ad spend on top.
            </p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {[
              { label: 'Form built for you', desc: 'We build your branded quote form with real pricing, professional copy, and your brand colours.' },
              { label: 'Ad creative & copy written', desc: 'We write the ad, design the creative, and test variations to find what converts best in your market.' },
              { label: 'Audience targeting handled', desc: 'We target the right people in your area — homeowners, property managers, local businesses — based on your service type.' },
              { label: 'Dedicated account manager', desc: 'A real person monitors your campaigns, optimises performance, and is available when you need to talk.' },
            ].map(({ label, desc }) => (
              <div key={label} style={{
                background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 12, padding: '18px 20px', display: 'flex', gap: 14, alignItems: 'flex-start',
              }}>
                <span style={{ color: '#FFE500', fontWeight: 800, fontSize: '1rem', flexShrink: 0, marginTop: 1 }}>✓</span>
                <div>
                  <div style={{ color: 'white', fontWeight: 600, fontSize: '0.92rem', marginBottom: 4 }}>{label}</div>
                  <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.84rem', lineHeight: 1.5 }}>{desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Why fully managed ── */}
      <section style={{ padding: '80px 24px', background: 'white' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 52 }}>
            <h2 style={{ fontFamily: "'Oswald', sans-serif", fontSize: '2rem', fontWeight: 700, marginBottom: 10 }}>
              Why choose Fully Managed?
            </h2>
            <p style={{ color: '#6b7280', fontSize: '1rem', maxWidth: 520, margin: '0 auto' }}>
              For business owners who want leads, not a marketing education.
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 24 }}>
            {[
              { icon: '🚀', title: 'Live in 48 hours', body: 'Onboard today, live ads by tomorrow. No waiting weeks for an agency to "spin up."' },
              { icon: '💸', title: 'Pay per lead only', body: '$15 per lead received. Zero ad spend, zero setup fee, zero monthly retainer.' },
              { icon: '🎯', title: 'Exclusive leads', body: 'Every lead is yours alone — never shared with competitors. They came through your form, for your business.' },
              { icon: '📞', title: 'Warm, self-qualified', body: 'Leads filled in a pricing form and saw an estimate before submitting. They know what to expect.' },
              { icon: '👤', title: 'Dedicated manager', body: 'A real account manager monitors your campaigns and is on hand when you need to talk strategy.' },
              { icon: '🔒', title: 'No contract, no risk', body: 'Stop anytime. No lock-in, no cancellation fee, no minimum spend. We earn your business every month.' },
            ].map(({ icon, title, body }) => (
              <div key={title} style={{ padding: '24px', border: '1px solid #f0f0f0', borderRadius: 12 }}>
                <div style={{ fontSize: '1.6rem', marginBottom: 12 }}>{icon}</div>
                <h3 style={{ fontFamily: "'Oswald', sans-serif", fontSize: '1rem', fontWeight: 700, marginBottom: 7 }}>{title}</h3>
                <p style={{ color: '#6b7280', fontSize: '0.88rem', lineHeight: 1.6 }}>{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing callout ── */}
      <section style={{ padding: '72px 24px', background: '#f9fafb', textAlign: 'center' }}>
        <div style={{ maxWidth: 520, margin: '0 auto' }}>
          <h2 style={{ fontFamily: "'Oswald', sans-serif", fontSize: '2rem', fontWeight: 700, color: '#1a1a2e', marginBottom: 14 }}>
            Simple, performance-based pricing
          </h2>
          <p style={{ color: '#6b7280', fontSize: '1rem', lineHeight: 1.7, marginBottom: 36 }}>
            No retainer. No ad spend. No surprises. Just $15 per lead — only when a real customer submits your form.
          </p>
          <div style={{ background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: '36px 32px', marginBottom: 32 }}>
            <div style={{ fontFamily: "'Oswald', sans-serif", fontSize: '3.5rem', fontWeight: 800, color: '#FFE500', lineHeight: 1 }}>$15</div>
            <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.88rem', marginTop: 6, marginBottom: 24 }}>per lead received</div>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10, textAlign: 'left' }}>
              {[
                'We build your quote form for you',
                'Meta ads on Facebook & Instagram managed for you',
                'Exclusive leads — never shared with competitors',
                'Dedicated account manager',
                'Full lead details in your dashboard',
                'No monthly fee, no contract, no ad spend',
              ].map((item) => (
                <li key={item} style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'rgba(255,255,255,0.8)', fontSize: '0.9rem' }}>
                  <span style={{ color: '#FFE500', fontWeight: 700, flexShrink: 0 }}>✓</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <a href="mailto:sales@quote-box.com?subject=Fully%20Managed%20Inquiry" style={{
            display: 'inline-block', padding: '15px 36px', background: '#1a1a2e',
            color: '#FFE500', fontWeight: 700, fontSize: '1rem', borderRadius: 10,
            textDecoration: 'none', fontFamily: "'Oswald', sans-serif", letterSpacing: '0.02em',
          }}>
            Get in touch — no commitment
          </a>
        </div>
      </section>

      {/* ── FAQs ── */}
      <section style={{ padding: '80px 24px', background: '#f9fafb' }}>
        <div style={{ maxWidth: 700, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 52 }}>
            <h2 style={{ fontFamily: "'Oswald', sans-serif", fontSize: '2rem', fontWeight: 700, marginBottom: 10 }}>
              Frequently asked questions
            </h2>
            <p style={{ color: '#6b7280', fontSize: '1rem' }}>
              Everything you need to know about Fully Managed.
            </p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {faqs.map(({ q, a }, i) => (
              <details key={i} style={{
                background: 'white', borderRadius: 10, overflow: 'hidden',
                border: '1px solid #e5e7eb',
              }}>
                <summary style={{
                  padding: '20px 24px', fontWeight: 600, fontSize: '0.95rem',
                  cursor: 'pointer', listStyle: 'none', display: 'flex',
                  justifyContent: 'space-between', alignItems: 'center', userSelect: 'none',
                }}>
                  {q}
                  <span style={{ color: '#9ca3af', fontSize: '1.2rem', flexShrink: 0, marginLeft: 16 }}>+</span>
                </summary>
                <div style={{ padding: '0 24px 20px', color: '#6b7280', fontSize: '0.92rem', lineHeight: 1.7 }}>
                  {a}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section style={{ padding: '80px 24px', background: '#FFE500', textAlign: 'center' }}>
        <div style={{ maxWidth: 600, margin: '0 auto' }}>
          <h2 style={{ fontFamily: "'Oswald', sans-serif", fontSize: '2.2rem', fontWeight: 800, color: '#1a1a2e', marginBottom: 14 }}>
            Ready for your first lead?
          </h2>
          <p style={{ fontSize: '1rem', color: 'rgba(26,26,46,0.7)', lineHeight: 1.7, marginBottom: 36 }}>
            Get in touch today. We&apos;ll be live within 48 hours — no website, no ad account, no setup fee required.
          </p>
          <a href="mailto:sales@quote-box.com?subject=Fully%20Managed%20Inquiry" style={{
            display: 'inline-block', padding: '16px 40px', background: '#1a1a2e',
            color: '#FFE500', fontWeight: 700, fontSize: '1.05rem', borderRadius: 10,
            textDecoration: 'none', fontFamily: "'Oswald', sans-serif", letterSpacing: '0.02em',
          }}>
            Contact us — it&apos;s free to start
          </a>
          <p style={{ marginTop: 16, fontSize: '0.82rem', color: 'rgba(26,26,46,0.5)' }}>
            Or email us at{' '}
            <a href="mailto:sales@quote-box.com" style={{ color: '#1a1a2e', fontWeight: 600 }}>
              sales@quote-box.com
            </a>
          </p>
        </div>
      </section>

      {/* Deal notification toasts */}
      <DealNotificationBanner />

      {/* ── Footer ── */}
      <footer style={{ background: '#1a1a2e', padding: '28px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <Link href="/" style={{ fontFamily: "'Oswald', sans-serif", fontSize: '1rem', fontWeight: 700, color: 'white', textDecoration: 'none' }}>
          Quote<span style={{ color: '#FFE500' }}>.</span>Box
        </Link>
        <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.35)' }}>
          © {new Date().getFullYear()} Quotebox. All rights reserved.
        </span>
        <div style={{ display: 'flex', gap: 20 }}>
          <Link href="/" style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.45)', textDecoration: 'none' }}>Home</Link>
          <Link href="/login" style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.45)', textDecoration: 'none' }}>Log in</Link>
          <Link href="/signup" style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.45)', textDecoration: 'none' }}>Sign up</Link>
        </div>
      </footer>

    </div>
  )
}
