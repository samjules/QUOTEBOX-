import Link from 'next/link'
import DealNotificationBanner from '@/components/DealNotificationBanner'
import PublicFooter from '@/components/PublicFooter'

export default function LandingPage() {
  return (
    <div style={{ fontFamily: "'Nautic', sans-serif", color: '#0e0020', background: '#fff' }}>

      {/* ── Arctic Reach banner ── */}
      <div style={{
        background: '#0e0020', color: 'rgba(255,255,255,0.5)',
        textAlign: 'center', fontSize: '0.72rem', padding: '6px 16px',
        letterSpacing: '0.03em',
      }}>
        Quotebox is a product of{' '}
        <span style={{ color: 'rgba(255,255,255,0.8)', fontWeight: 600 }}>Arctic Reach LLC</span>
        {' '}·{' '}
        <Link href="/privacy" style={{ color: 'rgba(255,255,255,0.5)', textDecoration: 'underline' }}>Privacy</Link>
        {' '}·{' '}
        <Link href="/terms" style={{ color: 'rgba(255,255,255,0.5)', textDecoration: 'underline' }}>Terms</Link>
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
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: '#FFE500', color: '#0e0020',
              fontSize: '0.73rem', fontWeight: 800, letterSpacing: '0.08em',
              textTransform: 'uppercase', padding: '5px 14px', borderRadius: 99, marginBottom: 28,
            }}>
              <span>★</span> Free CRM · Free App · No Credit Card
            </div>
            <h1 style={{
              fontFamily: "'Oswald', sans-serif", fontSize: 'clamp(2.6rem, 5.5vw, 4.4rem)',
              fontWeight: 800, lineHeight: 1.05, marginBottom: 24,
            }}>
              Your instant quote form<br />
              <span style={{ color: '#FFE500' }}>is free.</span><br />
              Forever.
            </h1>
            <p style={{ fontSize: '1.05rem', color: 'rgba(255,255,255,0.68)', lineHeight: 1.75, marginBottom: 38, maxWidth: 480 }}>
              Build a branded quote form for your moving or junk removal business in minutes. Free CRM, free iOS &amp; Android app, and a live shareable link — no website, no credit card, no catch.
            </p>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <Link href="/build" style={{
                padding: '16px 36px', background: '#FFE500', color: '#0e0020',
                fontWeight: 800, fontSize: '1.05rem', borderRadius: 10, textDecoration: 'none',
                fontFamily: "'Oswald', sans-serif", letterSpacing: '0.03em',
              }}>
                Build your form now — it&apos;s free →
              </Link>
            </div>
            <p style={{ marginTop: 18, fontSize: '0.82rem', color: 'rgba(255,255,255,0.35)' }}>
              No credit card required · Free forever
            </p>
          </div>

          {/* Right — dashboard screenshot */}
          <div style={{
            display: 'flex', justifyContent: 'center', alignItems: 'flex-end',
            position: 'relative', paddingTop: 20,
          }}>
            <div style={{
              position: 'relative', zIndex: 2,
              width: '100%',
              maxWidth: 520,
              borderRadius: '16px 16px 0 0',
              overflow: 'hidden',
              boxShadow: '0 -8px 60px rgba(255,229,0,0.12), 0 0 0 1px rgba(255,255,255,0.08)',
            }}>
              {/* Fake browser chrome */}
              <div style={{
                background: '#1e1e32', padding: '10px 16px',
                display: 'flex', alignItems: 'center', gap: 6,
                borderBottom: '1px solid rgba(255,255,255,0.06)',
              }}>
                <span style={{ width: 9, height: 9, borderRadius: '50%', background: '#ef4444', display: 'inline-block' }} />
                <span style={{ width: 9, height: 9, borderRadius: '50%', background: '#f59e0b', display: 'inline-block' }} />
                <span style={{ width: 9, height: 9, borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
                <div style={{
                  flex: 1, background: 'rgba(255,255,255,0.06)', borderRadius: 4, padding: '3px 10px',
                  fontSize: '0.65rem', color: 'rgba(255,255,255,0.3)', marginLeft: 8,
                }}>
                  quote-box.com/dashboard
                </div>
              </div>
              <img
                src="/screenshots/main-dashboard.png"
                alt="QuoteBox CRM dashboard showing $111,811 pipeline"
                style={{ width: '100%', display: 'block' }}
              />
            </div>

            {/* Floating lead badge */}
            <div style={{
              position: 'absolute', top: 28, right: '-2%', zIndex: 3,
              background: 'white', borderRadius: 12,
              padding: '10px 14px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
              display: 'flex', alignItems: 'center', gap: 10,
              minWidth: 175,
            }}>
              <div style={{
                width: 36, height: 36, borderRadius: '50%', background: '#dcfce7',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>🔔</div>
              <div>
                <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#0e0020', lineHeight: 1.2 }}>New lead received</div>
                <div style={{ fontSize: '0.65rem', color: '#10b981', fontWeight: 600 }}>Quote: $510.00 · Just now</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Strip ── */}
      <div style={{
        background: '#FFE500', padding: '13px 24px', textAlign: 'center',
        fontSize: '0.88rem', fontWeight: 700, color: '#0e0020', letterSpacing: '0.01em',
      }}>
        Free CRM · Free iOS & Android app · No credit card required · Build your instant quote form now
      </div>

      {/* ── How the form works (4 steps) ── */}
      <section style={{ padding: '96px 24px', background: '#f9fafb' }}>
        <div style={{ maxWidth: 1060, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 60 }}>
            <div style={{
              display: 'inline-block', background: '#0e0020', color: '#FFE500',
              fontSize: '0.72rem', fontWeight: 800, letterSpacing: '0.1em',
              textTransform: 'uppercase', padding: '5px 14px', borderRadius: 99, marginBottom: 20,
            }}>
              Your instant quote form
            </div>
            <h2 style={{ fontFamily: "'Oswald', sans-serif", fontSize: 'clamp(1.8rem, 3.5vw, 2.6rem)', fontWeight: 800, marginBottom: 12, color: '#0e0020' }}>
              Customers get a real price.<br />You get a real lead.
            </h2>
            <p style={{ color: '#6b7280', fontSize: '1rem', maxWidth: 520, margin: '0 auto', lineHeight: 1.7 }}>
              A branded quote form that lives at your own link — no website needed. Customers walk through it step by step and get an instant estimate.
            </p>
          </div>

          {/* 4-up form flow screenshots */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 24,
            alignItems: 'flex-start',
          }}>
            {[
              {
                step: '1',
                label: 'Home size',
                img: '/screenshots/home-size-form.png',
                alt: 'Home size selection step',
              },
              {
                step: '2',
                label: 'Moving route',
                img: '/screenshots/route-map.png',
                alt: 'Moving route with live Mapbox distance',
              },
              {
                step: '3',
                label: 'Contact info',
                img: '/screenshots/lead-capture.png',
                alt: 'Customer contact capture step',
              },
              {
                step: '4',
                label: 'Instant quote',
                img: '/screenshots/quote-confirmation.png',
                alt: 'Instant quote confirmation screen',
              },
            ].map(({ step, label, img, alt }) => (
              <div key={step} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: '50%', background: '#0e0020',
                  color: '#FFE500', fontFamily: "'Oswald', sans-serif", fontSize: '0.95rem',
                  fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {step}
                </div>
                <div style={{
                  width: '100%',
                  borderRadius: 18,
                  overflow: 'hidden',
                  boxShadow: '0 16px 48px rgba(0,0,0,0.14), 0 2px 8px rgba(0,0,0,0.06)',
                  border: '1px solid rgba(0,0,0,0.06)',
                }}>
                  <img src={img} alt={alt} style={{ width: '100%', display: 'block' }} />
                </div>
                <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#0e0020' }}>{label}</div>
              </div>
            ))}
          </div>

          <div style={{ textAlign: 'center', marginTop: 52 }}>
            <Link href="/build" style={{
              display: 'inline-block', padding: '15px 36px',
              background: '#0e0020', color: '#FFE500',
              fontWeight: 800, fontSize: '1rem', borderRadius: 10, textDecoration: 'none',
              fontFamily: "'Oswald', sans-serif", letterSpacing: '0.03em',
            }}>
              Build your form free →
            </Link>
            <p style={{ marginTop: 12, fontSize: '0.78rem', color: '#9ca3af' }}>No credit card required</p>
          </div>
        </div>
      </section>

      {/* ── CRM — full dashboard ── */}
      <section style={{ padding: '100px 24px', background: 'white', overflow: 'hidden' }}>
        <div style={{ maxWidth: 1060, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 100 }}>

          {/* Row 1 — Leads dashboard */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: 56,
            alignItems: 'center',
          }}>
            <div style={{ display: 'flex', justifyContent: 'center', position: 'relative' }}>
              <div style={{
                position: 'absolute', inset: -32,
                background: 'radial-gradient(ellipse at center, #10b98120 0%, transparent 70%)',
                borderRadius: '50%', zIndex: 0,
              }} />
              <div style={{
                position: 'relative', zIndex: 1, width: '100%', maxWidth: 520,
                borderRadius: 16,
                boxShadow: '0 32px 80px rgba(0,0,0,0.14), 0 2px 8px rgba(0,0,0,0.07)',
                border: '1px solid rgba(0,0,0,0.06)',
                overflow: 'hidden',
                transform: 'rotate(-1deg)',
              }}>
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
                    quote-box.com/leads
                  </div>
                </div>
                <img
                  src="/screenshots/leads-dashboard.png"
                  alt="QuoteBox leads dashboard — 686 total leads, $111,811 pipeline"
                  style={{ width: '100%', display: 'block' }}
                />
              </div>
            </div>

            <div>
              <div style={{
                display: 'inline-block', background: '#dcfce7', color: '#15803d',
                fontSize: '0.72rem', fontWeight: 800, letterSpacing: '0.1em',
                textTransform: 'uppercase', padding: '5px 14px', borderRadius: 99, marginBottom: 22,
              }}>
                Free CRM — included
              </div>
              <h2 style={{
                fontFamily: "'Oswald', sans-serif", fontSize: 'clamp(1.8rem, 4vw, 2.6rem)',
                fontWeight: 800, lineHeight: 1.12, color: '#0e0020', marginBottom: 20,
              }}>
                Every lead lands in<br />your dashboard the<br />second they submit.
              </h2>
              <p style={{ color: '#6b7280', fontSize: '1rem', lineHeight: 1.8, marginBottom: 28 }}>
                No spreadsheets. No chasing forms. The moment a customer submits, their name, contact info, and calculated quote total appear in your free CRM — instantly. Track every lead from new to booked.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {[
                  { icon: '📋', text: 'Full contact info — name, email, and phone on every lead' },
                  { icon: '💵', text: 'Estimated quote total calculated and shown right on the lead card' },
                  { icon: '🔄', text: 'Track each lead from new → contacted → booked → closed' },
                  { icon: '📊', text: 'Live pipeline value — see your total revenue in the funnel at a glance' },
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
                  background: '#15803d', color: 'white',
                  fontWeight: 700, fontSize: '0.93rem', borderRadius: 10, textDecoration: 'none',
                  fontFamily: "'Oswald', sans-serif", letterSpacing: '0.02em',
                }}>
                  Start capturing leads free →
                </Link>
              </div>
            </div>
          </div>

          {/* Row 2 — Main dashboard / pipeline */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: 56,
            alignItems: 'center',
          }}>
            <div>
              <div style={{
                display: 'inline-block', background: '#eff6ff', color: '#1d4ed8',
                fontSize: '0.72rem', fontWeight: 800, letterSpacing: '0.1em',
                textTransform: 'uppercase', padding: '5px 14px', borderRadius: 99, marginBottom: 22,
              }}>
                Pipeline dashboard
              </div>
              <h2 style={{
                fontFamily: "'Oswald', sans-serif", fontSize: 'clamp(1.8rem, 4vw, 2.6rem)',
                fontWeight: 800, lineHeight: 1.12, color: '#0e0020', marginBottom: 20,
              }}>
                See your full pipeline.<br />Know your numbers.<br />Close more jobs.
              </h2>
              <p style={{ color: '#6b7280', fontSize: '1rem', lineHeight: 1.8, marginBottom: 28 }}>
                Your dashboard shows total leads, new leads, booked jobs, Meta ad spend, and a live LTV calculator — so you always know your cost per lead, booking rate, and profit per job.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {[
                  { icon: '📈', text: '$111,811 pipeline value visible at a glance' },
                  { icon: '🎯', text: 'Booking rate, cost per lead, and ROAS calculated automatically' },
                  { icon: '🗓️', text: 'Today\'s feed shows new leads and appointments as they arrive' },
                  { icon: '💡', text: 'LTV calculator — see your average deal size, value per lead, and profit margin' },
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
                  background: '#1d4ed8', color: 'white',
                  fontWeight: 700, fontSize: '0.93rem', borderRadius: 10, textDecoration: 'none',
                  fontFamily: "'Oswald', sans-serif", letterSpacing: '0.02em',
                }}>
                  Get your free dashboard →
                </Link>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', position: 'relative' }}>
              <div style={{
                position: 'absolute', inset: -32,
                background: 'radial-gradient(ellipse at center, #1d4ed820 0%, transparent 70%)',
                borderRadius: '50%', zIndex: 0,
              }} />
              <div style={{
                position: 'relative', zIndex: 1, width: '100%', maxWidth: 520,
                borderRadius: 16,
                boxShadow: '0 32px 80px rgba(29,78,216,0.15), 0 2px 8px rgba(0,0,0,0.07)',
                border: '1px solid rgba(0,0,0,0.06)',
                overflow: 'hidden',
                transform: 'rotate(1deg)',
              }}>
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
                    quote-box.com/dashboard
                  </div>
                </div>
                <img
                  src="/screenshots/main-dashboard.png"
                  alt="QuoteBox main dashboard with pipeline value and LTV calculator"
                  style={{ width: '100%', display: 'block' }}
                />
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ── Lead map ── */}
      <section style={{ padding: '96px 24px', background: '#f9fafb' }}>
        <div style={{ maxWidth: 1060, margin: '0 auto' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: 56,
            alignItems: 'center',
          }}>
            <div style={{ display: 'flex', justifyContent: 'center', position: 'relative' }}>
              <div style={{
                position: 'absolute', inset: -32,
                background: 'radial-gradient(ellipse at center, #FFE50028 0%, transparent 70%)',
                borderRadius: '50%', zIndex: 0,
              }} />
              <div style={{
                position: 'relative', zIndex: 1, width: '100%', maxWidth: 520,
                borderRadius: 16,
                boxShadow: '0 32px 80px rgba(0,0,0,0.14)',
                border: '1px solid rgba(0,0,0,0.06)',
                overflow: 'hidden',
                transform: 'rotate(-1.5deg)',
              }}>
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
                    quote-box.com/map
                  </div>
                </div>
                <img
                  src="/screenshots/leads-map.png"
                  alt="Map view showing lead locations across Florida"
                  style={{ width: '100%', display: 'block' }}
                />
              </div>
            </div>

            <div>
              <div style={{
                display: 'inline-block', background: '#FEF9C3', color: '#854D0E',
                fontSize: '0.72rem', fontWeight: 800, letterSpacing: '0.1em',
                textTransform: 'uppercase', padding: '5px 14px', borderRadius: 99, marginBottom: 22,
              }}>
                Lead map
              </div>
              <h2 style={{
                fontFamily: "'Oswald', sans-serif", fontSize: 'clamp(1.8rem, 4vw, 2.6rem)',
                fontWeight: 800, lineHeight: 1.12, color: '#0e0020', marginBottom: 20,
              }}>
                See exactly where<br />your leads are<br />coming from.
              </h2>
              <p style={{ color: '#6b7280', fontSize: '1rem', lineHeight: 1.8, marginBottom: 28 }}>
                Every lead is plotted on a live map so you can visualize your coverage area, spot high-density zones, and decide where to double down on ads or service.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {[
                  { icon: '📍', text: 'Every lead pinned to their pickup or service address' },
                  { icon: '🗺️', text: 'Identify your hottest neighborhoods and coverage gaps at a glance' },
                  { icon: '📡', text: 'Live — new leads appear on the map the moment they submit' },
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
                  Get your free CRM →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Automations ── */}
      <section style={{ padding: '100px 24px', background: 'white' }}>
        <div style={{ maxWidth: 1060, margin: '0 auto' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: 56,
            alignItems: 'center',
          }}>
            <div>
              <div style={{
                display: 'inline-block', background: '#f5f3ff', color: '#6d28d9',
                fontSize: '0.72rem', fontWeight: 800, letterSpacing: '0.1em',
                textTransform: 'uppercase', padding: '5px 14px', borderRadius: 99, marginBottom: 22,
              }}>
                Instant automations
              </div>
              <h2 style={{
                fontFamily: "'Oswald', sans-serif", fontSize: 'clamp(1.8rem, 4vw, 2.6rem)',
                fontWeight: 800, lineHeight: 1.12, color: '#0e0020', marginBottom: 20,
              }}>
                Contact every lead<br />the second they<br />hit submit.
              </h2>
              <p style={{ color: '#6b7280', fontSize: '1rem', lineHeight: 1.8, marginBottom: 28 }}>
                Set up a one-time automation that fires the moment a new lead comes in — a personalized email and SMS with a link straight back to their quote. You reach them before any competitor even sees their name.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {[
                  { icon: '⚡', text: 'Instant email + SMS sent the moment a lead submits their form' },
                  { icon: '✉️', text: 'Personalized with their name, quote amount, and your business details' },
                  { icon: '📊', text: 'Track open rate, click rate, and response in your dashboard' },
                  { icon: '🔁', text: 'Set it once — it runs automatically on every new lead forever' },
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
                  background: '#6d28d9', color: 'white',
                  fontWeight: 700, fontSize: '0.93rem', borderRadius: 10, textDecoration: 'none',
                  fontFamily: "'Oswald', sans-serif", letterSpacing: '0.02em',
                }}>
                  Set up automations free →
                </Link>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', position: 'relative' }}>
              <div style={{
                position: 'absolute', inset: -32,
                background: 'radial-gradient(ellipse at center, #6d28d920 0%, transparent 70%)',
                borderRadius: '50%', zIndex: 0,
              }} />
              <div style={{
                position: 'relative', zIndex: 1, width: '100%', maxWidth: 520,
                borderRadius: 16,
                boxShadow: '0 32px 80px rgba(109,40,217,0.15), 0 2px 8px rgba(0,0,0,0.07)',
                border: '1px solid rgba(0,0,0,0.06)',
                overflow: 'hidden',
                transform: 'rotate(1deg)',
              }}>
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
                    quote-box.com/automations
                  </div>
                </div>
                <img
                  src="/screenshots/automations.png"
                  alt="Quotebox automation — instant email and SMS on new lead"
                  style={{ width: '100%', display: 'block' }}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Campaigns / Meta Ads ── */}
      <section style={{ padding: '96px 24px', background: '#f9fafb' }}>
        <div style={{ maxWidth: 1060, margin: '0 auto' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: 56,
            alignItems: 'center',
          }}>
            <div style={{ display: 'flex', justifyContent: 'center', position: 'relative' }}>
              <div style={{
                position: 'absolute', inset: -32,
                background: 'radial-gradient(ellipse at center, #1877f220 0%, transparent 70%)',
                borderRadius: '50%', zIndex: 0,
              }} />
              <div style={{
                position: 'relative', zIndex: 1, width: '100%', maxWidth: 520,
                borderRadius: 16,
                boxShadow: '0 32px 80px rgba(24,119,242,0.15), 0 2px 8px rgba(0,0,0,0.07)',
                border: '1px solid rgba(0,0,0,0.06)',
                overflow: 'hidden',
                transform: 'rotate(-1deg)',
              }}>
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
                    quote-box.com/campaigns
                  </div>
                </div>
                <img
                  src="/screenshots/campaigns-analytics.png"
                  alt="Campaigns dashboard — $2,968 spend, 210 leads, $14.14 CPL"
                  style={{ width: '100%', display: 'block' }}
                />
              </div>
            </div>

            <div>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                background: '#eff6ff', border: '1px solid #bfdbfe',
                borderRadius: 99, padding: '5px 14px', marginBottom: 22,
              }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="#1d4ed8" xmlns="http://www.w3.org/2000/svg">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
                <span style={{ color: '#1d4ed8', fontSize: '0.72rem', fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                  Powered by Meta Ads
                </span>
              </div>
              <h2 style={{
                fontFamily: "'Oswald', sans-serif", fontSize: 'clamp(1.8rem, 4vw, 2.6rem)',
                fontWeight: 800, lineHeight: 1.12, color: '#0e0020', marginBottom: 20,
              }}>
                Run Meta ads that<br />send customers straight<br />to your quote form.
              </h2>
              <p style={{ color: '#6b7280', fontSize: '1rem', lineHeight: 1.8, marginBottom: 28 }}>
                Connect your Meta Ads account and run campaigns directly from your Quotebox dashboard. Track spend, leads, cost per lead, and campaign performance — all in one place.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {[
                  { icon: '📊', text: 'Live analytics — total spend, leads, avg CPL, and active campaigns' },
                  { icon: '🎯', text: 'Split test ad sets and see which one wins in real time' },
                  { icon: '🔗', text: 'Ads go directly to your form — no landing page, no wasted clicks' },
                  { icon: '💰', text: 'Real example: 210 leads at $14.14 CPL from $2,968 in ad spend' },
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
                  Build your form & run ads →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Free App dark section ── */}
      <section className="maze-dark" style={{ padding: '80px 24px', background: '#0e0020' }}>
        <div style={{ maxWidth: 860, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 48, alignItems: 'center' }}>
          <div>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: 'rgba(255,229,0,0.12)', border: '1px solid rgba(255,229,0,0.3)',
              borderRadius: 99, padding: '5px 14px', marginBottom: 22,
            }}>
              <svg width="13" height="16" viewBox="0 0 814 1000" fill="#FFE500" xmlns="http://www.w3.org/2000/svg">
                <path d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76 0-103.7 40.8-165.9 40.8s-105-42.3-150.3-110.7c-67.5-98.2-120-252.6-120-398.7 0-138.9 48.4-207.5 96.8-253.5 57.3-54.5 138.4-86.1 213.3-86.1 81.6 0 132.2 39.5 189.5 39.5 55.4 0 115.7-42.3 207.8-42.3zm-156.5-252c32.5-50 56.7-119 56.7-188C688.3 24.6 549.8 0 476.5 0c-2 0-4 0-6.1.1 -2.3 30.5-1.2 96 22.7 158.6 23.2 61.5 56.8 99.2 138.4 130.2z"/>
              </svg>
              <span style={{ color: '#FFE500', fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                Free iOS & Android app
              </span>
            </div>
            <h2 style={{ fontFamily: "'Oswald', sans-serif", fontSize: '2.2rem', fontWeight: 800, color: 'white', lineHeight: 1.12, marginBottom: 18 }}>
              Manage your CRM<br />from your phone.<br />For free.
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.97rem', lineHeight: 1.75, marginBottom: 24 }}>
              The QuoteBox app lets you view new leads, update statuses, and get an instant push notification the second someone submits a quote — all from your iPhone or Android.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 32 }}>
              {[
                { icon: '🔔', text: 'Push notification the instant a new lead comes in' },
                { icon: '📞', text: 'Tap to call or text leads directly from the app' },
                { icon: '✅', text: 'Update lead status on the go — new, contacted, booked' },
                { icon: '💸', text: 'Free — included with every Quotebox account' },
              ].map(({ icon, text }) => (
                <div key={text} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <span style={{ fontSize: '0.9rem', flexShrink: 0 }}>{icon}</span>
                  <span style={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.9rem', lineHeight: 1.55 }}>{text}</span>
                </div>
              ))}
            </div>
            <Link href="/build" style={{
              display: 'inline-block', padding: '14px 32px',
              background: '#FFE500', color: '#0e0020',
              fontWeight: 800, fontSize: '0.95rem', borderRadius: 10, textDecoration: 'none',
              fontFamily: "'Oswald', sans-serif", letterSpacing: '0.03em',
            }}>
              Get the app free →
            </Link>
          </div>

          {/* What's in the box grid */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[
              { label: 'Free CRM', desc: 'Full lead dashboard with pipeline value, LTV calc, and status tracking.' },
              { label: 'Free iOS & Android app', desc: 'Manage leads, get push notifications, and update statuses from your phone.' },
              { label: 'Instant quote form', desc: 'A live link your customers fill out and get an auto-calculated price.' },
              { label: 'Lead map', desc: 'See where every lead is coming from on a live interactive map.' },
              { label: 'Automations', desc: 'Instant email + SMS sent to every new lead the second they submit.' },
              { label: 'Campaign analytics', desc: 'Connect Meta Ads and track CPL, spend, and campaign performance.' },
            ].map(({ label, desc }) => (
              <div key={label} style={{
                background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)',
                borderRadius: 12, padding: '16px 18px', display: 'flex', gap: 12, alignItems: 'flex-start',
              }}>
                <span style={{ color: '#FFE500', fontWeight: 800, fontSize: '1rem', flexShrink: 0, marginTop: 1 }}>✓</span>
                <div>
                  <div style={{ color: 'white', fontWeight: 600, fontSize: '0.9rem', marginBottom: 3 }}>{label}</div>
                  <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.82rem', lineHeight: 1.5 }}>{desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section style={{ padding: '96px 24px', background: '#FFE500', textAlign: 'center' }}>
        <div style={{ maxWidth: 640, margin: '0 auto' }}>
          <div style={{
            display: 'inline-block', background: '#0e0020', color: '#FFE500',
            fontSize: '0.72rem', fontWeight: 800, letterSpacing: '0.1em',
            textTransform: 'uppercase', padding: '5px 14px', borderRadius: 99, marginBottom: 24,
          }}>
            No credit card · Free forever CRM
          </div>
          <h2 style={{ fontFamily: "'Oswald', sans-serif", fontSize: 'clamp(2.2rem, 5vw, 3.4rem)', fontWeight: 800, color: '#0e0020', marginBottom: 16, lineHeight: 1.08 }}>
            Build your instant quote form now.
          </h2>
          <p style={{ fontSize: '1.05rem', color: 'rgba(14,0,32,0.65)', lineHeight: 1.75, marginBottom: 40, maxWidth: 520, margin: '0 auto 40px' }}>
            Free CRM. Free app. Free quote form. No credit card required. Start collecting leads from your first share.
          </p>
          <Link href="/build" style={{
            display: 'inline-block', padding: '18px 48px', background: '#0e0020',
            color: '#FFE500', fontWeight: 800, fontSize: '1.1rem', borderRadius: 10,
            textDecoration: 'none', fontFamily: "'Oswald', sans-serif", letterSpacing: '0.03em',
          }}>
            Build your form — it&apos;s free →
          </Link>
          <p style={{ marginTop: 16, fontSize: '0.82rem', color: 'rgba(14,0,32,0.4)', fontWeight: 500 }}>
            No credit card required · Takes under 5 minutes
          </p>
        </div>
      </section>

      <DealNotificationBanner />
      <PublicFooter />

    </div>
  )
}
