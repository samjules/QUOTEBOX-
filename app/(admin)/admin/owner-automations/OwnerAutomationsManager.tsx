'use client'

import { useState, useMemo, useEffect } from 'react'
import type { OwnerStep } from './page'

// ── types ────────────────────────────────────────────────────────────────────

interface EmailCopy {
  subject?: string
  heading?: string
  body?: string
  outro?: string
}

interface Config {
  welcome_email: EmailCopy | null
  welcome_sms: string | null
  no_leads_email: EmailCopy | null
  no_leads_sms: string | null
}

// ── defaults (mirrors lib/owner-automations.ts) ───────────────────────────

const WELCOME_EMAIL_DEFAULTS: EmailCopy = {
  subject: 'Welcome to QuoteBox, {{business}}!',
  heading: "You're officially in. 🎉",
  body: "Welcome to QuoteBox, {{business}}! Your account is live and ready to start capturing leads. To get you set up with ads and pulling in leads as fast as possible, let's book a quick call. I'll personally walk you through the setup and make sure your first campaign is dialed in.",
  outro: 'Takes 20 minutes. No fluff — just getting your ads live and generating leads.',
}

const NO_LEADS_EMAIL_DEFAULTS: EmailCopy = {
  subject: '{{business}} — still no leads yet?',
  heading: "I noticed you haven't gotten any leads yet",
  body: "Hey {{business}} — it's been a couple days and I don't see any leads coming in yet. That's totally normal at the start, but let's fix that. Book a free 20-minute consulting call and I'll help you figure out exactly what's holding things back — whether it's the ad setup, form copy, targeting, or something else entirely.",
  outro: 'No obligation — I just want to make sure QuoteBox is working for you.',
}

const WELCOME_SMS_DEFAULT = "Welcome to QuoteBox! 🎉 Your account is live. Book your free ad setup call and let's get leads coming in: https://quote-box.com/get-started"
const NO_LEADS_SMS_DEFAULT = "Hey! I noticed you haven't gotten any leads yet on QuoteBox. Need help? Book a free consulting call here: https://quote-box.com/get-started"

// ── helpers ───────────────────────────────────────────────────────────────

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  pending: { bg: '#fef9c3', text: '#92400e' },
  sent:    { bg: '#dcfce7', text: '#15803d' },
  skipped: { bg: '#f3f4f6', text: '#6b7280' },
}

const STEP_LABELS: Record<string, string> = {
  welcome: 'Welcome',
  no_leads_followup: 'No-Leads Follow-up',
}

// All 22 steps in the 30-day sequence
const SEQUENCE_STEPS: { step: string; label: string; channel: 'email' | 'sms' | 'both' }[] = [
  { step: 'welcome',             label: 'Welcome (Day 0)',           channel: 'both'  },
  { step: 'day1_sms_2h',        label: 'Day 1 · +2h',              channel: 'sms'   },
  { step: 'day2_email',         label: 'Day 2',                     channel: 'email' },
  { step: 'day3_sms',           label: 'Day 3',                     channel: 'sms'   },
  { step: 'day4_email',         label: 'Day 4',                     channel: 'email' },
  { step: 'day5_morning_email', label: 'Day 5 Morning',             channel: 'email' },
  { step: 'day5_afternoon_sms', label: 'Day 5 Afternoon',           channel: 'sms'   },
  { step: 'day7_email',         label: 'Day 7',                     channel: 'email' },
  { step: 'day9_sms',           label: 'Day 9',                     channel: 'sms'   },
  { step: 'day10_email',        label: 'Day 10',                    channel: 'email' },
  { step: 'day12_email',        label: 'Day 12',                    channel: 'email' },
  { step: 'day13_sms',          label: 'Day 13',                    channel: 'sms'   },
  { step: 'day14_email',        label: 'Day 14',                    channel: 'email' },
  { step: 'day14_sms',          label: 'Day 14 · +2h',             channel: 'sms'   },
  { step: 'day15_email',        label: 'Day 15',                    channel: 'email' },
  { step: 'day17_email',        label: 'Day 17',                    channel: 'email' },
  { step: 'day19_sms',          label: 'Day 19',                    channel: 'sms'   },
  { step: 'day21_email',        label: 'Day 21',                    channel: 'email' },
  { step: 'day23_sms',          label: 'Day 23',                    channel: 'sms'   },
  { step: 'day25_email',        label: 'Day 25',                    channel: 'email' },
  { step: 'day28_email',        label: 'Day 28',                    channel: 'email' },
  { step: 'day30_sms',          label: 'Day 30',                    channel: 'sms'   },
]

