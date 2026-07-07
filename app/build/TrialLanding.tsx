'use client'

import { useEffect, useState } from 'react'
import { Space_Grotesk, Inter } from 'next/font/google'

const spaceGrotesk = Space_Grotesk({ subsets: ['latin'], weight: ['500', '700'], variable: '--font-space-grotesk-offer' })
const inter = Inter({ subsets: ['latin'], weight: ['400', '500', '600', '700', '800'], variable: '--font-inter-offer' })

const PANELS = [
  { label: 'Dashboard', banner: 'Pipeline value · 685 leads', big: '$111,811', stats: [['Total Leads', '685'], ['New Leads', '366'], ['Booked', '41'], ['Ad Spend', '$6,038']], row: ['Return on ad spend', '2.88x'] },
  { label: 'Leads', banner: 'Leads', big: '686', stats: [['Total', '686'], ['New', '367'], ['Booked', '41']], row: null },
  { label: 'Automations', banner: 'Automations', big: null, stats: null, row: null },
] as const

function ProductPanel() {
  const [i, setI] = useState(0)
  useEffect(() => {
    const t = setInterval(() => setI((p) => (p + 1) % PANELS.length), 3200)
    return () => clearInterval(t)
  }, [])
  const panel = PANELS[i]
  return (
    <div className="browser-mock">
      <div className="browser-bar">
        <span className="bdot r" /><span className="bdot y" /><span className="bdot g" />
        <div className="browser-url">quote-box.com/dashboard</div>
      </div>
      <div className="browser-tabs">
        {PANELS.map((p, idx) => (
          <span key={p.label} className={`tab ${idx === i ? 'active' : ''}`}>{p.label}</span>
        ))}
      </div>
      <div className="browser-screen">
        {panel.big ? (
          <>
            <div className="ac-banner">{panel.banner}</div>
            <div className="ac-bignum">{panel.big}</div>
            <div className="ac-stats-grid">
              {panel.stats!.map(([l, v]) => (
                <div className="ac-stat" key={l}><span className="l">{l}</span><span className="v">{v}</span></div>
              ))}
            </div>
            {panel.row && <div className="ac-row"><span>{panel.row[0]}</span><b className="good">{panel.row[1]}</b></div>}
          </>
        ) : (
          <>
            <div className="ac-banner">Trigger: Any New Lead</div>
            <div className="auto-card">
              <div className="auto-card-head">Instant Contact</div>
              <div className="auto-bar"><span>Sent</span><div className="bar"><i style={{ width: '100%' }} /></div><b>231</b></div>
              <div className="auto-bar"><span>Opened</span><div className="bar"><i style={{ width: '19%' }} /></div><b>19%</b></div>
              <div className="auto-bar"><span>Clicked</span><div className="bar"><i style={{ width: '3%' }} /></div><b>3%</b></div>
            </div>
          </>
        )}
      </div>
      <style jsx>{`
        .browser-mock{position:relative;border-radius:16px;overflow:hidden;background:#0c0a16;border:1px solid var(--line);box-shadow:0 40px 90px -35px rgba(0,0,0,0.7);}
        .browser-bar{display:flex;align-items:center;gap:8px;padding:13px 16px;background:#141024;border-bottom:1px solid var(--line);}
        .bdot{width:11px;height:11px;border-radius:50%;flex:0 0 auto;}
        .bdot.r{background:#ff5f57;} .bdot.y{background:#febc2e;} .bdot.g{background:#28c840;}
        .browser-url{margin-left:10px;background:rgba(255,255,255,0.06);padding:5px 16px;border-radius:7px;font-size:12px;color:var(--muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
        .browser-tabs{display:flex;gap:2px;padding:10px 14px;background:#100c20;border-bottom:1px solid var(--line);overflow-x:auto;}
        .tab{background:none;border:none;color:var(--muted);font-size:12.5px;font-weight:600;padding:8px 13px;border-radius:8px;white-space:nowrap;transition:color .3s, background .3s;}
        .tab.active{color:#fff;background:var(--primary);}
        .browser-screen{position:relative;width:100%;min-height:280px;background:#f4f3fa;padding:20px 22px;color:#1c1830;}
        .ac-banner{font-size:11px;color:#8b86a8;text-transform:uppercase;letter-spacing:.05em;margin-bottom:6px;}
        .ac-bignum{font-family: var(--font-space-grotesk-offer), sans-serif;font-weight:700;font-size:28px;margin-bottom:16px;}
        .ac-stats-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:14px;}
        .ac-stat{background:#fff;border-radius:9px;padding:10px 12px;display:flex;flex-direction:column;gap:4px;box-shadow:0 1px 3px rgba(0,0,0,.05);min-width:0;}
        .ac-stat .l{font-size:10px;color:#8b86a8;text-transform:uppercase;letter-spacing:.03em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
        .ac-stat .v{font-family: var(--font-space-grotesk-offer), sans-serif;font-weight:700;font-size:15px;color:#1c1830;}
        .ac-row{display:flex;justify-content:space-between;font-size:13px;color:#5d5776;background:#fff;border-radius:9px;padding:10px 14px;}
        .good{color:#1a9e6a;font-family: var(--font-space-grotesk-offer), sans-serif;font-weight:700;}
        .auto-card{background:#fff;border-radius:10px;padding:16px;}
        .auto-card-head{font-family: var(--font-space-grotesk-offer), sans-serif;font-weight:700;font-size:14px;margin-bottom:12px;}
        .auto-bar{display:grid;grid-template-columns:52px 1fr 36px;align-items:center;gap:10px;font-size:11px;color:#8b86a8;margin-bottom:10px;}
        .auto-bar .bar{height:6px;background:#eeecf5;border-radius:4px;overflow:hidden;}
        .auto-bar .bar i{display:block;height:100%;background:var(--primary);border-radius:4px;transition:width 1s ease;}
        .auto-bar b{text-align:right;color:#1c1830;font-weight:700;}
        @media(max-width:560px){ .ac-stats-grid{grid-template-columns:repeat(2,1fr);} }
      `}</style>
    </div>
  )
}

