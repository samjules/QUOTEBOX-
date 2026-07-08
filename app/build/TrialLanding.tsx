'use client'

import { useEffect, useState } from 'react'
import { Space_Grotesk, Inter } from 'next/font/google'

const spaceGrotesk = Space_Grotesk({ subsets: ['latin'], weight: ['500', '700'], variable: '--font-space-grotesk-offer' })
const inter = Inter({ subsets: ['latin'], weight: ['400', '500', '600', '700', '800'], variable: '--font-inter-offer' })

const NAV_ITEMS = ['Dashboard', 'Leads', 'Calendar', 'Time Clock', 'Map', 'Hosted Forms', 'Form Builder', 'Analytics', 'Media', 'Automations', 'Campaigns', 'Billing & Credits', 'Settings'] as const

// Sample data only — invented names/emails/numbers, not pulled from any real account.
const SAMPLE_LEADS = [
  { name: 'Jordan Patel', email: 'jordan.p@example.com', phone: '+1 555-201-4488', quote: '$420' },
  { name: 'Casey Nguyen', email: 'casey.nguyen@example.com', phone: '+1 555-118-3302', quote: '$610' },
  { name: 'Maria Chen', email: 'maria.c@example.com', phone: '+1 555-347-9021', quote: '$390' },
  { name: 'Sam Cooper', email: 'sam.cooper@example.com', phone: '+1 555-902-1187', quote: '$540' },
] as const

const PANELS = ['Dashboard', 'Leads', 'Automations'] as const
type PanelName = typeof PANELS[number]

