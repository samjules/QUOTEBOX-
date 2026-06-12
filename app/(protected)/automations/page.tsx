'use client'

import { Fragment, useEffect, useState } from 'react'

interface AutomationConfig {
  is_enabled: boolean
  discount_percent: number
  hero_image_url: string | null
  default_lead_value: number | null
  accent_color: string | null
  business_name?: string
}

interface TestLead {
  id: string
  name: string | null
  email: string | null
  phone: string | null
  form_type: string | null
}

interface TestResult {
  step: string
  ok: boolean
  error?: string
}

interface LeadActivityRow {
  lead: { id: string; name: string | null; email: string | null }
  steps: Array<{
    step: string
    status: string
    scheduled_at: string
    sent_at: string | null
    events: Array<{ step: string; event_type: string; created_at: string }>
  }>
  converted: boolean
  convertedAt: string | null
}

interface StepStats {
  sent: number
  opens: number
  clicks: number
}

interface LeadChip {
  id: string
  name: string | null
  scheduledAt: string
}

interface StepLeadGroups {
  clicked: LeadChip[]
  opened: LeadChip[]
  sent: LeadChip[]
  pending: LeadChip[]
}

function IconZap({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  )
}
function IconBell({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  )
}
function IconTag({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
      <circle cx="7" cy="7" r="1" fill="currentColor" />
    </svg>
  )
}
function IconXCircle({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="15" y1="9" x2="9" y2="15" />
      <line x1="9" y1="9" x2="15" y2="15" />
    </svg>
  )
}

const STEP_ICONS = {
  initial_contact: IconZap,
  day1_followup: IconBell,
  discount_offer: IconTag,
  mark_lost: IconXCircle,
} as const

const STEPS = [
  {
    key: 'initial_contact',
    label: 'Instant Contact',
    wait: 'Immediately',
    accentBar: 'bg-brand-500',
    iconBg: 'bg-brand-600/20 text-brand-400',
    channels: ['Email', 'SMS'],
    description: 'Send a direct link to your quote form the moment the lead arrives.',
  },
  {
    key: 'day1_followup',
    label: 'Day 1 Follow-up',
    wait: 'Wait 24h',
    accentBar: 'bg-sky-500',
    iconBg: 'bg-sky-500/20 text-sky-400',
    channels: ['Email', 'SMS'],
    description: "Friendly reminder if they haven't submitted a quote yet.",
  },
  {
    key: 'discount_offer',
    label: 'Discount Offer',
    wait: 'Wait 24h',
    accentBar: 'bg-brand-600',
    iconBg: 'bg-brand-600/20 text-brand-400',
    channels: ['Email', 'SMS'],
    description: 'Sweeten the deal with an exclusive discount to win them over.',
    hasDiscount: true,
  },
  {
    key: 'mark_lost',
    label: 'Mark as Lost',
    wait: 'Wait 24h',
    accentBar: 'bg-white/10',
    iconBg: 'bg-white/10 text-white/30',
    channels: [] as string[],
    description: 'No engagement after 72h — lead is automatically marked as lost.',
  },
]

const STEP_LABELS: Record<string, string> = {
  initial_contact: 'Instant Contact',
  day1_followup: 'Day 1 Follow-up',
  discount_offer: 'Discount Offer',
  mark_lost: 'Mark as Lost',
}

function initials(name: string | null | undefined): string {
  if (!name) return '?'
  const parts = name.trim().split(' ')
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  return name[0].toUpperCase()
}

