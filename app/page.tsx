import Link from 'next/link'
import DealNotificationBanner from '@/components/DealNotificationBanner'
import PublicFooter from '@/components/PublicFooter'

const faqs = [
  {
    q: 'What is Quotebox?',
    a: 'Quotebox lets service businesses create branded quote forms and share them as a simple link — no website required. We run paid Meta ads pointing to your form so customers find you on Facebook and Instagram. When someone fills it out, you get their details and an instant price estimate straight to your dashboard.',
  },
  {
    q: 'How much does it cost?',
    a: 'Quotebox is $350/month with a 7-day free trial. No per-lead fees, no hidden charges. Everything — your quote form, Meta ads, and unlimited leads — is included in one flat monthly rate.',
  },
  {
    q: 'Do I need a website or technical skills?',
    a: 'Not at all. You can build a fully working quote form in under five minutes using our drag-and-drop builder. We then run Meta ads that send customers directly to your form — no website, no agency, no tech skills required.',
  },
  {
    q: 'How do you drive traffic to my form?',
    a: 'We run paid advertising on Facebook and Instagram (Meta) targeting people in your area who are actively looking for your type of service. The ads send them directly to your Quotebox form, where they get an instant estimate and you get the lead.',
  },
  {
    q: 'What happens when a customer fills in my form?',
    a: 'They get an instant quote estimate on screen, and their details land in your Quotebox dashboard immediately. You can see their name, contact info, and exactly what they selected — then follow up in one click.',
  },
  {
    q: 'What types of businesses use Quotebox?',
    a: 'Moving companies and junk removal businesses — local movers, long-distance movers, junk haulers, estate cleanout companies, and any business in the moving or hauling space that quotes customers before the job.',
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
    <div style={{ fontFamily: "'Nautic', sans-serif", color: '#0e0020', background: '#fff' }}>

      {/* ── Arctic Reach banner ── */}
      <div className="maze-dark" style={{
        background: '#0e0020', color: 'rgba(255,255,255,0.55)',
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
        <span style={{ fontFamily: "'Oswald', sans-serif", fontSize: '1.35rem', fontWeight: 700, letterSpacing: '0.01em' }}>
          Quote<span style={{ color: '#FFE500', WebkitTextStroke: '1px #0e0020' }}>.</span>Box
        </span>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <Link href="/contractor-leads" style={{ fontSize: '0.88rem', fontWeight: 500, color: '#555', textDecoration: 'none' }}>
            Moving & Junk Removal
          </Link>
          <Link href="/agency" style={{ fontSize: '0.88rem', fontWeight: 500, color: '#555', textDecoration: 'none' }}>
            Done for you
          </Link>
          <Link href="/login" style={{ fontSize: '0.88rem', fontWeight: 500, color: '#555', textDecoration: 'none' }}>
            Log in
          </Link>
          <Link href="/build" style={{
            fontSize: '0.88rem', fontWeight: 600, padding: '8px 18px',
            background: '#0e0020', color: '#FFE500', borderRadius: 8, textDecoration: 'none',
          }}>
            Build your form free
          </Link>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="maze-dark" style={{
        background: '#0e0020', color: 'white',
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
              display: 'inline-block', background: '#FFE500', color: '#0e0020',
              fontSize: '0.73rem', fontWeight: 700, letterSpacing: '0.08em',
              textTransform: 'uppercase', padding: '5px 14px', borderRadius: 99, marginBottom: 28,
            }}>
              Moving companies & junk removal
            </div>
            <h1 style={{
              fontFamily: "'Oswald', sans-serif", fontSize: 'clamp(2.6rem, 5.5vw, 4.2rem)',
              fontWeight: 800, lineHeight: 1.08, marginBottom: 24,
            }}>
              Get quality leads.<br />No website needed.
            </h1>
            <p style={{ fontSize: '1.05rem', color: 'rgba(255,255,255,0.68)', lineHeight: 1.75, marginBottom: 38, maxWidth: 480 }}>
              Quotebox deploys a branded instant-quote landing page for your moving or junk removal business and runs paid Meta ads on Facebook &amp; Instagram to fill it with customers. Warm leads, real prices, $350/month.
            </p>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <Link href="/build" style={{
                padding: '15px 32px', background: '#FFE500', color: '#0e0020',
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
                <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#0e0020', lineHeight: 1.2 }}>New lead received</div>
                <div style={{ fontSize: '0.65rem', color: '#10b981', fontWeight: 600 }}>Quote: $216.29 · Just now</div>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* ── Social proof strip ── */}
      <div style={{
        background: '#FFE500', padding: '14px 24px', textAlign: 'center',
        fontSize: '0.88rem', fontWeight: 600, color: '#0e0020', letterSpacing: '0.01em',
      }}>
        Built for moving companies and junk removal businesses — get exclusive leads from Facebook &amp; Instagram for $350/month
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
              { n: '4', title: 'You get the lead — close the job', body: 'Every submission lands in your dashboard with full contact info and quote total. All leads included in your $350/month plan.' },
            ].map(({ n, title, body }) => (
              <div key={n} style={{ background: 'white', borderRadius: 14, padding: '32px 28px', boxShadow: '0 1px 6px rgba(0,0,0,0.06)' }}>
                <div style={{
                  width: 40, height: 40, borderRadius: '50%', background: '#0e0020',
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
                display: 'inline-block', background: '#FFE500', color: '#0e0020',
                fontSize: '0.72rem', fontWeight: 800, letterSpacing: '0.1em',
                textTransform: 'uppercase', padding: '5px 14px', borderRadius: 99, marginBottom: 22,
              }}>
                Instant quote landing page
              </div>
              <h2 style={{
                fontFamily: "'Oswald', sans-serif", fontSize: 'clamp(1.8rem, 4vw, 2.6rem)',
                fontWeight: 800, lineHeight: 1.15, color: '#0e0020', marginBottom: 20,
              }}>
                Your quote form is a<br />live landing page.<br />Share it anywhere.
              </h2>
              <p style={{ color: '#6b7280', fontSize: '1rem', lineHeight: 1.8, marginBottom: 28 }}>
                Every Quotebox form is a publicly deployed URL that works on any device — no website, no hosting, no setup. Customers fill it in, see an instant price estimate, and submit their details in under two minutes.
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
                <Link href="/build" style={{
                  display: 'inline-block', padding: '13px 28px',
                  background: '#0e0020', color: '#FFE500',
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
                fontWeight: 800, lineHeight: 1.15, color: '#0e0020', marginBottom: 20,
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
                display: 'inline-block', background: '#0e0020', color: '#FFE500',
                fontSize: '0.72rem', fontWeight: 800, letterSpacing: '0.1em',
                textTransform: 'uppercase', padding: '5px 14px', borderRadius: 99, marginBottom: 22,
              }}>
                Form Builder
              </div>
              <h2 style={{
                fontFamily: "'Oswald', sans-serif", fontSize: 'clamp(1.8rem, 4vw, 2.6rem)',
                fontWeight: 800, lineHeight: 1.15, color: '#0e0020', marginBottom: 20,
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
                <Link href="/build" style={{
                  display: 'inline-block', padding: '13px 28px',
                  background: '#0e0020', color: '#FFE500',
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
                fontWeight: 800, lineHeight: 1.15, color: '#0e0020', marginBottom: 20,
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
                <Link href="/build" style={{
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
      <section className="maze-dark" style={{ padding: '72px 24px', background: '#0e0020' }}>
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
              Most small business owners don&apos;t have time to manage Facebook campaigns. Quotebox handles your paid advertising on Meta — targeting the right people in your area on Facebook and Instagram — so customers come to you instead of your competitors.
            </p>
            <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.97rem', lineHeight: 1.75 }}>
              No agency retainer. No ad account headaches. We do it, and everything is included in your flat <strong style={{ color: '#FFE500' }}>$350/month</strong> plan.
            </p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {[
              { label: 'Targeted local ads', desc: 'We reach people near you who are actively looking for your service on Facebook and Instagram.' },
              { label: 'Ads go straight to your form', desc: 'No landing page needed. Clicks go directly to your Quotebox form for maximum conversion.' },
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

      {/* ── Why Quotebox ── */}
      <section style={{ padding: '80px 24px', background: 'white' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 52 }}>
            <h2 style={{ fontFamily: "'Oswald', sans-serif", fontSize: '2rem', fontWeight: 700, marginBottom: 10 }}>
              Why movers and junk haulers choose Quotebox
            </h2>
            <p style={{ color: '#6b7280', fontSize: '1rem', maxWidth: 520, margin: '0 auto' }}>
              Traditional lead platforms share your leads with 5 competitors. We give you every lead exclusively.
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 24 }}>
            {[
              { icon: '💸', title: '$350/month flat', body: 'One price. Unlimited leads. No per-lead fees, no hidden charges, no contracts.' },
              { icon: '📣', title: 'Meta ads included', body: 'We run your Facebook & Instagram ads to drive moving and junk removal customers to your form.' },
              { icon: '🌐', title: 'No website needed', body: 'Share a link from anywhere. Your branded quote form is your storefront.' },
              { icon: '⚡', title: 'Instant quote estimates', body: 'Customers see a moving or junk removal price as they fill in the form. Warmer leads, faster decisions.' },
              { icon: '🎨', title: 'Your brand, your form', body: 'Custom logo, colours, and pricing — looks like you built it yourself.' },
              { icon: '🔒', title: '100% exclusive leads', body: "Every lead goes only to you. No sharing with other movers or junk haulers." },
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
        <div style={{ maxWidth: 680, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 52 }}>
            <h2 style={{ fontFamily: "'Oswald', sans-serif", fontSize: '2rem', fontWeight: 700, color: '#0e0020', marginBottom: 14 }}>
              Simple, honest pricing
            </h2>
            <p style={{ color: '#6b7280', fontSize: '1rem', lineHeight: 1.7, maxWidth: 500, margin: '0 auto' }}>
              One plan. Everything included. No per-lead fees, no hidden charges.
            </p>
          </div>

          {/* Pro plan — single card */}
          <div style={{
            background: '#0e0020', borderRadius: 20, padding: '40px 40px',
            border: '2px solid #FFE500', display: 'flex', flexDirection: 'column',
            gap: 0, position: 'relative', maxWidth: 480, margin: '0 auto',
          }}>
            <div style={{
              position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)',
              background: '#FFE500', color: '#0e0020',
              fontSize: '0.72rem', fontWeight: 800, letterSpacing: '0.08em',
              textTransform: 'uppercase', padding: '5px 20px', borderRadius: 99, whiteSpace: 'nowrap',
            }}>
              Pro Plan
            </div>
            <div style={{
              display: 'inline-block', background: 'rgba(255,229,0,0.15)', color: '#FFE500',
              fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.08em',
              textTransform: 'uppercase', padding: '4px 12px', borderRadius: 99, marginBottom: 20, alignSelf: 'flex-start',
            }}>
              Everything included
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, marginBottom: 4 }}>
              <div style={{ fontFamily: "'Oswald', sans-serif", fontSize: '3.6rem', fontWeight: 800, color: '#FFE500', lineHeight: 1 }}>$350</div>
              <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: '1rem', marginBottom: 8 }}>/month</div>
            </div>
            <div style={{
              display: 'inline-block', background: 'rgba(16,185,129,0.15)', color: '#10b981',
              fontSize: '0.72rem', fontWeight: 700, padding: '3px 10px', borderRadius: 99, marginBottom: 28, alignSelf: 'flex-start',
            }}>
              7-day free trial
            </div>
            <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.92rem', lineHeight: 1.65, marginBottom: 24 }}>
              We build your form, run your Meta ads, and deliver unlimited exclusive leads to your dashboard. You just close the jobs.
            </p>
            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 32px', display: 'flex', flexDirection: 'column', gap: 11 }}>
              {[
                'Branded moving or junk removal quote form',
                'Facebook & Instagram ads — fully managed',
                'Unlimited exclusive leads',
                'Built-in CRM lead dashboard',
                'Real-time lead notifications',
                'No per-lead fees. Ever.',
              ].map((item) => (
                <li key={item} style={{ display: 'flex', alignItems: 'center', gap: 12, color: 'rgba(255,255,255,0.85)', fontSize: '0.92rem' }}>
                  <span style={{ color: '#FFE500', fontWeight: 700, flexShrink: 0 }}>✓</span>
                  {item}
                </li>
              ))}
            </ul>
            <Link href="/signup" style={{
              display: 'block', textAlign: 'center', padding: '14px 24px',
              background: '#FFE500', color: '#0e0020',
              fontWeight: 700, fontSize: '1rem', borderRadius: 10, textDecoration: 'none',
              fontFamily: "'Oswald', sans-serif", letterSpacing: '0.02em',
            }}>
              Start free trial — 7 days free
            </Link>
            <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: '0.75rem', marginTop: 14 }}>
              No credit card required to start. Cancel anytime.
            </p>
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
          <h2 style={{ fontFamily: "'Oswald', sans-serif", fontSize: '2.2rem', fontWeight: 800, color: '#0e0020', marginBottom: 14 }}>
            Ready to fill your moving or junk removal schedule?
          </h2>
          <p style={{ fontSize: '1rem', color: 'rgba(26,26,46,0.7)', lineHeight: 1.7, marginBottom: 36 }}>
            Build your quote form in minutes. We&apos;ll run your Meta ads. Start receiving exclusive customers today — $350/month, 7-day free trial.
          </p>
          <Link href="/signup" style={{
            display: 'inline-block', padding: '16px 40px', background: '#0e0020',
            color: '#FFE500', fontWeight: 700, fontSize: '1.05rem', borderRadius: 10,
            textDecoration: 'none', fontFamily: "'Oswald', sans-serif", letterSpacing: '0.02em',
          }}>
            Create your free account
          </Link>
        </div>
      </section>

      {/* Deal notification toasts */}
      <DealNotificationBanner />

      {/* ── App Store Banner ── */}
      <section style={{ padding: '72px 24px', background: '#f9fafb', borderTop: '1px solid #f0f0f0' }}>
        <div style={{
          maxWidth: 860,
          margin: '0 auto',
          background: '#0e0020',
          borderRadius: 24,
          padding: '48px 48px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: 40,
          alignItems: 'center',
          overflow: 'hidden',
          position: 'relative',
        }}>
          {/* Background glow */}
          <div style={{
            position: 'absolute',
            top: -60,
            right: -60,
            width: 300,
            height: 300,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(255,229,0,0.08) 0%, transparent 70%)',
            pointerEvents: 'none',
          }} />

          {/* Copy */}
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              background: 'rgba(255,229,0,0.12)',
              border: '1px solid rgba(255,229,0,0.25)',
              borderRadius: 99,
              padding: '5px 14px',
              marginBottom: 20,
            }}>
              {/* Apple logo SVG */}
              <svg width="13" height="16" viewBox="0 0 814 1000" fill="#FFE500" xmlns="http://www.w3.org/2000/svg">
                <path d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76 0-103.7 40.8-165.9 40.8s-105-42.3-150.3-110.7c-67.5-98.2-120-252.6-120-398.7 0-138.9 48.4-207.5 96.8-253.5 57.3-54.5 138.4-86.1 213.3-86.1 81.6 0 132.2 39.5 189.5 39.5 55.4 0 115.7-42.3 207.8-42.3zm-156.5-252c32.5-50 56.7-119 56.7-188C688.3 24.6 549.8 0 476.5 0c-2 0-4 0-6.1.1 -2.3 30.5-1.2 96 22.7 158.6 23.2 61.5 56.8 99.2 138.4 130.2z"/>
              </svg>
              <span style={{ color: '#FFE500', fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                Now on iOS
              </span>
            </div>

            <h2 style={{
              fontFamily: "'Oswald', sans-serif",
              fontSize: 'clamp(1.6rem, 3.5vw, 2.2rem)',
              fontWeight: 800,
              color: 'white',
              lineHeight: 1.15,
              marginBottom: 16,
            }}>
              Manage your leads<br />from your phone.
            </h2>

            <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.95rem', lineHeight: 1.75, marginBottom: 32, maxWidth: 380 }}>
              The QuoteBox CRM app lets you view new leads, update statuses, and get instant push notifications the moment a customer submits — all from your iPhone.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 32 }}>
              {[
                { icon: '🔔', text: 'Push notification the instant a new lead comes in' },
                { icon: '📞', text: 'Tap to call or email leads directly from the app' },
                { icon: '✅', text: 'Update lead status on the go — new, contacted, booked' },
              ].map(({ icon, text }) => (
                <div key={text} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <span style={{ fontSize: '0.9rem', flexShrink: 0 }}>{icon}</span>
                  <span style={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.88rem', lineHeight: 1.55 }}>{text}</span>
                </div>
              ))}
            </div>

            {/* App Store badge */}
            <a
              href="https://apps.apple.com"
              target="_blank"
              rel="noopener noreferrer"
              style={{ display: 'inline-block' }}
            >
              {/* Official App Store badge shape, hand-coded */}
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 10,
                background: 'white',
                color: '#0e0020',
                borderRadius: 12,
                padding: '10px 20px',
                textDecoration: 'none',
                cursor: 'pointer',
                boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
                transition: 'opacity 0.15s',
              }}>
                <svg width="20" height="24" viewBox="0 0 814 1000" fill="#0e0020" xmlns="http://www.w3.org/2000/svg">
                  <path d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76 0-103.7 40.8-165.9 40.8s-105-42.3-150.3-110.7c-67.5-98.2-120-252.6-120-398.7 0-138.9 48.4-207.5 96.8-253.5 57.3-54.5 138.4-86.1 213.3-86.1 81.6 0 132.2 39.5 189.5 39.5 55.4 0 115.7-42.3 207.8-42.3zm-156.5-252c32.5-50 56.7-119 56.7-188C688.3 24.6 549.8 0 476.5 0c-2 0-4 0-6.1.1 -2.3 30.5-1.2 96 22.7 158.6 23.2 61.5 56.8 99.2 138.4 130.2z"/>
                </svg>
                <div>
                  <div style={{ fontSize: '0.6rem', color: '#555', lineHeight: 1, marginBottom: 1 }}>Download on the</div>
                  <div style={{ fontSize: '1rem', fontWeight: 700, lineHeight: 1.1, letterSpacing: '-0.01em' }}>App Store</div>
                </div>
              </div>
            </a>
          </div>

          {/* Phone mockup */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            position: 'relative',
            zIndex: 1,
          }}>
            <div style={{
              width: 200,
              background: '#0a0a1a',
              borderRadius: 36,
              padding: '10px',
              boxShadow: '0 0 0 1px rgba(255,255,255,0.1), 0 32px 80px rgba(0,0,0,0.6)',
              position: 'relative',
            }}>
              {/* Notch */}
              <div style={{
                width: 80,
                height: 18,
                background: '#0a0a1a',
                borderRadius: '0 0 14px 14px',
                position: 'absolute',
                top: 10,
                left: '50%',
                transform: 'translateX(-50%)',
                zIndex: 2,
              }} />
              {/* Screen */}
              <div style={{
                background: '#f9fafb',
                borderRadius: 28,
                overflow: 'hidden',
                minHeight: 380,
                paddingTop: 28,
              }}>
                {/* Status bar */}
                <div style={{ padding: '6px 16px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.55rem', fontWeight: 700, color: '#0e0020' }}>9:41</span>
                  <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                    <div style={{ width: 10, height: 6, border: '1px solid #0e0020', borderRadius: 1, position: 'relative' }}>
                      <div style={{ position: 'absolute', inset: 1, background: '#0e0020', borderRadius: 0.5, width: '70%' }} />
                    </div>
                  </div>
                </div>

                {/* App header */}
                <div style={{ padding: '12px 14px 8px', borderBottom: '1px solid #e5e7eb' }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0e0020' }}>My Business</div>
                </div>

                {/* Stats row */}
                <div style={{ display: 'flex', gap: 6, padding: '10px 10px 6px' }}>
                  {[
                    { label: 'Total', val: '24', color: '#4f46e5' },
                    { label: 'New', val: '3', color: '#f59e0b' },
                    { label: 'Booked', val: '11', color: '#10b981' },
                  ].map(({ label, val, color }) => (
                    <div key={label} style={{
                      flex: 1,
                      background: 'white',
                      borderRadius: 8,
                      padding: '6px 6px',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.07)',
                    }}>
                      <div style={{ fontSize: '0.52rem', color: '#9ca3af' }}>{label}</div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 700, color }}>{val}</div>
                    </div>
                  ))}
                </div>

                {/* Lead cards */}
                <div style={{ padding: '4px 10px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {[
                    { name: 'Sarah M.', type: 'Local Move', quote: '$320', status: 'New', dot: '#f59e0b' },
                    { name: 'James K.', type: 'Junk Removal', quote: '$180', status: 'Booked', dot: '#10b981' },
                    { name: 'Lisa R.', type: 'Long Distance', quote: '$1,450', status: 'Contacted', dot: '#3b82f6' },
                  ].map(({ name, type, quote, status, dot }) => (
                    <div key={name} style={{
                      background: 'white',
                      borderRadius: 10,
                      padding: '8px 10px',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.07)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                    }}>
                      <div style={{
                        width: 28,
                        height: 28,
                        borderRadius: '50%',
                        background: dot + '22',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.6rem',
                        fontWeight: 700,
                        color: dot,
                        flexShrink: 0,
                      }}>
                        {name[0]}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '0.62rem', fontWeight: 600, color: '#0e0020', lineHeight: 1.2 }}>{name}</div>
                        <div style={{ fontSize: '0.52rem', color: '#9ca3af' }}>{type}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '0.62rem', fontWeight: 700, color: '#10b981' }}>{quote}</div>
                        <div style={{
                          fontSize: '0.45rem',
                          fontWeight: 600,
                          color: dot,
                          background: dot + '18',
                          padding: '1px 5px',
                          borderRadius: 99,
                          marginTop: 2,
                        }}>
                          {status}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Google Play Banner ── */}
      <section style={{ padding: '72px 24px', background: 'white', borderTop: '1px solid #f0f0f0' }}>
        <div style={{
          maxWidth: 860,
          margin: '0 auto',
          background: '#0e0020',
          borderRadius: 24,
          padding: '48px 48px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: 40,
          alignItems: 'center',
          overflow: 'hidden',
          position: 'relative',
        }}>
          {/* Background glow */}
          <div style={{
            position: 'absolute',
            top: -60,
            left: -60,
            width: 300,
            height: 300,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(61,220,132,0.08) 0%, transparent 70%)',
            pointerEvents: 'none',
          }} />

          {/* Phone mockup */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            position: 'relative',
            zIndex: 1,
          }}>
            <div style={{
              width: 200,
              background: '#0a0a1a',
              borderRadius: 36,
              padding: '10px',
              boxShadow: '0 0 0 1px rgba(255,255,255,0.1), 0 32px 80px rgba(0,0,0,0.6)',
              position: 'relative',
            }}>
              {/* Punch-hole camera */}
              <div style={{
                width: 10,
                height: 10,
                background: '#0a0a1a',
                borderRadius: '50%',
                position: 'absolute',
                top: 18,
                left: '50%',
                transform: 'translateX(-50%)',
                zIndex: 2,
              }} />
              {/* Screen */}
              <div style={{
                background: '#f9fafb',
                borderRadius: 28,
                overflow: 'hidden',
                minHeight: 380,
                paddingTop: 24,
              }}>
                {/* Status bar */}
                <div style={{ padding: '6px 16px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.55rem', fontWeight: 700, color: '#0e0020' }}>12:30</span>
                  <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                    <div style={{ width: 10, height: 6, border: '1px solid #0e0020', borderRadius: 1, position: 'relative' }}>
                      <div style={{ position: 'absolute', inset: 1, background: '#10b981', borderRadius: 0.5, width: '85%' }} />
                    </div>
                  </div>
                </div>

                {/* App header */}
                <div style={{ padding: '12px 14px 8px', borderBottom: '1px solid #e5e7eb' }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0e0020' }}>My Business</div>
                </div>

                {/* Stats row */}
                <div style={{ display: 'flex', gap: 6, padding: '10px 10px 6px' }}>
                  {[
                    { label: 'Total', val: '38', color: '#4f46e5' },
                    { label: 'New', val: '5', color: '#f59e0b' },
                    { label: 'Booked', val: '19', color: '#10b981' },
                  ].map(({ label, val, color }) => (
                    <div key={label} style={{
                      flex: 1,
                      background: 'white',
                      borderRadius: 8,
                      padding: '6px 6px',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.07)',
                    }}>
                      <div style={{ fontSize: '0.52rem', color: '#9ca3af' }}>{label}</div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 700, color }}>{val}</div>
                    </div>
                  ))}
                </div>

                {/* Lead cards */}
                <div style={{ padding: '4px 10px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {[
                    { name: 'Mike T.', type: 'Estate Cleanout', quote: '$2,400', status: 'New', dot: '#f59e0b' },
                    { name: 'Amy W.', type: 'Apartment Move', quote: '$280', status: 'Booked', dot: '#10b981' },
                    { name: 'Carlos D.', type: 'Junk Hauling', quote: '$550', status: 'Contacted', dot: '#3b82f6' },
                  ].map(({ name, type, quote, status, dot }) => (
                    <div key={name} style={{
                      background: 'white',
                      borderRadius: 10,
                      padding: '8px 10px',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.07)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                    }}>
                      <div style={{
                        width: 28,
                        height: 28,
                        borderRadius: '50%',
                        background: dot + '22',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.6rem',
                        fontWeight: 700,
                        color: dot,
                        flexShrink: 0,
                      }}>
                        {name[0]}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '0.62rem', fontWeight: 600, color: '#0e0020', lineHeight: 1.2 }}>{name}</div>
                        <div style={{ fontSize: '0.52rem', color: '#9ca3af' }}>{type}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '0.62rem', fontWeight: 700, color: '#10b981' }}>{quote}</div>
                        <div style={{
                          fontSize: '0.45rem',
                          fontWeight: 600,
                          color: dot,
                          background: dot + '18',
                          padding: '1px 5px',
                          borderRadius: 99,
                          marginTop: 2,
                        }}>
                          {status}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Copy */}
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              background: 'rgba(61,220,132,0.12)',
              border: '1px solid rgba(61,220,132,0.25)',
              borderRadius: 99,
              padding: '5px 14px',
              marginBottom: 20,
            }}>
              {/* Google Play triangle icon */}
              <svg width="14" height="16" viewBox="0 0 24 24" fill="#3DDC84" xmlns="http://www.w3.org/2000/svg">
                <path d="M3.609 1.814L13.792 12 3.61 22.186a.996.996 0 0 1-.61-.92V2.734a1 1 0 0 1 .609-.92zm10.89 10.893l2.302 2.302-10.937 6.333 8.635-8.635zm3.199-3.198l2.807 1.626a1 1 0 0 1 0 1.73l-2.808 1.626L15.206 12l2.492-2.491zM5.864 2.658L16.8 8.99l-2.3 2.3-8.636-8.632z"/>
              </svg>
              <span style={{ color: '#3DDC84', fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                Now on Android
              </span>
            </div>

            <h2 style={{
              fontFamily: "'Oswald', sans-serif",
              fontSize: 'clamp(1.6rem, 3.5vw, 2.2rem)',
              fontWeight: 800,
              color: 'white',
              lineHeight: 1.15,
              marginBottom: 16,
            }}>
              QuoteBox CRM<br />for Android.
            </h2>

            <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.95rem', lineHeight: 1.75, marginBottom: 32, maxWidth: 380 }}>
              Get the same powerful lead management on your Android device. View leads, update statuses, and receive instant push notifications — wherever you are.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 32 }}>
              {[
                { icon: '🔔', text: 'Instant push notifications for every new lead' },
                { icon: '📞', text: 'One-tap call or email directly from the app' },
                { icon: '✅', text: 'Update lead status on the go — new, contacted, booked' },
              ].map(({ icon, text }) => (
                <div key={text} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <span style={{ fontSize: '0.9rem', flexShrink: 0 }}>{icon}</span>
                  <span style={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.88rem', lineHeight: 1.55 }}>{text}</span>
                </div>
              ))}
            </div>

            {/* Google Play badge */}
            <a
              href="https://play.google.com/store"
              target="_blank"
              rel="noopener noreferrer"
              style={{ display: 'inline-block' }}
            >
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 10,
                background: 'white',
                color: '#0e0020',
                borderRadius: 12,
                padding: '10px 20px',
                textDecoration: 'none',
                cursor: 'pointer',
                boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
                transition: 'opacity 0.15s',
              }}>
                <svg width="20" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M3.609 1.814L13.792 12 3.61 22.186a.996.996 0 0 1-.61-.92V2.734a1 1 0 0 1 .609-.92z" fill="#4285F4"/>
                  <path d="M14.499 12.707l2.302 2.302-10.937 6.333 8.635-8.635z" fill="#EA4335"/>
                  <path d="M17.698 9.509l2.807 1.626a1 1 0 0 1 0 1.73l-2.808 1.626L15.206 12l2.492-2.491z" fill="#FBBC04"/>
                  <path d="M5.864 2.658L16.8 8.99l-2.3 2.3-8.636-8.632z" fill="#34A853"/>
                </svg>
                <div>
                  <div style={{ fontSize: '0.6rem', color: '#555', lineHeight: 1, marginBottom: 1 }}>GET IT ON</div>
                  <div style={{ fontSize: '1rem', fontWeight: 700, lineHeight: 1.1, letterSpacing: '-0.01em' }}>Google Play</div>
                </div>
              </div>
            </a>
          </div>
        </div>
      </section>

      <PublicFooter />

    </div>
  )
}