function PhoneMock() {
  return (
    <div className="phone-mock">
      <div className="phone-frame">
        <div className="phone-notch" />
        <div className="phone-screen">
          <div className="p-step" style={{ animationDelay: '0s' }}>
            <div className="p-banner"><span className="tag">Get your quote</span><h4>Sample Moving Co.</h4></div>
            <div className="p-body">
              <div className="p-label">Home Size</div>
              <div className="p-option">Studio / 1 Bed</div>
              <div className="p-option chosen">2 Bedrooms</div>
              <div className="p-option">3 Bedrooms</div>
            </div>
          </div>
          <div className="p-step" style={{ animationDelay: '3s' }}>
            <div className="p-topbar"><span className="step-label">Almost there</span><h4>Sample Moving Co.</h4></div>
            <div className="p-body">
              <div className="p-label">Full Name</div>
              <div className="p-input">Rebecca Nguyen</div>
              <div className="p-label">Phone</div>
              <div className="p-input">727-555-0148</div>
            </div>
          </div>
          <div className="p-step" style={{ animationDelay: '6s' }}>
            <div className="p-confirm">
              <div className="check-circle">✓</div>
              <h4>You&apos;re all set!</h4>
              <div className="est-box"><span>Estimated Total</span><b>$510.00</b></div>
            </div>
          </div>
        </div>
      </div>
      <style jsx>{`
        .phone-mock{display:flex;flex-direction:column;align-items:center;gap:18px;}
        .phone-frame{width:250px;height:480px;border-radius:36px;background:#0c0a16;padding:10px;box-shadow:0 30px 70px -25px rgba(0,0,0,0.65), 0 0 0 2px rgba(255,255,255,0.06) inset;position:relative;}
        .phone-notch{position:absolute;top:10px;left:50%;transform:translateX(-50%);width:86px;height:18px;background:#0c0a16;border-radius:0 0 12px 12px;z-index:3;}
        .phone-screen{position:relative;width:100%;height:100%;border-radius:26px;overflow:hidden;background:#fff;}
        .p-step{position:absolute;inset:0;display:flex;flex-direction:column;background:#fff;opacity:0;transform:translateX(20px);animation:pCycle 9s infinite;}
        @keyframes pCycle{
          0%{opacity:0;transform:translateX(20px);}
          4%{opacity:1;transform:translateX(0);}
          30%{opacity:1;transform:translateX(0);}
          34%{opacity:0;transform:translateX(-20px);}
          100%{opacity:0;}
        }
        .p-banner{background:linear-gradient(135deg,var(--primary),var(--primary-light));padding:22px 16px 16px;color:#fff;flex:0 0 auto;}
        .p-banner .tag{font-size:9px;text-transform:uppercase;letter-spacing:.08em;opacity:.85;}
        .p-banner h4{margin:4px 0 0;font-family: var(--font-space-grotesk-offer), sans-serif;font-size:15px;}
        .p-topbar{background:linear-gradient(135deg,var(--primary),var(--primary-light));padding:16px 16px 14px;color:#fff;flex:0 0 auto;}
        .p-topbar .step-label{font-size:9px;text-transform:uppercase;letter-spacing:.08em;opacity:.85;display:block;margin-bottom:3px;}
        .p-topbar h4{margin:0;font-family: var(--font-space-grotesk-offer), sans-serif;font-size:15px;}
        .p-body{padding:16px;flex:1;display:flex;flex-direction:column;gap:8px;}
        .p-label{font-size:9.5px;color:#8b86a8;text-transform:uppercase;letter-spacing:.05em;font-weight:700;margin-top:6px;}
        .p-option{border:1.5px solid #e3e0ef;border-radius:10px;padding:11px 12px;font-size:12px;color:#2b2640;font-weight:600;}
        .p-option.chosen{border-color:var(--primary);background:rgba(92,81,214,0.06);color:var(--primary);}
        .p-input{border:1.5px solid #e3e0ef;background:#f7f6fb;border-radius:9px;padding:10px 12px;font-size:12px;color:#2b2640;font-weight:600;}
        .p-confirm{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:24px;gap:10px;}
        .check-circle{width:50px;height:50px;border-radius:50%;background:var(--green);color:#fff;font-size:22px;display:flex;align-items:center;justify-content:center;}
        .p-confirm h4{font-family: var(--font-space-grotesk-offer), sans-serif;font-size:16px;margin:4px 0 0;color:#1c1830;}
        .est-box{margin-top:8px;background:#f7f6fb;border:1px solid #e3e0ef;border-radius:10px;padding:12px 20px;}
        .est-box span{display:block;font-size:9px;color:#8b86a8;text-transform:uppercase;letter-spacing:.05em;}
        .est-box b{font-family: var(--font-space-grotesk-offer), sans-serif;font-size:21px;color:#1c1830;}
      `}</style>
    </div>
  )
}