const CHANNEL_BADGE: Record<string, { label: string; bg: string; color: string }> = {
  email: { label: '✉ Email',    bg: '#eff6ff', color: '#1d4ed8' },
  sms:   { label: '💬 SMS',     bg: '#f0fdf4', color: '#15803d' },
  both:  { label: '✉ + 💬',    bg: '#faf5ff', color: '#7e22ce' },
}

function fmt(iso: string) {
  return new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '9px 12px', borderRadius: 8,
  border: '1.5px solid #e2e8f0', fontSize: '0.88rem', outline: 'none',
  fontFamily: 'inherit', color: '#0e0020', boxSizing: 'border-box',
  background: '#fff',
}

const taStyle: React.CSSProperties = {
  ...inputStyle, resize: 'vertical', minHeight: 72, lineHeight: 1.5,
}

// ── sub-components ────────────────────────────────────────────────────────

function EmailEditor({
  value,
  defaults,
  onChange,
}: {
  value: EmailCopy | null
  defaults: EmailCopy
  onChange: (v: EmailCopy) => void
}) {
  const v = value ?? {}
  const field = (key: keyof EmailCopy, label: string, multi = false) => (
    <div key={key}>
      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#64748b', marginBottom: 4 }}>
        {label}
      </label>
      {multi ? (
        <textarea
          style={taStyle}
          value={v[key] ?? ''}
          placeholder={defaults[key]}
          onChange={(e) => onChange({ ...v, [key]: e.target.value })}
        />
      ) : (
        <input
          style={inputStyle}
          value={v[key] ?? ''}
          placeholder={defaults[key]}
          onChange={(e) => onChange({ ...v, [key]: e.target.value })}
        />
      )}
    </div>
  )
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <p style={{ margin: 0, fontSize: '0.75rem', color: '#94a3b8' }}>
        Use <code style={{ background: '#f1f5f9', padding: '1px 5px', borderRadius: 4 }}>{'{{business}}'}</code> to insert the business name. Leave blank to use default.
      </p>
      {field('subject', 'Subject line')}
      {field('heading', 'Heading')}
      {field('body', 'Body', true)}
      {field('outro', 'Outro / sign-off')}
    </div>
  )
}

