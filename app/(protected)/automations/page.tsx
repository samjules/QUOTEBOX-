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

interface ActivityStep {
  id: string
  step: string
  status: string
  scheduled_at: string
  sent_at: string | null
  lead_id: string
  leads: { name: string | null; email: string | null; phone: string | null } | null
}

interface StepStats {
  sent: number
  opens: number
  clicks: number
}

const STEPS = [
  {
    key: 'initial_contact',
    label: 'Instant Contact',
    wait: 'Immediately',
    icon: '⚡',
    accent: 'bg-violet-400',
    iconBg: 'bg-violet-50 text-violet-500',
    pill: 'bg-violet-50 text-violet-500 border border-violet-100',
    avatarBg: 'bg-violet-400',
    chipRing: 'border-violet-200 bg-violet-50',
    chipText: 'text-violet-700',
    barOpen: 'bg-violet-300',
    barClick: 'bg-violet-500',
    channels: ['Email', 'SMS'],
    description: 'Send a direct link to your quote form the moment the lead arrives.',
  },
  {
    key: 'day1_followup',
    label: 'Day 1 Follow-up',
    wait: 'Wait 24h',
    icon: '🔔',
    accent: 'bg-sky-400',
    iconBg: 'bg-sky-50 text-sky-500',
    pill: 'bg-sky-50 text-sky-500 border border-sky-100',
    avatarBg: 'bg-sky-400',
    chipRing: 'border-sky-200 bg-sky-50',
    chipText: 'text-sky-700',
    barOpen: 'bg-sky-300',
    barClick: 'bg-sky-500',
    channels: ['Email', 'SMS'],
    description: "Friendly reminder if they haven't submitted a quote yet.",
  },
  {
    key: 'discount_offer',
    label: 'Discount Offer',
    wait: 'Wait 24h',
    icon: '🎁',
    accent: 'bg-amber-400',
    iconBg: 'bg-amber-50 text-amber-500',
    pill: 'bg-amber-50 text-amber-500 border border-amber-100',
    avatarBg: 'bg-amber-400',
    chipRing: 'border-amber-200 bg-amber-50',
    chipText: 'text-amber-700',
    barOpen: 'bg-amber-300',
    barClick: 'bg-amber-500',
    channels: ['Email', 'SMS'],
    description: 'Sweeten the deal with an exclusive discount to win them over.',
    hasDiscount: true,
  },
  {
    key: 'mark_lost',
    label: 'Mark as Lost',
    wait: 'Wait 24h',
    icon: '🚫',
    accent: 'bg-gray-200',
    iconBg: 'bg-gray-50 text-gray-400',
    pill: 'bg-gray-50 text-gray-400 border border-gray-100',
    avatarBg: 'bg-gray-300',
    chipRing: 'border-gray-200 bg-gray-50',
    chipText: 'text-gray-500',
    barOpen: 'bg-gray-200',
    barClick: 'bg-gray-300',
    channels: [],
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

export default function AutomationsPage() {
  const [tab, setTab] = useState<'flow' | 'settings'>('flow')
  const [config, setConfig] = useState<AutomationConfig>({ is_enabled: true, discount_percent: 10, hero_image_url: null, default_lead_value: null })
  const [activity, setActivity] = useState<ActivityStep[]>([])
  const [stats, setStats] = useState<Record<string, StepStats>>({})
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
        fetch('/api/automations/activity'),
        fetch('/api/automations/test'),
        fetch('/api/automations/stats'),
      ])
      if (cfgRes.ok) setConfig(await cfgRes.json())
      if (actRes.ok) setActivity(await actRes.json())
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
      <div className="flex items-center justify-center h-full">
        <div className="flex items-center gap-2 text-gray-300 text-sm">
          <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
          </svg>
          Loading…
        </div>
      </div>
    )
  }

  // Each lead appears only at their next upcoming step (earliest pending scheduled_at)
  const currentStepByLead: Record<string, ActivityStep> = {}
  for (const row of activity) {
    if (row.status !== 'pending') continue
    const existing = currentStepByLead[row.lead_id]
    if (!existing || new Date(row.scheduled_at) < new Date(existing.scheduled_at)) {
      currentStepByLead[row.lead_id] = row
    }
  }
  const leadsByStep = Object.values(currentStepByLead).reduce((acc, row) => {
    if (!acc[row.step]) acc[row.step] = []
    acc[row.step].push(row)
    return acc
  }, {} as Record<string, ActivityStep[]>)

  const totalInFunnel = Object.keys(currentStepByLead).length
  const totalSent = activity.filter(a => a.status === 'sent').length

  return (
    <div className="min-h-full px-8 py-8">

      {/* Page header */}
      <div className="flex items-center justify-between mb-8 max-w-screen-xl mx-auto">
        <div>
          <h1 className="text-xl font-semibold text-gray-900 tracking-tight">Automations</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {totalInFunnel > 0
              ? `${totalInFunnel} leads in funnel · ${totalSent} sent total`
              : 'Nurture every lead from first touch to close.'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {saving && (
            <span className="text-xs text-gray-400 flex items-center gap-1.5">
              <svg className="w-3 h-3 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
              Saving
            </span>
          )}
          <div className="flex items-center gap-2.5 bg-white border border-gray-200 rounded-xl px-3.5 py-2 shadow-sm">
            <div className={`w-2 h-2 rounded-full ${config.is_enabled ? 'bg-emerald-400' : 'bg-gray-300'}`} />
            <span className="text-sm font-medium text-gray-700">{config.is_enabled ? 'Live' : 'Paused'}</span>
            <button
              onClick={() => save({ is_enabled: !config.is_enabled })}
              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ml-0.5 ${config.is_enabled ? 'bg-brand-600' : 'bg-gray-200'}`}
            >
              <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${config.is_enabled ? 'translate-x-4' : 'translate-x-0.5'}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-screen-xl mx-auto mb-8">
        <div className="inline-flex items-center gap-0.5 bg-gray-100 rounded-xl p-1">
          {(['flow', 'settings'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-5 py-1.5 rounded-lg text-sm font-medium transition-all ${
                tab === t
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              {t === 'flow' ? 'Flow' : 'Settings'}
            </button>
          ))}
        </div>
      </div>

      {!config.is_enabled && (
        <div className="max-w-screen-xl mx-auto mb-8 rounded-xl bg-amber-50 border border-amber-100 px-4 py-3 text-sm text-amber-600 flex items-center gap-2">
          <svg className="w-4 h-4 text-amber-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          Automations are paused — new leads will not receive automated messages.
        </div>
      )}

      {/* ── FLOW TAB ── */}
      {tab === 'flow' && (
        <div className="flex flex-col">

          {/* Trigger — centered via symmetric grid */}
          <div className="grid grid-cols-[1fr_380px_1fr]">
            <div />
            <div className="bg-gradient-to-br from-brand-500 to-brand-600 rounded-2xl p-5 shadow-md shadow-brand-500/15">
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-xl shrink-0">🎯</div>
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
            const pending = leadsByStep[step.key] || []
            const s: StepStats = stats[step.key] ?? { sent: 0, opens: 0, clicks: 0 }
            const pct = (n: number) => s.sent > 0 ? Math.round((n / s.sent) * 100) : 0
            const hasFunnel = s.sent > 0

            return (
              <div key={step.key}>

                {/* Connector — stays in center column */}
                <div className="grid grid-cols-[1fr_380px_1fr]">
                  <div />
                  <div className="flex flex-col items-center py-3">
                    <div className="w-px h-8 bg-gray-200" />
                    <span className="text-[11px] text-gray-400 bg-white border border-gray-200 rounded-full px-3 py-1 my-1.5 font-medium shadow-sm">
                      {step.wait}
                    </span>
                    <div className="w-px h-6 bg-gray-200" />
                    <svg className="w-2 h-2 text-gray-300" viewBox="0 0 8 8" fill="currentColor">
                      <path d="M4 8L0 2h8z" />
                    </svg>
                  </div>
                  <div />
                </div>

                {/* Node (center) + lead chips (right) */}
                <div className="grid grid-cols-[1fr_380px_1fr] items-start">
                  <div />

                  {/* Node card */}
                  <div className={`bg-white rounded-2xl border border-gray-100 overflow-hidden transition-opacity ${!config.is_enabled ? 'opacity-50' : ''}`}
                    style={{ boxShadow: '0 2px 16px rgba(0,0,0,0.05)' }}>
                    <div className={`h-[3px] ${step.accent}`} />
                    <div className="p-5">
                      <div className="flex items-start gap-3.5">
                        <div className={`w-10 h-10 rounded-xl ${step.iconBg} flex items-center justify-center text-xl shrink-0`}>
                          {step.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-900 text-sm leading-tight mb-1">{step.label}</p>
                          <p className="text-xs text-gray-400 leading-relaxed">
                            {step.hasDiscount
                              ? step.description.replace('exclusive discount', `${config.discount_percent}% discount`)
                              : step.description}
                          </p>
                          {step.channels.length > 0 && (
                            <div className="flex gap-1.5 mt-3">
                              {step.channels.map((ch) => (
                                <span key={ch} className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${step.pill}`}>
                                  {ch}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Funnel bars */}
                      {hasFunnel && step.channels.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-gray-50">
                          <div className="space-y-2.5">
                            {[
                              { label: 'Sent', value: s.sent, bar: 100, color: 'bg-gray-200' },
                              { label: 'Opened', value: s.opens, bar: pct(s.opens), color: step.barOpen },
                              { label: 'Clicked', value: s.clicks, bar: pct(s.clicks), color: step.barClick },
                            ].map((row) => (
                              <div key={row.label} className="flex items-center gap-2.5">
                                <span className="text-[10px] text-gray-300 w-10 text-right shrink-0 tabular-nums">{row.label}</span>
                                <div className="flex-1 bg-gray-100 rounded-full h-1.5 overflow-hidden">
                                  <div
                                    className={`h-full rounded-full ${row.color} transition-all duration-700`}
                                    style={{ width: `${row.bar}%` }}
                                  />
                                </div>
                                <span className="text-[11px] text-gray-500 w-6 text-right shrink-0 tabular-nums font-medium">{row.value}</span>
                                <span className="text-[10px] text-gray-300 w-7 shrink-0 tabular-nums">
                                  {row.bar < 100 ? `${row.bar}%` : ''}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {!hasFunnel && step.channels.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-gray-50">
                          <p className="text-[11px] text-gray-300">No sends yet</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Lead chips — right column, visually flowing down the funnel */}
                  <div className="pl-8 pt-4 flex flex-wrap gap-2 content-start">
                    {pending.slice(0, 10).map((row) => (
                      <div
                        key={row.id}
                        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border text-xs font-medium ${step.chipRing} ${step.chipText}`}
                      >
                        <div className={`w-5 h-5 rounded-full ${step.avatarBg} text-white flex items-center justify-center text-[9px] font-bold shrink-0`}>
                          {initials(row.leads?.name)}
                        </div>
                        <span className="max-w-[72px] truncate">
                          {row.leads?.name?.split(' ')[0] || 'Lead'}
                        </span>
                        <span className="opacity-40 shrink-0 text-[10px]">
                          {formatScheduled(row.scheduled_at)}
                        </span>
                      </div>
                    ))}
                    {pending.length > 10 && (
                      <div className={`flex items-center px-2.5 py-1.5 rounded-full border text-xs font-medium ${step.chipRing} ${step.chipText} opacity-60`}>
                        +{pending.length - 10}
                      </div>
                    )}
                  </div>
                </div>

              </div>
            )
          })}

          {/* Exit note */}
          <div className="grid grid-cols-[1fr_380px_1fr] mt-6">
            <div />
            <div className="flex justify-center">
              <div className="flex items-center gap-1.5 text-xs text-gray-300">
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

          {/* Discount */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6" style={{ boxShadow: '0 2px 16px rgba(0,0,0,0.04)' }}>
            <h2 className="text-sm font-semibold text-gray-700 mb-1">Discount Offer</h2>
            <p className="text-xs text-gray-400 mb-4">Applied in the Step 3 email to win back hesitant leads.</p>
            <div className="flex items-center gap-3">
              <input
                type="number"
                min={1}
                max={100}
                value={config.discount_percent}
                onChange={(e) => setConfig({ ...config, discount_percent: Number(e.target.value) })}
                onBlur={() => save({ discount_percent: config.discount_percent })}
                className="w-20 border border-gray-200 rounded-xl px-3 py-2 text-sm text-center font-semibold focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent bg-gray-50"
              />
              <span className="text-sm text-gray-400 font-medium">% off</span>
            </div>
          </div>

          {/* Send test */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6" style={{ boxShadow: '0 2px 16px rgba(0,0,0,0.04)' }}>
            <h2 className="text-sm font-semibold text-gray-700 mb-1">Send Test</h2>
            <p className="text-xs text-gray-400 mb-4">Fire all automation steps immediately to a real lead.</p>
            {testLeads.length === 0 ? (
              <p className="text-sm text-gray-300">No leads with email addresses yet.</p>
            ) : (
              <div className="space-y-3">
                <select
                  value={testLeadId}
                  onChange={(e) => { setTestLeadId(e.target.value); setTestResults(null) }}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-gray-50"
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
                  className="w-full px-4 py-2.5 bg-gray-900 text-white text-sm font-semibold rounded-xl hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
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
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-[11px] font-bold ${r.ok ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-500'}`}>
                          {r.ok ? '✓' : '✕'}
                        </div>
                        <span className={r.ok ? 'text-gray-600' : 'text-red-500'}>
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

          {/* How it works */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6" style={{ boxShadow: '0 2px 16px rgba(0,0,0,0.04)' }}>
            <h2 className="text-sm font-semibold text-gray-700 mb-4">How it works</h2>
            <ol className="space-y-3">
              {[
                ['Triggered automatically', 'Every new Meta lead or hosted form submission starts the sequence.'],
                ['Stops on conversion', 'The moment a lead submits your quote form, the sequence stops.'],
                ['SMS requires Twilio', 'Set TWILIO_* env vars to enable SMS alongside emails.'],
              ].map(([title, desc], i) => (
                <li key={i} className="flex gap-3">
                  <span className="w-5 h-5 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center text-[11px] font-bold shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  <div>
                    <p className="text-sm font-medium text-gray-600">{title}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{desc}</p>
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
