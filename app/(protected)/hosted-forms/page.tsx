'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import type { HostedForm } from '@/lib/types'

const PLAN_LIMITS: Record<string, number> = { trial: 1, starter: 1, growth: 3, fully_managed: Infinity, pay_per_lead: Infinity, pro: Infinity }
const PLAN_LABELS: Record<string, string> = {
  trial: 'Trial',
  starter: 'Starter plan',
  growth: 'Growth plan',
  fully_managed: 'Fully Managed',
  pay_per_lead: 'Retainer',
  pro: 'Pro plan',
}

function esc(s: string) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export default function HostedFormsPage() {
  const supabase = createClient()

  const [forms, setForms] = useState<HostedForm[]>([])
  const [countMap, setCountMap] = useState<Record<string, number>>({})
  const [plan, setPlan] = useState<string>('base')
  const [planLimit, setPlanLimit] = useState<number>(1)
  const [loading, setLoading] = useState(true)
  const [accountId, setAccountId] = useState<string | null>(null)
  const [deleteFormId, setDeleteFormId] = useState<string | null>(null)
  const [embedFormUrl, setEmbedFormUrl] = useState<string | null>(null)
  const [toast, setToast] = useState<{ msg: string; isError: boolean } | null>(null)

  function showToast(msg: string, isError = false) {
    setToast({ msg, isError })
    setTimeout(() => setToast(null), 2500)
  }

  const loadForms = useCallback(
    async (accId: string) => {
      // Plan
      const { data: billing } = await supabase
        .from('billing')
        .select('plan')
        .eq('account_id', accId)
        .single()
      const currentPlan = billing?.plan ?? 'starter'
      setPlan(currentPlan)
      setPlanLimit(PLAN_LIMITS[currentPlan] ?? 1)

      // Forms
      const { data: formsData, error } = await supabase
        .from('hosted_forms')
        .select('*')
        .eq('account_id', accId)
        .order('created_at', { ascending: false })
      if (error) { console.error(error); return }

      // Lead counts
      const { data: leadRows } = await supabase
        .from('leads')
        .select('hosted_form_id')
        .eq('account_id', accId)

      const cm: Record<string, number> = {}
      ;(leadRows ?? []).forEach((l: { hosted_form_id: string }) => {
        cm[l.hosted_form_id] = (cm[l.hosted_form_id] ?? 0) + 1
      })

      setForms(formsData ?? [])
      setCountMap(cm)
      setLoading(false)
    },
    [supabase]
  )

  useEffect(() => {
    async function init() {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      const { data: account } = await supabase
        .from('accounts')
        .select('*')
        .eq('owner_id', user.id)
        .single()
      if (!account) return

      setAccountId(account.id)
      await loadForms(account.id)
    }
    init()
  }, [supabase, loadForms])

  async function toggleActive(formId: string, currentState: boolean) {
    const { error } = await supabase
      .from('hosted_forms')
      .update({ is_active: !currentState, updated_at: new Date().toISOString() })
      .eq('id', formId)
    if (error) { showToast('Error updating form', true); return }
    showToast(currentState ? 'Form deactivated' : 'Form activated')
    if (accountId) loadForms(accountId)
  }

  async function confirmDelete() {
    if (!deleteFormId) return
    const { error } = await supabase
      .from('hosted_forms')
      .delete()
      .eq('id', deleteFormId)
    setDeleteFormId(null)
    if (error) { showToast('Error deleting form', true); return }
    showToast('Form deleted')
    if (accountId) loadForms(accountId)
  }

  function copyLink(url: string) {
    navigator.clipboard.writeText(url)
    showToast('Link copied!')
  }

  const atLimit = forms.length >= planLimit

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Hosted Forms</h1>
            <p className="mt-1 text-sm text-gray-500">Your live multi-step quote forms</p>
          </div>
          <Link
            href="/form-builder"
            className={`inline-flex items-center gap-2 bg-brand-600 text-white px-5 py-2.5 rounded-lg font-semibold hover:bg-brand-700 transition shadow-sm text-sm ${atLimit ? 'opacity-50 pointer-events-none' : ''}`}
          >
            + New Form
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        {/* Plan usage bar */}
        {!loading && (
          <div style={{ background: 'white', borderRadius: 14, padding: '16px 20px', marginBottom: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: '1px solid #f1f5f9' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#374151' }}>Forms used</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: '0.78rem', color: '#94a3b8', fontWeight: 500 }}>
                  {forms.length} / {planLimit === Infinity ? '∞' : planLimit}
                </span>
                <span style={{
                  fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em',
                  background: '#ede9fe', color: '#6d28d9', borderRadius: 6, padding: '2px 8px',
                }}>
                  {PLAN_LABELS[plan] ?? plan}
                </span>
              </div>
            </div>
            <div style={{ height: 6, background: '#f1f5f9', borderRadius: 3, overflow: 'hidden' }}>
              <div style={{
                height: '100%', borderRadius: 3, background: 'linear-gradient(90deg, #6366f1, #4f46e5)',
                width: planLimit === Infinity ? '8%' : `${Math.min((forms.length / planLimit) * 100, 100)}%`,
                transition: 'width 0.4s ease',
              }} />
            </div>
          </div>
        )}

        {/* Limit banner */}
        {atLimit && !loading && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-xl">⚠️</span>
              <div>
                <p className="text-sm font-semibold text-yellow-800">
                  Form limit reached
                </p>
                <p className="text-xs text-yellow-700">
                  Upgrade your plan to create more forms.
                </p>
              </div>
            </div>
            <Link
              href="/billing"
              className="bg-yellow-500 text-white px-4 py-1.5 rounded-lg text-sm font-semibold hover:bg-yellow-600 transition"
            >
              Upgrade
            </Link>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="bg-white shadow rounded-xl p-8 text-center">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/4 mx-auto" />
            </div>
            <p className="mt-2 text-gray-500">Loading forms…</p>
          </div>
        )}

        {/* Empty state */}
        {!loading && forms.length === 0 && (
          <div className="bg-white shadow rounded-xl p-12 text-center">
            <div className="text-5xl mb-4">📝</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No forms yet
            </h3>
            <p className="text-gray-500 text-sm mb-6">
              Create your first quote form and share it with customers
              instantly.
            </p>
            <Link
              href="/form-builder"
              className="inline-flex items-center gap-2 bg-brand-600 text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-brand-700 transition"
            >
              + Create your first form
            </Link>
          </div>
        )}

        {/* Forms grid */}
        {!loading && forms.length > 0 && (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {forms.map((form) => {
              const cfg = form.form_config ?? {}
              const slug = cfg.slug ?? ''
              const color = cfg.brand_color ?? 'yellow'
              const currency = cfg.currency ?? '$'
              const fields: Array<{ id: string; type: string; label: string }> = cfg.fields ?? []
              const fieldCount = fields.length
              const created = new Date(form.created_at).toLocaleDateString(
                'en-US',
                { month: '2-digit', day: '2-digit', year: 'numeric' }
              )
              const liveUrl = `/${slug}`
              const absoluteUrl = typeof window !== 'undefined'
                ? `${window.location.origin}/${slug}`
                : `/${slug}`

              const isBlue = color === 'blue'
              const headerBg = isBlue ? '#6422A8' : '#ffe500'
              const headerFg = isBlue ? '#ffffff' : '#5b5bd6'
              const progressBg = isBlue ? 'rgba(255,255,255,0.22)' : 'rgba(0,0,0,0.14)'
              const progressFill = isBlue ? 'rgba(255,255,255,0.85)' : 'rgba(0,0,0,0.38)'
              const pillBg = isBlue ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)'
              const pillFg = isBlue ? 'rgba(255,255,255,0.82)' : 'rgba(0,0,0,0.58)'

              const FIELD_TYPE_ICONS: Record<string, string> = {
                radio: '◉', checkbox: '☑', dropdown: '▾', number: '#',
                textarea: '¶', route: '📍', draw_area: '✏', image: '🖼',
              }

              return (
                <div
                  key={form.id}
                  style={{
                    background: 'white',
                    borderRadius: 18,
                    overflow: 'hidden',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.05)',
                    display: 'flex',
                    flexDirection: 'column',
                  }}
                >
                  {/* ── Branded header — mini form preview ── */}
                  <div style={{ background: headerBg }}>
                    {/* Progress bar */}
                    <div style={{ height: 4, background: progressBg }}>
                      <div style={{
                        height: '100%', width: '33%',
                        background: progressFill,
                        borderRadius: '0 2px 2px 0',
                      }} />
                    </div>

                    <div style={{ padding: '16px 18px 18px' }}>
                      {/* Step label */}
                      <div style={{
                        fontSize: '0.58rem', fontWeight: 800, letterSpacing: '0.13em',
                        textTransform: 'uppercase',
                        color: isBlue ? 'rgba(255,255,255,0.52)' : 'rgba(0,0,0,0.42)',
                        marginBottom: 6,
                      }}>
                        {fieldCount > 0 ? `${fieldCount} step${fieldCount !== 1 ? 's' : ''} · quote form` : 'Quote Form'}
                      </div>

                      {/* Form name */}
                      <div style={{
                        fontFamily: "'Oswald', sans-serif",
                        fontSize: '1.12rem', fontWeight: 800,
                        color: headerFg, lineHeight: 1.2, marginBottom: 12,
                      }}>
                        {esc(form.form_name)}
                      </div>

                      {/* Field type pills */}
                      {fieldCount > 0 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                          {fields.slice(0, 5).map((f) => (
                            <span key={f.id} style={{
                              fontSize: '0.62rem', fontWeight: 700,
                              letterSpacing: '0.06em', textTransform: 'uppercase',
                              background: pillBg, color: pillFg,
                              borderRadius: 6, padding: '3px 8px',
                              display: 'flex', alignItems: 'center', gap: 4,
                            }}>
                              <span style={{ fontSize: '0.7rem' }}>{FIELD_TYPE_ICONS[f.type] ?? '·'}</span>
                              {f.type}
                            </span>
                          ))}
                          {fieldCount > 5 && (
                            <span style={{ fontSize: '0.62rem', fontWeight: 700, color: pillFg, padding: '3px 4px' }}>
                              +{fieldCount - 5}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* ── Stats ── */}
                  <div style={{ display: 'flex', borderBottom: '1px solid #f1f5f9' }}>
                    {[
                      { value: countMap[form.id] ?? 0, label: 'Leads' },
                      { value: fieldCount, label: 'Steps' },
                      { value: currency, label: 'Currency' },
                    ].map(({ value, label }, i) => (
                      <div key={label} style={{
                        flex: 1, padding: '13px 8px', textAlign: 'center',
                        borderLeft: i > 0 ? '1px solid #f1f5f9' : 'none',
                      }}>
                        <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#0f172a', lineHeight: 1 }}>{value}</div>
                        <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: 3, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</div>
                      </div>
                    ))}
                  </div>

                  {/* ── Status + date ── */}
                  <div style={{ padding: '10px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: 5,
                      fontSize: '0.7rem', fontWeight: 700,
                      padding: '4px 10px', borderRadius: 20,
                      background: form.is_active ? '#dcfce7' : '#f1f5f9',
                      color: form.is_active ? '#15803d' : '#64748b',
                    }}>
                      <span style={{ fontSize: 7 }}>{form.is_active ? '●' : '○'}</span>
                      {form.is_active ? 'Live' : 'Inactive'}
                    </span>
                    <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>{created}</span>
                  </div>

                  {/* ── Actions ── */}
                  <div style={{ padding: '0 14px 14px', display: 'flex', gap: 6, marginTop: 'auto' }}>
                    <Link
                      href={`/form-builder?form_id=${form.id}`}
                      style={{
                        flex: 1, textAlign: 'center', background: '#4f46e5', color: 'white',
                        padding: '9px 12px', borderRadius: 10, fontSize: '0.82rem', fontWeight: 700,
                        textDecoration: 'none',
                      }}
                    >
                      Edit
                    </Link>
                    {slug && (
                      <a
                        href={liveUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          flex: 1, textAlign: 'center', border: '1.5px solid #e2e8f0', color: '#374151',
                          padding: '9px 12px', borderRadius: 10, fontSize: '0.82rem', fontWeight: 600,
                          textDecoration: 'none',
                        }}
                      >
                        Preview ↗
                      </a>
                    )}
                    <button
                      onClick={() => copyLink(absoluteUrl)}
                      style={{ border: '1.5px solid #e2e8f0', background: 'white', color: '#64748b', padding: '9px 11px', borderRadius: 10, fontSize: '0.85rem', cursor: 'pointer' }}
                      title="Copy link"
                    >
                      🔗
                    </button>
                    {slug && (
                      <button
                        onClick={() => setEmbedFormUrl(absoluteUrl)}
                        style={{ border: '1.5px solid #e2e8f0', background: 'white', color: '#64748b', padding: '9px 11px', borderRadius: 10, fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'monospace' }}
                        title="Embed form"
                      >
                        {'</>'}
                      </button>
                    )}
                    <button
                      onClick={() => toggleActive(form.id, form.is_active)}
                      style={{ border: '1.5px solid #e2e8f0', background: 'white', color: '#64748b', padding: '9px 11px', borderRadius: 10, fontSize: '0.85rem', cursor: 'pointer' }}
                      title={form.is_active ? 'Deactivate' : 'Activate'}
                    >
                      {form.is_active ? '⏸' : '▶'}
                    </button>
                    <button
                      onClick={() => setDeleteFormId(form.id)}
                      style={{ border: '1.5px solid #fee2e2', background: 'white', color: '#f87171', padding: '9px 11px', borderRadius: 10, fontSize: '0.85rem', cursor: 'pointer' }}
                      title="Delete"
                    >
                      🗑
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Embed modal */}
      {embedFormUrl && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 max-w-lg w-full mx-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-gray-900">Embed Form</h3>
              <button
                onClick={() => setEmbedFormUrl(null)}
                style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: '#94a3b8' }}
              >
                ✕
              </button>
            </div>
            <p className="text-sm text-gray-500 mb-4">
              Paste this snippet anywhere in your website&apos;s HTML to embed the form inline.
            </p>
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: '14px 16px', fontFamily: 'monospace', fontSize: '0.78rem', color: '#334155', wordBreak: 'break-all', lineHeight: 1.6 }}>
              {`<iframe\n  src="${embedFormUrl}"\n  width="100%"\n  height="650"\n  style="border:none;border-radius:12px;"\n  loading="lazy"\n  title="Quote Form"\n></iframe>`}
            </div>
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(`<iframe\n  src="${embedFormUrl}"\n  width="100%"\n  height="650"\n  style="border:none;border-radius:12px;"\n  loading="lazy"\n  title="Quote Form"\n></iframe>`)
                  showToast('Embed code copied!')
                }}
                style={{ flex: 1, background: '#4f46e5', color: 'white', border: 'none', padding: '10px 16px', borderRadius: 10, fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer' }}
              >
                Copy Embed Code
              </button>
              <button
                onClick={() => setEmbedFormUrl(null)}
                className="flex-1 border border-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm modal */}
      {deleteFormId && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 max-w-sm w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Delete form?
            </h3>
            <p className="text-sm text-gray-500 mb-6">
              This will permanently delete the form and it will stop accepting
              submissions. Your existing leads won&apos;t be affected.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteFormId(null)}
                className="flex-1 border border-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-red-700 transition"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div
          style={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            padding: '12px 20px',
            borderRadius: 10,
            fontSize: '0.85rem',
            fontWeight: 500,
            zIndex: 999,
            background: toast.isError ? '#fee2e2' : '#f0fdf4',
            color: toast.isError ? '#991b1b' : '#166534',
            border: toast.isError ? '1px solid #fca5a5' : '1px solid #86efac',
          }}
        >
          {toast.msg}
        </div>
      )}
    </div>
  )
}
