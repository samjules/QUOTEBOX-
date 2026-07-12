'use client'

import { useEffect, useState } from 'react'
import { Space_Grotesk, Inter } from 'next/font/google'
import { QRCodeSVG } from 'qrcode.react'
import { trackBuildEvent } from '@/lib/track-build-event'

const APPLE_APP_URL = 'https://apps.apple.com/us/app/quote-box-lead-machine/id6761129794'

const spaceGrotesk = Space_Grotesk({ subsets: ['latin'], weight: ['500', '700'], variable: '--font-space-grotesk-offer' })
const inter = Inter({ subsets: ['latin'], weight: ['400', '500', '600', '700', '800'], variable: '--font-inter-offer' })

// Real product screenshots, framed in fake browser chrome — same treatment as the
// homepage. Replaces the earlier hand-drawn CSS mockups, which read as noticeably
// less credible next to actual software.
function BrowserShot({ src, alt, url, glow }: { src: string; alt: string; url: string; glow?: string }) {
  return (
    <div className="bshot-wrap">
      {glow && <div className="bshot-glow" style={{ background: `radial-gradient(ellipse at center, ${glow} 0%, transparent 70%)` }} />}
      <div className="bshot">
        <div className="bshot-bar">
          <span className="bdot r" /><span className="bdot y" /><span className="bdot g" />
          <div className="bshot-url">{url}</div>
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={alt} />
      </div>
      <style jsx>{`
        .bshot-wrap{position:relative;width:100%;}
        .bshot-glow{position:absolute;inset:-15%;z-index:0;}
        .bshot{position:relative;z-index:1;border-radius:14px;overflow:hidden;background:#0c0a16;border:1px solid var(--line);box-shadow:0 40px 90px -30px rgba(0,0,0,0.75);}
        .bshot-bar{display:flex;align-items:center;gap:6px;padding:10px 14px;background:#141024;border-bottom:1px solid var(--line);}
        .bdot{width:9px;height:9px;border-radius:50%;flex:0 0 auto;}
        .bdot.r{background:#ff5f57;} .bdot.y{background:#febc2e;} .bdot.g{background:#28c840;}
        .bshot-url{margin-left:8px;background:rgba(255,255,255,0.06);padding:3px 12px;border-radius:6px;font-size:11px;color:var(--muted);}
        .bshot img{width:100%;display:block;}
      `}</style>
    </div>
  )
}

const FAQS = [
  { q: 'Is this really $1, or is there a catch?', a: "It's $1 for your first month — full access, no feature limits. After that, it renews at the normal $34/month rate. Cancel anytime before your first renewal and you're never charged again." },
  { q: 'Do I need to be technical to set this up?', a: 'No. Most owners have their branded quote form live in under 10 minutes using our guided setup. If you get stuck, our team will build it with you on a quick call at no charge.' },
  { q: 'What happens after I sign up?', a: "You'll land in your dashboard immediately. From there you can build your quote form, connect your number for SMS, and start collecting leads the same day." },
  { q: 'Does this replace my Facebook/Google ads?', a: 'No — Quotebox is where your leads land and get followed up with automatically. If you want us to also run your ad campaigns, that\'s available separately once you\'re set up.' },
  { q: 'Can I cancel anytime?', a: "Yes. There's no contract. Cancel from your dashboard in a couple of clicks, whenever you want." },
] as const

