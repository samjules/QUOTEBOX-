import Link from 'next/link'
import DealNotificationBanner from '@/components/DealNotificationBanner'

const faqs = [
  {
    q: 'What is Quote Box?',
    a: 'Quote Box lets service businesses create branded quote forms and share them as a simple link — no website required. We run paid Meta ads pointing to your form so customers find you on Facebook and Instagram. When someone fills it out, you get their details and an instant price estimate straight to your dashboard.',
  },
  {
    q: 'How much does it cost?',
    a: 'Nothing upfront. You only pay $15 per lead received. No monthly retainer, no subscription, no hidden fees. Top up credits when you need them and stop whenever you like.',
  },
  {
    q: 'Do I need a website or technical skills?',
    a: 'Not at all. You can build a fully working quote form in under five minutes using our drag-and-drop builder. We then run Meta ads that send customers directly to your form — no website, no agency, no tech skills required.',
  },
  {
    q: 'How do you drive traffic to my form?',
    a: 'We run paid advertising on Facebook and Instagram (Meta) targeting people in your area who are actively looking for your type of service. The ads send them directly to your Quote Box form, where they get an instant estimate and you get the lead.',
  },
  {
    q: 'What happens when a customer fills in my form?',
    a: 'They get an instant quote estimate on screen, and their details land in your Quote Box dashboard immediately. You can see their name, contact info, and exactly what they selected — then follow up in one click.',
  },
  {
    q: 'What types of businesses use Quote Box?',
    a: 'Any trade or service business that quotes customers before starting work — cleaners, movers, landscapers, painters, photographers, personal trainers, dog groomers, HVAC technicians, and more.',
  },
  {
    q: 'Can I customise the form to match my brand?',
    a: 'Yes. You can set your own form name, description, brand colour, hero image, and pricing options. Every form looks professional and loads instantly on any device.',
  },
  {
    q: 'What if I run out of credits?',
    a: "Leads don't get lost — they're held securely in our system and unlocked the moment you top up. You'll never miss a customer because of a low balance.",
  },
  {
    q: 'Is there a contract or minimum commitment?',
    a: "None. Buy credits when you need them, pause whenever you like. There's no lock-in, no minimum spend, and no cancellation fee.",
  },
]

