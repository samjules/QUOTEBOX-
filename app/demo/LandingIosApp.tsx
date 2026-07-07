'use client'

import { Space_Grotesk, Inter } from 'next/font/google'

const spaceGrotesk = Space_Grotesk({ subsets: ['latin'], weight: ['400', '500', '600', '700'], variable: '--font-space-grotesk-2' })
const inter = Inter({ subsets: ['latin'], weight: ['400', '500', '600'], variable: '--font-inter-landing-2' })

export default function LandingIosApp({ onStart }: { onStart: () => void }) {
  return (
    <div className={`${spaceGrotesk.variable} ${inter.variable} lia`}>
      <div className="ambient" />

      <nav>
        <div className="logo"><div className="logo-mark">QB</div>Quotebox</div>
        <div className="nav-links">
          <a href="#features">Features</a>
          <a href="#proof">Results</a>
        </div>
        <button className="btn-pill" onClick={onStart}>Book a Demo</button>
      </nav>

      <header className="hero wrap">
        <div>
          <div className="eyebrow"><span className="dot" />Now on iOS</div>
          <h1 className="hero-title">Never miss a lead <span className="accent">again.</span></h1>
          <p className="hero-sub">The moment a homeowner requests a quote, it&apos;s on your phone. Quotebox pushes every new lead straight to your lock screen — so you can call back before anyone else does.</p>
          <div className="hero-ctas">
            <button className="btn-primary" onClick={onStart}>Get the app free</button>
            <a className="btn-ghost" href="#features">See how it works →</a>
          </div>
          <div className="hero-proof">
            <div><b>2 min</b> avg. response time</div>
            <div><b>210+</b> leads delivered instantly</div>
            <div><b>iOS</b> App Store ready</div>
          </div>
        </div>

        <div className="phone-stage">
          <div className="phone">
            <div className="phone-screen">
              <div className="phone-clock">9:41</div>
              <div className="phone-date">Wednesday, July 6</div>

              <div className="notif">
                <div className="notif-icon">QB</div>
                <div className="notif-body">
                  <div className="notif-top"><span>QUOTEBOX</span><span>now</span></div>
                  <div className="notif-title">New lead — Sarah M.</div>
                  <div className="notif-text">3-bedroom move, Tampa → St. Pete. Est. <b>$425</b>. Tap to call.</div>
                </div>
              </div>
              <div className="notif">
                <div className="notif-icon">QB</div>
                <div className="notif-body">
                  <div className="notif-top"><span>QUOTEBOX</span><span>1m ago</span></div>
                  <div className="notif-title">Demo booked — Jose V.</div>
                  <div className="notif-text">Interested in junk removal bundle. Confirmed for <b>2:00 PM</b>.</div>
                </div>
              </div>
              <div className="notif">
                <div className="notif-icon">QB</div>
                <div className="notif-body">
                  <div className="notif-top"><span>QUOTEBOX</span><span>3m ago</span></div>
                  <div className="notif-title">Lead reply — Angie R.</div>
                  <div className="notif-text">Replied &quot;Yes, Tuesday works.&quot; <b>Reply now</b> to lock it in.</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <section className="section" id="features">
        <div className="section-head">
          <div className="section-kicker">The iOS App</div>
          <h2>Your whole pipeline, one lock-screen glance away.</h2>
        </div>
        <div className="feature-grid">
          <div className="feature-card">
            <div className="feature-icon">⚡</div>
            <h3>Instant push alerts</h3>
            <p>Every new lead — from Meta ads or your hosted form — reaches your phone in under a second. No app-opening, no refreshing.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">📋</div>
            <h3>Full CRM in your pocket</h3>
            <p>See quote details, contact info, and route distance right in the notification. Call, text, or book — without touching a laptop.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">✓</div>
            <h3>First call wins</h3>
            <p>Homeowners book with whoever answers first. Quotebox users respond in under 2 minutes on average — before competitors even see the lead.</p>
          </div>
        </div>
      </section>

      <div className="proof-strip" id="proof">
        <div className="proof-inner">
          <div>
            <div className="proof-quote">&quot;I don&apos;t touch a laptop anymore. My phone buzzes, I call, I book the job.&quot;</div>
            <div className="proof-who">— Titan Tuff Moving, Tampa Bay</div>
          </div>
          <div className="proof-stats">
            <div className="proof-stat"><b>$111,811</b><span>pipeline generated</span></div>
            <div className="proof-stat"><b>2.88x</b><span>average ROAS</span></div>
            <div className="proof-stat"><b>41</b><span>jobs booked</span></div>
          </div>
        </div>
      </div>

      <section className="section" id="cta">
        <div className="cta-banner">
          <h2>Download the app your competitors don&apos;t have yet.</h2>
          <p>Free for your first month. Cancel anytime. Set up in under 5 minutes.</p>
          <button className="btn-primary" onClick={onStart}>Start free trial →</button>
        </div>
      </section>

      <footer>© 2026 Quotebox — a product of Arctic Reach LLC</footer>

      <style jsx>{`
        .lia{
          --bg:#0B0E1A; --surface:#12162A; --surface-2:#171C33; --line:#262C4A;
          --purple:#5B50D6; --purple-light:#8B7FFF;
          --text:#F4F5FA; --text-dim:#9BA1C4; --text-dimmer:#6B7194; --glow: rgba(91,80,214,.45);
          background:var(--bg); color:var(--text); font-family: var(--font-inter-landing-2), sans-serif;
          -webkit-font-smoothing:antialiased; overflow-x:hidden; position:relative;
        }
        .lia :global(h1), .lia :global(h2), .lia :global(h3){ font-family: var(--font-space-grotesk-2), sans-serif; letter-spacing:-0.02em; }
        .lia a{ color:inherit; text-decoration:none; }
        .lia button{ font-family: var(--font-inter-landing-2), sans-serif; border:none; cursor:pointer; }

        .ambient{ position:fixed; inset:0; z-index:0; pointer-events:none;
          background: radial-gradient(600px 400px at 85% 8%, var(--glow), transparent 60%),
            radial-gradient(500px 350px at 10% 60%, rgba(91,80,214,.18), transparent 65%); }
        .wrap{ max-width:1180px; margin:0 auto; padding:0 32px; position:relative; z-index:1;}

        nav{ display:flex; align-items:center; justify-content:space-between; padding:26px 32px; max-width:1180px; margin:0 auto; position:relative; z-index:2; }
        .logo{ display:flex; align-items:center; gap:10px; font-weight:700; font-size:18px; font-family: var(--font-space-grotesk-2), sans-serif;}
        .logo-mark{ width:34px; height:34px; border-radius:10px; background:linear-gradient(145deg, var(--purple-light), var(--purple));
          display:flex; align-items:center; justify-content:center; font-size:14px; font-weight:700; color:white; font-family: var(--font-space-grotesk-2), sans-serif; box-shadow: 0 4px 20px var(--glow); }
        .nav-links{ display:flex; gap:36px; font-size:14.5px; color:var(--text-dim); }
        .nav-links a:hover{ color:var(--text); }
        .btn-pill{ background:var(--purple); color:white; padding:11px 22px; border-radius:100px; font-size:14px; font-weight:600; box-shadow:0 6px 24px var(--glow); transition: transform .15s ease, box-shadow .15s ease; }
        .btn-pill:hover{ transform:translateY(-1px); box-shadow:0 8px 30px var(--glow); }
        @media(max-width:820px){ .nav-links{display:none;} }

        .hero{ display:grid; grid-template-columns: 1.05fr 0.95fr; align-items:center; gap:40px; padding:64px 32px 40px; max-width:1180px; margin:0 auto; position:relative; z-index:1; }
        .eyebrow{ display:inline-flex; align-items:center; gap:8px; font-size:13px; color:var(--purple-light); font-weight:600;
          background:rgba(91,80,214,.12); border:1px solid rgba(91,80,214,.35); padding:6px 14px; border-radius:100px; margin-bottom:22px; }
        .eyebrow .dot{ width:6px; height:6px; border-radius:50%; background:var(--purple-light); box-shadow:0 0 8px var(--purple-light); }
        .hero-title{ font-size:clamp(36px, 4.6vw, 58px); line-height:1.03; font-weight:700; margin-bottom:22px; }
        .hero-title .accent{ color:var(--purple-light); }
        .hero-sub{ font-size:17.5px; color:var(--text-dim); line-height:1.6; max-width:460px; margin-bottom:32px; }
        .hero-ctas{ display:flex; gap:14px; align-items:center; flex-wrap:wrap; }
        .btn-primary{ background:var(--purple); color:white; padding:15px 26px; border-radius:12px; font-weight:600; font-size:15.5px; box-shadow:0 10px 30px var(--glow); transition: transform .15s ease; }
        .btn-primary:hover{ transform:translateY(-2px); }
        .btn-ghost{ color:var(--text-dim); font-size:14.5px; font-weight:500; padding:15px 8px; display:flex; align-items:center; gap:6px; background:none; }
        .hero-proof{ margin-top:30px; display:flex; gap:22px; color:var(--text-dimmer); font-size:13.5px; flex-wrap: wrap; }
        .hero-proof b{ color:var(--text); font-weight:600; }

        .phone-stage{ position:relative; display:flex; justify-content:center; align-items:flex-start; padding-top:8px; }
        .phone{ width:290px; height:588px; border-radius:44px; background:#05060C; border:8px solid #1A1E33;
          box-shadow: 0 30px 90px rgba(0,0,0,.55), 0 0 0 1px rgba(255,255,255,.04); position:relative; overflow:hidden; }
        .phone::before{ content:''; position:absolute; top:0; left:50%; transform:translateX(-50%);
          width:120px; height:22px; background:#05060C; border-radius:0 0 16px 16px; z-index:5; }
        .phone-screen{ position:absolute; inset:0; background: radial-gradient(circle at 50% 15%, #1c2140 0%, #0B0E1A 55%); padding:56px 16px 20px; }
        .phone-clock{ text-align:center; font-family: var(--font-space-grotesk-2), sans-serif; font-size:52px; font-weight:600; margin-bottom:4px;}
        .phone-date{ text-align:center; color:var(--text-dim); font-size:13px; margin-bottom:26px;}

        .notif{ background:rgba(23,28,51,.92); backdrop-filter:blur(6px); border:1px solid var(--line); border-radius:16px; padding:13px 14px;
          display:flex; gap:11px; margin-bottom:10px; opacity:0; transform:translateY(-14px) scale(.97); animation: dropIn .5s ease forwards; }
        .notif:nth-child(1){ animation-delay:.3s; }
        .notif:nth-child(2){ animation-delay:1.0s; }
        .notif:nth-child(3){ animation-delay:1.7s; }
        @keyframes dropIn{ to{ opacity:1; transform:translateY(0) scale(1); } }
        .notif-icon{ width:30px; height:30px; border-radius:8px; flex-shrink:0; background:linear-gradient(145deg, var(--purple-light), var(--purple));
          display:flex; align-items:center; justify-content:center; font-size:12px; font-weight:700; font-family: var(--font-space-grotesk-2), sans-serif; }
        .notif-body{ flex:1; min-width:0; }
        .notif-top{ display:flex; justify-content:space-between; font-size:11.5px; color:var(--text-dimmer); margin-bottom:2px;}
        .notif-title{ font-size:13.5px; font-weight:600; margin-bottom:2px; }
        .notif-text{ font-size:12.5px; color:var(--text-dim); line-height:1.35; }
        .notif-text :global(b){ color:var(--text); font-weight:600; }

        .section{ padding:90px 32px; max-width:1180px; margin:0 auto; position:relative; z-index:1; }
        .section-head{ max-width:560px; margin-bottom:52px; }
        .section-kicker{ color:var(--purple-light); font-size:13px; font-weight:600; text-transform:uppercase; letter-spacing:.08em; margin-bottom:14px; }
        .section-head h2{ font-size:clamp(26px,3vw,36px); line-height:1.15; }

        .feature-grid{ display:grid; grid-template-columns:repeat(3,1fr); gap:24px; }
        @media(max-width:900px){ .feature-grid{ grid-template-columns:1fr; } .hero{ grid-template-columns:1fr; } .phone-stage{ order:-1; } }
        .feature-card{ background:var(--surface); border:1px solid var(--line); border-radius:18px; padding:30px 26px; transition:border-color .2s ease, transform .2s ease; }
        .feature-card:hover{ border-color:rgba(91,80,214,.5); transform:translateY(-3px); }
        .feature-icon{ width:44px; height:44px; border-radius:12px; background:rgba(91,80,214,.15); border:1px solid rgba(91,80,214,.3);
          display:flex; align-items:center; justify-content:center; margin-bottom:20px; color:var(--purple-light); }
        .feature-card h3{ font-size:18px; margin-bottom:10px; font-weight:600; }
        .feature-card p{ color:var(--text-dim); font-size:14.5px; line-height:1.6; }

        .proof-strip{ background:var(--surface-2); border-top:1px solid var(--line); border-bottom:1px solid var(--line); padding:56px 32px; }
        .proof-inner{ max-width:1180px; margin:0 auto; display:flex; align-items:center; justify-content:space-between; gap:40px; flex-wrap:wrap; }
        .proof-quote{ max-width:520px; font-size:19px; line-height:1.5; font-family: var(--font-space-grotesk-2), sans-serif; font-weight:500; }
        .proof-who{ margin-top:16px; font-size:13.5px; color:var(--text-dim); }
        .proof-stats{ display:flex; gap:44px; }
        .proof-stat b{ display:block; font-size:30px; font-family: var(--font-space-grotesk-2), sans-serif; font-weight:700; color:var(--purple-light); }
        .proof-stat span{ font-size:12.5px; color:var(--text-dimmer); }

        .cta-banner{ margin:0 auto 60px; max-width:1116px; background:linear-gradient(135deg, #171C33, #1B1440);
          border:1px solid rgba(91,80,214,.35); border-radius:28px; padding:64px 48px; text-align:center; position:relative; overflow:hidden; }
        .cta-banner::after{ content:''; position:absolute; inset:0; background:radial-gradient(500px 260px at 50% 0%, var(--glow), transparent 70%); }
        .cta-banner h2{ font-size:clamp(26px,3.4vw,38px); position:relative; margin-bottom:14px; }
        .cta-banner p{ color:var(--text-dim); font-size:16px; margin-bottom:30px; position:relative; }
        .cta-banner button{ position:relative; }

        footer{ text-align:center; padding:36px; color:var(--text-dimmer); font-size:13px; }
      `}</style>
    </div>
  )
}