function StepNode({
  label,
  timing,
  accentColor,
  emailValue,
  emailDefaults,
  smsValue,
  smsDefault,
  onSave,
  sentCount,
  pendingCount,
}: {
  label: string
  timing: string
  accentColor: string
  emailValue: EmailCopy | null
  emailDefaults: EmailCopy
  smsValue: string | null
  smsDefault: string
  onSave: (email: EmailCopy | null, sms: string | null) => Promise<void>
  sentCount: number
  pendingCount: number
}) {
  const [open, setOpen] = useState(false)
  const [tab, setTab] = useState<'email' | 'sms'>('email')
  const [email, setEmail] = useState<EmailCopy>(emailValue ?? {})
  const [sms, setSms] = useState(smsValue ?? '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => { setEmail(emailValue ?? {}) }, [emailValue])
  useEffect(() => { setSms(smsValue ?? '') }, [smsValue])

  async function handleSave() {
    setSaving(true)
    await onSave(
      Object.values(email).some(Boolean) ? email : null,
      sms.trim() || null,
    )
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div style={{ position: 'relative' }}>
      {/* Node card */}
      <div style={{
        background: '#fff', border: `1.5px solid ${open ? accentColor : '#e2e8f0'}`,
        borderRadius: 14, overflow: 'hidden',
        boxShadow: open ? `0 0 0 3px ${accentColor}22` : '0 1px 3px rgba(0,0,0,0.06)',
        transition: 'all 0.15s',
      }}>
        {/* Header bar */}
        <div
          style={{ background: accentColor, padding: '3px 0' }}
        />
        <div
          style={{ padding: '16px 20px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
          onClick={() => setOpen((o) => !o)}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ background: `${accentColor}18`, padding: '8px', borderRadius: 8 }}>
              <svg width="16" height="16" fill="none" stroke={accentColor} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                <path d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#0e0020' }}>{label}</div>
              <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: 2 }}>{timing}</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ display: 'flex', gap: 8 }}>
              {sentCount > 0 && (
                <span style={{ fontSize: '0.75rem', fontWeight: 600, background: '#dcfce7', color: '#15803d', padding: '2px 8px', borderRadius: 99 }}>
                  {sentCount} sent
                </span>
              )}
              {pendingCount > 0 && (
                <span style={{ fontSize: '0.75rem', fontWeight: 600, background: '#fef9c3', color: '#92400e', padding: '2px 8px', borderRadius: 99 }}>
                  {pendingCount} pending
                </span>
              )}
            </div>
            <svg
              width="16" height="16" fill="none" stroke="#94a3b8" strokeWidth={2} viewBox="0 0 24 24"
              style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0 }}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>

        {/* Editor */}
        {open && (
          <div style={{ borderTop: '1px solid #f1f5f9', padding: '20px' }}>
            {/* Tabs */}
            <div style={{ display: 'flex', gap: 4, marginBottom: 16, background: '#f8fafc', borderRadius: 8, padding: 4 }}>
              {(['email', 'sms'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  style={{
                    flex: 1, padding: '7px', borderRadius: 6, border: 'none',
                    fontFamily: 'inherit', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer',
                    background: tab === t ? '#fff' : 'transparent',
                    color: tab === t ? '#0e0020' : '#94a3b8',
                    boxShadow: tab === t ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                  }}
                >
                  {t === 'email' ? '✉ Email' : '💬 SMS'}
                </button>
              ))}
            </div>

            {tab === 'email' ? (
              <EmailEditor value={Object.values(email).some(Boolean) ? email : null} defaults={emailDefaults} onChange={setEmail} />
            ) : (
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#64748b', marginBottom: 4 }}>
                  SMS message
                </label>
                <textarea
                  style={{ ...taStyle, minHeight: 96 }}
                  value={sms}
                  placeholder={smsDefault}
                  onChange={(e) => setSms(e.target.value)}
                />
                <p style={{ margin: '6px 0 0', fontSize: '0.72rem', color: '#94a3b8' }}>
                  {(sms || smsDefault).length} chars · Leave blank to use default
                </p>
              </div>
            )}

            <button
              onClick={handleSave}
              disabled={saving}
              style={{
                marginTop: 16, padding: '9px 20px', borderRadius: 8, border: 'none',
                background: saved ? '#16a34a' : '#0e0020', color: saved ? '#fff' : '#ffe500',
                fontSize: '0.88rem', fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer',
                fontFamily: 'inherit', opacity: saving ? 0.6 : 1, transition: 'background 0.2s',
              }}
            >
              {saved ? '✓ Saved' : saving ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ── main component ────────────────────────────────────────────────────────

interface PreviewData {
  subject: string | null
  html: string | null
  sms: string | null
}

export default function OwnerAutomationsManager({ steps: initialSteps }: { steps: OwnerStep[] }) {
  const [steps] = useState(initialSteps)
  const [config, setConfig] = useState<Config>({ welcome_email: null, welcome_sms: null, no_leads_email: null, no_leads_sms: null })
  const [configLoaded, setConfigLoaded] = useState(false)

  const [search, setSearch] = useState('')
  const [stepFilter, setStepFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')

  const [testEmail, setTestEmail] = useState('')
  const [testPhone, setTestPhone] = useState('')
  const [testStep, setTestStep] = useState('all')
  const [testing, setTesting] = useState(false)
  const [testResults, setTestResults] = useState<{ step: string; channel: string; ok: boolean; error?: string }[] | null>(null)

  const [preview, setPreview] = useState<PreviewData | null>(null)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [previewTab, setPreviewTab] = useState<'email' | 'sms'>('email')

  useEffect(() => {
    fetch('/api/admin/owner-automations/config')
      .then((r) => r.json())
      .then((d) => { setConfig(d); setConfigLoaded(true) })
      .catch(() => setConfigLoaded(true))
  }, [])

  useEffect(() => {
    if (testStep === 'all') { setPreview(null); return }
    setPreviewLoading(true)
    setPreview(null)
    fetch(`/api/admin/owner-automations/preview?step=${testStep}`)
      .then((r) => r.json())
      .then((d: PreviewData) => {
        setPreview(d)
        setPreviewTab(d.html ? 'email' : 'sms')
      })
      .catch(() => setPreview(null))
      .finally(() => setPreviewLoading(false))
  }, [testStep])

  async function saveConfig(patch: Partial<Config>) {
    const next = { ...config, ...patch }
    setConfig(next)
    await fetch('/api/admin/owner-automations/config', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    })
  }

  async function runTest() {
    setTesting(true)
    setTestResults(null)
    const res = await fetch('/api/admin/owner-automations/test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail.trim() || null,
        phone: testPhone.trim() || null,
        step: testStep,
      }),
    })
    const data = await res.json()
    setTestResults(data.results ?? [])
    setTesting(false)
  }

  const stats = useMemo(() => ({
    uniqueAccounts: new Set(steps.map((s) => s.account_id)).size,
    sent: steps.filter((s) => s.status === 'sent').length,
    pending: steps.filter((s) => s.status === 'pending').length,
    skipped: steps.filter((s) => s.status === 'skipped').length,
  }), [steps])

  const stepCounts = useMemo(() => {
    const counts: Record<string, { sent: number; pending: number }> = {}
    for (const s of steps) {
      if (!counts[s.step]) counts[s.step] = { sent: 0, pending: 0 }
      if (s.status === 'sent') counts[s.step].sent++
      if (s.status === 'pending') counts[s.step].pending++
    }
    return counts
  }, [steps])

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return steps.filter((s) => {
      if (q && !s.business_name.toLowerCase().includes(q) && !s.owner_email.toLowerCase().includes(q)) return false
      if (stepFilter !== 'all' && s.step !== stepFilter) return false
      if (statusFilter !== 'all' && s.status !== statusFilter) return false
      return true
    })
  }, [steps, search, stepFilter, statusFilter])

  if (!configLoaded) return <div style={{ padding: 40, color: '#94a3b8' }}>Loading…</div>

  return (
    <div style={{ padding: '32px 28px', maxWidth: 1000, margin: '0 auto', fontFamily: 'inherit' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28, gap: 16, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0e0020', margin: 0 }}>Owner Automations</h1>
          <p style={{ fontSize: '0.88rem', color: '#64748b', marginTop: 4 }}>
            Welcome + follow-up messages sent to new QuoteBox accounts.
          </p>
        </div>

        {/* Test panel */}
        <div style={{ background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: 12, padding: '16px 18px', minWidth: 300, maxWidth: 380 }}>
          <p style={{ margin: '0 0 12px', fontSize: '0.8rem', fontWeight: 700, color: '#374151' }}>Send Test</p>

          {/* Step picker */}
          <div style={{ marginBottom: 8 }}>
            <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 600, color: '#64748b', marginBottom: 4 }}>Step</label>
            <select
              value={testStep}
              onChange={(e) => setTestStep(e.target.value)}
              style={{ width: '100%', padding: '9px 10px', borderRadius: 8, border: '1.5px solid #e2e8f0', fontSize: '0.84rem', fontFamily: 'inherit', color: '#0e0020', background: '#fff' }}
            >
              <option value="all">All 22 steps</option>
              {SEQUENCE_STEPS.map(({ step, label, channel }) => (
                <option key={step} value={step}>
                  {label} · {channel === 'both' ? 'Email + SMS' : channel === 'email' ? 'Email' : 'SMS'}
                </option>
              ))}
            </select>
          </div>

          {/* Channel badge */}
          {testStep !== 'all' && (() => {
            const info = SEQUENCE_STEPS.find((s) => s.step === testStep)
            const badge = info ? CHANNEL_BADGE[info.channel] : null
            return badge ? (
              <div style={{ marginBottom: 10 }}>
                <span style={{ display: 'inline-block', fontSize: '0.72rem', fontWeight: 600, padding: '2px 8px', borderRadius: 99, background: badge.bg, color: badge.color }}>
                  {badge.label}
                </span>
              </div>
            ) : null
          })()}

          {/* Email field */}
          <div style={{ marginBottom: 8 }}>
            <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 600, color: '#64748b', marginBottom: 4 }}>Test email</label>
            <input
              type="email"
              placeholder="Leave blank to use your admin email"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              style={inputStyle}
            />
          </div>

          {/* Phone field */}
          <div style={{ marginBottom: 10 }}>
            <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 600, color: '#64748b', marginBottom: 4 }}>Test phone (SMS steps)</label>
            <input
              type="tel"
              placeholder="+1 555 000 0000"
              value={testPhone}
              onChange={(e) => setTestPhone(e.target.value)}
              style={inputStyle}
            />
          </div>

          <button
            onClick={runTest}
            disabled={testing}
            style={{
              width: '100%', padding: '9px 16px', borderRadius: 8, border: 'none',
              background: '#0e0020', color: '#ffe500', fontSize: '0.84rem',
              fontWeight: 700, cursor: testing ? 'not-allowed' : 'pointer',
              fontFamily: 'inherit', opacity: testing ? 0.6 : 1,
            }}
          >
            {testing ? 'Sending…' : testStep === 'all' ? '▶ Send all 22 steps' : '▶ Send test'}
          </button>

          {testResults && (
            <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 180, overflowY: 'auto' }}>
              {testResults.map((r, i) => {
                const info = SEQUENCE_STEPS.find((s) => s.step === r.step)
                const label = info?.label ?? STEP_LABELS[r.step] ?? r.step
                return (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 6, fontSize: '0.78rem' }}>
                    <span style={{ color: r.ok ? '#16a34a' : '#dc2626', fontWeight: 700, flexShrink: 0 }}>{r.ok ? '✓' : '✗'}</span>
                    <span style={{ color: '#374151' }}>{label} · {r.channel}</span>
                    {r.error && <span style={{ color: '#dc2626', fontSize: '0.72rem' }}>— {r.error}</span>}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Preview panel */}
      {testStep !== 'all' && (
        <div style={{ background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: 14, marginBottom: 28, overflow: 'hidden' }}>
          {/* Preview header */}
          <div style={{ padding: '14px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#374151' }}>
                Preview — {SEQUENCE_STEPS.find((s) => s.step === testStep)?.label ?? testStep}
              </span>
              {preview?.subject && previewTab === 'email' && (
                <span style={{ fontSize: '0.78rem', color: '#64748b' }}>· {preview.subject}</span>
              )}
            </div>
            {/* Tabs */}
            {preview && preview.html && preview.sms && (
              <div style={{ display: 'flex', gap: 4, background: '#f8fafc', borderRadius: 8, padding: 3 }}>
                {(['email', 'sms'] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setPreviewTab(t)}
                    style={{
                      padding: '5px 12px', borderRadius: 6, border: 'none', fontFamily: 'inherit',
                      fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer',
                      background: previewTab === t ? '#fff' : 'transparent',
                      color: previewTab === t ? '#0e0020' : '#94a3b8',
                      boxShadow: previewTab === t ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                    }}
                  >
                    {t === 'email' ? '✉ Email' : '💬 SMS'}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Preview body */}
          {previewLoading ? (
            <div style={{ padding: '40px 20px', textAlign: 'center', color: '#94a3b8', fontSize: '0.84rem' }}>Loading preview…</div>
          ) : preview ? (
            <>
              {/* Email iframe */}
              {(previewTab === 'email' || !preview.sms) && preview.html && (
                <iframe
                  srcDoc={preview.html}
                  title="Email preview"
                  style={{ width: '100%', height: 540, border: 'none', display: 'block' }}
                  sandbox="allow-same-origin"
                />
              )}

              {/* SMS bubble */}
              {(previewTab === 'sms' || !preview.html) && preview.sms && (
                <div style={{ padding: '24px 28px', background: '#f8fafc' }}>
                  <p style={{ margin: '0 0 10px', fontSize: '0.72rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>SMS message</p>
                  <div style={{ display: 'inline-block', maxWidth: 420, background: '#0e0020', color: '#fff', padding: '12px 16px', borderRadius: '16px 16px 16px 4px', fontSize: '0.92rem', lineHeight: 1.55, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                    {preview.sms}
                  </div>
                  <p style={{ margin: '10px 0 0', fontSize: '0.72rem', color: '#94a3b8' }}>{preview.sms.length} chars</p>
                </div>
              )}
            </>
          ) : (
            <div style={{ padding: '40px 20px', textAlign: 'center', color: '#94a3b8', fontSize: '0.84rem' }}>No preview available for this step.</div>
          )}
        </div>
      )}

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 32 }}>
        {[
          { label: 'Accounts', value: stats.uniqueAccounts },
          { label: 'Sent', value: stats.sent },
          { label: 'Pending', value: stats.pending },
          { label: 'Skipped', value: stats.skipped },
        ].map((s) => (
          <div key={s.label} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, padding: '14px 18px' }}>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0e0020' }}>{s.value}</div>
            <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Flow nodes */}
      <div style={{ marginBottom: 36 }}>
        <p style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>
          Automation flow · click a node to edit
        </p>

        {/* Node: Trigger */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, paddingLeft: 4 }}>
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#5b50d6', flexShrink: 0 }} />
          <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#5b50d6' }}>User signs up</span>
        </div>

        {/* Connector */}
        <div style={{ width: 2, height: 16, background: '#e2e8f0', marginLeft: 8, marginBottom: 8 }} />

        <StepNode
          label="Welcome"
          timing="Fires immediately on signup"
          accentColor="#5b50d6"
          emailValue={config.welcome_email}
          emailDefaults={WELCOME_EMAIL_DEFAULTS}
          smsValue={config.welcome_sms}
          smsDefault={WELCOME_SMS_DEFAULT}
          sentCount={stepCounts.welcome?.sent ?? 0}
          pendingCount={stepCounts.welcome?.pending ?? 0}
          onSave={(email, sms) => saveConfig({ welcome_email: email, welcome_sms: sms })}
        />

        {/* Connector with condition */}
        <div style={{ display: 'flex', alignItems: 'stretch', gap: 0, margin: '8px 0 8px 8px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 2 }}>
            <div style={{ flex: 1, width: 2, background: '#e2e8f0' }} />
          </div>
          <div style={{ marginLeft: 12, alignSelf: 'center', background: '#fef9c3', border: '1px solid #fde68a', borderRadius: 6, padding: '3px 10px', fontSize: '0.72rem', fontWeight: 600, color: '#92400e' }}>
            +2 days · only if no leads yet
          </div>
        </div>
        <div style={{ width: 2, height: 8, background: '#e2e8f0', marginLeft: 8, marginBottom: 8 }} />

        <StepNode
          label="No-Leads Follow-up"
          timing="+2 days after signup · skipped if leads exist"
          accentColor="#f59e0b"
          emailValue={config.no_leads_email}
          emailDefaults={NO_LEADS_EMAIL_DEFAULTS}
          smsValue={config.no_leads_sms}
          smsDefault={NO_LEADS_SMS_DEFAULT}
          sentCount={stepCounts.no_leads_followup?.sent ?? 0}
          pendingCount={stepCounts.no_leads_followup?.pending ?? 0}
          onSave={(email, sms) => saveConfig({ no_leads_email: email, no_leads_sms: sms })}
        />
      </div>

      {/* Activity table */}
      <p style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>
        Activity log
      </p>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
        <input
          type="text"
          placeholder="Search business or email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ ...inputStyle, minWidth: 200, flex: 1 }}
        />
        <select value={stepFilter} onChange={(e) => setStepFilter(e.target.value)}
          style={{ padding: '9px 12px', borderRadius: 8, border: '1.5px solid #e2e8f0', fontSize: '0.88rem', fontFamily: 'inherit' }}>
          <option value="all">All steps</option>
          <option value="welcome">Welcome</option>
          <option value="no_leads_followup">No-Leads Follow-up</option>
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
          style={{ padding: '9px 12px', borderRadius: 8, border: '1.5px solid #e2e8f0', fontSize: '0.88rem', fontFamily: 'inherit' }}>
          <option value="all">All statuses</option>
          <option value="pending">Pending</option>
          <option value="sent">Sent</option>
          <option value="skipped">Skipped</option>
        </select>
      </div>

      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.86rem' }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              {['Business', 'Email', 'Phone', 'Step', 'Status', 'Scheduled', 'Sent'].map((h) => (
                <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 600, color: '#374151', whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ padding: '32px 14px', textAlign: 'center', color: '#94a3b8' }}>No records found.</td>
              </tr>
            ) : filtered.map((s) => {
              const colors = STATUS_COLORS[s.status] ?? STATUS_COLORS.pending
              return (
                <tr key={s.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '10px 14px', fontWeight: 600, color: '#0e0020' }}>{s.business_name}</td>
                  <td style={{ padding: '10px 14px', color: '#475569' }}>{s.owner_email}</td>
                  <td style={{ padding: '10px 14px', color: '#475569' }}>{s.phone ?? <span style={{ color: '#cbd5e1' }}>—</span>}</td>
                  <td style={{ padding: '10px 14px', color: '#374151' }}>{STEP_LABELS[s.step] ?? s.step}</td>
                  <td style={{ padding: '10px 14px' }}>
                    <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 5, fontSize: '0.76rem', fontWeight: 600, background: colors.bg, color: colors.text }}>
                      {s.status}
                    </span>
                  </td>
                  <td style={{ padding: '10px 14px', color: '#475569', whiteSpace: 'nowrap' }}>{fmt(s.scheduled_at)}</td>
                  <td style={{ padding: '10px 14px', color: '#475569', whiteSpace: 'nowrap' }}>
                    {s.sent_at ? fmt(s.sent_at) : <span style={{ color: '#cbd5e1' }}>—</span>}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: 8 }}>
        {filtered.length} of {steps.length} records · Booking link → /get-started
      </p>
    </div>
  )
}
