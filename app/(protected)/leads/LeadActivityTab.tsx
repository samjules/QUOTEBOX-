'use client'

import { useEffect, useState } from 'react'

const STEP_LABELS: Record<string, string> = {
  initial_contact: 'Instant Contact',
  day1_followup: 'Day 1 Follow-up',
  discount_offer: 'Discount Offer',
  mark_lost: 'Mark as Lost',
}

const STEP_ICONS: Record<string, string> = {
  initial_contact: '⚡',
  day1_followup: '🔔',
  discount_offer: '🎁',
  mark_lost: '🚫',
}

const EVENT_LABELS: Record<string, { icon: string; label: string; color: string }> = {
  email_open: { icon: '👁', label: 'Email opened', color: 'text-blue-600' },
  link_click: { icon: '🔗', label: 'Link clicked', color: 'text-indigo-600' },
  form_submit: { icon: '✅', label: 'Form submitted', color: 'text-green-600' },
}

interface AutomationEvent {
  lead_id: string
  step: string
  event_type: string
  created_at: string
}

interface StepData {
  step: string
  status: string
  scheduled_at: string
  sent_at: string | null
  events: AutomationEvent[]
}

interface LeadRow {
  lead: {
    id: string
    name: string | null
    email: string | null
    phone: string | null
    form_type: string | null
    created_at: string
  }
  steps: StepData[]
  converted: boolean
  convertedAt: string | null
}

function fmt(date: string) {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

export default function LeadActivityTab() {
  const [data, setData] = useState<LeadRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/automations/lead-activity')
      .then((r) => r.json())
      .then((d) => { setData(Array.isArray(d) ? d : []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="py-20 text-center text-sm text-gray-400">Loading activity…</div>
    )
  }

  if (data.length === 0) {
    return (
      <div className="py-20 text-center text-sm text-gray-400">
        No automation activity yet. Activity will appear here once leads start receiving automated messages.
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {data.map(({ lead, steps, converted, convertedAt }) => (
        <div key={lead.id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {/* Lead header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-gray-50">
            <div>
              <p className="font-semibold text-gray-900 text-sm">{lead.name || 'Unnamed Lead'}</p>
              <p className="text-xs text-gray-500">{lead.email ?? '—'}{lead.phone ? ` · ${lead.phone}` : ''}</p>
            </div>
            <div className="flex items-center gap-2">
              {lead.form_type === 'meta_lead_form' ? (
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">Meta</span>
              ) : (
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">Form</span>
              )}
              {converted && (
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-green-100 text-green-700">Converted</span>
              )}
            </div>
          </div>

          {/* Timeline */}
          <div className="px-5 py-4">
            <div className="relative">
              {/* Vertical spine */}
              <div className="absolute left-3.5 top-0 bottom-0 w-px bg-gray-200" />

              <div className="space-y-4">
                {steps.map((s) => (
                  <div key={s.step} className="relative pl-10">
                    {/* Step dot */}
                    <div className={`absolute left-0 w-7 h-7 rounded-full flex items-center justify-center text-sm border-2 bg-white ${
                      s.status === 'sent' ? 'border-indigo-400' :
                      s.status === 'skipped' ? 'border-gray-200' : 'border-gray-300'
                    }`}>
                      {STEP_ICONS[s.step] ?? '•'}
                    </div>

                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-900">{STEP_LABELS[s.step] ?? s.step}</span>
                          <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${
                            s.status === 'sent' ? 'bg-green-100 text-green-700' :
                            s.status === 'skipped' ? 'bg-gray-100 text-gray-500' :
                            'bg-yellow-100 text-yellow-700'
                          }`}>
                            {s.status}
                          </span>
                        </div>
                        {s.sent_at && (
                          <p className="text-xs text-gray-400 mt-0.5">{fmt(s.sent_at)}</p>
                        )}
                        {!s.sent_at && s.scheduled_at && (
                          <p className="text-xs text-gray-400 mt-0.5">Scheduled {fmt(s.scheduled_at)}</p>
                        )}

                        {/* Events for this step */}
                        {s.events.length > 0 && (
                          <div className="mt-2 space-y-1 pl-2 border-l-2 border-gray-100 ml-1">
                            {s.events.map((ev, i) => {
                              const meta = EVENT_LABELS[ev.event_type]
                              if (!meta) return null
                              return (
                                <div key={i} className="flex items-center gap-1.5 text-xs">
                                  <span>{meta.icon}</span>
                                  <span className={`font-medium ${meta.color}`}>{meta.label}</span>
                                  <span className="text-gray-400">{fmt(ev.created_at)}</span>
                                </div>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {/* Conversion marker */}
                {converted && convertedAt && (
                  <div className="relative pl-10">
                    <div className="absolute left-0 w-7 h-7 rounded-full flex items-center justify-center text-sm border-2 border-green-400 bg-green-50">
                      ✅
                    </div>
                    <div>
                      <span className="text-sm font-medium text-green-700">Form submitted</span>
                      <p className="text-xs text-gray-400 mt-0.5">{fmt(convertedAt)}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