export default function LandingPage() {
  return (
    <div style={{ fontFamily: "'Inter', sans-serif", color: '#1a1a2e', background: '#fff' }}>

      {/* ── Nav ── */}
      <nav style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 32px', height: 60, borderBottom: '1px solid #f0f0f0',
        position: 'sticky', top: 0, background: 'white', zIndex: 50,
      }}>
        <span style={{ fontFamily: "'Oswald', sans-serif", fontSize: '1.35rem', fontWeight: 700, letterSpacing: '0.01em' }}>
          Quote<span style={{ color: '#FFE500', WebkitTextStroke: '1px #1a1a2e' }}>.</span>Box
        </span>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <Link href="/login" style={{ fontSize: '0.88rem', fontWeight: 500, color: '#555', textDecoration: 'none' }}>
            Log in
          </Link>
          <Link href="/signup" style={{
            fontSize: '0.88rem', fontWeight: 600, padding: '8px 18px',
            background: '#1a1a2e', color: '#FFE500', borderRadius: 8, textDecoration: 'none',
          }}>
            Get started free
          </Link>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section style={{
        background: '#1a1a2e', color: 'white',
        padding: '90px 24px 80px', textAlign: 'center',
      }}>
        <div style={{ maxWidth: 720, margin: '0 auto' }}>
          <div style={{
            display: 'inline-block', background: '#FFE500', color: '#1a1a2e',
            fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.08em',
            textTransform: 'uppercase', padding: '5px 14px', borderRadius: 99, marginBottom: 28,
          }}>
            Pay per lead — no monthly fees
          </div>
          <h1 style={{
            fontFamily: "'Oswald', sans-serif", fontSize: 'clamp(2.4rem, 6vw, 4rem)',
            fontWeight: 800, lineHeight: 1.1, marginBottom: 22,
          }}>
            Get quality leads.<br />No website needed.
          </h1>
          <p style={{ fontSize: '1.1rem', color: 'rgba(255,255,255,0.7)', lineHeight: 1.7, marginBottom: 40, maxWidth: 580, margin: '0 auto 40px' }}>
            Quote Box builds your branded quote form and runs paid Meta ads on Facebook &amp; Instagram to drive real customers to it. You get warm leads with instant price estimates. You only pay $15 when it works.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/signup" style={{
              padding: '15px 32px', background: '#FFE500', color: '#1a1a2e',
              fontWeight: 700, fontSize: '1rem', borderRadius: 10, textDecoration: 'none',
              fontFamily: "'Oswald', sans-serif", letterSpacing: '0.02em',
            }}>
              Build your form — it&apos;s free
            </Link>
            <Link href="/login" style={{
              padding: '15px 28px', background: 'rgba(255,255,255,0.08)', color: 'white',
              fontWeight: 600, fontSize: '0.92rem', borderRadius: 10, textDecoration: 'none',
              border: '1px solid rgba(255,255,255,0.18)',
            }}>
              Log in to dashboard
            </Link>
          </div>
          <p style={{ marginTop: 22, fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)' }}>
            No credit card required to sign up
          </p>
        </div>
      </section>

      {/* ── Social proof strip ── */}
      <div style={{
        background: '#FFE500', padding: '14px 24px', textAlign: 'center',
        fontSize: '0.88rem', fontWeight: 600, color: '#1a1a2e', letterSpacing: '0.01em',
      }}>
        Used by cleaners, movers, landscapers, photographers, trades &amp; more — any business that quotes before they start
      </div>

      {/* ── How it works ── */}
      <section style={{ padding: '80px 24px', background: '#f9fafb' }}>
        <div style={{ maxWidth: 960, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 52 }}>
            <h2 style={{ fontFamily: "'Oswald', sans-serif", fontSize: '2rem', fontWeight: 700, marginBottom: 10 }}>
              Live in minutes. Leads in hours.
            </h2>
            <p style={{ color: '#6b7280', fontSize: '1rem' }}>
              Four steps. No tech skills required.
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 28 }}>
            {[
              { n: '1', title: 'Build your quote form', body: 'Pick your fields, set your prices, upload a photo. Done in five minutes. No coding, no designers needed.' },
              { n: '2', title: 'We launch your Meta ads', body: 'We run paid ads on Facebook and Instagram targeting people in your area who are actively searching for your service.' },
              { n: '3', title: 'Customers land on your form', body: 'Ad clicks go straight to your branded quote form. Customers fill it in, see an instant price, and submit their details.' },
              { n: '4', title: 'You get the lead — pay $15', body: 'Every submission lands in your dashboard with full contact info and quote total. Pay $15 per lead, nothing else.' },
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

      {/* ── Meta Ads callout ── */}
      <section style={{ padding: '72px 24px', background: '#1a1a2e' }}>
        <div style={{ maxWidth: 860, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 48, alignItems: 'center' }}>
          <div>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: 'rgba(255,229,0,0.12)', border: '1px solid rgba(255,229,0,0.3)',
              borderRadius: 99, padding: '5px 14px', marginBottom: 22,
            }}>
              {/* Meta / Facebook icon */}
              <svg width="16" height="16" viewBox="0 0 24 24" fill="#FFE500" xmlns="http://www.w3.org/2000/svg">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
              <span style={{ color: '#FFE500', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase' }}>
                Powered by Meta Ads
              </span>
            </div>
            <h2 style={{ fontFamily: "'Oswald', sans-serif", fontSize: '2rem', fontWeight: 800, color: 'white', lineHeight: 1.15, marginBottom: 18 }}>
              We run your paid ads.<br />You just close the jobs.
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.97rem', lineHeight: 1.75, marginBottom: 24 }}>
              Most small business owners don&apos;t have time to manage Facebook campaigns. Quote Box handles your paid advertising on Meta — targeting the right people in your area on Facebook and Instagram — so customers come to you instead of your competitors.
            </p>
            <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.97rem', lineHeight: 1.75 }}>
              No agency retainer. No ad account headaches. We do it, and you only pay <strong style={{ color: '#FFE500' }}>$15 per lead</strong> that actually lands in your inbox.
            </p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {[
              { label: 'Targeted local ads', desc: 'We reach people near you who are actively looking for your service on Facebook and Instagram.' },
              { label: 'Ads go straight to your form', desc: 'No landing page needed. Clicks go directly to your Quote Box form for maximum conversion.' },
              { label: 'Real-time lead delivery', desc: 'The moment someone submits, the lead appears in your dashboard — name, number, and quote total.' },
              { label: 'Zero ad management on your end', desc: 'We handle the creative, targeting, and optimisation. You just follow up and win the job.' },
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

      {/* ── Why Quote Box ── */}
      <section style={{ padding: '80px 24px', background: 'white' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 52 }}>
            <h2 style={{ fontFamily: "'Oswald', sans-serif", fontSize: '2rem', fontWeight: 700, marginBottom: 10 }}>
              Why small businesses choose Quote Box
            </h2>
            <p style={{ color: '#6b7280', fontSize: '1rem', maxWidth: 520, margin: '0 auto' }}>
              Traditional lead generation costs hundreds a month whether you get leads or not. We flipped the model.
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 24 }}>
            {[
              { icon: '💸', title: 'Pay per lead', body: '$15 flat per lead received. No monthly retainer. No wasted spend.' },
              { icon: '📣', title: 'Meta ads included', body: 'We run your Facebook & Instagram ads to drive targeted local traffic to your form.' },
              { icon: '🌐', title: 'No website needed', body: 'Share a link from anywhere. Your form is your storefront.' },
              { icon: '⚡', title: 'Instant quote estimates', body: 'Customers see a price as they fill in the form. Warmer leads, faster decisions.' },
              { icon: '🎨', title: 'Your brand, your form', body: 'Custom colours, images, and pricing — looks like you built it yourself.' },
              { icon: '🔒', title: 'Leads held, never lost', body: "Low on credits? Leads are held safely and unlocked the moment you top up." },
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
        <div style={{ maxWidth: 560, margin: '0 auto' }}>
          <h2 style={{ fontFamily: "'Oswald', sans-serif", fontSize: '2rem', fontWeight: 700, color: '#1a1a2e', marginBottom: 14 }}>
            Simple, honest pricing
          </h2>
          <p style={{ color: '#6b7280', fontSize: '1rem', lineHeight: 1.7, marginBottom: 36 }}>
            No subscriptions. No lock-in. No surprises. Just $15 per lead — only when a real customer submits your form.
          </p>
          <div style={{ background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: '36px 32px', marginBottom: 32 }}>
            <div style={{ fontFamily: "'Oswald', sans-serif", fontSize: '3.5rem', fontWeight: 800, color: '#FFE500', lineHeight: 1 }}>$15</div>
            <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.88rem', marginTop: 6, marginBottom: 24 }}>per lead received</div>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10, textAlign: 'left' }}>
              {[
                'Meta ads on Facebook & Instagram included',
                'Unlimited form fields & customisation',
                'Instant quote calculator built in',
                'Full lead details in your dashboard',
                'Leads held safely if credits run low',
                'No monthly fee, no contract',
              ].map((item) => (
                <li key={item} style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'rgba(255,255,255,0.8)', fontSize: '0.9rem' }}>
                  <span style={{ color: '#FFE500', fontWeight: 700, flexShrink: 0 }}>✓</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <Link href="/signup" style={{
            display: 'inline-block', padding: '15px 36px', background: '#1a1a2e',
            color: '#FFE500', fontWeight: 700, fontSize: '1rem', borderRadius: 10,
            textDecoration: 'none', fontFamily: "'Oswald', sans-serif", letterSpacing: '0.02em',
          }}>
            Start free — no card needed
          </Link>
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
              Everything you need to know before getting started.
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
            Ready to get your first lead?
          </h2>
          <p style={{ fontSize: '1rem', color: 'rgba(26,26,46,0.7)', lineHeight: 1.7, marginBottom: 36 }}>
            Build your quote form in minutes. We&apos;ll run your Meta ads. Start receiving customers today — without a website, without a retainer.
          </p>
          <Link href="/signup" style={{
            display: 'inline-block', padding: '16px 40px', background: '#1a1a2e',
            color: '#FFE500', fontWeight: 700, fontSize: '1.05rem', borderRadius: 10,
            textDecoration: 'none', fontFamily: "'Oswald', sans-serif", letterSpacing: '0.02em',
          }}>
            Create your free account
          </Link>
        </div>
      </section>

      {/* Deal notification toasts */}
      <DealNotificationBanner />

      {/* ── Footer ── */}
      <footer style={{ background: '#1a1a2e', padding: '28px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <span style={{ fontFamily: "'Oswald', sans-serif", fontSize: '1rem', fontWeight: 700, color: 'white' }}>
          Quote<span style={{ color: '#FFE500' }}>.</span>Box
        </span>
        <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.35)' }}>
          © {new Date().getFullYear()} Quote Box. All rights reserved.
        </span>
        <div style={{ display: 'flex', gap: 20 }}>
          <Link href="/login" style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.45)', textDecoration: 'none' }}>Log in</Link>
          <Link href="/signup" style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.45)', textDecoration: 'none' }}>Sign up</Link>
        </div>
      </footer>

    </div>
  )
}