export default function TrialLanding({ onStart }: { onStart: (upsell?: never) => void }) {
  const [showSticky, setShowSticky] = useState(false)

  // Funnel analytics — one row per landing-page view, compared against accounts
  // actually created (accounts.signup_source = 'build'). Raw data only for now;
  // the admin dashboard for this was retired in favor of /admin/casestudy-analytics.
  useEffect(() => {
    fetch('/api/build/track-view', { method: 'POST' }).catch(() => {})
  }, [])

  useEffect(() => {
    function onScroll() { setShowSticky(window.scrollY > 500) }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <div className={`${spaceGrotesk.variable} ${inter.variable} offer`}>
      <nav>
        <div className="brand"><div className="logo-mark">QB</div>Quotebox</div>
        <button className="cta-btn small" onClick={() => { trackBuildEvent('landing_nav'); onStart() }}>Make My Pledge</button>
      </nav>

      <header className="hero">
        <div className="hero-text">
          <div className="eyebrow"><span className="dot" /> Take the pledge</div>
          <h1 className="headline">Pledge your next <span className="accent">booked job.</span><br />We&apos;ll build you the strategy to get it.</h1>
          <p className="sub">Every service business starts the same way — with one goal: the next booked job. Quotebox gives you the instant-quote form, automatic follow-up, and lead pipeline that turn that pledge into a real, trackable strategy — not a hope. Try the full platform for <strong>$1 for your first month</strong>, instead of $34/month.</p>
          <button className="cta-btn" onClick={() => { trackBuildEvent('landing_hero'); onStart() }}>Make My Pledge →</button>
          <span className="cta-sub">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M20 6L9 17l-5-5" stroke="#34d399" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" /></svg>
            Cancel anytime · Then $34/mo · Live in under 10 minutes
          </span>
        </div>
        <div className="hero-visual">
          <BrowserShot
            src="/screenshots/main-dashboard.png"
            alt="QuoteBox CRM dashboard showing $111,811 pipeline"
            url="quote-box.com/dashboard"
            glow="rgba(245,166,35,0.16)"
          />
          <div className="lead-badge">
            <div className="lead-badge-icon">🔔</div>
            <div>
              <div className="lead-badge-title">New lead received</div>
              <div className="lead-badge-sub">Quote: $510.00 · Just now</div>
            </div>
          </div>
        </div>
      </header>

      <section className="feature-grid">
        {[
          { icon: '📋', label: 'Instant Quote Forms', desc: 'Branded, mobile-first, auto-calculated price in minutes.' },
          { icon: '📱', label: 'iOS App', desc: 'Check and follow up on leads the moment they come in.' },
          { icon: '💬', label: 'SMS & Email Flows', desc: 'Built specifically for home & auto service pros — automatic, instant, no setup.' },
          { icon: '📊', label: 'CRM', desc: 'Every lead, quote, and job tracked from first contact to booked.' },
        ].map((f) => (
          <div className="feature-card" key={f.label}>
            <div className="feature-icon">{f.icon}</div>
            <div className="feature-label">{f.label}</div>
            <div className="feature-desc">{f.desc}</div>
          </div>
        ))}
      </section>

      <div className="divider" />

      <section>
        <div className="showcase-head">
          <h2>This is the actual software</h2>
          <p>A quick look inside a live Quotebox account.</p>
        </div>
        <BrowserShot
          src="/screenshots/leads-dashboard.png"
          alt="QuoteBox leads dashboard — 686 total leads, $111,811 pipeline"
          url="quote-box.com/leads"
          glow="rgba(92,81,214,0.22)"
        />
        <div className="stat-strip">
          <div className="stat"><div className="n">$111,811</div><div className="l">Pipeline value tracked</div></div>
          <div className="stat"><div className="n">685</div><div className="l">Leads captured</div></div>
          <div className="stat"><div className="n">41</div><div className="l">Jobs booked</div></div>
          <div className="stat"><div className="n">2.88x</div><div className="l">Return on ad spend</div></div>
        </div>
      </section>

      <div className="divider" />

      <section className="problem">
        <h2>Most service businesses never hit their pledge — not because they can&apos;t do the work, but because the leads never turn into jobs.</h2>
        <p>No instant quote, no automatic follow-up, and no easy way to see which ads are actually turning into booked jobs.</p>
        <div className="leak-grid">
          <div className="leak-card">
            <div className="num">01</div>
            <h3>No instant quote form</h3>
            <p>Customers want a number fast. Without a branded quote form, they&apos;re stuck waiting on a callback — and calling the next company instead.</p>
          </div>
          <div className="leak-card">
            <div className="num">02</div>
            <h3>Leads scattered everywhere</h3>
            <p>Facebook DMs, missed calls, a shared inbox. Nothing tells you which lead is worth following up on first.</p>
          </div>
          <div className="leak-card">
            <div className="num">03</div>
            <h3>Ad spend, no visibility</h3>
            <p>Without a CRM tied to your Meta campaigns, you can&apos;t tell which ads are actually producing booked jobs — just clicks.</p>
          </div>
        </div>
      </section>

      <div className="divider" />

      <section>
        <div className="phone-wrap">
          <div className="phone-copy">
            <h2>The quote form your customers actually fill out</h2>
            <p>A guided, mobile-first flow — home size, route, contact info, instant estimate. No app to download, no &quot;we&apos;ll call you back.&quot; Shown here in a sample brand color; yours ships in your own.</p>
            <ul className="phone-points">
              <li>Step-by-step, never a wall of fields</li>
              <li>Auto-calculates distance and drive time</li>
              <li>Ends in an instant estimate, not a maybe</li>
            </ul>
          </div>
          <div className="phone-shot">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/screenshots/home-size-form.png" alt="A real QuoteBox quote form — home size selection step" />
          </div>
        </div>
      </section>

      <div className="divider" />

      <section style={{ paddingTop: 56 }} id="offer">
        <div style={{ textAlign: 'center', marginBottom: 10 }}>
          <h2 style={{ fontSize: 'clamp(22px,3.4vw,34px)', margin: '0 0 8px' }}>Here&apos;s the software you get today</h2>
          <p style={{ color: 'var(--muted)', fontSize: 15.5 }}>One receipt. Everything included. No hidden add-ons.</p>
        </div>
        <div className="stack-wrap">
          <div className="receipt">
            <div className="stamp">1st month</div>
            <div className="receipt-head">
              <div className="rlogo" />
              <h3>Quotebox Order Summary</h3>
              <span>Booked-Job Growth System</span>
            </div>
            {[
              ['Branded instant quote form', 'Multi-step form with your logo, pricing rules, and up to 1,000 leads/mo capacity', '49'],
              ['Instant SMS + email follow-up', 'Every new lead contacted automatically, the moment they submit', '97'],
              ['Meta Ads sync & analytics', 'Spend, leads, and cost-per-lead in one dashboard, tied to real bookings', '79'],
              ['Full CRM & lead pipeline', 'Every lead, quote, and job tracked from first contact to booked', '59'],
              ['Route & pricing calculator', 'Auto-quotes distance, crew size, and job type', '39'],
              ['iOS app access', 'Quote and follow up from the job site', '29'],
            ].map(([name, desc, was]) => (
              <div className="rline" key={name}>
                <div className="rname">{name}<small>{desc}</small></div>
                <div className="rprice"><span className="was">${was}</span>$0</div>
              </div>
            ))}
            <div className="rtotal">
              <div className="label">Total monthly value</div>
              <div className="value">$352</div>
            </div>
            <div className="due">
              <div className="label">Due today</div>
              <div className="amt">$1<sup>1st mo</sup></div>
            </div>
          </div>
        </div>
        <div style={{ textAlign: 'center', marginTop: 38 }}>
          <button className="cta-btn" onClick={() => { trackBuildEvent('landing_offer'); onStart() }}>Make My Pledge →</button>
          <span className="cta-sub" style={{ display: 'block', marginTop: 14 }}>Renews at $34/mo after your first month · Cancel anytime, no questions asked</span>
        </div>
      </section>

      <div className="divider" />

      <section>
        <h2 style={{ textAlign: 'center', fontSize: 'clamp(22px,3.4vw,32px)', margin: '0 0 8px' }}>From pledge to proof</h2>
        <p style={{ textAlign: 'center', color: 'var(--muted)', margin: '0 0 10px' }}>Three steps. You&apos;ll be live before the coffee&apos;s cold.</p>
        <div className="steps">
          <div className="step-card">
            <div className="step-num">1</div>
            <h3>Pledge your number</h3>
            <p>Pick how many booked jobs you&apos;re going after this month. We build your strategy — and your form — around hitting it.</p>
          </div>
          <div className="step-card">
            <div className="step-num">2</div>
            <h3>Every lead gets an instant reply</h3>
            <p>Your form goes live, connected to SMS and email. New leads get contacted automatically — even at 11pm on a Sunday.</p>
          </div>
          <div className="step-card">
            <div className="step-num">3</div>
            <h3>Track it straight to booked</h3>
            <p>See every lead, quote, and Meta ad dollar in one CRM. You focus on quoting jobs and running crews, not chasing a spreadsheet.</p>
          </div>
        </div>
      </section>

      <div className="divider" />

      <section>
        <div className="app-banner">
          <div className="app-qr">
            <QRCodeSVG value={APPLE_APP_URL} size={92} level="M" />
          </div>
          <div className="app-copy">
            <div className="app-eyebrow">iOS App · Included</div>
            <h3>Check your leads from the job site.</h3>
            <p>Get a push notification the second a lead comes in, tap to call or text, and update lead status — all from your phone. Scan to open the App Store.</p>
          </div>
          <a
            href={APPLE_APP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="app-store-btn"
            style={{ color: '#0c0a16' }}
          >
            <svg width="16" height="19" viewBox="0 0 814 1000" fill="currentColor"><path d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76 0-103.7 40.8-165.9 40.8s-105-42.3-150.3-110.7c-67.5-98.2-120-252.6-120-398.7 0-138.9 48.4-207.5 96.8-253.5 57.3-54.5 138.4-86.1 213.3-86.1 81.6 0 132.2 39.5 189.5 39.5 55.4 0 115.7-42.3 207.8-42.3zm-156.5-252c32.5-50 56.7-119 56.7-188C688.3 24.6 549.8 0 476.5 0c-2 0-4 0-6.1.1-2.3 30.5-1.2 96 22.7 158.6 23.2 61.5 56.8 99.2 138.4 130.2z" /></svg>
            View on the App Store
          </a>
        </div>
      </section>

      <div className="divider" />

      <section>
        <div className="guarantee">
          <div className="seal">
            <svg width="44" height="44" viewBox="0 0 24 24" fill="none"><path d="M12 2l8 4v6c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V6l8-4z" stroke="#fff" strokeWidth="1.6" /><path d="M9 12l2 2 4-4" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </div>
          <div>
            <h3>The &quot;Live In 10 Minutes&quot; guarantee</h3>
            <p>Get your branded quote form live within 10 minutes, or our team will build it with you free on a call. Not happy after trying it? Cancel anytime during your $1 trial — no contract, no hoops, keep whatever you&apos;ve already collected in your CRM.</p>
          </div>
        </div>
      </section>

      <div className="divider" />

      <section>
        <div className="proof-card">
          <div className="proof-avatar">TT</div>
          <div>
            <p className="quote">Before Quotebox, leads sat in our Facebook inbox for a day or two. Now every quote request gets a text back instantly, and we can see exactly which ads are turning into booked jobs.</p>
            <div className="who"><strong>Titan Tuff Moving</strong> — Clearwater, FL, on Quotebox</div>
            <div className="proof-stats">
              <div><div className="n">$111,811</div><div className="l">pipeline value generated</div></div>
              <div><div className="n">685</div><div className="l">leads captured</div></div>
              <div><div className="n">2.88x</div><div className="l">return on ad spend</div></div>
            </div>
          </div>
        </div>
      </section>

      <div className="divider" />

      <section>
        <h2 style={{ textAlign: 'center', fontSize: 'clamp(20px,3vw,30px)', margin: '0 0 30px' }}>Questions service business owners ask</h2>
        {FAQS.map((f, i) => (
          <details className="faq-item" key={f.q} open={i === 0}>
            <summary>{f.q}</summary>
            <p>{f.a}</p>
          </details>
        ))}
      </section>

      <div className="divider" />

      <section className="final-cta">
        <h2>Make your pledge. We&apos;ll build the strategy.</h2>
        <p>Get the same software Titan Tuff Moving used to turn 685 leads into $111K in pipeline — live in under 10 minutes.</p>
        <button className="cta-btn" onClick={() => { trackBuildEvent('landing_final'); onStart() }}>Make My Pledge →</button>
      </section>

      <footer>Quotebox is a product of Arctic Reach LLC. © 2026 Quotebox. All rights reserved.</footer>

      <div className={`sticky-bar ${showSticky ? 'show' : ''}`}>
        <div className="txt">Take the pledge — first month just <b>$1</b></div>
        <button className="cta-btn" onClick={() => { trackBuildEvent('landing_sticky'); onStart() }}>Make My Pledge →</button>
      </div>

      <style jsx>{`
        .offer{
          --bg:#5b50d6; --bg-2:#453bc2; --panel:#181330; --panel-2:#1e1838;
          --primary:#5b50d6; --primary-light:#8b7fff; --gold:#f4a93c; --green:#34d399;
          --text:#ffffff; --muted:rgba(255,255,255,0.74); --line:rgba(255,255,255,0.18); --radius:16px;
          background: var(--bg);
          color:var(--text); font-family: var(--font-inter-offer), sans-serif; -webkit-font-smoothing:antialiased;
          overflow-x:hidden; position:relative;
        }
        .offer::before{
          content:'';
          position:absolute;
          inset:0;
          background:url('/patterns/map-pattern-2.jpg') repeat;
          background-size:340px;
          filter:invert(1);
          opacity:0.07;
          pointer-events:none;
          z-index:0;
        }
        .offer > * { position:relative; z-index:1; }
        .offer :global(h1), .offer :global(h2), .offer :global(h3){ font-family: 'Nautic', var(--font-space-grotesk-offer), sans-serif; font-weight:800; letter-spacing:-0.02em; }
        .offer :global(a){ color:inherit; }
        .offer button{ font-family: 'Nautic', var(--font-inter-offer), sans-serif; border:none; cursor:pointer; }

        nav{ max-width:1080px; margin:0 auto; padding:22px 24px; display:flex; align-items:center; justify-content:space-between; gap:12px; }
        .brand{ display:flex; align-items:center; gap:10px; font-family: 'Nautic', var(--font-space-grotesk-offer), sans-serif; font-weight:700; font-size:19px; }
        .logo-mark{ width:34px; height:34px; border-radius:8px; background:linear-gradient(145deg, var(--primary-light), var(--primary)); display:flex; align-items:center; justify-content:center; font-size:13px; font-weight:700; color:#fff; }

        .cta-btn{ display:inline-flex; align-items:center; justify-content:center; gap:10px;
          background:linear-gradient(135deg,var(--gold),#ffcf6b); color:#241704; font-weight:800; font-size:18px;
          padding:18px 36px; border-radius:12px; box-shadow:0 12px 30px -8px rgba(245,166,35,0.55); transition:transform .15s ease, box-shadow .15s ease; }
        .cta-btn:hover{ transform:translateY(-2px); box-shadow:0 16px 36px -8px rgba(245,166,35,0.7); }
        .cta-btn.small{ padding:11px 20px; font-size:14px; }
        .cta-sub{ display:block; margin-top:14px; font-size:13.5px; color:var(--muted); }
        .cta-sub svg{ vertical-align:-2px; margin-right:5px; }

        section{ max-width:1080px; margin:0 auto; padding:64px 24px; }
        .divider{ max-width:1080px; margin:0 auto; height:1px; background:var(--line); }

        .hero{ max-width:1080px; margin:0 auto; padding:56px 24px 40px; display:grid; grid-template-columns:1.05fr 0.95fr; align-items:center; gap:40px; }
        .hero-visual{ position:relative; }
        .lead-badge{ position:absolute; top:24px; right:-4%; z-index:3; background:#fff; border-radius:12px; padding:10px 14px; box-shadow:0 8px 32px rgba(0,0,0,0.35); display:flex; align-items:center; gap:10px; min-width:175px; }
        .lead-badge-icon{ width:36px; height:36px; border-radius:50%; background:#dcfce7; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
        .lead-badge-title{ font-size:11px; font-weight:700; color:#0e0020; line-height:1.2; }
        .lead-badge-sub{ font-size:10px; color:#10b981; font-weight:600; }
        @media(max-width:900px){ .lead-badge{ right:4%; } }
        @media(max-width:520px){ .lead-badge{ display:none; } }
        .eyebrow{ display:inline-flex; align-items:center; gap:8px; background:rgba(92,81,214,0.18); border:1px solid rgba(139,127,255,0.4); color:var(--primary-light);
          padding:7px 16px; border-radius:999px; font-size:13px; font-weight:600; letter-spacing:0.03em; text-transform:uppercase; margin-bottom:26px; }
        .eyebrow .dot{ width:7px; height:7px; border-radius:50%; background:var(--green); box-shadow:0 0 8px var(--green); }
        .headline{ font-size:clamp(30px,4.6vw,54px); line-height:1.06; margin:0 0 22px; }
        .headline :global(.accent){ color:var(--gold); }
        .sub{ font-size:17px; line-height:1.55; color:var(--muted); max-width:480px; margin:0 0 34px; }
        .sub :global(strong){ color:var(--text); }
        @media(max-width:900px){ .hero{ grid-template-columns:1fr; text-align:center; } .hero-text{ order:1; } .hero-visual{ order:2; } .sub{ margin-left:auto; margin-right:auto; } }

        .feature-grid{ max-width:1080px; margin:0 auto; padding:0 24px 44px; display:grid; grid-template-columns:repeat(4,1fr); gap:16px; }
        .feature-card{ background:rgba(255,255,255,0.06); border:1px solid var(--line); border-radius:14px; padding:22px 18px; text-align:center; }
        .feature-icon{ font-size:26px; margin-bottom:10px; }
        .feature-label{ font-family:'Nautic', var(--font-space-grotesk-offer), sans-serif; font-weight:800; font-size:15px; margin-bottom:6px; }
        .feature-desc{ font-size:12.5px; color:var(--muted); line-height:1.5; }
        @media(max-width:800px){ .feature-grid{ grid-template-columns:repeat(2,1fr); } }

        .showcase-head{ text-align:center; margin-bottom:34px; }
        .showcase-head h2{ font-size:clamp(22px,3.4vw,34px); margin:0 0 8px; }
        .showcase-head p{ color:var(--muted); font-size:15.5px; margin:0; }
        .stat-strip{ display:flex; justify-content:center; gap:60px; flex-wrap:wrap; margin-top:34px; }
        .stat-strip .stat{ text-align:center; }
        .stat-strip .stat .n{ font-family: 'Nautic', var(--font-space-grotesk-offer), sans-serif; font-size:30px; font-weight:700; color:var(--gold); }
        .stat-strip .stat .l{ font-size:12px; color:var(--muted); letter-spacing:0.03em; text-transform:uppercase; margin-top:4px; }

        .problem{ text-align:center; }
        .problem h2{ font-size:clamp(22px,3.4vw,36px); max-width:700px; margin:0 auto 14px; }
        .problem p{ color:var(--muted); max-width:600px; margin:0 auto; font-size:16px; line-height:1.6; }
        .leak-grid{ display:grid; grid-template-columns:repeat(3,1fr); gap:18px; margin-top:40px; }
        .leak-card{ background:var(--panel); border:1px solid var(--line); border-radius:var(--radius); padding:26px 22px; text-align:left; }
        .leak-card .num{ font-family: 'Nautic', var(--font-space-grotesk-offer), sans-serif; font-size:13px; color:var(--primary-light); font-weight:700; letter-spacing:0.08em; }
        .leak-card h3{ font-size:17px; margin:10px 0 8px; }
        .leak-card p{ font-size:14.5px; color:var(--muted); margin:0; }

        .phone-wrap{ display:flex; align-items:center; gap:60px; }
        .phone-copy{ flex:1 1 380px; }
        .phone-copy h2{ font-size:clamp(22px,3.2vw,32px); margin:0 0 14px; }
        .phone-copy > p{ color:var(--muted); font-size:15.5px; line-height:1.6; margin:0; max-width:440px; }
        .phone-points{ list-style:none; padding:0; margin:26px 0 0; display:grid; gap:13px; }
        .phone-points li{ display:flex; gap:10px; align-items:flex-start; color:var(--text); font-size:15px; font-weight:500; }
        .phone-points li::before{ content:''; width:7px; height:7px; border-radius:50%; background:var(--green); margin-top:7px; flex:0 0 auto; box-shadow:0 0 8px var(--green); }
        .phone-shot{ flex:0 0 auto; width:250px; border-radius:26px; overflow:hidden; box-shadow:0 30px 70px -25px rgba(0,0,0,0.65), 0 0 0 1px rgba(255,255,255,0.08); }
        .phone-shot img{ width:100%; display:block; }
        @media(max-width:900px){ .phone-shot{ margin:0 auto; } }

        .stack-wrap{ display:flex; justify-content:center; padding-top:20px; }
        .receipt{ width:100%; max-width:460px; background:#fbfaf7; color:#221c33; border-radius:6px; padding:34px 30px 28px; position:relative;
          box-shadow:0 30px 60px -20px rgba(0,0,0,0.55), 0 0 0 1px rgba(0,0,0,0.04); }
        .receipt-head{ text-align:center; border-bottom:2px dashed #d8d2c4; padding-bottom:18px; margin-bottom:18px; }
        .receipt-head .rlogo{ width:30px; height:30px; border-radius:7px; margin:0 auto 10px; display:block; background:linear-gradient(145deg, var(--primary-light), var(--primary)); }
        .receipt-head h3{ font-family: 'Nautic', var(--font-space-grotesk-offer), sans-serif; font-size:15px; letter-spacing:0.14em; text-transform:uppercase; margin:0 0 4px; }
        .receipt-head span{ font-size:12px; color:#8a8296; letter-spacing:0.04em; }
        .rline{ display:flex; justify-content:space-between; align-items:baseline; font-size:14.5px; padding:9px 0; border-bottom:1px dotted #e3ded1; gap:12px; }
        .rline .rname{ max-width:270px; }
        .rline .rname :global(small){ display:block; color:#8a8296; font-size:12px; margin-top:2px; }
        .rline .rprice{ font-variant-numeric:tabular-nums; white-space:nowrap; }
        .rline .rprice :global(.was){ text-decoration:line-through; color:#b3ab9c; margin-right:8px; font-size:13px; }
        .rtotal{ display:flex; justify-content:space-between; align-items:center; padding-top:16px; margin-top:6px; border-top:2px dashed #d8d2c4; }
        .rtotal .label{ font-family: 'Nautic', var(--font-space-grotesk-offer), sans-serif; font-weight:700; font-size:15px; letter-spacing:0.03em; }
        .rtotal .value{ font-family: 'Nautic', var(--font-space-grotesk-offer), sans-serif; font-size:15px; text-decoration:line-through; color:#b3ab9c; }
        .due{ margin-top:16px; background:#221c33; color:#fbfaf7; border-radius:8px; padding:18px 20px; display:flex; justify-content:space-between; align-items:center; }
        .due .label{ font-family: 'Nautic', var(--font-space-grotesk-offer), sans-serif; font-size:13px; letter-spacing:0.1em; text-transform:uppercase; color:#c9c2e6; }
        .due .amt{ font-family: 'Nautic', var(--font-space-grotesk-offer), sans-serif; font-size:34px; font-weight:700; color:var(--gold); }
        .due .amt :global(sup){ font-size:15px; color:#c9c2e6; font-weight:600; margin-left:5px; }
        .stamp{ position:absolute; top:38px; right:24px; border:3px solid #d1483d; color:#d1483d;
          font-family: 'Nautic', var(--font-space-grotesk-offer), sans-serif; font-weight:700; font-size:13px; letter-spacing:0.1em;
          padding:5px 10px; border-radius:6px; transform:rotate(9deg); text-transform:uppercase; }

        .steps{ display:grid; grid-template-columns:repeat(3,1fr); gap:20px; margin-top:44px; }
        .step-card{ background:var(--panel); border:1px solid var(--line); border-radius:var(--radius); padding:28px 24px; }
        .step-num{ width:38px; height:38px; border-radius:10px; background:rgba(92,81,214,0.25); display:flex; align-items:center; justify-content:center; color:var(--primary-light);
          font-family: 'Nautic', var(--font-space-grotesk-offer), sans-serif; font-weight:700; font-size:16px; margin-bottom:16px; }
        .step-card h3{ font-size:17px; margin:0 0 8px; }
        .step-card p{ font-size:14.5px; color:var(--muted); margin:0; line-height:1.55; }

        .app-banner{ background:linear-gradient(160deg, var(--panel-2), var(--panel)); border:1px solid rgba(139,127,255,0.3); border-radius:20px; padding:36px 40px; display:flex; align-items:center; gap:30px; }
        .app-qr{ flex:0 0 auto; background:#fff; border-radius:12px; padding:10px; }
        .app-copy{ flex:1; min-width:0; }
        .app-eyebrow{ color:var(--gold); font-size:11px; font-weight:800; letter-spacing:0.1em; text-transform:uppercase; margin-bottom:8px; }
        .app-copy h3{ font-size:21px; margin:0 0 8px; }
        .app-copy p{ color:var(--muted); font-size:14.5px; line-height:1.6; margin:0; max-width:480px; }
        .app-store-btn{ flex:0 0 auto; display:inline-flex; align-items:center; gap:8px; background:#fff; color:#0c0a16; font-weight:700; font-size:13.5px; padding:12px 20px; border-radius:10px; text-decoration:none; white-space:nowrap; }
        @media(max-width:760px){ .app-banner{ flex-direction:column; text-align:center; padding:32px 24px; } .app-copy p{ margin-left:auto; margin-right:auto; } }

        .guarantee{ background:linear-gradient(160deg, var(--panel-2), var(--panel)); border:1px solid rgba(139,127,255,0.3); border-radius:20px; padding:44px; display:flex; align-items:center; gap:30px; }
        .seal{ flex:0 0 auto; width:96px; height:96px; border-radius:50%; background:radial-gradient(circle at 35% 30%, var(--primary-light), var(--primary)); display:flex; align-items:center; justify-content:center; box-shadow:0 10px 30px -6px rgba(92,81,214,0.6); }
        .guarantee h3{ font-size:22px; margin:0 0 10px; }
        .guarantee p{ color:var(--muted); font-size:15px; line-height:1.6; margin:0; max-width:600px; }

        .proof-card{ background:var(--panel); border:1px solid var(--line); border-radius:var(--radius); padding:36px; display:flex; gap:26px; align-items:flex-start; }
        .proof-avatar{ flex:0 0 auto; width:52px; height:52px; border-radius:50%; background:linear-gradient(135deg,var(--primary),var(--primary-light)); display:flex; align-items:center; justify-content:center; font-family: 'Nautic', var(--font-space-grotesk-offer), sans-serif; font-weight:700; font-size:18px; }
        .proof-card :global(p.quote){ font-size:17px; line-height:1.6; margin:0 0 14px; }
        .who{ color:var(--muted); font-size:14px; }
        .who :global(strong){ color:var(--text); }
        .proof-stats{ display:flex; gap:34px; margin-top:22px; padding-top:22px; border-top:1px solid var(--line); flex-wrap:wrap; }
        .proof-stats > div{ text-align:left; }
        .proof-stats .n{ font-family: 'Nautic', var(--font-space-grotesk-offer), sans-serif; font-size:24px; font-weight:700; color:var(--gold); }
        .proof-stats .l{ font-size:12.5px; color:var(--muted); }

        .faq-item{ border-bottom:1px solid var(--line); padding:20px 0; }
        .faq-item summary{ cursor:pointer; font-weight:600; font-size:16px; list-style:none; display:flex; justify-content:space-between; align-items:center; gap:12px; }
        .faq-item summary::-webkit-details-marker{ display:none; }
        .faq-item summary::after{ content:'+'; font-size:22px; color:var(--primary-light); font-weight:400; flex:0 0 auto; }
        .faq-item[open] summary::after{ content:'\\2013'; }
        .faq-item :global(p){ color:var(--muted); font-size:15px; line-height:1.6; margin:12px 0 0; }

        .final-cta{ text-align:center; }
        .final-cta h2{ font-size:clamp(24px,4vw,40px); margin:0 0 16px; }
        .final-cta p{ color:var(--muted); font-size:16px; margin:0 0 30px; }

        footer{ max-width:1080px; margin:0 auto; padding:34px 24px 90px; text-align:center; color:var(--muted); font-size:13px; }

        .sticky-bar{ position:fixed; left:0; right:0; bottom:0; z-index:40; background:rgba(14,11,26,0.94); backdrop-filter:blur(10px); border-top:1px solid var(--line);
          padding:12px 20px; display:flex; align-items:center; justify-content:space-between; gap:16px; transform:translateY(120%); transition:transform .3s ease;
          padding-bottom:calc(12px + env(safe-area-inset-bottom)); }
        .sticky-bar.show{ transform:translateY(0); }
        .sticky-bar .txt{ font-size:13.5px; }
        .sticky-bar .txt :global(b){ color:var(--gold); }
        .sticky-bar .cta-btn{ padding:12px 22px; font-size:14.5px; }

        @media(max-width:820px){
          .leak-grid, .steps{ grid-template-columns:1fr; }
          .guarantee{ flex-direction:column; text-align:center; }
          .proof-card{ flex-direction:column; }
          .phone-wrap{ flex-direction:column; text-align:center; }
          .phone-points{ justify-items:center; }
        }
        @media(max-width:560px){
          section{ padding:46px 24px; }
          .hero{ padding:34px 24px 26px; }
          .cta-btn{ width:100%; max-width:320px; }
          .sticky-bar{ flex-direction:column; gap:8px; padding:10px 16px; padding-bottom:calc(10px + env(safe-area-inset-bottom)); }
          .sticky-bar .cta-btn{ width:100%; max-width:none; }
          .receipt{ padding:26px 18px 22px; max-width:100%; }
        }
      `}</style>
    </div>
  )
}
