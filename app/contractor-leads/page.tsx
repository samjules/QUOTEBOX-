import type { Metadata } from 'next'
import Link from 'next/link'
import PublicNav from '@/components/PublicNav'
import PublicFooter from '@/components/PublicFooter'

export const metadata: Metadata = {
  title: 'Moving & Junk Removal Lead Capture Software | Quotebox',
  description: 'Turn website visitors into booked jobs. Quotebox gives moving and junk removal companies a branded instant-quote form, automatic SMS & email follow-up, and a full CRM — all in one platform. Try it for $1 your first month.',
  alternates: { canonical: 'https://quote-box.com/contractor-leads' },
  openGraph: {
    title: 'Moving & Junk Removal Lead Capture Software | Quotebox',
    description: 'A branded instant-quote form, automatic follow-up, and CRM built for moving and junk removal companies. Try it for $1.',
    url: 'https://quote-box.com/contractor-leads',
  },
}

const faqs = [
  {
    q: 'How much does Quotebox cost?',
    a: 'Your first month is $1, full access, no feature limits. After that it renews at $34/month. No per-lead fees, no bidding, no contract — cancel anytime.',
  },
  {
    q: 'Are the leads exclusive to me?',
    a: 'Yes. When someone fills out your Quotebox form, you are the only company who receives that lead. Unlike Thumbtack, which sends the same lead to up to five movers or junk haulers, your Quotebox leads are 100% exclusive.',
  },
  {
    q: 'How does Quotebox compare to Thumbtack?',
    a: 'On Thumbtack you pay a bid fee just to send a quote — and five other moving companies are doing the same. On Quotebox you get your own branded instant-quote form and CRM for a flat $34/month, and no competitor ever sees that customer.',
  },
  {
    q: "How does Quotebox compare to Angi (Angie's List)?",
    a: "Angi charges $40–$100+ per month plus separate lead fees, and those leads are still shared with competitors. Quotebox is $1 for your first month, then a flat $34/month. You're not on a marketplace — it's your form, your brand, your customers.",
  },
  {
    q: 'What types of companies use Quotebox?',
    a: 'Local movers, long-distance moving companies, junk removal and hauling companies, estate cleanout services, pressure washing businesses, mobile car detailers, and any business that quotes customers before the job.',
  },
  {
    q: 'How fast do I get leads?',
    a: 'Instantly. The moment someone submits your form, you get a push notification on the mobile app and their details appear in your dashboard. There is no delay and no middleman.',
  },
  {
    q: 'Do I need a website or marketing experience?',
    a: 'No. Quotebox builds your branded quote form in a guided setup wizard — most owners are live in under 10 minutes. If you want to run Facebook and Instagram ads pointing to that form, you can connect your Meta ads account right from the dashboard.',
  },
  {
    q: 'What areas can I target?',
    a: 'Any city, zip code, or radius you choose. If you connect Meta ads, you control the geographic targeting of your campaigns, so you only get leads from the areas you actually serve.',
  },
  {
    q: 'Is there a contract or minimum commitment?',
    a: 'No. Cancel anytime from your dashboard in a couple of clicks. There is no lock-in, no minimum spend, and no cancellation fee.',
  },
]

const services = [
  { label: 'Moving Leads', href: '/electrician-leads', icon: '🚚' },
  { label: 'Junk Removal Leads', href: '/hvac-leads', icon: '🗑️' },
  { label: 'Local Moving', href: '/plumbing-leads', icon: '📦' },
  { label: 'Estate Cleanout', href: '/roofing-leads', icon: '🏠' },
  { label: 'Pressure Washing', href: '/build', icon: '🧽' },
  { label: 'Car Detailing', href: '/build', icon: '🚗' },
  { label: 'Hoarding Cleanup', href: '/roofing-leads', icon: '🧹' },
  { label: 'Storage & Hauling', href: '/hvac-leads', icon: '🛻' },
]

