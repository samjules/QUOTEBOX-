'use client'

import { useState, useTransition } from 'react'
import type { Lead } from '@/lib/types'
import { updateLeadStatus, saveLeadNote } from './actions'

const SEND_INVOICE_FUNCTION_URL = process.env.NEXT_PUBLIC_SEND_INVOICE_FUNCTION_URL!
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const STATUS_OPTIONS = ['new', 'contacted', 'booked', 'lost'] as const

function statusColor(status: string) {
  switch (status) {
    case 'new':
      return 'bg-yellow-100 text-yellow-800'
    case 'contacted':
      return 'bg-blue-100 text-blue-800'
    case 'booked':
      return 'bg-green-100 text-green-800'
    case 'lost':
      return 'bg-red-100 text-red-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

function formatKey(key: string) {
  return key
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return '-'
  if (typeof value === 'boolean') return value ? 'Yes' : 'No'
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}

export default function LeadsTable({ leads, stripeConnectAccountId }: { leads: Lead[]; stripeConnectAccountId: string | null }) {
  const [selected, setSelected] = useState<Lead | null>(null)
  const [localStatus, setLocalStatus] = useState<string>('')
  const [isPending, startTransition] = useTransition()
  const [savedStatus, setSavedStatus] = useState<Record<string, string>>({})
  const [noteText, setNoteText] = useState<string>('')
  const [isPendingNote, startNoteTransition] = useTransition()
  const [noteSaved, setNoteSaved] = useState(false)

  // Invoice state
  const [invoiceAmount, setInvoiceAmount] = useState<string>('')
  const [invoiceDescription, setInvoiceDescription] = useState<string>('')
  const [invoiceSending, setInvoiceSending] = useState(false)
  const [invoiceSent, setInvoiceSent] = useState(false)
  const [invoiceError, setInvoiceError] = useState<string | null>(null)

  function openLead(lead: Lead) {
    setSelected(lead)
    setLocalStatus(savedStatus[lead.id] ?? lead.status)
    setNoteText(lead.notes ?? '')
    setNoteSaved(false)
    // Reset invoice state and pre-fill from quote
    setInvoiceSent(false)
    setInvoiceError(null)
    const quote = getQuote(lead)
    setInvoiceAmount(quote ? String(quote.total) : '')
    setInvoiceDescription(lead.form_type ? `${lead.form_type} quote` : 'Service quote')
  }

  function closeLead() {
    setSelected(null)
  }

  function handleStatusSave() {
    if (!selected) return
    startTransition(async () => {
      await updateLeadStatus(selected.id, localStatus)
      setSavedStatus((prev) => ({ ...prev, [selected.id]: localStatus }))
      setSelected((prev) => prev ? { ...prev, status: localStatus as Lead['status'] } : prev)
    })
  }

  function handleNoteSave() {
    if (!selected) return
    startNoteTransition(async () => {
      await saveLeadNote(selected.id, noteText)
      setNoteSaved(true)
      setSelected((prev) => prev ? { ...prev, notes: noteText } : prev)
    })
  }

  async function handleSendInvoice() {
    if (!selected?.email || !invoiceAmount || !stripeConnectAccountId) return
    setInvoiceSending(true)
    setInvoiceError(null)
    try {
      const res = await fetch(SEND_INVOICE_FUNCTION_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          email: selected.email,
          name: selected.name,
          amount: parseFloat(invoiceAmount),
          description: invoiceDescription || 'Service quote',
          stripeConnectAccountId,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to send invoice')
      setInvoiceSent(true)
    } catch (err) {
      setInvoiceError(err instanceof Error ? err.message : 'Failed to send invoice')
    }
    setInvoiceSending(false)
  }

  const getDisplayStatus = (lead: Lead) =>
    savedStatus[lead.id] ?? lead.status

  const INTERNAL_KEYS = ['name', 'email', 'phone', '_quote_total', '_quote_currency', '_breakdown']

  function getQuote(lead: Lead): { total: number; currency: string } | null {
    const total = lead.form_data?._quote_total
    if (typeof total !== 'number' || total === 0) return null
    const currency = (lead.form_data?._quote_currency as string) ?? '$'
    return { total, currency }
  }

  const formDataEntries = selected?.form_data
    ? Object.entries(selected.form_data).filter(([key]) => !INTERNAL_KEYS.includes(key))
    : []

  const selectedQuote = selected ? getQuote(selected) : null

  return (
    <div className="relative">
      {/* Table */}
      <div className="bg-white shadow rounded-xl overflow-hidden">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Recent Leads
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quote</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Details</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {leads.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                    No leads yet. They will appear here once you receive them.
                  </td>
                </tr>
              ) : (
                leads.map((lead) => {
                  const displayStatus = getDisplayStatus(lead)
                  return (
                    <tr
                      key={lead.id}
                      className={`hover:bg-gray-50 ${selected?.id === lead.id ? 'bg-indigo-50' : ''}`}
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {lead.name || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {lead.email || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {lead.phone || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                        {(() => { const q = getQuote(lead); return q ? `${q.currency}${q.total.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}` : <span className="text-gray-400 font-normal">—</span> })()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColor(displayStatus)}`}>
                          {displayStatus}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(lead.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button
                          onClick={() => openLead(lead)}
                          className="text-indigo-600 hover:text-indigo-900 font-medium"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail panel overlay */}
      {selected && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/20 z-30"
            onClick={closeLead}
          />

          {/* Slide-in panel */}
          <div className="fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-2xl z-40 flex flex-col overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">{selected.name || 'Unnamed Lead'}</h2>
                <p className="text-sm text-gray-500">{selected.form_type || 'Lead'} · {new Date(selected.created_at).toLocaleDateString()}</p>
              </div>
              <button
                onClick={closeLead}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-md"
                aria-label="Close"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
              {/* Contact info */}
              <section>
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Contact</h3>
                <dl className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <dt className="text-gray-500">Name</dt>
                    <dd className="text-gray-900 font-medium">{selected.name || '-'}</dd>
                  </div>
                  <div className="flex justify-between text-sm">
                    <dt className="text-gray-500">Email</dt>
                    <dd className="text-gray-900 font-medium">
                      {selected.email
                        ? <a href={`mailto:${selected.email}`} className="text-indigo-600 hover:underline">{selected.email}</a>
                        : '-'}
                    </dd>
                  </div>
                  <div className="flex justify-between text-sm">
                    <dt className="text-gray-500">Phone</dt>
                    <dd className="text-gray-900 font-medium">
                      {selected.phone
                        ? <a href={`tel:${selected.phone}`} className="text-indigo-600 hover:underline">{selected.phone}</a>
                        : '-'}
                    </dd>
                  </div>
                </dl>
              </section>

              {/* Quote total */}
              {selectedQuote && (
                <section>
                  <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Estimated Quote</h3>
                  <div className="rounded-xl bg-green-50 border border-green-200 px-5 py-4 flex items-center justify-between">
                    <span className="text-sm text-green-700 font-medium">Total</span>
                    <span className="text-2xl font-bold text-green-800">
                      {selectedQuote.currency}{selectedQuote.total.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                </section>
              )}

              {/* Form data */}
              {formDataEntries.length > 0 && (
                <section>
                  <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Form Details</h3>
                  <dl className="space-y-2">
                    {formDataEntries.map(([key, value]) => (
                      <div key={key} className="flex justify-between text-sm">
                        <dt className="text-gray-500">{formatKey(key)}</dt>
                        <dd className="text-gray-900 font-medium text-right max-w-[60%]">{formatValue(value)}</dd>
                      </div>
                    ))}
                  </dl>
                </section>
              )}

              {/* Status */}
              <section>
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Status</h3>
                <div className="flex items-center gap-3">
                  <select
                    value={localStatus}
                    onChange={(e) => setLocalStatus(e.target.value)}
                    className="flex-1 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                    ))}
                  </select>
                  <button
                    onClick={handleStatusSave}
                    disabled={isPending || localStatus === (savedStatus[selected.id] ?? selected.status)}
                    className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isPending ? 'Saving…' : 'Save'}
                  </button>
                </div>
                <div className="mt-2">
                  <span className={`px-2 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColor(localStatus)}`}>
                    {localStatus}
                  </span>
                </div>
              </section>

              {/* Notes */}
              <section>
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Notes</h3>
                <textarea
                  value={noteText}
                  onChange={(e) => { setNoteText(e.target.value); setNoteSaved(false) }}
                  rows={4}
                  placeholder="Add a note about this lead…"
                  className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none"
                />
                <div className="mt-2 flex items-center gap-3">
                  <button
                    onClick={handleNoteSave}
                    disabled={isPendingNote}
                    className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isPendingNote ? 'Saving…' : 'Save Note'}
                  </button>
                  {noteSaved && <span className="text-xs text-green-600 font-medium">Saved</span>}
                </div>
              </section>

              {/* Send Invoice */}
              <section>
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Send Invoice</h3>
                {!stripeConnectAccountId ? (
                  <p className="text-sm text-gray-500">
                    <a href="/settings" className="text-indigo-600 hover:underline font-medium">Connect Stripe in Settings</a> to send invoices to your leads.
                  </p>
                ) : !selected?.email ? (
                  <p className="text-sm text-gray-500">No email address on file for this lead.</p>
                ) : invoiceSent ? (
                  <div className="rounded-lg bg-green-50 border border-green-200 px-4 py-3 flex items-center gap-2">
                    <svg className="w-4 h-4 text-green-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <p className="text-sm text-green-800 font-medium">Invoice sent to {selected.email}</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Amount (USD)</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                        <input
                          type="number"
                          min="0.50"
                          step="0.01"
                          value={invoiceAmount}
                          onChange={(e) => setInvoiceAmount(e.target.value)}
                          placeholder="0.00"
                          className="w-full rounded-md border border-gray-300 bg-white pl-7 pr-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Description</label>
                      <input
                        type="text"
                        value={invoiceDescription}
                        onChange={(e) => setInvoiceDescription(e.target.value)}
                        placeholder="Service quote"
                        className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>
                    {invoiceError && (
                      <p className="text-xs text-red-600">{invoiceError}</p>
                    )}
                    <button
                      onClick={handleSendInvoice}
                      disabled={invoiceSending || !invoiceAmount}
                      className="w-full px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {invoiceSending ? 'Sending…' : 'Send Invoice'}
                    </button>
                    <p className="text-xs text-gray-400">Invoice will be sent to {selected.email} · due in 7 days</p>
                  </div>
                )}
              </section>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