function formatScheduled(dateStr: string): string {
  const d = new Date(dateStr)
  const now = new Date()
  const diffMs = d.getTime() - now.getTime()
  if (diffMs > 0) {
    const h = Math.round(diffMs / 3600000)
    if (h < 1) return 'soon'
    if (h < 24) return `in ${h}h`
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }
  const h = Math.round(-diffMs / 3600000)
  if (h < 24) return `${h}h ago`
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function buildStepLeadGroups(leadActivity: LeadActivityRow[]): Record<string, StepLeadGroups> {
  const result: Record<string, StepLeadGroups> = {}
  for (const row of leadActivity) {
    for (const s of row.steps) {
      if (!result[s.step]) result[s.step] = { clicked: [], opened: [], sent: [], pending: [] }
      const chip: LeadChip = { id: row.lead.id, name: row.lead.name, scheduledAt: s.scheduled_at }
      const hasClick = s.events.some(e => e.event_type === 'link_click')
      const hasOpen = s.events.some(e => e.event_type === 'email_open')
      if (s.status === 'pending') result[s.step].pending.push(chip)
      else if (hasClick) result[s.step].clicked.push(chip)
      else if (hasOpen) result[s.step].opened.push(chip)
      else result[s.step].sent.push(chip)
    }
  }
  return result
}

function Chip({
  chip,
  chipBg,
  chipBorder,
  chipText,
  avatarBg,
  timingColor,
}: {
  chip: LeadChip
  chipBg: string
  chipBorder: string
  chipText: string
  avatarBg: string
  timingColor: string
}) {
  return (
    <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full border text-xs font-medium ${chipBg} ${chipBorder}`}>
      <div className={`w-4 h-4 rounded-full ${avatarBg} text-white flex items-center justify-center text-[8px] font-bold shrink-0`}>
        {initials(chip.name)}
      </div>
      <span className={`max-w-[64px] truncate ${chipText}`}>{chip.name?.split(' ')[0] || 'Lead'}</span>
      <span className={`shrink-0 text-[9px] font-normal ${timingColor}`}>{formatScheduled(chip.scheduledAt)}</span>
    </div>
  )
}

function ChipGroup({
  label,
  leads,
  dot,
  chipBg,
  chipBorder,
  chipText,
  avatarBg,
  timingColor,
}: {
  label: string
  leads: LeadChip[]
  dot: string
  chipBg: string
  chipBorder: string
  chipText: string
  avatarBg: string
  timingColor: string
}) {
  if (!leads.length) return null
  const visible = leads.slice(0, 5)
  const overflow = leads.length - 5
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-1.5">
        <div className={`w-1.5 h-1.5 rounded-full ${dot} shrink-0`} />
        <span className="text-[10px] font-semibold uppercase tracking-widest text-white/30">
          {label} · {leads.length}
        </span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {visible.map(c => (
          <Chip key={c.id} chip={c} chipBg={chipBg} chipBorder={chipBorder} chipText={chipText} avatarBg={avatarBg} timingColor={timingColor} />
        ))}
        {overflow > 0 && (
          <div className={`flex items-center px-2 py-1 rounded-full border text-xs font-medium ${chipBg} ${chipBorder} ${chipText} opacity-50`}>
            +{overflow}
          </div>
        )}
      </div>
    </div>
  )
}

// Y-split tree section rendered between a step card and the next connector
function BranchSection({ groups }: { groups: StepLeadGroups }) {
  const leftLeads = [...groups.sent, ...groups.pending]
  const rightLeads = [...groups.clicked, ...groups.opened]
  const hasLeft = leftLeads.length > 0
  const hasRight = rightLeads.length > 0
  if (!hasLeft && !hasRight) return null

  return (
    // relative container — absolute lines stretch with its height
    <div className="relative w-full">
      {/* Center stem down from card */}
      <div className="absolute top-0 h-5 left-1/2 w-px bg-brand-500/30 -translate-x-px" />

      {/* Horizontal split bar */}
      <div className="absolute top-5 left-1/4 right-1/4 h-px bg-brand-500/20" />

      {/* Left arm — runs full height, reconnects at bottom */}
      {hasLeft && <div className="absolute top-5 bottom-5 left-1/4 w-px bg-brand-500/20" />}

      {/* Right arm — fixed height, terminates (engaged leads exit here) */}
      {hasRight && <div className="absolute top-5 h-14 right-1/4 w-px bg-brand-500/15" />}

      {/* Bottom reconnect: left arm → center stem for next connector */}
      {hasLeft && (
        <>
          <div className="absolute bottom-5 left-1/4 w-1/4 h-px bg-brand-500/20" />
          <div className="absolute bottom-0 h-5 left-1/2 w-px bg-brand-500/30 -translate-x-px" />
        </>
      )}

      {/* Chip columns */}
      <div className="grid grid-cols-2 pt-8 pb-8">

        {/* Left branch: no response + pending */}
        <div className="flex flex-col gap-4 items-end pr-8 pl-4">
          {hasLeft && (
            <p className="text-[10px] font-semibold uppercase tracking-widest text-white/20 text-right">
              No response
            </p>
          )}
          <ChipGroup
            label="No response"
            leads={groups.sent}
            dot="bg-white/20"
            chipBg="bg-white/[0.04]"
            chipBorder="border-white/10"
            chipText="text-white/40"
            avatarBg="bg-white/20"
            timingColor="text-white/20"
          />
          <ChipGroup
            label="Pending"
            leads={groups.pending}
            dot="bg-sky-400"
            chipBg="bg-sky-500/10"
            chipBorder="border-sky-500/20"
            chipText="text-sky-300"
            avatarBg="bg-sky-600"
            timingColor="text-sky-600/50"
          />
        </div>

        {/* Right branch: clicked + opened */}
        <div className="flex flex-col gap-4 items-start pl-8 pr-4">
          {hasRight && (
            <p className="text-[10px] font-semibold uppercase tracking-widest text-white/20">
              Engaged
            </p>
          )}
          <ChipGroup
            label="Clicked"
            leads={groups.clicked}
            dot="bg-emerald-400"
            chipBg="bg-emerald-500/10"
            chipBorder="border-emerald-500/25"
            chipText="text-emerald-300"
            avatarBg="bg-emerald-600"
            timingColor="text-emerald-600/50"
          />
          <ChipGroup
            label="Opened"
            leads={groups.opened}
            dot="bg-brand-400"
            chipBg="bg-brand-600/10"
            chipBorder="border-brand-500/25"
            chipText="text-brand-300"
            avatarBg="bg-brand-600"
            timingColor="text-brand-500/50"
          />
        </div>
      </div>
    </div>
  )
}

function buildPreviewHtml(params: {
  companyName: string
  accentColor: string
  heroImageUrl: string | null
  step: 'initial_contact' | 'day1_followup' | 'discount_offer'
  discountPercent: number
}): string {
  const { companyName, accentColor, heroImageUrl, step, discountPercent } = params
  const btnStyle = `display:inline-block;background:${accentColor};color:#fff;padding:14px 28px;border-radius:8px;font-size:15px;font-weight:700;text-decoration:none;`
  const heroBlock = heroImageUrl
    ? `<tr><td style="padding:0;"><img src="${heroImageUrl}" alt="" width="520" style="width:100%;max-width:520px;display:block;" /></td></tr>`
    : ''
  const configs = {
    initial_contact: {
      subject: `Hi Alex, get your free estimate from ${companyName}`,
      heading: `We'd love to give you a free quote!`,
      body: `Thanks for reaching out to <strong>${companyName}</strong>! We saw your inquiry and want to make it easy for you to get an instant estimate — no phone calls needed, just answer a few quick questions.`,
      outro: `We'll follow up once you submit. Takes less than 2 minutes!`,
    },
    day1_followup: {
      heading: `Just checking in!`,
      body: `We noticed you haven't had a chance to get your estimate from <strong>${companyName}</strong> yet — no worries, life gets busy! Whenever you're ready, your free estimate is just a click away.`,
      outro: `Questions? Contact ${companyName} directly — we're happy to help.`,
    },
    discount_offer: {
      heading: `Here's an exclusive offer just for you`,
      body: `We really want to earn your business at <strong>${companyName}</strong>. As a thank-you for your interest, we're offering you <strong style="color:${accentColor};">${discountPercent}% off</strong> your first booking. Just mention this email when you reach out and we'll apply it automatically.`,
      outro: `This offer is just for you — grab it before it expires!`,
    },
  }
  const c = configs[step]
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f7f6f3;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f7f6f3;padding:32px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;">
        <tr>
          <td style="background:${accentColor};border-radius:14px 14px 0 0;padding:24px 28px;">
            <div style="font-size:20px;font-weight:800;color:#fff;letter-spacing:-0.01em;">${companyName}</div>
            <div style="font-size:11px;color:rgba(255,255,255,0.5);margin-top:5px;letter-spacing:0.02em;">via <span style="font-family:Georgia,serif;font-weight:700;">Quote<span style="color:#FFE500;">.</span>Box</span></div>
          </td>
        </tr>
        ${heroBlock}
        <tr>
          <td style="background:white;padding:32px 32px 28px;border-radius:0 0 14px 14px;">
            <p style="margin:0 0 8px;font-size:15px;color:#64748b;">Hi Alex,</p>
            <h2 style="margin:0 0 16px;font-size:20px;color:#1e293b;">${c.heading}</h2>
            <p style="margin:0 0 20px;font-size:15px;color:#334155;line-height:1.6;">${c.body}</p>
            <div style="text-align:center;margin:28px 0;">
              <a href="#" style="${btnStyle}">Get My Free Estimate →</a>
            </div>
            <p style="margin:0;font-size:14px;color:#64748b;line-height:1.6;">${c.outro}</p>
          </td>
        </tr>
        <tr>
          <td style="padding:20px 0 8px;text-align:center;">
            <p style="margin:0 0 4px;font-size:12px;color:#94a3b8;">Sent by <strong style="color:#94a3b8;">${companyName}</strong> via <span style="color:#94a3b8;">Quote.Box</span></p>
            <p style="margin:0;font-size:11px;color:#cbd5e1;">This is an automated message — please do not reply to this email.</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body></html>`
}

const COLOR_PRESETS = [
  { label: 'Brand',   value: '#5b50d6' },
  { label: 'Indigo',  value: '#4f46e5' },
  { label: 'Sky',     value: '#0ea5e9' },
  { label: 'Emerald', value: '#10b981' },
  { label: 'Rose',    value: '#f43f5e' },
  { label: 'Slate',   value: '#334155' },
]

export default function AutomationsPage() {
  const [tab, setTab] = useState<'flow' | 'email' | 'settings'>('flow')
  const [config, setConfig] = useState<AutomationConfig>({ is_enabled: true, discount_percent: 10, hero_image_url: null, default_lead_value: null, accent_color: '#5b50d6' })
  const [previewStep, setPreviewStep] = useState<'initial_contact' | 'day1_followup' | 'discount_offer'>('initial_contact')
  const [stats, setStats] = useState<Record<string, StepStats>>({})
  const [leadActivity, setLeadActivity] = useState<LeadActivityRow[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testLeads, setTestLeads] = useState<TestLead[]>([])
  const [testLeadId, setTestLeadId] = useState<string>('')
  const [testSending, setTestSending] = useState(false)
  const [testResults, setTestResults] = useState<TestResult[] | null>(null)

  useEffect(() => {
    async function load() {
      const [cfgRes, actRes, leadsRes, statsRes] = await Promise.all([
        fetch('/api/automations'),
        fetch('/api/automations/lead-activity'),
        fetch('/api/automations/test'),
        fetch('/api/automations/stats'),
      ])
      if (cfgRes.ok) setConfig(await cfgRes.json())
      if (actRes.ok) setLeadActivity(await actRes.json())
      if (statsRes.ok) setStats(await statsRes.json())
      if (leadsRes.ok) {
        const leads = await leadsRes.json()
        setTestLeads(leads)
        if (leads.length > 0) setTestLeadId(leads[0].id)
      }
      setLoading(false)
    }
    load()
  }, [])

  async function sendTest() {
    if (!testLeadId) return
    setTestSending(true)
    setTestResults(null)
    const res = await fetch('/api/automations/test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lead_id: testLeadId }),
    })
    const data = await res.json()
    setTestResults(res.ok ? data.results : [{ step: 'error', ok: false, error: data.error }])
    setTestSending(false)
  }

  async function save(updates: Partial<AutomationConfig>) {
    const next = { ...config, ...updates }
    setConfig(next)
    setSaving(true)
    await fetch('/api/automations', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(next),
    })
    setSaving(false)
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#0D0F1A]">
        <div className="flex items-center gap-2 text-white/30 text-sm">
          <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
          </svg>
          Loading…
        </div>
      </div>
    )
  }

  const stepLeadGroups = buildStepLeadGroups(leadActivity)

  const totalInFunnel = leadActivity.filter(r => r.steps.some(s => s.status === 'pending')).length
  const totalSent = leadActivity.reduce((acc, r) => acc + r.steps.filter(s => s.status === 'sent').length, 0)

  return (
    <div className="flex-1 px-8 py-8 bg-[#0D0F1A]">

      {/* Page header */}
      <div className="flex items-center justify-between mb-8 max-w-screen-xl mx-auto">
        <div>
          <h1 className="text-xl font-semibold text-white tracking-tight">Automations</h1>
          <p className="text-sm text-white/40 mt-0.5">
            {totalInFunnel > 0
              ? `${totalInFunnel} leads in funnel · ${totalSent} sent total`
              : 'Nurture every lead from first touch to close.'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {saving && (
            <span className="text-xs text-white/30 flex items-center gap-1.5">
              <svg className="w-3 h-3 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
              Saving
            </span>
          )}
          <div className="flex items-center gap-2.5 bg-white/5 border border-white/10 rounded-xl px-3.5 py-2">
            <div className={`w-2 h-2 rounded-full ${config.is_enabled ? 'bg-emerald-400' : 'bg-white/20'}`} />
            <span className="text-sm font-medium text-white/80">{config.is_enabled ? 'Live' : 'Paused'}</span>
            <button
              onClick={() => save({ is_enabled: !config.is_enabled })}
              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ml-0.5 ${config.is_enabled ? 'bg-brand-600' : 'bg-white/15'}`}
            >
              <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${config.is_enabled ? 'translate-x-4' : 'translate-x-0.5'}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-screen-xl mx-auto mb-8">
        <div className="inline-flex items-center gap-0.5 bg-white/5 border border-white/10 rounded-xl p-1">
          {(['flow', 'email', 'settings'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-5 py-1.5 rounded-lg text-sm font-medium transition-all ${
                tab === t ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/70'
              }`}
            >
              {t === 'flow' ? 'Flow' : t === 'email' ? 'Email' : 'Settings'}
            </button>
          ))}
        </div>
      </div>

      {!config.is_enabled && (
        <div className="max-w-screen-xl mx-auto mb-8 rounded-xl bg-amber-500/10 border border-amber-500/20 px-4 py-3 text-sm text-amber-400 flex items-center gap-2">
          <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          Automations are paused — new leads will not receive automated messages.
        </div>
      )}

      {/* ── FLOW TAB ── */}
      {tab === 'flow' && (
        <div className="flex flex-col items-center w-full">

          {/* Trigger */}
          <div className="w-[380px]">
            <div className="bg-gradient-to-br from-brand-500 to-brand-600 rounded-2xl p-5 shadow-lg shadow-brand-600/25">
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                  <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-brand-100 leading-none mb-1">Trigger</p>
                  <p className="font-semibold text-white text-sm leading-tight">Any New Lead</p>
                  <p className="text-xs text-brand-200 mt-0.5">Meta or hosted form</p>
                </div>
              </div>
            </div>
          </div>

          {STEPS.map((step) => {
            const s: StepStats = stats[step.key] ?? { sent: 0, opens: 0, clicks: 0 }
            const pct = (n: number) => s.sent > 0 ? Math.round((n / s.sent) * 100) : 0
            const hasFunnel = s.sent > 0
            const Icon = STEP_ICONS[step.key as keyof typeof STEP_ICONS]
            const groups = stepLeadGroups[step.key] ?? { clicked: [], opened: [], sent: [], pending: [] }
            const hasBranch = step.channels.length > 0 &&
              (groups.clicked.length + groups.opened.length + groups.sent.length + groups.pending.length > 0)

            return (
              <Fragment key={step.key}>

                {/* Wait connector — centered */}
                <div className="flex flex-col items-center py-3">
                  <div className="w-px h-8 bg-gradient-to-b from-white/0 to-brand-500/30" />
                  <span className="text-[9px] font-semibold uppercase tracking-widest text-brand-400 bg-brand-600/10 border border-brand-500/25 rounded-full px-3 py-1 my-1.5">
                    {step.wait}
                  </span>
                  <div className="w-px h-6 bg-gradient-to-b from-brand-500/30 to-white/0" />
                  <svg className="w-2 h-2 text-brand-500/40" viewBox="0 0 8 8" fill="currentColor">
                    <path d="M4 8L0 2h8z" />
                  </svg>
                </div>

                {/* Step card — fixed width centered */}
                <div className="w-[380px]">
                  <div
                    className={`rounded-2xl border border-white/[0.08] overflow-hidden transition-opacity ${!config.is_enabled ? 'opacity-40' : ''}`}
                    style={{ background: '#161929', boxShadow: '0 4px 32px rgba(0,0,0,0.4)' }}
                  >
                    <div className={`h-[3px] ${step.accentBar}`} />
                    <div className="p-5">
                      <div className="flex items-start gap-3.5">
                        <div className={`w-9 h-9 rounded-xl ${step.iconBg} flex items-center justify-center shrink-0`}>
                          <Icon className="w-[18px] h-[18px]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-white text-sm leading-tight mb-1">{step.label}</p>
                          <p className="text-xs text-white/40 leading-relaxed">
                            {step.hasDiscount
                              ? step.description.replace('exclusive discount', `${config.discount_percent}% discount`)
                              : step.description}
                          </p>
                          {step.channels.length > 0 && (
                            <div className="flex gap-1.5 mt-3">
                              {step.channels.map((ch, i) => (
                                <span key={ch} className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${i === 0 ? 'border-brand-500/40 text-brand-300 bg-brand-600/10' : 'border-white/15 text-white/40'}`}>
                                  {ch}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      {hasFunnel && step.channels.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-white/[0.06]">
                          <div className="space-y-2.5">
                            {[
                              { label: 'SENT',    value: s.sent,   bar: 100,          barClass: 'bg-white/25'  },
                              { label: 'OPENED',  value: s.opens,  bar: pct(s.opens), barClass: 'bg-brand-500' },
                              { label: 'CLICKED', value: s.clicks, bar: pct(s.clicks),barClass: 'bg-brand-400' },
                            ].map((row) => (
                              <div key={row.label} className="flex items-center gap-2.5">
                                <span className="text-[10px] font-semibold uppercase tracking-wider text-white/25 w-12 text-right shrink-0">{row.label}</span>
                                <div className="flex-1 bg-white/[0.07] rounded-full h-1.5 overflow-hidden">
                                  <div className={`h-full rounded-full ${row.barClass} transition-all duration-700`} style={{ width: `${row.bar}%` }} />
                                </div>
                                <span className="text-xs text-white/70 w-6 text-right shrink-0 tabular-nums font-semibold">{row.value}</span>
                                <span className="text-[10px] text-white/25 w-7 shrink-0 tabular-nums">{row.bar < 100 ? `${row.bar}%` : ''}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {!hasFunnel && step.channels.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-white/[0.06]">
                          <p className="text-[11px] text-white/20">No sends yet</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Inverted tree branch — splits left (no response) and right (engaged) */}
                {hasBranch && <BranchSection groups={groups} />}

              </Fragment>
            )
          })}

          {/* Exit note */}
          <div className="mt-8 mb-8">
            <div className="flex items-center gap-2 bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-2.5 text-xs text-white/40">
              <svg className="w-3.5 h-3.5 text-emerald-400 shrink-0" fill="none" viewBox="0 0 16 16" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l4 4 6-6" />
              </svg>
              Lead submits form → sequence stops automatically
            </div>
          </div>

        </div>
      )}

      {/* ── EMAIL DESIGNER TAB ── */}
      {tab === 'email' && (
        <div className="max-w-screen-xl mx-auto flex gap-8 items-start">

          {/* Controls */}
          <div className="w-72 shrink-0 space-y-5">

            {/* Step selector */}
            <div className="rounded-2xl border border-white/[0.08] p-5" style={{ background: '#161929' }}>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-white/30 mb-3">Preview step</p>
              <div className="flex flex-col gap-1.5">
                {([
                  { key: 'initial_contact', label: 'Instant Contact' },
                  { key: 'day1_followup',   label: 'Day 1 Follow-up' },
                  { key: 'discount_offer',  label: 'Discount Offer'  },
                ] as const).map(s => (
                  <button
                    key={s.key}
                    onClick={() => setPreviewStep(s.key)}
                    className={`text-left px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                      previewStep === s.key
                        ? 'bg-brand-600/20 text-brand-300 border border-brand-500/30'
                        : 'text-white/40 hover:text-white/70 hover:bg-white/5 border border-transparent'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Accent color */}
            <div className="rounded-2xl border border-white/[0.08] p-5" style={{ background: '#161929' }}>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-white/30 mb-3">Accent color</p>
              <div className="flex flex-wrap gap-2 mb-3">
                {COLOR_PRESETS.map(p => (
                  <button
                    key={p.value}
                    title={p.label}
                    onClick={() => save({ accent_color: p.value })}
                    className="w-7 h-7 rounded-full border-2 transition-all"
                    style={{
                      background: p.value,
                      borderColor: config.accent_color === p.value ? '#fff' : 'transparent',
                      boxShadow: config.accent_color === p.value ? `0 0 0 1px ${p.value}` : 'none',
                    }}
                  />
                ))}
              </div>
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg shrink-0 border border-white/10" style={{ background: config.accent_color || '#5b50d6' }} />
                <input
                  type="text"
                  maxLength={7}
                  value={config.accent_color || '#5b50d6'}
                  onChange={e => setConfig(c => ({ ...c, accent_color: e.target.value }))}
                  onBlur={() => {
                    const v = config.accent_color || ''
                    if (/^#[0-9a-fA-F]{6}$/.test(v)) save({ accent_color: v })
                  }}
                  className="flex-1 bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5 text-sm text-white font-mono focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
                <input
                  type="color"
                  value={config.accent_color || '#5b50d6'}
                  onChange={e => setConfig(c => ({ ...c, accent_color: e.target.value }))}
                  onBlur={() => save({ accent_color: config.accent_color })}
                  className="w-7 h-7 rounded-lg border border-white/10 bg-transparent cursor-pointer p-0 overflow-hidden"
                  style={{ appearance: 'none' }}
                />
              </div>
            </div>

            {/* Header image */}
            <div className="rounded-2xl border border-white/[0.08] p-5" style={{ background: '#161929' }}>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-white/30 mb-3">Header image</p>
              {config.hero_image_url && (
                <div className="relative mb-3 rounded-lg overflow-hidden border border-white/10">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={config.hero_image_url} alt="" className="w-full h-20 object-cover" />
                  <button
                    onClick={() => save({ hero_image_url: null })}
                    className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-black/60 text-white/80 flex items-center justify-center text-[10px] hover:bg-black/80 transition-colors"
                  >
                    ✕
                  </button>
                </div>
              )}
              <input
                type="url"
                placeholder="https://..."
                value={config.hero_image_url || ''}
                onChange={e => setConfig(c => ({ ...c, hero_image_url: e.target.value || null }))}
                onBlur={() => save({ hero_image_url: config.hero_image_url })}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-brand-500 placeholder-white/20"
              />
              <p className="text-[11px] text-white/25 mt-2">Paste a public image URL. Shown below the header in the email.</p>
            </div>

          </div>

          {/* Live preview */}
          <div className="flex-1 min-w-0">
            <div className="rounded-2xl border border-white/[0.08] overflow-hidden" style={{ background: '#161929' }}>
              <div className="flex items-center gap-2 px-4 py-3 border-b border-white/[0.06]">
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-white/10" />
                  <div className="w-2.5 h-2.5 rounded-full bg-white/10" />
                  <div className="w-2.5 h-2.5 rounded-full bg-white/10" />
                </div>
                <span className="text-[11px] text-white/30 ml-1">Email preview</span>
              </div>
              <iframe
                srcDoc={buildPreviewHtml({
                  companyName: config.business_name || 'Your Company',
                  accentColor: (/^#[0-9a-fA-F]{6}$/.test(config.accent_color || '') ? config.accent_color : '#5b50d6') as string,
                  heroImageUrl: config.hero_image_url,
                  step: previewStep,
                  discountPercent: config.discount_percent,
                })}
                className="w-full border-0"
                style={{ height: '600px' }}
                title="Email preview"
                sandbox="allow-same-origin"
              />
            </div>
          </div>

        </div>
      )}

      {/* ── SETTINGS TAB ── */}
      {tab === 'settings' && (
        <div className="max-w-lg mx-auto space-y-5">

          <div className="rounded-2xl border border-white/[0.08] p-6" style={{ background: '#161929' }}>
            <h2 className="text-sm font-semibold text-white/80 mb-1">Discount Offer</h2>
            <p className="text-xs text-white/40 mb-4">Applied in the Step 3 email to win back hesitant leads.</p>
            <div className="flex items-center gap-3">
              <input
                type="number" min={1} max={100}
                value={config.discount_percent}
                onChange={(e) => setConfig({ ...config, discount_percent: Number(e.target.value) })}
                onBlur={() => save({ discount_percent: config.discount_percent })}
                className="w-20 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-center font-semibold text-white focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
              />
              <span className="text-sm text-white/40 font-medium">% off</span>
            </div>
          </div>

          <div className="rounded-2xl border border-white/[0.08] p-6" style={{ background: '#161929' }}>
            <h2 className="text-sm font-semibold text-white/80 mb-1">Send Test</h2>
            <p className="text-xs text-white/40 mb-4">Fire all automation steps immediately to a real lead.</p>
            {testLeads.length === 0 ? (
              <p className="text-sm text-white/25">No leads with email addresses yet.</p>
            ) : (
              <div className="space-y-3">
                <select
                  value={testLeadId}
                  onChange={(e) => { setTestLeadId(e.target.value); setTestResults(null) }}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  {testLeads.map((l) => (
                    <option key={l.id} value={l.id}>{l.name || 'Unnamed'} — {l.email}</option>
                  ))}
                </select>
                <button
                  onClick={sendTest}
                  disabled={testSending}
                  className="w-full px-4 py-2.5 bg-brand-600 text-white text-sm font-semibold rounded-xl hover:bg-brand-500 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
                >
                  {testSending ? (
                    <>
                      <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                      </svg>
                      Sending…
                    </>
                  ) : 'Send All Steps Now'}
                </button>
                {testResults && (
                  <div className="space-y-2 pt-1">
                    {testResults.map((r) => (
                      <div key={r.step} className="flex items-center gap-2.5 text-sm">
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-[11px] font-bold ${r.ok ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                          {r.ok ? '✓' : '✕'}
                        </div>
                        <span className={r.ok ? 'text-white/60' : 'text-red-400'}>
                          {STEP_LABELS[r.step] ?? r.step}{!r.ok && r.error ? ` — ${r.error}` : ''}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-white/[0.08] p-6" style={{ background: '#161929' }}>
            <h2 className="text-sm font-semibold text-white/80 mb-4">How it works</h2>
            <ol className="space-y-3">
              {[
                ['Triggered automatically', 'Every new Meta lead or hosted form submission starts the sequence.'],
                ['Stops on conversion', 'The moment a lead submits your quote form, the sequence stops.'],
                ['SMS requires Twilio', 'Set TWILIO_* env vars to enable SMS alongside emails.'],
              ].map(([title, desc], i) => (
                <li key={i} className="flex gap-3">
                  <span className="w-5 h-5 rounded-full bg-brand-600/20 text-brand-400 flex items-center justify-center text-[11px] font-bold shrink-0 mt-0.5">{i + 1}</span>
                  <div>
                    <p className="text-sm font-medium text-white/70">{title}</p>
                    <p className="text-xs text-white/35 mt-0.5">{desc}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>

        </div>
      )}

    </div>
  )
}
