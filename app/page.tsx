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
          <Link href="/agency" style={{ fontSize: '0.88rem', fontWeight: 500, color: '#555', textDecoration: 'none' }}>
            Done for you
          </Link>
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
        padding: '80px 24px 0', overflow: 'hidden',
      }}>
        <div style={{
          maxWidth: 1100, margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '48px 72px',
          alignItems: 'flex-end',
        }}>

          {/* Left — copy */}
          <div style={{ paddingBottom: 80 }}>
            <div style={{
              display: 'inline-block', background: '#FFE500', color: '#1a1a2e',
              fontSize: '0.73rem', fontWeight: 700, letterSpacing: '0.08em',
              textTransform: 'uppercase', padding: '5px 14px', borderRadius: 99, marginBottom: 28,
            }}>
              Pay per lead — no monthly fees
            </div>
            <h1 style={{
              fontFamily: "'Oswald', sans-serif", fontSize: 'clamp(2.6rem, 5.5vw, 4.2rem)',
              fontWeight: 800, lineHeight: 1.08, marginBottom: 24,
            }}>
              Get quality leads.<br />No website needed.
            </h1>
            <p style={{ fontSize: '1.05rem', color: 'rgba(255,255,255,0.68)', lineHeight: 1.75, marginBottom: 38, maxWidth: 480 }}>
              Quote Box deploys a branded instant-quote landing page for your business and runs paid Meta ads on Facebook &amp; Instagram to fill it with customers. Warm leads, real prices, $15 per result.
            </p>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
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
                border: '1px solid rgba(255,255,255,0.15)',
              }}>
                Log in to dashboard
              </Link>
            </div>
            <p style={{ marginTop: 20, fontSize: '0.78rem', color: 'rgba(255,255,255,0.35)' }}>
              No credit card required to sign up
            </p>
          </div>

          {/* Right — floating screenshots */}
          <div style={{
            display: 'flex', justifyContent: 'center', alignItems: 'flex-end',
            position: 'relative', paddingTop: 20,
          }}>

            {/* Form builder — back layer, desktop */}
            <div style={{
              position: 'absolute',
              bottom: 0,
              left: '50%',
              transform: 'translateX(-62%) rotate(-4deg)',
              width: '62%',
              minWidth: 200,
              borderRadius: '14px 14px 0 0',
              overflow: 'hidden',
              boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
              border: '1px solid rgba(255,255,255,0.08)',
              zIndex: 1,
            }}>
              <div style={{
                background: '#2a2a3e', padding: '8px 12px',
                display: 'flex', alignItems: 'center', gap: 5,
              }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#ef4444', display: 'inline-block' }} />
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#f59e0b', display: 'inline-block' }} />
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
              </div>
              <img
                src="/screenshots/Form%20builder.png"
                alt="QuoteBox form builder"
                style={{ width: '100%', display: 'block' }}
              />
            </div>

            {/* Quote form — front layer, mobile */}
            <div style={{
              position: 'relative', zIndex: 2,
              width: 200,
              marginLeft: '28%',
              borderRadius: '20px 20px 0 0',
              overflow: 'hidden',
              boxShadow: '0 28px 80px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.1)',
            }}>
              <img
                src="/screenshots/Movingquote.png"
                alt="QuoteBox instant quote form on mobile"
                style={{ width: '100%', display: 'block' }}
              />
            </div>

            {/* Floating "New Lead" badge */}
            <div style={{
              position: 'absolute', top: 32, right: '4%', zIndex: 3,
              background: 'white', borderRadius: 12,
              padding: '10px 14px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
              display: 'flex', alignItems: 'center', gap: 10,
              minWidth: 170,
            }}>
              <div style={{
                width: 36, height: 36, borderRadius: '50%', background: '#dcfce7',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0, fontSize: '1rem',
              }}>🔔</div>
              <div>
                <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#1a1a2e', lineHeight: 1.2 }}>New lead received</div>
                <div style={{ fontSize: '0.65rem', color: '#10b981', fontWeight: 600 }}>Quote: $216.29 · Just now</div>
              </div>
            </div>

          </div>

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

      {/* ── Product Screenshots ── */}
      <section style={{ padding: '100px 24px', background: 'white', overflow: 'hidden' }}>
        <div style={{ maxWidth: 1060, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 100 }}>

          {/* Row 1 — Quote form */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: 56,
            alignItems: 'center',
          }}>
            {/* Screenshot */}
            <div style={{ display: 'flex', justifyContent: 'center', position: 'relative' }}>
              {/* Glow blob */}
              <div style={{
                position: 'absolute', inset: -32,
                background: 'radial-gradient(ellipse at center, #FFE50033 0%, transparent 70%)',
                borderRadius: '50%', zIndex: 0,
              }} />
              <div style={{
                position: 'relative', zIndex: 1,
                maxWidth: 300, width: '100%',
                borderRadius: 24,
                boxShadow: '0 32px 80px rgba(0,0,0,0.18), 0 2px 8px rgba(0,0,0,0.08)',
                border: '1px solid rgba(0,0,0,0.06)',
                overflow: 'hidden',
                transform: 'rotate(-1.5deg)',
              }}>
                <img
                  src="/screenshots/Movingquote.png"
                  alt="QuoteBox instant quote form on mobile"
                  style={{ width: '100%', display: 'block' }}
                />
              </div>
            </div>

            {/* Copy */}
            <div>
              <div style={{
                display: 'inline-block', background: '#FFE500', color: '#1a1a2e',
                fontSize: '0.72rem', fontWeight: 800, letterSpacing: '0.1em',
                textTransform: 'uppercase', padding: '5px 14px', borderRadius: 99, marginBottom: 22,
              }}>
                Instant quote landing page
              </div>
              <h2 style={{
                fontFamily: "'Oswald', sans-serif", fontSize: 'clamp(1.8rem, 4vw, 2.6rem)',
                fontWeight: 800, lineHeight: 1.15, color: '#1a1a2e', marginBottom: 20,
              }}>
                Your quote form is a<br />live landing page.<br />Share it anywhere.
              </h2>
              <p style={{ color: '#6b7280', fontSize: '1rem', lineHeight: 1.8, marginBottom: 28 }}>
                Every Quote Box form is a publicly deployed URL that works on any device — no website, no hosting, no setup. Customers fill it in, see an instant price estimate, and submit their details in under two minutes.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {[
                  { icon: '⚡', text: 'Live instantly — share your link the same day you build it' },
                  { icon: '📱', text: 'Beautiful on mobile and desktop — no responsive headaches' },
                  { icon: '💰', text: 'Auto-calculated quotes shown step-by-step as customers answer' },
                  { icon: '📍', text: 'Route & distance pricing built in — perfect for movers, cleaners, drivers' },
                ].map(({ icon, text }) => (
                  <div key={text} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                    <span style={{ fontSize: '1rem', flexShrink: 0, marginTop: 1 }}>{icon}</span>
                    <span style={{ color: '#374151', fontSize: '0.93rem', lineHeight: 1.6 }}>{text}</span>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 36 }}>
                <Link href="/signup" style={{
                  display: 'inline-block', padding: '13px 28px',
                  background: '#1a1a2e', color: '#FFE500',
                  fontWeight: 700, fontSize: '0.93rem', borderRadius: 10, textDecoration: 'none',
                  fontFamily: "'Oswald', sans-serif", letterSpacing: '0.02em',
                }}>
                  Build your form free →
                </Link>
              </div>
            </div>
          </div>

          {/* Row 2 — Robert & Meta Ads */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: 56,
            alignItems: 'center',
          }}>
            {/* Copy — left on desktop, bottom on mobile via order */}
            <div style={{ order: 0 }}>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                background: '#f5f3ff', border: '1px solid #ddd6fe',
                borderRadius: 99, padding: '5px 14px', marginBottom: 22,
              }}>
                <img src="/icons/logo-1772578089154.jpg" alt="Robert" style={{ width: 20, height: 20, borderRadius: '50%', objectFit: 'cover' }} />
                <span style={{ color: '#7c3aed', fontSize: '0.72rem', fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                  Meet Robert
                </span>
              </div>
              <h2 style={{
                fontFamily: "'Oswald', sans-serif", fontSize: 'clamp(1.8rem, 4vw, 2.6rem)',
                fontWeight: 800, lineHeight: 1.15, color: '#1a1a2e', marginBottom: 20,
              }}>
                Run Meta ads with<br />Robert — your built-in<br />AI ad expert.
              </h2>
              <p style={{ color: '#6b7280', fontSize: '1rem', lineHeight: 1.8, marginBottom: 28 }}>
                Robert lives inside your Lead Machine dashboard. Tell him your target area, budget, and offer — he generates your campaign copy, targeting, and split-test variants automatically. No ad agency. No guessing.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {[
                  { icon: '🎯', text: 'Describe your service area in plain English — Robert turns it into precise zip codes' },
                  { icon: '✍️', text: 'AI-written headlines, body copy, and 3 split-test variants ready to launch' },
                  { icon: '💬', text: 'Chat with Robert anytime to optimize spend, CPL, and targeting' },
                  { icon: '📊', text: 'Live analytics — spend, leads, CPL, and top performer all in one place' },
                ].map(({ icon, text }) => (
                  <div key={text} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                    <span style={{ fontSize: '1rem', flexShrink: 0, marginTop: 1 }}>{icon}</span>
                    <span style={{ color: '#374151', fontSize: '0.93rem', lineHeight: 1.6 }}>{text}</span>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 36 }}>
                <Link href="/signup" style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8, padding: '13px 28px',
                  background: '#7c3aed', color: 'white',
                  fontWeight: 700, fontSize: '0.93rem', borderRadius: 10, textDecoration: 'none',
                  fontFamily: "'Oswald', sans-serif", letterSpacing: '0.02em',
                }}>
                  <img src="/icons/logo-1772578089154.jpg" alt="" style={{ width: 20, height: 20, borderRadius: '50%', objectFit: 'cover' }} />
                  Launch ads with Robert →
                </Link>
              </div>
            </div>

            {/* Screenshot — right on desktop */}
            <div style={{ display: 'flex', justifyContent: 'center', position: 'relative', order: 1 }}>
              <div style={{
                position: 'absolute', inset: -32,
                background: 'radial-gradient(ellipse at center, #7c3aed22 0%, transparent 70%)',
                borderRadius: '50%', zIndex: 0,
              }} />
              <div style={{
                position: 'relative', zIndex: 1,
                maxWidth: 520, width: '100%',
                borderRadius: 16,
                boxShadow: '0 32px 80px rgba(124,58,237,0.18), 0 2px 8px rgba(0,0,0,0.08)',
                border: '1px solid rgba(0,0,0,0.06)',
                overflow: 'hidden',
                transform: 'rotate(1deg)',
              }}>
                {/* Fake browser chrome */}
                <div style={{
                  background: '#f3f4f6', padding: '10px 16px',
                  display: 'flex', alignItems: 'center', gap: 6,
                  borderBottom: '1px solid #e5e7eb',
                }}>
                  <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#ef4444', display: 'inline-block' }} />
                  <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#f59e0b', display: 'inline-block' }} />
                  <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
                  <div style={{
                    flex: 1, background: 'white', borderRadius: 4, padding: '3px 10px',
                    fontSize: '0.68rem', color: '#9ca3af', marginLeft: 8,
                  }}>
                    quote-box.com/lead-machine
                  </div>
                </div>
                <img
                  src="/screenshots/robertads.png"
                  alt="Robert AI zip code generator for Meta ads targeting"
                  style={{ width: '100%', display: 'block' }}
                />
              </div>
            </div>
          </div>

          {/* Row 3 — Form Builder */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: 56,
            alignItems: 'center',
          }}>
            {/* Copy */}
            <div>
              <div style={{
                display: 'inline-block', background: '#1a1a2e', color: '#FFE500',
                fontSize: '0.72rem', fontWeight: 800, letterSpacing: '0.1em',
                textTransform: 'uppercase', padding: '5px 14px', borderRadius: 99, marginBottom: 22,
              }}>
                Form Builder
              </div>
              <h2 style={{
                fontFamily: "'Oswald', sans-serif", fontSize: 'clamp(1.8rem, 4vw, 2.6rem)',
                fontWeight: 800, lineHeight: 1.15, color: '#1a1a2e', marginBottom: 20,
              }}>
                Build your perfect<br />quote form in minutes.<br />No code required.
              </h2>
              <p style={{ color: '#6b7280', fontSize: '1rem', lineHeight: 1.8, marginBottom: 28 }}>
                Drag and drop the fields you need — radio cards, dropdowns, checkboxes, number inputs, route &amp; distance, draw area, and more. Set your prices, see a live preview, and go live the same day. Or let Robert generate the whole form from a one-sentence description of your business.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {[
                  { icon: '🧱', text: '8 field types — radio, checkbox, dropdown, number, route, draw area &amp; more' },
                  { icon: '👁️', text: 'Live preview updates as you build — see exactly what customers see' },
                  { icon: '🚀', text: 'Start from a template or let Robert generate your form with AI in seconds' },
                  { icon: '💲', text: 'Set prices per option, per mile, per sq ft — auto-totalled for the customer' },
                ].map(({ icon, text }) => (
                  <div key={icon} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                    <span style={{ fontSize: '1rem', flexShrink: 0, marginTop: 1 }}>{icon}</span>
                    <span style={{ color: '#374151', fontSize: '0.93rem', lineHeight: 1.6 }} dangerouslySetInnerHTML={{ __html: text }} />
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 36 }}>
                <Link href="/signup" style={{
                  display: 'inline-block', padding: '13px 28px',
                  background: '#1a1a2e', color: '#FFE500',
                  fontWeight: 700, fontSize: '0.93rem', borderRadius: 10, textDecoration: 'none',
                  fontFamily: "'Oswald', sans-serif", letterSpacing: '0.02em',
                }}>
                  Open the form builder →
                </Link>
              </div>
            </div>

            {/* Screenshot */}
            <div style={{ display: 'flex', justifyContent: 'center', position: 'relative' }}>
              <div style={{
                position: 'absolute', inset: -32,
                background: 'radial-gradient(ellipse at center, #FFE50026 0%, transparent 70%)',
                borderRadius: '50%', zIndex: 0,
              }} />
              <div style={{
                position: 'relative', zIndex: 1,
                maxWidth: 520, width: '100%',
                borderRadius: 16,
                boxShadow: '0 32px 80px rgba(0,0,0,0.16), 0 2px 8px rgba(0,0,0,0.07)',
                border: '1px solid rgba(0,0,0,0.06)',
                overflow: 'hidden',
                transform: 'rotate(-1deg)',
              }}>
                {/* Browser chrome */}
                <div style={{
                  background: '#f3f4f6', padding: '10px 16px',
                  display: 'flex', alignItems: 'center', gap: 6,
                  borderBottom: '1px solid #e5e7eb',
                }}>
                  <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#ef4444', display: 'inline-block' }} />
                  <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#f59e0b', display: 'inline-block' }} />
                  <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
                  <div style={{
                    flex: 1, background: 'white', borderRadius: 4, padding: '3px 10px',
                    fontSize: '0.68rem', color: '#9ca3af', marginLeft: 8,
                  }}>
                    quote-box.com/form-builder
                  </div>
                </div>
                <img
                  src="/screenshots/Form%20builder.png"
                  alt="QuoteBox drag-and-drop form builder"
                  style={{ width: '100%', display: 'block' }}
                />
              </div>
            </div>
          </div>

          {/* Row 4 — CRM / Leads */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: 56,
            alignItems: 'center',
          }}>
            {/* Screenshot */}
            <div style={{ display: 'flex', justifyContent: 'center', position: 'relative', order: 0 }}>
              <div style={{
                position: 'absolute', inset: -32,
                background: 'radial-gradient(ellipse at center, #10b98122 0%, transparent 70%)',
                borderRadius: '50%', zIndex: 0,
              }} />
              <div style={{
                position: 'relative', zIndex: 1,
                maxWidth: 280, width: '100%',
                borderRadius: 20,
                boxShadow: '0 32px 80px rgba(16,185,129,0.15), 0 2px 8px rgba(0,0,0,0.08)',
                border: '1px solid rgba(0,0,0,0.06)',
                overflow: 'hidden',
                transform: 'rotate(1.5deg)',
              }}>
                <img
                  src="/screenshots/Customer.png"
                  alt="QuoteBox lead CRM with contact info and quote total"
                  style={{ width: '100%', display: 'block' }}
                />
              </div>
            </div>

            {/* Copy */}
            <div style={{ order: 1 }}>
              <div style={{
                display: 'inline-block', background: '#dcfce7', color: '#15803d',
                fontSize: '0.72rem', fontWeight: 800, letterSpacing: '0.1em',
                textTransform: 'uppercase', padding: '5px 14px', borderRadius: 99, marginBottom: 22,
              }}>
                Built-in CRM
              </div>
              <h2 style={{
                fontFamily: "'Oswald', sans-serif", fontSize: 'clamp(1.8rem, 4vw, 2.6rem)',
                fontWeight: 800, lineHeight: 1.15, color: '#1a1a2e', marginBottom: 20,
              }}>
                Every lead lands<br />in your dashboard<br />with the quote attached.
              </h2>
              <p style={{ color: '#6b7280', fontSize: '1rem', lineHeight: 1.8, marginBottom: 28 }}>
                No spreadsheets. No chasing forms. The moment a customer submits, their name, contact details, and calculated quote total appear instantly in your lead dashboard. See exactly what they selected, follow up in one tap, and track status from new to booked.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {[
                  { icon: '📋', text: 'Full contact info — name, email, and phone captured on every lead' },
                  { icon: '💵', text: 'Estimated quote total calculated and shown right on the lead card' },
                  { icon: '🔄', text: 'Track each lead from new → contacted → booked → closed' },
                  { icon: '🔒', text: "Low on credits? Leads are held safely and unlocked the moment you top up — never lost" },
                ].map(({ icon, text }) => (
                  <div key={icon} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                    <span style={{ fontSize: '1rem', flexShrink: 0, marginTop: 1 }}>{icon}</span>
                    <span style={{ color: '#374151', fontSize: '0.93rem', lineHeight: 1.6 }}>{text}</span>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 36 }}>
                <Link href="/signup" style={{
                  display: 'inline-block', padding: '13px 28px',
                  background: '#15803d', color: 'white',
                  fontWeight: 700, fontSize: '0.93rem', borderRadius: 10, textDecoration: 'none',
                  fontFamily: "'Oswald', sans-serif", letterSpacing: '0.02em',
                }}>
                  Start capturing leads →
                </Link>
              </div>
            </div>
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
      <section id="pricing" style={{ padding: '72px 24px', background: '#f9fafb' }}>
        <div style={{ maxWidth: 960, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 52 }}>
            <h2 style={{ fontFamily: "'Oswald', sans-serif", fontSize: '2rem', fontWeight: 700, color: '#1a1a2e', marginBottom: 14 }}>
              Simple, honest pricing
            </h2>
            <p style={{ color: '#6b7280', fontSize: '1rem', lineHeight: 1.7, maxWidth: 500, margin: '0 auto' }}>
              Start free and self-serve, or let us handle everything. Pick the plan that fits.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24, alignItems: 'start' }}>

            {/* Starter */}
            <div style={{ background: 'white', borderRadius: 16, padding: '32px 28px', border: '1px solid #e5e7eb', display: 'flex', flexDirection: 'column', gap: 0 }}>
              <div style={{
                display: 'inline-block', background: '#f3f4f6', color: '#6b7280',
                fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.08em',
                textTransform: 'uppercase', padding: '4px 12px', borderRadius: 99, marginBottom: 20, alignSelf: 'flex-start',
              }}>
                Starter
              </div>
              <div style={{ fontFamily: "'Oswald', sans-serif", fontSize: '2.8rem', fontWeight: 800, color: '#1a1a2e', lineHeight: 1 }}>$20</div>
              <div style={{ color: '#9ca3af', fontSize: '0.85rem', marginTop: 4, marginBottom: 8 }}>/month</div>
              <div style={{
                display: 'inline-block', background: '#dcfce7', color: '#16a34a',
                fontSize: '0.72rem', fontWeight: 700, padding: '3px 10px', borderRadius: 99, marginBottom: 24, alignSelf: 'flex-start',
              }}>
                7-day free trial
              </div>
              <p style={{ color: '#6b7280', fontSize: '0.88rem', lineHeight: 1.6, marginBottom: 20 }}>
                Everything you need to get started with quote generation.
              </p>
              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 28px', display: 'flex', flexDirection: 'column', gap: 9 }}>
                {[
                  '1 quote form',
                  '10 leads per month',
                  '1 media file',
                  'Form builder & Robert (AI)',
                  'Lead dashboard',
                ].map((item) => (
                  <li key={item} style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#374151', fontSize: '0.88rem' }}>
                    <span style={{ color: '#10b981', fontWeight: 700, flexShrink: 0 }}>✓</span>
                    {item}
                  </li>
                ))}
              </ul>
              <Link href="/signup" style={{
                display: 'block', textAlign: 'center', padding: '12px 24px',
                border: '2px solid #1a1a2e', color: '#1a1a2e',
                fontWeight: 700, fontSize: '0.92rem', borderRadius: 10, textDecoration: 'none',
                fontFamily: "'Oswald', sans-serif", letterSpacing: '0.02em',
              }}>
                Start free trial
              </Link>
            </div>

            {/* Growth — featured */}
            <div style={{ background: '#1a1a2e', borderRadius: 16, padding: '32px 28px', border: '2px solid #FFE500', display: 'flex', flexDirection: 'column', gap: 0, position: 'relative' }}>
              <div style={{
                position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)',
                background: '#FFE500', color: '#1a1a2e',
                fontSize: '0.72rem', fontWeight: 800, letterSpacing: '0.08em',
                textTransform: 'uppercase', padding: '5px 16px', borderRadius: 99, whiteSpace: 'nowrap',
              }}>
                Most popular
              </div>
              <div style={{
                display: 'inline-block', background: 'rgba(255,229,0,0.15)', color: '#FFE500',
                fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.08em',
                textTransform: 'uppercase', padding: '4px 12px', borderRadius: 99, marginBottom: 20, alignSelf: 'flex-start',
              }}>
                Growth
              </div>
              <div style={{ fontFamily: "'Oswald', sans-serif", fontSize: '2.8rem', fontWeight: 800, color: '#FFE500', lineHeight: 1 }}>$30</div>
              <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.85rem', marginTop: 4, marginBottom: 32 }}>/month</div>
              <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.88rem', lineHeight: 1.6, marginBottom: 20 }}>
                Scale your lead generation across multiple forms and services.
              </p>
              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 28px', display: 'flex', flexDirection: 'column', gap: 9 }}>
                {[
                  '3 quote forms',
                  '50 leads per month',
                  'Priority support',
                  'Form builder & Robert (AI)',
                  'Full lead dashboard',
                ].map((item) => (
                  <li key={item} style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'rgba(255,255,255,0.85)', fontSize: '0.88rem' }}>
                    <span style={{ color: '#FFE500', fontWeight: 700, flexShrink: 0 }}>✓</span>
                    {item}
                  </li>
                ))}
              </ul>
              <Link href="/signup" style={{
                display: 'block', textAlign: 'center', padding: '12px 24px',
                background: '#FFE500', color: '#1a1a2e',
                fontWeight: 700, fontSize: '0.92rem', borderRadius: 10, textDecoration: 'none',
                fontFamily: "'Oswald', sans-serif", letterSpacing: '0.02em',
              }}>
                Get started
              </Link>
            </div>

            {/* Fully Managed */}
            <div style={{ background: 'white', borderRadius: 16, padding: '32px 28px', border: '1px solid #e5e7eb', display: 'flex', flexDirection: 'column', gap: 0 }}>
              <div style={{
                display: 'inline-block', background: '#1a1a2e', color: '#FFE500',
                fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.08em',
                textTransform: 'uppercase', padding: '4px 12px', borderRadius: 99, marginBottom: 20, alignSelf: 'flex-start',
              }}>
                Fully Managed
              </div>
              <div style={{ fontFamily: "'Oswald', sans-serif", fontSize: '2.8rem', fontWeight: 800, color: '#1a1a2e', lineHeight: 1 }}>$15</div>
              <div style={{ color: '#9ca3af', fontSize: '0.85rem', marginTop: 4, marginBottom: 32 }}>/lead received</div>
              <p style={{ color: '#6b7280', fontSize: '0.88rem', lineHeight: 1.6, marginBottom: 20 }}>
                We build your form, run your ads, and deliver leads. You just close the jobs.
              </p>
              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 28px', display: 'flex', flexDirection: 'column', gap: 9 }}>
                {[
                  'Form built for you',
                  'Meta ads managed for you',
                  'Exclusive leads',
                  'Dedicated account manager',
                  'Pay only for results',
                ].map((item) => (
                  <li key={item} style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#374151', fontSize: '0.88rem' }}>
                    <span style={{ color: '#10b981', fontWeight: 700, flexShrink: 0 }}>✓</span>
                    {item}
                  </li>
                ))}
              </ul>
              <Link href="/agency" style={{
                display: 'block', textAlign: 'center', padding: '12px 24px',
                background: '#1a1a2e', color: '#FFE500',
                fontWeight: 700, fontSize: '0.92rem', borderRadius: 10, textDecoration: 'none',
                fontFamily: "'Oswald', sans-serif", letterSpacing: '0.02em',
              }}>
                Learn more
              </Link>
            </div>

          </div>
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
