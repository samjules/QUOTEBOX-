'use client'

import { useEffect, useState } from 'react'

interface AutomationConfig {
  is_enabled: boolean
  discount_percent: number
  hero_image_url: string | null
  default_lead_value: number | null
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

      if (s.status === 'pending') {
        result[s.step].pending.push(chip)
      } else if (hasClick) {
        result[s.step].clicked.push(chip)
      } else if (hasOpen) {
        result[s.step].opened.push(chip)
      } else {
        result[s.step].sent.push(chip)
      }
    }
  }

  return result
}

function LeadGroupSection({
  label,
  leads,
  dotColor,
  chipBg,
  chipBorder,
  chipText,
  avatarBg,
  timingColor,
}: {
  label: string
  leads: LeadChip[]
  dotColor: string
  chipBg: string
  chipBorder: string
  chipText: string
  avatarBg: string
  timingColor: string
}) {
  if (leads.length === 0) return null
  const visible = leads.slice(0, 6)
  const overflow = leads.length - 6
  return (
    <div>
      <div className="flex items-center gap-1.5 mb-1.5">
        <div className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
        <span className="text-[10px] font-semibold uppercase tracking-widest text-white/30">
          {label} · {leads.length}
        </span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {visible.map((chip) => (
          <div
            key={chip.id}
            className={`flex items-center gap-1.5 px-2 py-1 rounded-full border text-xs font-medium ${chipBg} ${chipBorder}`}
          >
            <div className={`w-4 h-4 rounded-full ${avatarBg} text-white flex items-center justify-center text-[8px] font-bold shrink-0`}>
              {initials(chip.name)}
            </div>
            <span className={`max-w-[60px] truncate ${chipText}`}>
              {chip.name?.split(' ')[0] || 'Lead'}
            </span>
            <span className={`shrink-0 text-[9px] font-normal ${timingColor}`}>
              {formatScheduled(chip.scheduledAt)}
            </span>
          </div>
        ))}
        {overflow > 0 && (
          <div className={`flex items-center px-2 py-1 rounded-full border text-xs font-medium ${chipBg} ${chipBorder} ${chipText} opacity-60`}>
            +{overflow}
          </div>
        )}
      </div>
    </div>
  )
}