export default function ContractorLeadsPage() {
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

      {/* ── Hero ── */}
      <section style={{ background: '#453bc2', color: 'white', padding: '80px 24px 72px' }}>
        <div style={{ maxWidth: 800, margin: '0 auto', textAlign: 'center' }}>
          <div style={{
            display: 'inline-block', background: '#f4a93c', color: '#201d3d',
            fontSize: '0.73rem', fontWeight: 700, letterSpacing: '0.08em',
            textTransform: 'uppercase', padding: '5px 14px', borderRadius: 99, marginBottom: 28,
          }}>
            Your own quote form — not a shared marketplace
          </div>
          <h1 style={{
            fontFamily: "'Nautic', sans-serif",
            fontSize: 'clamp(2.4rem, 5vw, 3.8rem)',
            fontWeight: 800, lineHeight: 1.08, marginBottom: 24,
          }}>
            Moving & Junk Removal Leads,<br />
            <span style={{ color: '#f4a93c' }}>Tracked All the Way to Booked.</span>
          </h1>
          <p style={{ fontSize: '1.1rem', color: 'rgba(255,255,255,0.75)', lineHeight: 1.75, marginBottom: 40, maxWidth: 600, margin: '0 auto 40px' }}>
            A branded instant-quote form, automatic SMS &amp; email follow-up, and a full CRM — all in one platform. No bidding against five other movers or junk haulers for the same customer. Try it for $1 your first month.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/pricing" style={{
              background: '#f4a93c', color: '#201d3d', fontWeight: 800,
              padding: '14px 32px', borderRadius: 10, textDecoration: 'none', fontSize: '1rem',
            }}>
              See Pricing →
            </Link>
            <Link href="/vs-thumbtack" style={{
              background: 'rgba(255,255,255,0.1)', color: 'white', fontWeight: 600,
              padding: '14px 32px', borderRadius: 10, textDecoration: 'none', fontSize: '1rem',
              border: '1px solid rgba(255,255,255,0.2)',
            }}>
              vs Thumbtack →
            </Link>
          </div>
        </div>
      </section>

      {/* ── Why Quotebox wins ── */}
      <section style={{ padding: '72px 24px', background: '#fff' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <h2 style={{
            fontFamily: "'Nautic', sans-serif", fontSize: 'clamp(1.8rem, 3.5vw, 2.6rem)',
            fontWeight: 700, textAlign: 'center', marginBottom: 12,
          }}>
            Why movers and junk haulers are ditching Thumbtack & Angi
          </h2>
          <p style={{ textAlign: 'center', color: '#6b7280', marginBottom: 52, fontSize: '1rem' }}>
            The same lead sent to 5 companies is not a lead — it&apos;s a race to the bottom.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24 }}>
            {[
              {
                icon: '📋',
                title: 'Your own branded quote form',
                body: 'When a customer fills out your form, you are the only company who gets their info. No auctions. No bidding wars.',
              },
              {
                icon: '💬',
                title: 'Automatic follow-up, instantly',
                body: 'Every new lead gets an SMS and email reply the moment they submit — even at 11pm on a Sunday, before a competitor calls back.',
              },
              {
                icon: '🏷️',
                title: 'Your brand, not ours',
                body: "Customers see your company name and logo, not a marketplace. You build trust and repeat business that Thumbtack and Angi can't take from you.",
              },
              {
                icon: '📱',
                title: 'Facebook & Instagram, connected',
                body: 'Connect your Meta ads account and every campaign lead lands straight in your CRM, with cost-per-lead tracked automatically.',
              },
              {
                icon: '⚡',
                title: 'Instant lead delivery',
                body: 'The second someone submits the form you get a push notification, plus their name, number, and job details in your dashboard.',
              },
              {
                icon: '🚫',
                title: 'No contracts. Ever.',
                body: 'A flat $34/month after your $1 first month. No minimum spend, no lock-in. Cancel anytime from your dashboard.',
              },
            ].map(({ icon, title, body }) => (
              <div key={title} style={{
                background: '#f9fafb', borderRadius: 12, padding: '28px 24px',
                border: '1px solid #e5e7eb',
              }}>
                <div style={{ fontSize: '1.8rem', marginBottom: 12 }}>{icon}</div>
                <h3 style={{ fontWeight: 700, fontSize: '1.05rem', marginBottom: 8 }}>{title}</h3>
                <p style={{ color: '#6b7280', lineHeight: 1.65, fontSize: '0.92rem', margin: 0 }}>{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section style={{ padding: '72px 24px', background: '#f9fafb' }}>
        <div style={{ maxWidth: 800, margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{
            fontFamily: "'Nautic', sans-serif", fontSize: 'clamp(1.8rem, 3.5vw, 2.6rem)',
            fontWeight: 700, marginBottom: 48,
          }}>
            Three steps to your first booked job
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 32 }}>
            {[
              { step: '1', title: 'Build your form', body: 'Answer a few questions about your business and your quote form is live in under 10 minutes.' },
              { step: '2', title: 'Drive traffic to it', body: 'Share your form link, add it to your website, or connect Meta ads to run Facebook & Instagram campaigns pointing to it.' },
              { step: '3', title: 'Track it to booked', body: 'Every customer who fills out your form lands exclusively in your CRM, gets an instant automated reply, and you follow up to close the job.' },
            ].map(({ step, title, body }) => (
              <div key={step} style={{ textAlign: 'center' }}>
                <div style={{
                  width: 56, height: 56, borderRadius: '50%',
                  background: '#201d3d', color: '#f4a93c',
                  fontFamily: "'Nautic', sans-serif", fontSize: '1.6rem', fontWeight: 700,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 16px',
                }}>
                  {step}
                </div>
                <h3 style={{ fontWeight: 700, fontSize: '1.05rem', marginBottom: 8 }}>{title}</h3>
                <p style={{ color: '#6b7280', lineHeight: 1.65, fontSize: '0.92rem', margin: 0 }}>{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Services we serve ── */}
      <section style={{ padding: '72px 24px', background: '#fff' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <h2 style={{
            fontFamily: "'Nautic', sans-serif", fontSize: 'clamp(1.8rem, 3.5vw, 2.4rem)',
            fontWeight: 700, textAlign: 'center', marginBottom: 12,
          }}>
            Built for every home & auto service business
          </h2>
          <p style={{ textAlign: 'center', color: '#6b7280', marginBottom: 40, fontSize: '1rem' }}>
            If you quote before you work, Quotebox works for you.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12 }}>
            {services.map(({ label, href, icon }) => (
              <Link key={label} href={href} style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
                background: '#f9fafb', borderRadius: 12, padding: '20px 12px',
                border: '1px solid #e5e7eb', textDecoration: 'none', color: '#201d3d',
                transition: 'border-color 0.15s',
              }}>
                <span style={{ fontSize: '1.8rem' }}>{icon}</span>
                <span style={{ fontWeight: 600, fontSize: '0.88rem' }}>{label}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Social proof ── */}
      <section style={{ padding: '72px 24px', background: '#453bc2', color: 'white' }}>
        <div style={{ maxWidth: 800, margin: '0 auto', textAlign: 'center' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 32 }}>
            {[
              { stat: '$1', label: 'Your first month' },
              { stat: '685', label: 'Leads captured for one real customer' },
              { stat: '100%', label: 'Leads exclusive to you' },
              { stat: '<10 min', label: 'To launch your first form' },
            ].map(({ stat, label }) => (
              <div key={label}>
                <div style={{ fontFamily: "'Nautic', sans-serif", fontSize: '2.8rem', fontWeight: 700, color: '#f4a93c', lineHeight: 1 }}>{stat}</div>
                <div style={{ fontSize: '0.88rem', color: 'rgba(255,255,255,0.7)', marginTop: 8, lineHeight: 1.4 }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" style={{ padding: '80px 24px', background: '#f9fafb' }}>
        <div style={{ maxWidth: 700, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 52 }}>
            <h2 style={{ fontFamily: "'Nautic', sans-serif", fontSize: 'clamp(1.8rem, 3vw, 2.4rem)', fontWeight: 700, marginBottom: 12 }}>
              Moving & Junk Removal Lead FAQ
            </h2>
            <p style={{ color: '#6b7280', fontSize: '1rem', margin: 0 }}>
              Everything movers and junk haulers ask before switching from Thumbtack or Angi.
            </p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {faqs.map(({ q, a }, i) => (
              <details key={i} style={{
                background: 'white', borderRadius: 10, overflow: 'hidden',
                border: '1px solid #e5e7eb',
              }}>
                <summary style={{
                  padding: '18px 22px', fontWeight: 600, cursor: 'pointer',
                  fontSize: '0.97rem', listStyle: 'none', display: 'flex',
                  justifyContent: 'space-between', alignItems: 'center',
                }}>
                  {q}
                  <span style={{ fontSize: '1.1rem', color: '#9ca3af', flexShrink: 0, marginLeft: 12 }}>+</span>
                </summary>
                <div style={{ padding: '0 22px 18px', color: '#4b5563', lineHeight: 1.7, fontSize: '0.93rem' }}>
                  {a}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{ padding: '80px 24px', background: '#f4a93c' }}>
        <div style={{ maxWidth: 640, margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{
            fontFamily: "'Nautic', sans-serif", fontSize: 'clamp(2rem, 4vw, 3rem)',
            fontWeight: 800, color: '#201d3d', marginBottom: 16,
          }}>
            Stop bidding. Start booking.
          </h2>
          <p style={{ color: '#201d3d', opacity: 0.75, marginBottom: 32, fontSize: '1.05rem', lineHeight: 1.65 }}>
            Build your branded quote form in under 10 minutes and try the full platform for $1 your first month.
          </p>
          <Link href="/pricing" style={{
            display: 'inline-block', background: '#201d3d', color: '#f4a93c',
            fontWeight: 800, padding: '16px 40px', borderRadius: 10,
            textDecoration: 'none', fontSize: '1.05rem',
          }}>
            See Pricing →
          </Link>
          <p style={{ marginTop: 16, fontSize: '0.82rem', color: '#201d3d', opacity: 0.6 }}>
            Cancel anytime · Then $34/mo
          </p>
        </div>
      </section>

      <PublicFooter />
    </div>
  )
}
