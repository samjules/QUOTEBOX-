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
    delay: 'Immediately',
    icon: '⚡',
    color: 'bg-indigo-500',
    description: 'Email + SMS sent the moment a Meta lead arrives, with a direct link to your quote form.',
  },
  {
    key: 'day1_followup',
    label: 'Day 1 Follow-up',
    delay: 'After 24 hours',
    icon: '🔔',
    color: 'bg-blue-500',
    description: "If they haven't submitted a quote yet, we send a friendly reminder.",
  },
  {
    key: 'discount_offer',
    label: 'Discount Offer',
    delay: 'After 48 hours',
    icon: '🎁',
    color: 'bg-amber-500',
    description: 'No response? We sweeten the deal with an exclusive discount to win them over.',
  },
  {
    key: 'mark_lost',
    label: 'Mark as Lost',
    delay: 'After 72 hours',
    icon: '❌',
    color: 'bg-gray-400',
    description: "If there's still no engagement, the lead is automatically marked as lost.",
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
    <div className="p-6 max-w-4xl mx-auto space-y-8">
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
          <span className="text-sm font-medium text-gray-700">
            {config.is_enabled ? 'Enabled' : 'Disabled'}
          </span>
        </div>
      </div>

      {!config.is_enabled && (
        <div className="rounded-lg bg-yellow-50 border border-yellow-200 px-4 py-3 text-sm text-yellow-800">
          Automations are paused. New Meta leads will not receive automated messages.
        </div>
      )}

      {/* Flow */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Default Flow — Meta Leads</h2>
        </div>
        <div className="divide-y divide-gray-100">
          {STEPS.map((step, i) => (
            <div key={step.key} className="flex items-start gap-4 px-5 py-4">
              <div className="flex flex-col items-center pt-1 shrink-0">
                <div className={`w-8 h-8 rounded-full ${step.color} flex items-center justify-center text-white text-sm font-bold`}>
                  {i + 1}
                </div>
                {i < STEPS.length - 1 && (
                  <div className="w-px flex-1 bg-gray-200 mt-2 min-h-[20px]" />
                )}
              </div>
              <div className="flex-1 min-w-0 pb-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-base font-semibold text-gray-900">{step.label}</span>
                  <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-medium">
                    {step.delay}
                  </span>
                </div>
                <p className="text-sm text-gray-500 mt-0.5">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Discount setting */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">Discount Offer Settings</h2>
        <div className="flex items-center gap-4">
          <label className="text-sm text-gray-700 font-medium shrink-0">Discount percentage</label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={1}
              max={100}
              value={config.discount_percent}
              onChange={(e) => setConfig({ ...config, discount_percent: Number(e.target.value) })}
              onBlur={() => save({ discount_percent: config.discount_percent })}
              className="w-20 border border-gray-300 rounded-lg px-3 py-1.5 text-sm text-center focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <span className="text-sm text-gray-500">%</span>
          </div>
          <p className="text-xs text-gray-400 ml-2">
            This discount is mentioned in the third follow-up email and SMS.
          </p>
        </div>
      </div>

      {/* Activity feed */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Recent Activity</h2>
        </div>
        {activity.length === 0 ? (
          <div className="px-5 py-10 text-center text-sm text-gray-400">
            No automation activity yet. Activity will appear here once Meta leads start coming in.
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {activity.map((row) => (
              <div key={row.id} className="flex items-center gap-3 px-5 py-3">
                <span
                  className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_COLORS[row.status] ?? 'bg-gray-100 text-gray-600'}`}
                >
                  {row.status}
                </span>
                <span className="text-sm text-gray-700 font-medium flex-1 min-w-0 truncate">
                  {STEP_LABELS[row.step] ?? row.step}
                  {row.leads?.name ? ` → ${row.leads.name}` : ''}
                </span>
                <span className="text-xs text-gray-400 shrink-0">
                  {row.sent_at
                    ? new Date(row.sent_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
                    : `Scheduled ${new Date(row.scheduled_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Info box */}
      <div className="rounded-lg bg-indigo-50 border border-indigo-100 px-5 py-4 text-sm text-indigo-700 space-y-1">
        <p className="font-semibold">How it works</p>
        <ul className="list-disc list-inside space-y-1 text-indigo-600">
          <li>When a Meta lead arrives, email + SMS are sent immediately with a link to your quote form.</li>
          <li>If they submit the quote form, the sequence stops automatically.</li>
          <li>If they don't respond, follow-ups go out at 24h and 48h with an escalating offer.</li>
          <li>After 72h of silence the lead is marked as Lost to keep your pipeline clean.</li>
        </ul>
        <p className="mt-2 text-indigo-500 text-xs">
          SMS requires TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER environment variables.
        </p>
      </div>
    </div>
  )
}