export default function AutomationsPage() {
  const [tab, setTab] = useState<'flow' | 'settings'>('flow')
  const [config, setConfig] = useState<AutomationConfig>({ is_enabled: true, discount_percent: 10, hero_image_url: null, default_lead_value: null })
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
      <div className="flex items-center justify-center h-full bg-[#0D0F1A]">
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

  const totalInFunnel = leadActivity.filter(r =>
    r.steps.some(s => s.status === 'pending')
  ).length
  const totalSent = leadActivity.reduce((acc, r) =>
    acc + r.steps.filter(s => s.status === 'sent').length, 0
  )

  return (
    <div className="min-h-full px-8 py-8 bg-[#0D0F1A]">

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
          {(['flow', 'settings'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-5 py-1.5 rounded-lg text-sm font-medium transition-all ${
                tab === t ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/70'
              }`}
            >
              {t === 'flow' ? 'Flow' : 'Settings'}
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
        <div className="flex flex-col">

          {/* Trigger */}
          <div className="grid grid-cols-[1fr_380px_1fr]">
            <div />
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
            <div />
          </div>

          {/* Steps */}
          {STEPS.map((step) => {
            const s: StepStats = stats[step.key] ?? { sent: 0, opens: 0, clicks: 0 }
            const pct = (n: number) => s.sent > 0 ? Math.round((n / s.sent) * 100) : 0
            const hasFunnel = s.sent > 0
            const Icon = STEP_ICONS[step.key as keyof typeof STEP_ICONS]
            const groups = stepLeadGroups[step.key] ?? { clicked: [], opened: [], sent: [], pending: [] }
            const hasAnyLeads = groups.clicked.length + groups.opened.length + groups.sent.length + groups.pending.length > 0

            return (
              <div key={step.key}>

                {/* Connector */}
                <div className="grid grid-cols-[1fr_380px_1fr]">
                  <div />
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
                  <div />
                </div>

                {/* Node + lead groups */}
                <div className="grid grid-cols-[1fr_380px_1fr] items-start">
                  <div />

                  {/* Card */}
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
                                <span
                                  key={ch}
                                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                                    i === 0
                                      ? 'border-brand-500/40 text-brand-300 bg-brand-600/10'
                                      : 'border-white/15 text-white/40'
                                  }`}
                                >
                                  {ch}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Funnel bars */}
                      {hasFunnel && step.channels.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-white/[0.06]">
                          <div className="space-y-2.5">
                            {[
                              { label: 'SENT', value: s.sent, bar: 100, barClass: 'bg-white/25' },
                              { label: 'OPENED', value: s.opens, bar: pct(s.opens), barClass: 'bg-brand-500' },
                              { label: 'CLICKED', value: s.clicks, bar: pct(s.clicks), barClass: 'bg-brand-400' },
                            ].map((row) => (
                              <div key={row.label} className="flex items-center gap-2.5">
                                <span className="text-[10px] font-semibold uppercase tracking-wider text-white/25 w-12 text-right shrink-0">{row.label}</span>
                                <div className="flex-1 bg-white/[0.07] rounded-full h-1.5 overflow-hidden">
                                  <div
                                    className={`h-full rounded-full ${row.barClass} transition-all duration-700`}
                                    style={{ width: `${row.bar}%` }}
                                  />
                                </div>
                                <span className="text-xs text-white/70 w-6 text-right shrink-0 tabular-nums font-semibold">{row.value}</span>
                                <span className="text-[10px] text-white/25 w-7 shrink-0 tabular-nums">
                                  {row.bar < 100 ? `${row.bar}%` : ''}
                                </span>
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

                  {/* Lead groups — split by engagement */}
                  {hasAnyLeads && (
                    <div className="pl-8 pt-2 space-y-4">
                      <LeadGroupSection
                        label="Clicked"
                        leads={groups.clicked}
                        dotColor="bg-emerald-400"
                        chipBg="bg-emerald-500/10"
                        chipBorder="border-emerald-500/25"
                        chipText="text-emerald-300"
                        avatarBg="bg-emerald-600"
                        timingColor="text-emerald-600/60"
                      />
                      <LeadGroupSection
                        label="Opened"
                        leads={groups.opened}
                        dotColor="bg-brand-400"
                        chipBg="bg-brand-600/10"
                        chipBorder="border-brand-500/25"
                        chipText="text-brand-300"
                        avatarBg="bg-brand-600"
                        timingColor="text-brand-500/60"
                      />
                      <LeadGroupSection
                        label="No response"
                        leads={groups.sent}
                        dotColor="bg-white/20"
                        chipBg="bg-white/[0.04]"
                        chipBorder="border-white/10"
                        chipText="text-white/40"
                        avatarBg="bg-white/20"
                        timingColor="text-white/25"
                      />
                      <LeadGroupSection
                        label="Pending"
                        leads={groups.pending}
                        dotColor="bg-sky-400"
                        chipBg="bg-sky-500/10"
                        chipBorder="border-sky-500/20"
                        chipText="text-sky-300"
                        avatarBg="bg-sky-600"
                        timingColor="text-sky-600/60"
                      />
                    </div>
                  )}
                </div>

              </div>
            )
          })}

          {/* Exit note */}
          <div className="grid grid-cols-[1fr_380px_1fr] mt-8">
            <div />
            <div className="flex justify-center">
              <div className="flex items-center gap-2 bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-2.5 text-xs text-white/40">
                <svg className="w-3.5 h-3.5 text-emerald-400 shrink-0" fill="none" viewBox="0 0 16 16" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l4 4 6-6" />
                </svg>
                Lead submits form → sequence stops automatically
              </div>
            </div>
            <div />
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
                type="number"
                min={1}
                max={100}
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
                    <option key={l.id} value={l.id}>
                      {l.name || 'Unnamed'} — {l.email}
                    </option>
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
                          {STEP_LABELS[r.step] ?? r.step}
                          {!r.ok && r.error ? ` — ${r.error}` : ''}
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
                  <span className="w-5 h-5 rounded-full bg-brand-600/20 text-brand-400 flex items-center justify-center text-[11px] font-bold shrink-0 mt-0.5">
                    {i + 1}
                  </span>
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
