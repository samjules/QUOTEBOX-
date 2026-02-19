'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import type { HostedForm } from '@/lib/types'

const PLAN_LIMITS: Record<string, number> = { base: 1, pro: 10, agency: Infinity }
const PLAN_LABELS: Record<string, string> = {
  base: 'Base plan',
  pro: 'Pro plan',
  agency: 'Agency plan',
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
      const currentPlan = billing?.plan ?? 'base'
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
            <h1 className="text-2xl font-semibold text-gray-900">
              Hosted Forms
            </h1>
            <p className="mt-1 text-sm text-gray-600">
              All your live quote forms
            </p>
          </div>
          <Link
            href="/form-builder"
            className={`inline-flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-lg font-semibold hover:bg-indigo-700 transition shadow-sm ${atLimit ? 'opacity-50 pointer-events-none' : ''}`}
          >
            + New Form
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        {/* Plan usage bar */}
        {!loading && (
          <div className="bg-white shadow rounded-xl p-5 mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">
                Forms used
              </span>
              <span className="text-sm text-gray-500">
                {forms.length} /{' '}
                {planLimit === Infinity ? '∞' : planLimit}
              </span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2">
              <div
                className="bg-indigo-600 h-2 rounded-full transition-all"
                style={{
                  width:
                    planLimit === Infinity
                      ? '10%'
                      : `${Math.min((forms.length / planLimit) * 100, 100)}%`,
                }}
              />
            </div>
            <p className="mt-2 text-xs text-gray-400">{PLAN_LABELS[plan]}</p>
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
              className="inline-flex items-center gap-2 bg-indigo-600 text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-indigo-700 transition"
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
              const fieldCount = (cfg.fields ?? []).length
              const created = new Date(form.created_at).toLocaleDateString(
                'en-US',
                { month: 'short', day: 'numeric', year: 'numeric' }
              )
              const liveUrl = `https://quote-box.com/${slug}`
              const headerStyle =
                color === 'blue'
                  ? { background: '#1A56FF', color: 'white' }
                  : { background: '#FFE500', color: '#1a1a2e' }

              return (
                <div
                  key={form.id}
                  className="bg-white shadow rounded-xl overflow-hidden flex flex-col"
                >
                  {/* Colour header */}
                  <div style={{ ...headerStyle, padding: '20px 20px 16px' }}>
                    <div
                      style={{
                        fontSize: '0.65rem',
                        fontWeight: 700,
                        letterSpacing: '0.08em',
                        textTransform: 'uppercase',
                        opacity: 0.6,
                        marginBottom: 4,
                      }}
                    >
                      Quote Form
                    </div>
                    <div
                      style={{
                        fontFamily: 'Syne, sans-serif',
                        fontSize: '1.1rem',
                        fontWeight: 800,
                        lineHeight: 1.2,
                      }}
                    >
                      {esc(form.form_name)}
                    </div>
                    <div
                      style={{
                        fontSize: '0.75rem',
                        marginTop: 4,
                        opacity: 0.65,
                        fontFamily: 'monospace',
                      }}
                    >
                      {slug ? liveUrl : 'No slug set'}
                    </div>
                  </div>

                  {/* Stats row */}
                  <div className="flex divide-x divide-gray-100 border-b border-gray-100">
                    <div className="flex-1 px-4 py-3 text-center">
                      <div className="text-xl font-bold text-gray-900">
                        {countMap[form.id] ?? 0}
                      </div>
                      <div className="text-xs text-gray-500">Leads</div>
                    </div>
                    <div className="flex-1 px-4 py-3 text-center">
                      <div className="text-xl font-bold text-gray-900">
                        {fieldCount}
                      </div>
                      <div className="text-xs text-gray-500">Fields</div>
                    </div>
                    <div className="flex-1 px-4 py-3 text-center">
                      <div className="text-xl font-bold text-gray-900">
                        {currency}
                      </div>
                      <div className="text-xs text-gray-500">Currency</div>
                    </div>
                  </div>

                  {/* Meta */}
                  <div className="px-4 py-3 flex items-center justify-between">
                    {form.is_active ? (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 bg-green-100 px-2 py-0.5 rounded-full">
                        ● Live
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                        ○ Inactive
                      </span>
                    )}
                    <span className="text-xs text-gray-400">
                      Created {created}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="px-4 pb-4 mt-auto flex gap-2">
                    <Link
                      href={`/form-builder?form_id=${form.id}`}
                      className="flex-1 text-center bg-indigo-600 text-white px-3 py-2 rounded-lg text-sm font-semibold hover:bg-indigo-700 transition"
                    >
                      Edit
                    </Link>
                    {slug && (
                      <a
                        href={liveUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 text-center border border-gray-200 text-gray-700 px-3 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition"
                      >
                        View Live ↗
                      </a>
                    )}
                    <button
                      onClick={() => copyLink(liveUrl)}
                      className="border border-gray-200 text-gray-500 px-3 py-2 rounded-lg text-sm hover:bg-gray-50 transition"
                      title="Copy link"
                    >
                      🔗
                    </button>
                    <button
                      onClick={() => toggleActive(form.id, form.is_active)}
                      className="border border-gray-200 text-gray-500 px-3 py-2 rounded-lg text-sm hover:bg-gray-50 transition"
                      title={form.is_active ? 'Deactivate' : 'Activate'}
                    >
                      {form.is_active ? '⏸' : '▶'}
                    </button>
                    <button
                      onClick={() => setDeleteFormId(form.id)}
                      className="border border-red-100 text-red-400 px-3 py-2 rounded-lg text-sm hover:bg-red-50 transition"
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
