'use client'

import { Space_Grotesk, Inter } from 'next/font/google'

const spaceGrotesk = Space_Grotesk({ subsets: ['latin'], weight: ['400', '500', '600', '700'], variable: '--font-space-grotesk' })
const inter = Inter({ subsets: ['latin'], weight: ['400', '500', '600'], variable: '--font-inter-landing' })

export default function LandingQuoteForm({ onStart }: { onStart: () => void }) {
  return (
    <div className={`${spaceGrotesk.variable} ${inter.variable} lqf`}>
      <div className="ambient" />

      <nav>
        <div className="logo"><div className="logo-mark">QB</div>Quotebox</div>
        <div className="nav-links">
          <a href="#steps">Features</a>
          <a href="#proof">Results</a>
        </div>
        <button className="btn-pill" onClick={onStart}>Book a Demo</button>
      </nav>

      <header className="hero wrap">
        <div>
          <div className="eyebrow"><span className="dot" />Instant Quote Form</div>
          <h1 className="hero-title">Give them a price <span className="accent">before they leave the page.</span></h1>
          <p className="hero-sub">No callbacks, no &quot;we&apos;ll get back to you.&quot; Homeowners answer a few questions and get a real estimate in seconds — while they&apos;re still interested.</p>
          <div className="hero-ctas">
            <button className="btn-primary" onClick={onStart}>See it live</button>
            <a className="btn-ghost" href="#steps">How it works →</a>
          </div>
          <div className="hero-proof">
            <div><b>6.0%</b> avg. booking rate</div>
            <div><b>$8.82</b> cost per lead</div>
            <div><b>&lt;60 sec</b> to complete</div>
          </div>
        </div>

        <div className="form-stage">
          <div style={{ position: 'relative' }}>
            <div className="badge-live"><span className="pulse" />Live demo</div>
            <div className="form-card">
              <div className="form-head">
                <div className="form-step">GET YOUR QUOTE</div>
                <div className="form-brand">Titan Tuff Moving</div>
              </div>
              <div className="form-body">
                <div className="form-slide">
                  <div className="fq">Home Size</div>
                  <div className="opt"><span className="radio" />Studio / 1 Bed</div>
                  <div className="opt selected"><span className="radio" />3 Bedrooms</div>
                  <div className="opt"><span className="radio" />4+ Bedrooms</div>
                </div>

                <div className="form-slide">
                  <div className="fq">Almost there</div>
                  <div className="field-label">FULL NAME</div>
                  <div className="field">Sarah Mitchell</div>
                  <div className="field-label">EMAIL</div>
                  <div className="field">sarah.m@email.com</div>
                  <div className="field-label">PHONE</div>
                  <div className="field">727-555-0148</div>
                </div>

                <div className="form-slide">
                  <div className="result-check">✓</div>
                  <div className="result-title">You&apos;re all set!</div>
                  <div className="result-sub">We&apos;ve received your details and will send your personalized quote shortly.</div>
                  <div className="result-total">
                    <div className="result-total-label">ESTIMATED TOTAL</div>
                    <div className="result-total-value">$425.00</div>
                  </div>
                </div>
              </div>
              <div className="progress-dots"><span /><span /><span /></div>
            </div>
          </div>
        </div>
      </header>

      <section className="section" id="steps">
        <div className="section-head">
          <div className="section-kicker">Under the hood</div>
          <h2>Four short steps stand between a scroll and a booked job.</h2>
        </div>
        <div className="steps-row">
          <div className="step-card">
            <div className="step-num">Step 1</div>
            <h3>Home or job size</h3>
            <p>One tap tells you the scope — studio, 3-bed, or a full junk-out. No typing required.</p>
          </div>
          <div className="step-card">
            <div className="step-num">Step 2</div>
            <h3>Pickup & drop-off</h3>
            <p>Addresses auto-calculate real drive distance and time, so your estimate reflects the actual route.</p>
          </div>
          <div className="step-card">
            <div className="step-num">Step 3</div>
            <h3>Contact details</h3>
            <p>Name, email, phone — with SMS opt-in built in, so instant follow-up is already compliant.</p>
          </div>
          <div className="step-card">
            <div className="step-num">Step 4</div>
            <h3>Instant estimate</h3>
            <p>A real dollar figure appears immediately, and the lead lands in your dashboard — and your phone.</p>
          </div>
        </div>
      </section>

      <div className="proof-strip" id="proof">
        <div className="proof-inner">
          <div>
            <div className="proof-quote">&quot;People fill it out on their lunch break and text back &apos;yes&apos; before we even call.&quot;</div>
            <div className="proof-who">— Titan Tuff Moving, Tampa Bay</div>
          </div>
          <div className="proof-stats">
            <div className="proof-stat"><b>686</b><span>quotes completed</span></div>
            <div className="proof-stat"><b>$425</b><span>avg. deal size</span></div>
            <div className="proof-stat"><b>41</b><span>jobs booked</span></div>
          </div>
        </div>
      </div>

      <section className="section" id="cta">
        <div className="cta-banner">
          <h2>Turn your website into a quoting machine.</h2>
          <p>Free for your first month. Live in under 5 minutes — no developer needed.</p>
          <button className="btn-primary" onClick={onStart}>Build my form free →</button>
        </div>
      </section>

      <footer>© 2026 Quotebox — a product of Arctic Reach LLC</footer>

      <style jsx>{`
        .lqf{
          --bg:#0B0E1A; --surface:#12162A; --surface-2:#171C33; --line:#262C4A;
          --purple:#5B50D6; --purple-light:#8B7FFF; --coral:#E15B4D;
          --text:#F4F5FA; --text-dim:#9BA1C4; --text-dimmer:#6B7194; --glow: rgba(91,80,214,.45);
          background:var(--bg); color:var(--text); font-family: var(--font-inter-landing), sans-serif;
          -webkit-font-smoothing:antialiased; overflow-x:hidden; position:relative;
        }
        .lqf :global(h1), .lqf :global(h2), .lqf :global(h3){ font-family: var(--font-space-grotesk), sans-serif; letter-spacing:-0.02em; }
        .lqf a{ color:inherit; text-decoration:none; }
        .lqf button{ font-family: var(--font-inter-landing), sans-serif; border:none; cursor:pointer; }

        .ambient{ position:fixed; inset:0; z-index:0; pointer-events:none;
          background: radial-gradient(600px 400px at 15% 6%, var(--glow), transparent 60%),
            radial-gradient(500px 350px at 90% 55%, rgba(91,80,214,.16), transparent 65%); }
        .wrap{ max-width:1180px; margin:0 auto; padding:0 32px; position:relative; z-index:1; }

        nav{ display:flex; align-items:center; justify-content:space-between; padding:26px 32px; max-width:1180px; margin:0 auto; position:relative; z-index:2; }
        .logo{ display:flex; align-items:center; gap:10px; font-weight:700; font-size:18px; font-family: var(--font-space-grotesk), sans-serif; }
        .logo-mark{ width:34px; height:34px; border-radius:10px; background:linear-gradient(145deg, var(--purple-light), var(--purple));
          display:flex; align-items:center; justify-content:center; font-size:14px; font-weight:700; color:white; box-shadow:0 4px 20px var(--glow); }
        .nav-links{ display:flex; gap:36px; font-size:14.5px; color:var(--text-dim); }
        .nav-links a:hover{ color:var(--text); }
        .btn-pill{ background:var(--purple); color:white; padding:11px 22px; border-radius:100px; font-size:14px; font-weight:600; box-shadow:0 6px 24px var(--glow); transition: transform .15s ease; }
        .btn-pill:hover{ transform:translateY(-1px); }
        @media(max-width:820px){ .nav-links{display:none;} }

        .hero{ display:grid; grid-template-columns: 1fr 0.92fr; align-items:center; gap:40px; padding:60px 32px 30px; max-width:1180px; margin:0 auto; position:relative; z-index:1; }
        @media(max-width:900px){ .hero{ grid-template-columns:1fr; } .form-stage{ order:-1; } }
        .eyebrow{ display:inline-flex; align-items:center; gap:8px; font-size:13px; color:var(--purple-light); font-weight:600;
          background:rgba(91,80,214,.12); border:1px solid rgba(91,80,214,.35); padding:6px 14px; border-radius:100px; margin-bottom:22px; }
        .eyebrow .dot{ width:6px; height:6px; border-radius:50%; background:var(--purple-light); box-shadow:0 0 8px var(--purple-light); }
        .hero-title{ font-size:clamp(34px,4.4vw,54px); line-height:1.05; font-weight:700; margin-bottom:20px; }
        .hero-title .accent{ color:var(--purple-light); }
        .hero-sub{ font-size:17px; color:var(--text-dim); line-height:1.6; max-width:460px; margin-bottom:30px; }
        .hero-ctas{ display:flex; gap:14px; align-items:center; flex-wrap:wrap; }
        .btn-primary{ background:var(--purple); color:white; padding:15px 26px; border-radius:12px; font-weight:600; font-size:15.5px; box-shadow:0 10px 30px var(--glow); transition:transform .15s ease; }
        .btn-primary:hover{ transform:translateY(-2px); }
        .btn-ghost{ color:var(--text-dim); font-size:14.5px; font-weight:500; padding:15px 8px; display:flex; align-items:center; gap:6px; background:none; }
        .hero-proof{ margin-top:26px; display:flex; gap:22px; color:var(--text-dimmer); font-size:13.5px; flex-wrap:wrap; }
        .hero-proof b{ color:var(--text); font-weight:600; }

        .form-stage{ display:flex; justify-content:center; }
        .form-card{ width:340px; background:#fff; color:#1a1d2b; border-radius:22px; overflow:hidden;
          box-shadow:0 40px 90px rgba(0,0,0,.5), 0 0 0 1px rgba(255,255,255,.05); position:relative; }
        .form-head{ background:var(--coral); color:white; padding:20px 22px; }
        .form-step{ font-size:11px; letter-spacing:.08em; opacity:.85; margin-bottom:4px; font-weight:600; }
        .form-brand{ font-family: var(--font-space-grotesk), sans-serif; font-weight:700; font-size:19px; }
        .form-body{ padding:26px 22px 24px; min-height:300px; position:relative; }

        .form-slide{ position:absolute; inset:0; padding:26px 22px 24px; opacity:0; transform:translateX(16px); animation: slideCycle 9s infinite; }
        .form-slide:nth-child(1){ animation-delay:0s; }
        .form-slide:nth-child(2){ animation-delay:3s; }
        .form-slide:nth-child(3){ animation-delay:6s; }
        @keyframes slideCycle{
          0%{ opacity:0; transform:translateX(16px); }
          4%{ opacity:1; transform:translateX(0); }
          30%{ opacity:1; transform:translateX(0); }
          34%{ opacity:0; transform:translateX(-16px); }
          100%{ opacity:0; }
        }
        .fq{ font-size:16px; font-weight:700; margin-bottom:16px; color:#1a1d2b; }
        .opt{ border:1.5px solid #e6e5ee; border-radius:12px; padding:14px 16px; margin-bottom:10px; font-size:14px; font-weight:600; color:#3a3d4d; display:flex; align-items:center; gap:10px; }
        .opt.selected{ border-color:var(--coral); background:#FFF4F2; color:var(--coral); }
        .opt .radio{ width:16px; height:16px; border-radius:50%; border:2px solid #d8d7e2; flex-shrink:0; }
        .opt.selected .radio{ border-color:var(--coral); background:radial-gradient(circle, var(--coral) 40%, transparent 42%); }
        .field-label{ font-size:11px; font-weight:700; letter-spacing:.05em; color:#8a8da3; margin-bottom:6px; margin-top:14px; }
        .field{ background:#eef0fb; border-radius:10px; padding:12px 14px; font-size:14px; font-weight:600; color:#1a1d2b; margin-bottom:4px; }
        .result-check{ width:56px; height:56px; border-radius:50%; background:var(--coral); display:flex; align-items:center; justify-content:center; color:white; font-size:24px; margin:10px auto 18px; }
        .result-title{ text-align:center; font-size:17px; font-weight:700; margin-bottom:6px; }
        .result-sub{ text-align:center; font-size:13px; color:#8a8da3; margin-bottom:18px; line-height:1.5; }
        .result-total{ background:#FFF4F2; border:1px solid #FBD9D2; border-radius:12px; padding:14px 16px; }
        .result-total-label{ font-size:10.5px; font-weight:700; color:#c2564a; letter-spacing:.05em; margin-bottom:4px;}
        .result-total-value{ font-size:26px; font-weight:700; color:#1a1d2b; font-family: var(--font-space-grotesk), sans-serif; }

        .progress-dots{ display:flex; gap:6px; justify-content:center; padding-top:14px; padding-bottom: 14px;}
        .progress-dots span{ width:6px; height:6px; border-radius:50%; background:#e0e0ea; }
        .badge-live{ position:absolute; top:-14px; right:18px; background:var(--purple); color:white; font-size:11px; font-weight:700; padding:6px 12px; border-radius:100px; box-shadow:0 6px 20px var(--glow); display:flex; align-items:center; gap:6px; z-index:3; }
        .badge-live .pulse{ width:7px; height:7px; border-radius:50%; background:#7CFF9E; animation:pulse 1.4s infinite; }
        @keyframes pulse{ 0%,100%{ opacity:1; } 50%{ opacity:.3; } }

        .section{ padding:90px 32px; max-width:1180px; margin:0 auto; position:relative; z-index:1; }
        .section-head{ max-width:580px; margin-bottom:52px; }
        .section-kicker{ color:var(--purple-light); font-size:13px; font-weight:600; text-transform:uppercase; letter-spacing:.08em; margin-bottom:14px; }
        .section-head h2{ font-size:clamp(26px,3vw,36px); line-height:1.15; }

        .steps-row{ display:grid; grid-template-columns:repeat(4,1fr); gap:20px; }
        @media(max-width:900px){ .steps-row{ grid-template-columns:1fr 1fr; } }
        .step-card{ background:var(--surface); border:1px solid var(--line); border-radius:16px; padding:24px 20px; transition:border-color .2s ease, transform .2s ease; }
        .step-card:hover{ border-color:rgba(91,80,214,.5); transform:translateY(-3px); }
        .step-num{ font-family: var(--font-space-grotesk), sans-serif; font-size:13px; font-weight:700; color:var(--purple-light); margin-bottom:14px; }
        .step-card h3{ font-size:15.5px; margin-bottom:8px; font-weight:600; }
        .step-card p{ color:var(--text-dim); font-size:13.5px; line-height:1.55; }

        .proof-strip{ background:var(--surface-2); border-top:1px solid var(--line); border-bottom:1px solid var(--line); padding:56px 32px; }
        .proof-inner{ max-width:1180px; margin:0 auto; display:flex; align-items:center; justify-content:space-between; gap:40px; flex-wrap:wrap; }
        .proof-quote{ max-width:520px; font-size:19px; line-height:1.5; font-family: var(--font-space-grotesk), sans-serif; font-weight:500; }
        .proof-who{ margin-top:16px; font-size:13.5px; color:var(--text-dim); }
        .proof-stats{ display:flex; gap:44px; }
        .proof-stat b{ display:block; font-size:30px; font-family: var(--font-space-grotesk), sans-serif; font-weight:700; color:var(--purple-light); }
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