const FAQS = [
  { q: 'Is this really $1/month, or is there a catch?', a: "It's $1/month for your first 3 months — full access, no feature limits. After month 3, it renews at the normal $34/month rate. Cancel anytime before that and you're never charged again." },
  { q: 'Do I need to be technical to set this up?', a: 'No. Most owners have their branded quote form live in under 10 minutes using our guided setup. If you get stuck, our team will build it with you on a quick call at no charge.' },
  { q: 'What happens after I sign up?', a: "You'll land in your dashboard immediately. From there you can build your quote form, connect your number for SMS, and start collecting leads the same day." },
  { q: 'Does this replace my Facebook/Google ads?', a: 'No — Quotebox is where your leads land and get followed up with automatically. If you want us to also run your ad campaigns, that\'s available separately once you\'re set up.' },
  { q: 'Can I cancel anytime?', a: "Yes. There's no contract. Cancel from your dashboard in a couple of clicks, whenever you want." },
] as const

export default function TrialLanding({ onStart }: { onStart: (upsell?: never) => void }) {
  const [showSticky, setShowSticky] = useState(false)

  useEffect(() => {
    function onScroll() { setShowSticky(window.scrollY > 500) }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <div className={`${spaceGrotesk.variable} ${inter.variable} offer`}>
      <nav>
        <div className="brand"><div className="logo-mark">QB</div>Quotebox</div>
        <button className="cta-btn small" onClick={() => onStart()}>Start for $1</button>
      </nav>

      <header className="hero">
        <div className="eyebrow"><span className="dot" /> For moving &amp; junk removal companies</div>
        <h1 className="headline">The quote form &amp; CRM<br />that turned <span className="accent">685 leads</span> into $111K in pipeline.</h1>
        <p className="sub">Quotebox is the instant-quote form, CRM, and Meta Ads dashboard built specifically for movers and junk haulers — with every lead texted and emailed back automatically. Try the full software for <strong>$1/month for your first 3 months</strong>, instead of $34/month.</p>
        <button className="cta-btn" onClick={() => onStart()}>Try Quotebox For $1 →</button>
        <span className="cta-sub">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M20 6L9 17l-5-5" stroke="#34d399" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" /></svg>
          Cancel anytime · Then $34/mo · Live in under 10 minutes
        </span>
      </header>

      <div className="divider" />

      <section>
        <div className="showcase-head">
          <h2>This is the actual software</h2>
          <p>A quick look inside a live Quotebox account.</p>
        </div>
        <ProductPanel />
        <div className="stat-strip">
          <div className="stat"><div className="n">$111,811</div><div className="l">Pipeline value tracked</div></div>
          <div className="stat"><div className="n">685</div><div className="l">Leads captured</div></div>
          <div className="stat"><div className="n">41</div><div className="l">Jobs booked</div></div>
          <div className="stat"><div className="n">2.88x</div><div className="l">Return on ad spend</div></div>
        </div>
      </section>

      <div className="divider" />

      <section className="problem">
        <h2>Most movers are running six-figure ad spend through a Facebook inbox.</h2>
        <p>No instant quote, no automatic follow-up, and no easy way to see which ads are actually turning into booked jobs.</p>
        <div className="leak-grid">
          <div className="leak-card">
            <div className="num">01</div>
            <h3>No instant quote form</h3>
            <p>Customers want a number fast. Without a branded quote form, they&apos;re stuck waiting on a callback — and calling the next mover instead.</p>
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
          <PhoneMock />
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
            <div className="stamp">3 months</div>
            <div className="receipt-head">
              <div className="rlogo" />
              <h3>Quotebox Order Summary</h3>
              <span>Moving &amp; Junk Removal Growth System</span>
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
              <div className="amt">$1<sup>/mo × 3</sup></div>
            </div>
          </div>
        </div>
        <div style={{ textAlign: 'center', marginTop: 38 }}>
          <button className="cta-btn" onClick={() => onStart()}>Claim My $1 Trial →</button>
          <span className="cta-sub" style={{ display: 'block', marginTop: 14 }}>Renews at $34/mo after month 3 · Cancel anytime, no questions asked</span>
        </div>
      </section>

      <div className="divider" />

      <section>
        <h2 style={{ textAlign: 'center', fontSize: 'clamp(22px,3.4vw,32px)', margin: '0 0 8px' }}>How it works</h2>
        <p style={{ textAlign: 'center', color: 'var(--muted)', margin: '0 0 10px' }}>Three steps. You&apos;ll be live before the coffee&apos;s cold.</p>
        <div className="steps">
          <div className="step-card">
            <div className="step-num">1</div>
            <h3>Start your $1 trial</h3>
            <p>Create your account and pick a look for your quote form. Takes about 10 minutes, no card decline surprises later.</p>
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
        <h2 style={{ textAlign: 'center', fontSize: 'clamp(20px,3vw,30px)', margin: '0 0 30px' }}>Questions moving &amp; junk removal owners ask</h2>
        {FAQS.map((f, i) => (
          <details className="faq-item" key={f.q} open={i === 0}>
            <summary>{f.q}</summary>
            <p>{f.a}</p>
          </details>
        ))}
      </section>

      <div className="divider" />

      <section className="final-cta">
        <h2>Your branded quote form could be live in 10 minutes.</h2>
        <p>Start your $1 trial and get the same software Titan Tuff Moving used to turn 685 leads into $111K in pipeline.</p>
        <button className="cta-btn" onClick={() => onStart()}>Claim My $1 Trial →</button>
      </section>

      <footer>Quotebox is a product of Arctic Reach LLC. © 2026 Quotebox. All rights reserved.</footer>

      <div className={`sticky-bar ${showSticky ? 'show' : ''}`}>
        <div className="txt">First 3 months just <b>$1/mo</b> — normally $34/mo</div>
        <button className="cta-btn" onClick={() => onStart()}>Start My $1 Trial →</button>
      </div>

      <style jsx>{`
        .offer{
          --bg:#0e0b1a; --bg-2:#141024; --panel:#181330; --panel-2:#1e1838;
          --primary:#5c51d6; --primary-light:#8b7fff; --gold:#f5a623; --green:#34d399;
          --text:#f4f2fb; --muted:#a79fc7; --line:rgba(255,255,255,0.09); --radius:16px;
          background:
            radial-gradient(ellipse 900px 500px at 15% -5%, rgba(92,81,214,0.35), transparent 60%),
            radial-gradient(ellipse 700px 500px at 90% 10%, rgba(139,127,255,0.18), transparent 55%),
            var(--bg);
          color:var(--text); font-family: var(--font-inter-offer), sans-serif; -webkit-font-smoothing:antialiased;
          overflow-x:hidden; position:relative;
        }
        .offer :global(h1), .offer :global(h2), .offer :global(h3){ font-family: var(--font-space-grotesk-offer), sans-serif; font-weight:700; letter-spacing:-0.02em; }
        .offer :global(a){ color:inherit; }
        .offer button{ font-family: var(--font-inter-offer), sans-serif; border:none; cursor:pointer; }

        nav{ max-width:1080px; margin:0 auto; padding:22px 24px; display:flex; align-items:center; justify-content:space-between; gap:12px; }
        .brand{ display:flex; align-items:center; gap:10px; font-family: var(--font-space-grotesk-offer), sans-serif; font-weight:700; font-size:19px; }
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

        .hero{ max-width:1080px; margin:0 auto; padding:56px 24px 40px; text-align:center; }
        .eyebrow{ display:inline-flex; align-items:center; gap:8px; background:rgba(92,81,214,0.18); border:1px solid rgba(139,127,255,0.4); color:var(--primary-light);
          padding:7px 16px; border-radius:999px; font-size:13px; font-weight:600; letter-spacing:0.03em; text-transform:uppercase; margin-bottom:26px; }
        .eyebrow .dot{ width:7px; height:7px; border-radius:50%; background:var(--green); box-shadow:0 0 8px var(--green); }
        .headline{ font-size:clamp(30px,5.2vw,62px); line-height:1.06; margin:0 0 22px; max-width:880px; margin-left:auto; margin-right:auto; }
        .headline :global(.accent){ color:var(--gold); }
        .sub{ font-size:18px; line-height:1.55; color:var(--muted); max-width:620px; margin:0 auto 34px; }
        .sub :global(strong){ color:var(--text); }

        .showcase-head{ text-align:center; margin-bottom:34px; }
        .showcase-head h2{ font-size:clamp(22px,3.4vw,34px); margin:0 0 8px; }
        .showcase-head p{ color:var(--muted); font-size:15.5px; margin:0; }
        .stat-strip{ display:flex; justify-content:center; gap:60px; flex-wrap:wrap; margin-top:34px; }
        .stat-strip .stat{ text-align:center; }
        .stat-strip .stat .n{ font-family: var(--font-space-grotesk-offer), sans-serif; font-size:30px; font-weight:700; color:var(--gold); }
        .stat-strip .stat .l{ font-size:12px; color:var(--muted); letter-spacing:0.03em; text-transform:uppercase; margin-top:4px; }

        .problem{ text-align:center; }
        .problem h2{ font-size:clamp(22px,3.4vw,36px); max-width:700px; margin:0 auto 14px; }
        .problem p{ color:var(--muted); max-width:600px; margin:0 auto; font-size:16px; line-height:1.6; }
        .leak-grid{ display:grid; grid-template-columns:repeat(3,1fr); gap:18px; margin-top:40px; }
        .leak-card{ background:var(--panel); border:1px solid var(--line); border-radius:var(--radius); padding:26px 22px; text-align:left; }
        .leak-card .num{ font-family: var(--font-space-grotesk-offer), sans-serif; font-size:13px; color:var(--primary-light); font-weight:700; letter-spacing:0.08em; }
        .leak-card h3{ font-size:17px; margin:10px 0 8px; }
        .leak-card p{ font-size:14.5px; color:var(--muted); margin:0; }

        .phone-wrap{ display:flex; align-items:center; gap:60px; }
        .phone-copy{ flex:1 1 380px; }
        .phone-copy h2{ font-size:clamp(22px,3.2vw,32px); margin:0 0 14px; }
        .phone-copy > p{ color:var(--muted); font-size:15.5px; line-height:1.6; margin:0; max-width:440px; }
        .phone-points{ list-style:none; padding:0; margin:26px 0 0; display:grid; gap:13px; }
        .phone-points li{ display:flex; gap:10px; align-items:flex-start; color:var(--text); font-size:15px; font-weight:500; }
        .phone-points li::before{ content:''; width:7px; height:7px; border-radius:50%; background:var(--green); margin-top:7px; flex:0 0 auto; box-shadow:0 0 8px var(--green); }

        .stack-wrap{ display:flex; justify-content:center; padding-top:20px; }
        .receipt{ width:100%; max-width:460px; background:#fbfaf7; color:#221c33; border-radius:6px; padding:34px 30px 28px; position:relative;
          box-shadow:0 30px 60px -20px rgba(0,0,0,0.55), 0 0 0 1px rgba(0,0,0,0.04); }
        .receipt-head{ text-align:center; border-bottom:2px dashed #d8d2c4; padding-bottom:18px; margin-bottom:18px; }
        .receipt-head .rlogo{ width:30px; height:30px; border-radius:7px; margin:0 auto 10px; display:block; background:linear-gradient(145deg, var(--primary-light), var(--primary)); }
        .receipt-head h3{ font-family: var(--font-space-grotesk-offer), sans-serif; font-size:15px; letter-spacing:0.14em; text-transform:uppercase; margin:0 0 4px; }
        .receipt-head span{ font-size:12px; color:#8a8296; letter-spacing:0.04em; }
        .rline{ display:flex; justify-content:space-between; align-items:baseline; font-size:14.5px; padding:9px 0; border-bottom:1px dotted #e3ded1; gap:12px; }
        .rline .rname{ max-width:270px; }
        .rline .rname :global(small){ display:block; color:#8a8296; font-size:12px; margin-top:2px; }
        .rline .rprice{ font-variant-numeric:tabular-nums; white-space:nowrap; }
        .rline .rprice :global(.was){ text-decoration:line-through; color:#b3ab9c; margin-right:8px; font-size:13px; }
        .rtotal{ display:flex; justify-content:space-between; align-items:center; padding-top:16px; margin-top:6px; border-top:2px dashed #d8d2c4; }
        .rtotal .label{ font-family: var(--font-space-grotesk-offer), sans-serif; font-weight:700; font-size:15px; letter-spacing:0.03em; }
        .rtotal .value{ font-family: var(--font-space-grotesk-offer), sans-serif; font-size:15px; text-decoration:line-through; color:#b3ab9c; }
        .due{ margin-top:16px; background:#221c33; color:#fbfaf7; border-radius:8px; padding:18px 20px; display:flex; justify-content:space-between; align-items:center; }
        .due .label{ font-family: var(--font-space-grotesk-offer), sans-serif; font-size:13px; letter-spacing:0.1em; text-transform:uppercase; color:#c9c2e6; }
        .due .amt{ font-family: var(--font-space-grotesk-offer), sans-serif; font-size:34px; font-weight:700; color:var(--gold); }
        .due .amt :global(sup){ font-size:15px; color:#c9c2e6; font-weight:600; margin-left:5px; }
        .stamp{ position:absolute; top:38px; right:24px; border:3px solid #d1483d; color:#d1483d;
          font-family: var(--font-space-grotesk-offer), sans-serif; font-weight:700; font-size:13px; letter-spacing:0.1em;
          padding:5px 10px; border-radius:6px; transform:rotate(9deg); text-transform:uppercase; }

        .steps{ display:grid; grid-template-columns:repeat(3,1fr); gap:20px; margin-top:44px; }
        .step-card{ background:var(--panel); border:1px solid var(--line); border-radius:var(--radius); padding:28px 24px; }
        .step-num{ width:38px; height:38px; border-radius:10px; background:rgba(92,81,214,0.25); display:flex; align-items:center; justify-content:center; color:var(--primary-light);
          font-family: var(--font-space-grotesk-offer), sans-serif; font-weight:700; font-size:16px; margin-bottom:16px; }
        .step-card h3{ font-size:17px; margin:0 0 8px; }
        .step-card p{ font-size:14.5px; color:var(--muted); margin:0; line-height:1.55; }

        .guarantee{ background:linear-gradient(160deg, var(--panel-2), var(--panel)); border:1px solid rgba(139,127,255,0.3); border-radius:20px; padding:44px; display:flex; align-items:center; gap:30px; }
        .seal{ flex:0 0 auto; width:96px; height:96px; border-radius:50%; background:radial-gradient(circle at 35% 30%, var(--primary-light), var(--primary)); display:flex; align-items:center; justify-content:center; box-shadow:0 10px 30px -6px rgba(92,81,214,0.6); }
        .guarantee h3{ font-size:22px; margin:0 0 10px; }
        .guarantee p{ color:var(--muted); font-size:15px; line-height:1.6; margin:0; max-width:600px; }

        .proof-card{ background:var(--panel); border:1px solid var(--line); border-radius:var(--radius); padding:36px; display:flex; gap:26px; align-items:flex-start; }
        .proof-avatar{ flex:0 0 auto; width:52px; height:52px; border-radius:50%; background:linear-gradient(135deg,var(--primary),var(--primary-light)); display:flex; align-items:center; justify-content:center; font-family: var(--font-space-grotesk-offer), sans-serif; font-weight:700; font-size:18px; }
        .proof-card :global(p.quote){ font-size:17px; line-height:1.6; margin:0 0 14px; }
        .who{ color:var(--muted); font-size:14px; }
        .who :global(strong){ color:var(--text); }
        .proof-stats{ display:flex; gap:34px; margin-top:22px; padding-top:22px; border-top:1px solid var(--line); flex-wrap:wrap; }
        .proof-stats > div{ text-align:left; }
        .proof-stats .n{ font-family: var(--font-space-grotesk-offer), sans-serif; font-size:24px; font-weight:700; color:var(--gold); }
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
