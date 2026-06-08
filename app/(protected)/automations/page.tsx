'use client'

import { useEffect, useState } from 'react'

interface AutomationConfig {
  is_enabled: boolean
  discount_percent: number
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

const STEPS = [
  {
    key: 'initial_contact',
    label: 'Instant Contact',
    wait: 'Immediately',
    icon: '⚡',
    colorBg: 'bg-indigo-500',
    colorBorder: 'border-indigo-200',
    colorIcon: 'bg-indigo-50 text-indigo-600',
    channels: ['Email', 'SMS'],
    description: 'Send a direct link to your quote form the moment the lead arrives.',
  },
  {
    key: 'day1_followup',
    label: 'Day 1 Follow-up',
    wait: 'Wait 24h',
    icon: '🔔',
    colorBg: 'bg-blue-500',
    colorBorder: 'border-blue-200',
    colorIcon: 'bg-blue-50 text-blue-600',
    channels: ['Email', 'SMS'],
    description: "If they haven't submitted a quote, send a friendly reminder.",
  },
  {
    key: 'discount_offer',
    label: 'Discount Offer',
    wait: 'Wait 24h',
    icon: '🎁',
    colorBg: 'bg-amber-500',
    colorBorder: 'border-amber-200',
    colorIcon: 'bg-amber-50 text-amber-600',
    channels: ['Email', 'SMS'],
    description: 'Sweeten the deal with an exclusive discount to win them over.',
    hasDiscount: true,
  },
  {
    key: 'mark_lost',
    label: 'Mark as Lost',
    wait: 'Wait 24h',
    icon: '🚫',
    colorBg: 'bg-gray-400',
    colorBorder: 'border-gray-200',
    colorIcon: 'bg-gray-50 text-gray-500',
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

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  sent: 'bg-green-100 text-green-800',
  skipped: 'bg-gray-100 text-gray-600',
}

function ArrowDown() {
  return (
    <svg className="w-3 h-3 text-gray-400" viewBox="0 0 12 12" fill="none">
      <path d="M6 1v9M2.5 7l3.5 3.5L9.5 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export default function AutomationsPage() {
  const [config, setConfig] = useState<AutomationConfig>({ is_enabled: true, discount_percent: 10 })
  const [activity, setActivity] = useState<ActivityStep[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    async function load() {
      const [cfgRes, actRes] = await Promise.all([
        fetch('/api/automations'),
        fetch('/api/automations/activity'),
      ])
      if (cfgRes.ok) setConfig(await cfgRes.json())
      if (actRes.ok) setActivity(await actRes.json())
      setLoading(false)
    }
    load()
  }, [])

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
      <div className="flex items-center justify-center h-full text-gray-400">
        Loading automations…
      </div>
    )
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Automations</h1>
          <p className="text-sm text-gray-500 mt-1">
            Automatically nurture every Meta lead from first touch to close.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {saving && <span className="text-sm text-gray-400">Saving…</span>}
          <span className="text-sm font-medium text-gray-700">
            {config.is_enabled ? 'Enabled' : 'Disabled'}
          </span>
          <button
            onClick={() => save({ is_enabled: !config.is_enabled })}
            className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors focus:outline-none ${
              config.is_enabled ? 'bg-indigo-600' : 'bg-gray-300'
            }`}
          >
            <span
              className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                config.is_enabled ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </div>

      {!config.is_enabled && (
        <div className="rounded-lg bg-yellow-50 border border-yellow-200 px-4 py-3 text-sm text-yellow-800">
          Automations are paused. New Meta leads will not receive automated messages.
        </div>
      )}

      {/* Flow map + sidebar */}
      <div className="flex gap-6 items-start">

        {/* Canvas */}
        <div className="flex-1 bg-gray-50 rounded-2xl border border-gray-200 p-8 min-h-[560px]">
          <div className="flex flex-col items-center">

            {/* Trigger node */}
            <div className="w-full max-w-xs">
              <div className="bg-indigo-600 rounded-xl p-4 text-white shadow-md">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-white/20 flex items-center justify-center text-lg shrink-0">
                    🎯
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-indigo-200 leading-none mb-0.5">Trigger</p>
                    <p className="font-semibold leading-tight">Meta Lead Arrives</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Steps */}
            {STEPS.map((step) => (
              <div key={step.key} className="w-full max-w-xs flex flex-col items-center">

                {/* Connector */}
                <div className="flex flex-col items-center py-1">
                  <div className="w-px h-4 bg-gray-300" />
                  <span className="text-xs bg-white border border-gray-200 text-gray-500 px-2.5 py-0.5 rounded-full font-medium shadow-sm my-1 whitespace-nowrap">
                    {step.wait}
                  </span>
                  <div className="w-px h-4 bg-gray-300" />
                  <ArrowDown />
                </div>

                {/* Step node */}
                <div className={`w-full bg-white rounded-xl border ${step.colorBorder} shadow-sm p-4 ${!config.is_enabled ? 'opacity-50' : ''}`}>
                  <div className="flex items-start gap-3">
                    <div className={`w-9 h-9 rounded-lg ${step.colorIcon} flex items-center justify-center text-lg shrink-0`}>
                      {step.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 text-sm leading-tight">{step.label}</p>
                      <p className="text-xs text-gray-500 mt-0.5 leading-snug">
                        {step.hasDiscount
                          ? step.description.replace('exclusive discount', `${config.discount_percent}% discount`)
                          : step.description}
                      </p>
                      {step.channels.length > 0 && (
                        <div className="flex gap-1 mt-2 flex-wrap">
                          {step.channels.map((ch) => (
                            <span key={ch} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded font-medium">
                              {ch}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

              </div>
            ))}

            {/* Exit note */}
            <div className="mt-4 flex items-center gap-2 text-xs text-gray-400">
              <svg className="w-3.5 h-3.5 text-green-500" fill="none" viewBox="0 0 16 16" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l4 4 6-6" />
              </svg>
              Lead submits quote form at any point → sequence stops
            </div>

          </div>
        </div>

        {/* Sidebar: settings + activity */}
        <div className="w-72 space-y-4 shrink-0">

          {/* Discount setting */}
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Discount Offer</h2>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={1}
                max={100}
                value={config.discount_percent}
                onChange={(e) => setConfig({ ...config, discount_percent: Number(e.target.value) })}
                onBlur={() => save({ discount_percent: config.discount_percent })}
                className="w-16 border border-gray-300 rounded-lg px-3 py-1.5 text-sm text-center focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <span className="text-sm text-gray-500">%</span>
              <span className="text-xs text-gray-400">off in step 3</span>
            </div>
          </div>

          {/* Activity feed */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100">
              <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Recent Activity</h2>
            </div>
            {activity.length === 0 ? (
              <div className="px-4 py-8 text-center text-xs text-gray-400">
                No activity yet. Starts when Meta leads come in.
              </div>
            ) : (
              <div className="divide-y divide-gray-100 max-h-96 overflow-y-auto">
                {activity.map((row) => (
                  <div key={row.id} className="flex items-start gap-2 px-4 py-3">
                    <span
                      className={`text-xs font-medium px-1.5 py-0.5 rounded-full shrink-0 ${STATUS_COLORS[row.status] ?? 'bg-gray-100 text-gray-600'}`}
                    >
                      {row.status}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-700 truncate">
                        {STEP_LABELS[row.step] ?? row.step}
                        {row.leads?.name ? ` → ${row.leads.name}` : ''}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {row.sent_at
                          ? new Date(row.sent_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
                          : `Scheduled ${new Date(row.scheduled_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="rounded-xl bg-indigo-50 border border-indigo-100 px-4 py-3 text-xs text-indigo-600 space-y-1">
            <p className="font-semibold text-indigo-700">How it works</p>
            <ul className="list-disc list-inside space-y-0.5 text-indigo-500">
              <li>Triggered by every new Meta lead</li>
              <li>Stops if quote form is submitted</li>
              <li>Requires Twilio env vars for SMS</li>
            </ul>
          </div>

        </div>
      </div>
    </div>
  )
}
