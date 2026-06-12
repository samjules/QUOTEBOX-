'use client'

import { useEffect, useState } from 'react'

interface AutomationConfig {
  is_enabled: boolean
  discount_percent: number
  hero_image_url: string | null
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
    accent: 'bg-violet-500',
    iconBg: 'bg-violet-50 text-violet-600',
    pill: 'bg-violet-50 text-violet-600 border border-violet-100',
    avatarBg: 'bg-violet-500',
    chipRing: 'border-violet-200 bg-violet-50',
    chipText: 'text-violet-800',
    barOpen: 'bg-violet-400',
    barClick: 'bg-violet-600',
    channels: ['Email', 'SMS'],
    description: 'Send a direct link to your quote form the moment the lead arrives.',
  },
  {
    key: 'day1_followup',
    label: 'Day 1 Follow-up',
    wait: 'Wait 24h',
    icon: '🔔',
    accent: 'bg-blue-500',
    iconBg: 'bg-blue-50 text-blue-600',
    pill: 'bg-blue-50 text-blue-600 border border-blue-100',
    avatarBg: 'bg-blue-500',
    chipRing: 'border-blue-200 bg-blue-50',
    chipText: 'text-blue-800',
    barOpen: 'bg-blue-400',
    barClick: 'bg-blue-600',
    channels: ['Email', 'SMS'],
    description: "If they haven't submitted a quote, send a friendly reminder.",
  },
  {
    key: 'discount_offer',
    label: 'Discount Offer',
    wait: 'Wait 24h',
    icon: '🎁',
    accent: 'bg-amber-500',
    iconBg: 'bg-amber-50 text-amber-600',
    pill: 'bg-amber-50 text-amber-600 border border-amber-100',
    avatarBg: 'bg-amber-500',
    chipRing: 'border-amber-200 bg-amber-50',
    chipText: 'text-amber-800',
    barOpen: 'bg-amber-400',
    barClick: 'bg-amber-600',
    channels: ['Email', 'SMS'],
    description: 'Sweeten the deal with an exclusive discount to win them over.',
    hasDiscount: true,
  },
  {
    key: 'mark_lost',
    label: 'Mark as Lost',
    wait: 'Wait 24h',
    icon: '🚫',
    accent: 'bg-gray-300',
    iconBg: 'bg-gray-100 text-gray-500',
    pill: 'bg-gray-100 text-gray-500 border border-gray-200',
    avatarBg: 'bg-gray-400',
    chipRing: 'border-gray-200 bg-gray-50',
    chipText: 'text-gray-600',
    barOpen: 'bg-gray-300',
    barClick: 'bg-gray-400',
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
  if (h < 1) return 'now'
  if (h < 24) return `${h}h ago`
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export default function AutomationsPage() {
  const [config, setConfig] = useState<AutomationConfig>({ is_enabled: true, discount_percent: 10, hero_image_url: null })
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
        <div className="flex items-center gap-2 text-gray-400 text-sm">
          <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
          </svg>
          Loading…
        </div>
      </div>
    )
  }

  const pendingByStep = activity.reduce((acc, row) => {
    if (row.status === 'pending') {
      if (!acc[row.step]) acc[row.step] = []
      acc[row.step].push(row)
    }
    return acc
  }, {} as Record<string, ActivityStep[]>)

  const totalPending = activity.filter(a => a.status === 'pending').length
  const totalSent = activity.filter(a => a.status === 'sent').length

  return (
    <div className="p-8">

      {/* Header */}
      <div className="flex items-center justify-between mb-10">
        <div>
          <h1 className="text-xl font-semibold text-gray-900 tracking-tight">Automations</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {totalPending > 0 ? `${totalPending} leads active in funnel · ${totalSent} sent total` : 'Nurture every lead from first touch to close.'}
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
            <div className={`w-2 h-2 rounded-full transition-colors ${config.is_enabled ? 'bg-emerald-400' : 'bg-gray-300'}`} />
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

      {!config.is_enabled && (
        <div className="mb-8 rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-700 flex items-center gap-2">
          <svg className="w-4 h-4 text-amber-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          Automations are paused — new leads will not receive automated messages.
        </div>
      )}

      {/* Main layout */}
      <div className="flex gap-8 items-start">

        {/* Flow — full white, no container */}
        <div className="flex-1 min-w-0">

          {/* Trigger node */}
          <div className="flex items-start gap-10">
            <div className="w-80 shrink-0">
              <div className="bg-gradient-to-br from-brand-600 to-brand-700 rounded-2xl p-5 shadow-lg shadow-brand-500/20">
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-xl bg-white/15 flex items-center justify-center text-2xl shrink-0">🎯</div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-brand-200 leading-none mb-1">Trigger</p>
                    <p className="font-semibold text-white leading-tight">Any New Lead</p>
                    <p className="text-xs text-brand-300 mt-0.5">Meta or hosted form</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex-1" />
          </div>

          {/* Steps */}
          {STEPS.map((step) => {
            const pending = pendingByStep[step.key] || []
            const s: StepStats = stats[step.key] ?? { sent: 0, opens: 0, clicks: 0 }
            const pct = (n: number) => s.sent > 0 ? Math.round((n / s.sent) * 100) : 0
            const hasFunnel = s.sent > 0

            return (
              <div key={step.key}>

                {/* Connector */}
                <div className="flex items-start">
                  <div className="w-80 shrink-0 flex flex-col items-center py-2">
                    <div className="w-px h-8 bg-gray-200" />
                    <div className="text-[11px] text-gray-400 border border-gray-200 bg-white rounded-full px-3 py-1 my-2 shadow-sm font-medium">
                      {step.wait}
                    </div>
                    <div className="w-px h-6 bg-gray-200" />
                    <svg className="w-2.5 h-2.5 text-gray-300" viewBox="0 0 10 10" fill="currentColor">
                      <path d="M5 10L0 3h10z" />
                    </svg>
                  </div>
                </div>

                {/* Node + lead chips */}
                <div className="flex items-start gap-10">

                  {/* Step node */}
                  <div className={`w-80 shrink-0 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden ${!config.is_enabled ? 'opacity-50' : ''}`}>
                    <div className={`h-[3px] ${step.accent}`} />
                    <div className="p-5">
                      <div className="flex items-start gap-3.5">
                        <div className={`w-10 h-10 rounded-xl ${step.iconBg} flex items-center justify-center text-xl shrink-0`}>
                          {step.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-900 text-sm leading-tight mb-0.5">{step.label}</p>
                          <p className="text-xs text-gray-500 leading-snug">
                            {step.hasDiscount
                              ? step.description.replace('exclusive discount', `${config.discount_percent}% discount`)
                              : step.description}
                          </p>
                          {step.channels.length > 0 && (
                            <div className="flex gap-1.5 mt-2.5">
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
                        <div className="mt-4 pt-4 border-t border-gray-100">
                          <div className="space-y-2">
                            {[
                              { label: 'Sent', value: s.sent, bar: 100, color: 'bg-gray-300' },
                              { label: 'Opened', value: s.opens, bar: pct(s.opens), color: step.barOpen },
                              { label: 'Clicked', value: s.clicks, bar: pct(s.clicks), color: step.barClick },
                            ].map((row) => (
                              <div key={row.label} className="flex items-center gap-2">
                                <span className="text-[10px] text-gray-400 w-10 shrink-0 text-right tabular-nums">{row.label}</span>
                                <div className="flex-1 bg-gray-100 rounded-full h-[5px] overflow-hidden">
                                  <div
                                    className={`h-full rounded-full ${row.color} transition-all duration-700`}
                                    style={{ width: `${row.bar}%` }}
                                  />
                                </div>
                                <span className="text-[11px] text-gray-600 w-6 text-right shrink-0 tabular-nums font-medium">{row.value}</span>
                                <span className="text-[10px] text-gray-400 w-7 shrink-0 tabular-nums">
                                  {row.bar < 100 ? `${row.bar}%` : ''}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {!hasFunnel && step.channels.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-gray-100">
                          <p className="text-[11px] text-gray-300">No sends yet</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Lead chips — funnel level */}
                  {pending.length > 0 && (
                    <div className="flex-1 flex flex-wrap gap-2 items-start pt-4 min-w-0">
                      {pending.slice(0, 12).map((row) => (
                        <div
                          key={row.id}
                          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border text-xs font-medium ${step.chipRing} ${step.chipText}`}
                        >
                          <div className={`w-5 h-5 rounded-full ${step.avatarBg} text-white flex items-center justify-center text-[9px] font-bold shrink-0`}>
                            {initials(row.leads?.name)}
                          </div>
                          <span className="truncate max-w-[80px]">
                            {row.leads?.name?.split(' ')[0] || 'Lead'}
                          </span>
                          <span className="text-[10px] opacity-50 shrink-0">
                            {formatScheduled(row.scheduled_at)}
                          </span>
                        </div>
                      ))}
                      {pending.length > 12 && (
                        <div className="flex items-center px-2.5 py-1.5 rounded-full border border-gray-200 bg-gray-50 text-xs text-gray-400 font-medium">
                          +{pending.length - 12} more
                        </div>
                      )}
                    </div>
                  )}

                </div>
              </div>
            )
          })}

          {/* Exit note */}
          <div className="flex items-start mt-6">
            <div className="w-80 flex justify-center">
              <div className="flex items-center gap-1.5 text-xs text-gray-400">
                <svg className="w-3.5 h-3.5 text-emerald-400 shrink-0" fill="none" viewBox="0 0 16 16" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l4 4 6-6" />
                </svg>
                Lead submits form → sequence stops
              </div>
            </div>
          </div>

        </div>

        {/* Sidebar */}
        <div className="w-64 space-y-4 shrink-0">

          {/* Discount */}
          <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
            <h2 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Discount Offer</h2>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={1}
                max={100}
                value={config.discount_percent}
                onChange={(e) => setConfig({ ...config, discount_percent: Number(e.target.value) })}
                onBlur={() => save({ discount_percent: config.discount_percent })}
                className="w-16 border border-gray-200 rounded-lg px-3 py-1.5 text-sm text-center font-semibold focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent bg-gray-50"
              />
              <span className="text-sm font-medium text-gray-500">%</span>
              <span className="text-xs text-gray-400">off in step 3</span>
            </div>
          </div>

          {/* Test */}
          <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
            <h2 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Send Test</h2>
            {testLeads.length === 0 ? (
              <p className="text-xs text-gray-400">No leads with emails yet.</p>
            ) : (
              <div className="space-y-2.5">
                <select
                  value={testLeadId}
                  onChange={(e) => { setTestLeadId(e.target.value); setTestResults(null) }}
                  className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500 bg-gray-50"
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
                  className="w-full px-3 py-2 bg-gray-900 text-white text-xs font-semibold rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
                >
                  {testSending ? (
                    <>
                      <svg className="w-3 h-3 animate-spin" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                      </svg>
                      Sending…
                    </>
                  ) : 'Send All Steps Now'}
                </button>
                {testResults && (
                  <div className="space-y-1.5 pt-0.5">
                    {testResults.map((r) => (
                      <div key={r.step} className="flex items-center gap-2 text-xs">
                        <div className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold ${r.ok ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
                          {r.ok ? '✓' : '✕'}
                        </div>
                        <span className={r.ok ? 'text-gray-600' : 'text-red-600'}>
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
          <div className="rounded-2xl bg-gray-50 border border-gray-100 px-4 py-4">
            <p className="text-xs font-semibold text-gray-600 mb-2.5">How it works</p>
            <ul className="space-y-2">
              {[
                'Triggered by every new Meta or form lead',
                'Sequence stops when quote form is submitted',
                'Requires Twilio env vars for SMS',
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-gray-400">
                  <span className="mt-0.5 w-4 h-4 rounded-full bg-white border border-gray-200 flex items-center justify-center shrink-0 text-[9px] font-bold text-gray-400 shadow-sm">
                    {i + 1}
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

        </div>
      </div>
    </div>
  )
}