// Hero illustration — desktop dashboard with the iOS app's lock-screen alerts layered on top.
// Sample data only, same as ProductPanel — nothing pulled from a real account.
function HeroMock() {
  return (
    <div className="hero-mock">
      <div className="hero-desktop">
        <div className="hd-bar">
          <span className="hd-dot r" /><span className="hd-dot y" /><span className="hd-dot g" />
          <div className="hd-url">quote-box.com/dashboard</div>
        </div>
        <div className="hd-shell">
          <div className="hd-sidebar">
            <div className="hd-brand"><span className="qb">QB</span>QuoteBox</div>
            {['Dashboard', 'Leads', 'Calendar', 'Automations'].map((item, i) => (
              <div key={item} className={`hd-nav ${i === 0 ? 'active' : ''}`}>{item}</div>
            ))}
          </div>
          <div className="hd-content">
            <div className="hd-title">Dashboard</div>
            <div className="hd-sub">This Month</div>
            <div className="hd-pipeline-label">PIPELINE VALUE · 22 LEADS</div>
            <div className="hd-pipeline-big">$9,270</div>
            <div className="hd-stats">
              {[['Total Leads', '22'], ['New Leads', '14'], ['Booked', '3'], ['Ad Spend', '$412']].map(([l, v]) => (
                <div className="hd-stat" key={l}><span className="l">{l}</span><span className="v">{v}</span></div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="hero-phone">
        <div className="hp-frame">
          <div className="hp-notch" />
          <div className="hp-screen">
            <div className="hp-clock">9:41</div>
            <div className="hp-date">Wed, Jul 6</div>
            <div className="hp-notif">
              <div className="hp-icon">QB</div>
              <div className="hp-body">
                <div className="hp-top"><span>QUOTEBOX</span><span>now</span></div>
                <div className="hp-lead">New lead — Jordan P.</div>
                <div className="hp-text">3-bedroom move. Est. <b>$420</b>. Tap to call.</div>
              </div>
            </div>
            <div className="hp-notif">
              <div className="hp-icon">QB</div>
              <div className="hp-body">
                <div className="hp-top"><span>QUOTEBOX</span><span>1m ago</span></div>
                <div className="hp-lead">Demo booked — Casey N.</div>
                <div className="hp-text">Confirmed for <b>2:00 PM</b>.</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .hero-mock{position:relative;padding-bottom:56px;padding-right:24px;}
        .hero-desktop{border-radius:14px;overflow:hidden;background:#0c0a16;border:1px solid var(--line);box-shadow:0 40px 90px -35px rgba(0,0,0,0.7);}
        .hd-bar{display:flex;align-items:center;gap:6px;padding:10px 13px;background:#141024;border-bottom:1px solid var(--line);}
        .hd-dot{width:8px;height:8px;border-radius:50%;flex:0 0 auto;}
        .hd-dot.r{background:#ff5f57;} .hd-dot.y{background:#febc2e;} .hd-dot.g{background:#28c840;}
        .hd-url{margin-left:8px;background:rgba(255,255,255,0.06);padding:3px 12px;border-radius:6px;font-size:10.5px;color:var(--muted);}
        .hd-shell{display:flex;min-height:230px;}
        .hd-sidebar{width:96px;flex:0 0 auto;background:#14111f;padding:12px 8px;display:flex;flex-direction:column;gap:1px;}
        .hd-brand{display:flex;align-items:center;gap:6px;color:#fff;font-weight:700;font-size:9.5px;margin-bottom:10px;padding:0 2px;}
        .hd-brand .qb{width:16px;height:16px;border-radius:5px;background:var(--primary);display:flex;align-items:center;justify-content:center;font-size:7px;font-weight:800;flex:0 0 auto;}
        .hd-nav{padding:5px 6px;border-radius:6px;color:#8b86a8;font-size:8.5px;font-weight:600;white-space:nowrap;}
        .hd-nav.active{background:rgba(92,81,214,0.28);color:#fff;}
        .hd-content{flex:1;background:#f4f3fa;padding:14px 16px;color:#1c1830;min-width:0;}
        .hd-title{font-family: var(--font-space-grotesk-offer), sans-serif;font-weight:700;font-size:14px;}
        .hd-sub{font-size:9px;color:#8b86a8;margin-bottom:10px;}
        .hd-pipeline-label{font-size:8px;color:#8b86a8;text-transform:uppercase;letter-spacing:.05em;margin-bottom:3px;}
        .hd-pipeline-big{font-family: var(--font-space-grotesk-offer), sans-serif;font-weight:700;font-size:22px;margin-bottom:10px;}
        .hd-stats{display:grid;grid-template-columns:repeat(4,1fr);gap:6px;}
        .hd-stat{background:#fff;border-radius:7px;padding:7px 8px;display:flex;flex-direction:column;gap:2px;box-shadow:0 1px 3px rgba(0,0,0,.05);min-width:0;}
        .hd-stat .l{font-size:6.5px;color:#8b86a8;text-transform:uppercase;letter-spacing:.02em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
        .hd-stat .v{font-family: var(--font-space-grotesk-offer), sans-serif;font-weight:700;font-size:11px;color:#1c1830;}

        .hero-phone{position:absolute;right:0;bottom:0;width:150px;}
        .hp-frame{width:100%;aspect-ratio:150/305;border-radius:22px;background:#05060c;border:5px solid #1a1e33;box-shadow:0 20px 50px -18px rgba(0,0,0,.6), 0 0 0 1px rgba(255,255,255,.05);position:relative;}
        .hp-notch{position:absolute;top:0;left:50%;transform:translateX(-50%);width:54px;height:12px;background:#05060c;border-radius:0 0 8px 8px;z-index:3;}
        .hp-screen{position:absolute;inset:0;border-radius:17px;overflow:hidden;background:radial-gradient(circle at 50% 15%, #1c2140 0%, #0B0E1A 55%);padding:22px 8px 8px;}
        .hp-clock{text-align:center;font-family: var(--font-space-grotesk-offer), sans-serif;font-size:19px;font-weight:600;color:#fff;margin-bottom:1px;}
        .hp-date{text-align:center;color:var(--muted);font-size:6.5px;margin-bottom:9px;}
        .hp-notif{background:rgba(23,28,51,.92);border:1px solid var(--line);border-radius:8px;padding:6px 7px;display:flex;gap:5px;margin-bottom:5px;}
        .hp-icon{width:14px;height:14px;border-radius:4px;flex-shrink:0;background:linear-gradient(145deg, var(--primary-light), var(--primary));display:flex;align-items:center;justify-content:center;font-size:5px;font-weight:700;color:#fff;}
        .hp-body{flex:1;min-width:0;}
        .hp-top{display:flex;justify-content:space-between;font-size:5.5px;color:var(--muted);margin-bottom:1px;}
        .hp-lead{font-size:6.5px;font-weight:700;color:#fff;margin-bottom:1px;line-height:1.2;}
        .hp-text{font-size:6px;color:var(--muted);line-height:1.3;}
        .hp-text :global(b){color:#fff;font-weight:700;}

        @media(max-width:900px){
          .hero-mock{padding-right:0;max-width:420px;margin:0 auto;}
        }
      `}</style>
    </div>
  )
}

function ProductPanel() {
  const [i, setI] = useState(0)
  useEffect(() => {
    const t = setInterval(() => setI((p) => (p + 1) % PANELS.length), 4400)
    return () => clearInterval(t)
  }, [])
  const active: PanelName = PANELS[i]

  return (
    <div className="browser-mock">
      <div className="browser-bar">
        <span className="bdot r" /><span className="bdot y" /><span className="bdot g" />
        <div className="browser-url">quote-box.com/{active.toLowerCase().replace(/\s+/g, '-')}</div>
      </div>
      <div className="app-shell">
        <div className="app-sidebar">
          <div className="sidebar-brand"><span className="qb">QB</span>QuoteBox</div>
          {NAV_ITEMS.map((item) => (
            <div key={item} className={`nav-item ${item === active ? 'active' : ''}`}>{item}</div>
          ))}
        </div>

        <div className="app-content">
          {active === 'Dashboard' && (
            <>
              <div className="content-title">Dashboard</div>
              <div className="content-sub">This Month</div>
              <div className="pipeline-label">PIPELINE VALUE · 22 LEADS</div>
              <div className="pipeline-big">$9,270</div>
              <div className="live-banner">
                <span className="live-dot" />Your quote form is live!
                <span className="live-url">quote-box.com/sample-moving-co</span>
              </div>
              <div className="today-row">
                <div>
                  <div className="today-label">Today</div>
                  {SAMPLE_LEADS.slice(0, 2).map((l) => (
                    <div className="today-lead" key={l.name}><span className="avatar">{l.name.split(' ').map((n) => n[0]).join('')}</span>{l.name}</div>
                  ))}
                </div>
              </div>
              <div className="stat-grid">
                {[['Total Leads', '22'], ['New Leads', '14'], ['Booked', '3'], ['Ad Spend', '$412']].map(([l, v]) => (
                  <div className="stat-tile" key={l}><span className="l">{l}</span><span className="v">{v}</span></div>
                ))}
              </div>
            </>
          )}

          {active === 'Leads' && (
            <>
              <div className="content-title">Leads</div>
              <div className="content-sub">Sample Moving Co.</div>
              <div className="stat-grid three">
                {[['Total Leads', '22'], ['New Leads', '14'], ['Booked', '3']].map(([l, v]) => (
                  <div className="stat-tile" key={l}><span className="l">{l}</span><span className="v">{v}</span></div>
                ))}
              </div>
              <div className="lead-table">
                <div className="lead-row head"><span>Name</span><span>Email</span><span>Phone</span><span>Quote</span></div>
                {SAMPLE_LEADS.map((l) => (
                  <div className="lead-row" key={l.name}><span>{l.name}</span><span>{l.email}</span><span>{l.phone}</span><span>{l.quote}</span></div>
                ))}
              </div>
            </>
          )}

          {active === 'Automations' && (
            <>
              <div className="content-title">Automations</div>
              <div className="content-sub">Nurture every lead from first touch to close.</div>
              <div className="trigger-card">
                <div className="trigger-label">TRIGGER</div>
                <div className="trigger-name">Any New Lead</div>
                <div className="trigger-sub">Meta or hosted form</div>
              </div>
              <div className="auto-card">
                <div className="auto-card-head">Instant Contact<span className="tag">Email</span><span className="tag">SMS</span></div>
                <div className="auto-bar"><span>Sent</span><div className="bar"><i style={{ width: '100%' }} /></div><b>184</b></div>
                <div className="auto-bar"><span>Opened</span><div className="bar"><i style={{ width: '31%' }} /></div><b>31%</b></div>
                <div className="auto-bar"><span>Clicked</span><div className="bar"><i style={{ width: '6%' }} /></div><b>6%</b></div>
              </div>
            </>
          )}
        </div>
      </div>
      <style jsx>{`
        .browser-mock{position:relative;border-radius:16px;overflow:hidden;background:#0c0a16;border:1px solid var(--line);box-shadow:0 40px 90px -35px rgba(0,0,0,0.7);}
        .browser-bar{display:flex;align-items:center;gap:8px;padding:13px 16px;background:#141024;border-bottom:1px solid var(--line);}
        .bdot{width:11px;height:11px;border-radius:50%;flex:0 0 auto;}
        .bdot.r{background:#ff5f57;} .bdot.y{background:#febc2e;} .bdot.g{background:#28c840;}
        .browser-url{margin-left:10px;background:rgba(255,255,255,0.06);padding:5px 16px;border-radius:7px;font-size:12px;color:var(--muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}

        .app-shell{display:flex;min-height:420px;}
        .app-sidebar{width:150px;flex:0 0 auto;background:#14111f;padding:16px 12px;display:flex;flex-direction:column;gap:1px;}
        .sidebar-brand{display:flex;align-items:center;gap:8px;color:#fff;font-weight:700;font-size:12.5px;margin-bottom:16px;padding:0 4px;}
        .sidebar-brand .qb{width:22px;height:22px;border-radius:6px;background:var(--primary);display:flex;align-items:center;justify-content:center;font-size:9.5px;font-weight:800;flex:0 0 auto;}
        .nav-item{padding:7px 8px;border-radius:7px;color:#8b86a8;font-size:10.5px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
        .nav-item.active{background:rgba(92,81,214,0.28);color:#fff;}

        .app-content{flex:1;background:#f4f3fa;padding:20px 22px;color:#1c1830;min-width:0;overflow:hidden;}
        .content-title{font-family: var(--font-space-grotesk-offer), sans-serif;font-weight:700;font-size:19px;}
        .content-sub{font-size:11.5px;color:#8b86a8;margin-bottom:14px;}

        .pipeline-label{font-size:10px;color:#8b86a8;text-transform:uppercase;letter-spacing:.05em;margin-bottom:4px;}
        .pipeline-big{font-family: var(--font-space-grotesk-offer), sans-serif;font-weight:700;font-size:28px;margin-bottom:12px;}
        .live-banner{display:flex;align-items:center;gap:8px;flex-wrap:wrap;background:#fff;border-radius:9px;padding:10px 14px;font-size:11.5px;font-weight:600;margin-bottom:14px;box-shadow:0 1px 3px rgba(0,0,0,.05);}
        .live-dot{width:7px;height:7px;border-radius:50%;background:#1a9e6a;flex:0 0 auto;}
        .live-url{font-size:10px;color:#8b86a8;font-weight:500;background:#f4f3fa;border-radius:6px;padding:3px 8px;}
        .today-row{margin-bottom:14px;}
        .today-label{font-size:10.5px;font-weight:700;color:#8b86a8;text-transform:uppercase;letter-spacing:.04em;margin-bottom:6px;}
        .today-lead{display:flex;align-items:center;gap:8px;font-size:11.5px;font-weight:600;background:#fff;border-radius:8px;padding:8px 10px;margin-bottom:5px;box-shadow:0 1px 3px rgba(0,0,0,.04);}
        .avatar{width:20px;height:20px;border-radius:50%;background:var(--primary);color:#fff;font-size:8.5px;font-weight:700;display:flex;align-items:center;justify-content:center;flex:0 0 auto;}

        .stat-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;}
        .stat-grid.three{grid-template-columns:repeat(3,1fr);margin-bottom:14px;}
        .stat-tile{background:#fff;border-radius:9px;padding:9px 10px;display:flex;flex-direction:column;gap:3px;box-shadow:0 1px 3px rgba(0,0,0,.05);min-width:0;}
        .stat-tile .l{font-size:9px;color:#8b86a8;text-transform:uppercase;letter-spacing:.03em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
        .stat-tile .v{font-family: var(--font-space-grotesk-offer), sans-serif;font-weight:700;font-size:14px;color:#1c1830;}

        .lead-table{background:#fff;border-radius:9px;overflow:hidden;}
        .lead-row{display:grid;grid-template-columns:1.2fr 1.6fr 1.3fr 0.7fr;gap:8px;padding:8px 12px;font-size:10.5px;border-bottom:1px solid #eeecf5;color:#3a3555;white-space:nowrap;overflow:hidden;}
        .lead-row span{overflow:hidden;text-overflow:ellipsis;}
        .lead-row.head{color:#8b86a8;font-size:9px;text-transform:uppercase;letter-spacing:.03em;border-bottom:1px solid #e3e0ef;font-weight:700;}
        .lead-row:last-child{border-bottom:none;}

        .trigger-card{background:var(--primary);color:#fff;border-radius:10px;padding:14px 16px;margin-bottom:12px;}
        .trigger-label{font-size:9px;letter-spacing:.08em;opacity:.85;margin-bottom:2px;}
        .trigger-name{font-family: var(--font-space-grotesk-offer), sans-serif;font-weight:700;font-size:14px;}
        .trigger-sub{font-size:10.5px;opacity:.85;}
        .auto-card{background:#fff;border-radius:10px;padding:16px;}
        .auto-card-head{display:flex;align-items:center;gap:6px;font-family: var(--font-space-grotesk-offer), sans-serif;font-weight:700;font-size:13px;margin-bottom:12px;}
        .auto-card-head .tag{font-family: var(--font-inter-offer), sans-serif;font-size:9px;font-weight:700;background:rgba(92,81,214,0.1);color:var(--primary);border-radius:999px;padding:2px 8px;}
        .auto-bar{display:grid;grid-template-columns:52px 1fr 36px;align-items:center;gap:10px;font-size:11px;color:#8b86a8;margin-bottom:10px;}
        .auto-bar .bar{height:6px;background:#eeecf5;border-radius:4px;overflow:hidden;}
        .auto-bar .bar i{display:block;height:100%;background:var(--primary);border-radius:4px;transition:width 1s ease;}
        .auto-bar b{text-align:right;color:#1c1830;font-weight:700;}

        @media(max-width:640px){
          .app-sidebar{width:0;padding:0;overflow:hidden;}
          .stat-grid{grid-template-columns:repeat(2,1fr);}
          .lead-row{grid-template-columns:1fr 1fr;}
          .lead-row span:nth-child(3), .lead-row span:nth-child(4){display:none;}
        }
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
  { q: 'Is this really $1, or is there a catch?', a: "It's $1 for your first month — full access, no feature limits. After that, it renews at the normal $34/month rate. Cancel anytime before your first renewal and you're never charged again." },
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
        <div className="hero-text">
          <div className="truck-sticker">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/delivery-truck.png" alt="" />
          </div>
          <div className="eyebrow"><span className="dot" /> For moving &amp; junk removal companies</div>
          <h1 className="headline">The quote form &amp; CRM<br />that turned <span className="accent">685 leads</span> into $111K in pipeline.</h1>
          <p className="sub">Quotebox is the instant-quote form, CRM, and Meta Ads dashboard built specifically for movers and junk haulers — with every lead texted and emailed back automatically. Try the full software for <strong>$1 for your first month</strong>, instead of $34/month.</p>
          <button className="cta-btn" onClick={() => onStart()}>Try Quotebox For $1 →</button>
          <span className="cta-sub">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M20 6L9 17l-5-5" stroke="#34d399" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" /></svg>
            Cancel anytime · Then $34/mo · Live in under 10 minutes
          </span>
        </div>
        <div className="hero-visual">
          <HeroMock />
        </div>
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
            <div className="stamp">1st month</div>
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
              <div className="amt">$1<sup>1st mo</sup></div>
            </div>
          </div>
        </div>
        <div style={{ textAlign: 'center', marginTop: 38 }}>
          <button className="cta-btn" onClick={() => onStart()}>Claim My $1 Trial →</button>
          <span className="cta-sub" style={{ display: 'block', marginTop: 14 }}>Renews at $34/mo after your first month · Cancel anytime, no questions asked</span>
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
        <div className="txt">Your first month just <b>$1</b> — normally $34/mo</div>
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

        .hero{ max-width:1080px; margin:0 auto; padding:56px 24px 40px; display:grid; grid-template-columns:1.05fr 0.95fr; align-items:center; gap:40px; }
        .truck-sticker{ display:inline-block; background:#fff; border-radius:18px; padding:10px 12px 6px; transform:rotate(-3deg); box-shadow:0 24px 54px -22px rgba(0,0,0,0.65); margin-bottom:18px; }
        .truck-sticker img{ display:block; width:150px; height:auto; }
        @media(max-width:900px){ .truck-sticker{ margin-left:auto; margin-right:auto; } }
        .eyebrow{ display:inline-flex; align-items:center; gap:8px; background:rgba(92,81,214,0.18); border:1px solid rgba(139,127,255,0.4); color:var(--primary-light);
          padding:7px 16px; border-radius:999px; font-size:13px; font-weight:600; letter-spacing:0.03em; text-transform:uppercase; margin-bottom:26px; }
        .eyebrow .dot{ width:7px; height:7px; border-radius:50%; background:var(--green); box-shadow:0 0 8px var(--green); }
        .headline{ font-size:clamp(30px,4.6vw,54px); line-height:1.06; margin:0 0 22px; }
        .headline :global(.accent){ color:var(--gold); }
        .sub{ font-size:17px; line-height:1.55; color:var(--muted); max-width:480px; margin:0 0 34px; }
        .sub :global(strong){ color:var(--text); }
        @media(max-width:900px){ .hero{ grid-template-columns:1fr; text-align:center; } .hero-text{ order:1; } .hero-visual{ order:2; } .sub{ margin-left:auto; margin-right:auto; } }

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
