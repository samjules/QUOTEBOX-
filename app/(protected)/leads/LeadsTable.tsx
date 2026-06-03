'use client'

import { useState, useTransition } from 'react'
import type { Lead } from '@/lib/types'
import { updateLeadStatus, saveLeadNote, deleteLead, updateContactCount } from './actions'

const SEND_INVOICE_FUNCTION_URL =
  process.env.NEXT_PUBLIC_SEND_INVOICE_FUNCTION_URL ||
  `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/send-invoice`
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const STATUS_OPTIONS = ['new', 'contacted', 'booked', 'lost'] as const

export type FieldMap = Record<string, {
  label: string
  type: string
  options?: Array<{ id: string; label: string }>
}>

interface RouteValue {
  startAddress?: string
  endAddress?: string
  distanceMiles?: number
  durationMinutes?: number
}

function isRouteValue(val: unknown): val is RouteValue {
  if (!val || typeof val !== 'object') return false
  const obj = val as Record<string, unknown>
  return 'distanceMiles' in obj || 'endAddress' in obj || 'startAddress' in obj
}

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

function resolveLabel(key: string, fieldMap: FieldMap): string {
  const field = fieldMap[key]
  if (field?.label) return field.label
  return key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

function resolveValue(key: string, value: unknown, fieldMap: FieldMap): string {
  if (value === null || value === undefined) return '-'
  if (typeof value === 'boolean') return value ? 'Yes' : 'No'

  const field = fieldMap[key]

  if (typeof value === 'string' && field?.options) {
    const opt = field.options.find((o) => o.id === value)
    if (opt) return opt.label
  }

  if (Array.isArray(value) && field?.options) {
    return (value as string[])
      .map((id) => field.options?.find((o) => o.id === id)?.label ?? id)
      .join(', ')
  }

  if (typeof value === 'number') return value.toLocaleString()
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}

function ContactBubbles({ count, onChange }: { count: number; onChange: (n: number) => void }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3].map((n) => (
        <button
          key={n}
          onClick={(e) => { e.stopPropagation(); onChange(count === n ? n - 1 : n) }}
          className="focus:outline-none"
          title={`${n} contact${n !== 1 ? 's' : ''}`}
        >
          {n <= count ? (
            <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
              <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
          ) : (
            <div className="w-5 h-5 rounded-full border-2 border-dashed border-gray-300" />
          )}
        </button>
      ))}
    </div>
  )
}

function SuperLeadBadge() {
  return (
    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-green-100 text-green-700 text-xs font-semibold">
      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
      </svg>
      Super Lead
    </span>
  )
}

function SourceBadge({ formType, size = 'md' }: { formType: string | null | undefined; size?: 'sm' | 'md' }) {
  const base = size === 'sm'
    ? 'px-1.5 py-0.5 text-xs font-semibold rounded'
    : 'px-2 inline-flex text-xs leading-5 font-semibold rounded-full'
  if (formType === 'meta_lead_form') {
    return <span className={`${base} bg-blue-100 text-blue-700`}>Meta</span>
  }
  return <span className={`${base} bg-gray-100 text-gray-600`}>Form</span>
}

type DisplayRow = {
  primary: Lead
  group: Lead[]
  isSuperLead: boolean
}

function groupLeads(leads: Lead[]): DisplayRow[] {
  const key = (l: Lead) => {
    if (!l.name && !l.email) return `__solo_${l.id}`
    return `${(l.name ?? '').trim().toLowerCase()}||${(l.email ?? '').trim().toLowerCase()}`
  }
  const map = new Map<string, Lead[]>()
  for (const l of leads) {
    const k = key(l)
    map.set(k, [...(map.get(k) ?? []), l])
  }
  const seen = new Set<string>()
  const rows: DisplayRow[] = []
  for (const l of leads) {
    const k = key(l)
    if (!seen.has(k)) {
      seen.add(k)
      const group = map.get(k)!
      rows.push({ primary: group[0], group, isSuperLead: group.length > 1 })
    }
  }
  return rows
}

const INTERNAL_KEYS = ['name', 'email', 'phone', '_quote_total', '_quote_currency', '_breakdown']

export default function LeadsTable({ leads: initialLeads, stripeConnectAccountId, agreementTemplateUrl, fieldMap }: { leads: Lead[]; stripeConnectAccountId: string | null; agreementTemplateUrl: string | null; fieldMap: FieldMap }) {
  const [leads, setLeads] = useState<Lead[]>(initialLeads)
  const displayRows = groupLeads(leads)

  const [contactCounts, setContactCounts] = useState<Record<string, number>>(
    () => Object.fromEntries(initialLeads.map((l) => [l.id, Number(l.form_data?._contact_count) || 0]))
  )
  const [selected, setSelected] = useState<Lead | null>(null)
  const [selectedGroup, setSelectedGroup] = useState<Lead[]>([])
  const [localStatus, setLocalStatus] = useState<string>('')
  const [isPending, startTransition] = useTransition()
  const [savedStatus, setSavedStatus] = useState<Record<string, string>>({})
  const [noteText, setNoteText] = useState<string>('')
  const [isPendingNote, startNoteTransition] = useTransition()
  const [noteSaved, setNoteSaved] = useState(false)

  const [confirmDelete, setConfirmDelete] = useState(false)
  const [isDeleting, startDeleteTransition] = useTransition()

  const [invoiceAmount, setInvoiceAmount] = useState<string>('')
  const [invoiceDescription, setInvoiceDescription] = useState<string>('')
  const [invoiceSending, setInvoiceSending] = useState(false)
  const [invoiceSent, setInvoiceSent] = useState<false | 'email' | 'email+sms'>(false)
  const [invoiceError, setInvoiceError] = useState<string | null>(null)

  const [agreementSending, setAgreementSending] = useState(false)
  const [agreementStatus, setAgreementStatus] = useState<string | null>(null)
  const [agreementError, setAgreementError] = useState<string | null>(null)

  const isSuperLeadSelected = selectedGroup.length > 1

  function openLead(row: DisplayRow) {
    const lead = row.primary
    setSelected(lead)
    setSelectedGroup(row.group)
    setLocalStatus(savedStatus[lead.id] ?? lead.status)
    setNoteText(lead.notes ?? '')
    setNoteSaved(false)
    setConfirmDelete(false)
    setInvoiceSent(false as false)
    setInvoiceError(null)
    const quote = getQuote(lead)
    setInvoiceAmount(quote ? String(quote.total) : '')
    setInvoiceDescription(lead.form_type ? `${lead.form_type} quote` : 'Service quote')
    setAgreementStatus(null)
    setAgreementError(null)
    fetch(`/api/agreements/status?leadId=${lead.id}`)
      .then((r) => r.json())
      .then((d) => { if (d.agreement) setAgreementStatus(d.agreement.status) })
      .catch(() => {})
  }

  function closeLead() {
    setSelected(null)
    setSelectedGroup([])
  }

  function handleContactCount(leadId: string, count: number) {
    setContactCounts((prev) => ({ ...prev, [leadId]: count }))
    updateContactCount(leadId, count)
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
      const phone = selectedGroup.find((l) => l.phone)?.phone
      const res = await fetch(SEND_INVOICE_FUNCTION_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          email: selected.email,
          name: selected.name,
          phone: phone || undefined,
          amount: parseFloat(invoiceAmount),
          description: invoiceDescription || 'Service quote',
          stripeConnectAccountId,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to send invoice')
      setInvoiceSent(data.smsSent ? 'email+sms' : 'email')
    } catch (err) {
      setInvoiceError(err instanceof Error ? err.message : 'Failed to send invoice')
    }
    setInvoiceSending(false)
  }

  async function handleSendAgreement() {
    if (!selected?.email) return
    setAgreementSending(true)
    setAgreementError(null)
    try {
      const res = await fetch('/api/agreements/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadId: selected.id }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to send agreement')
      setAgreementStatus('sent')
    } catch (err) {
      setAgreementError(err instanceof Error ? err.message : 'Failed to send agreement')
    }
    setAgreementSending(false)
  }

  function handleDeleteLead() {
    if (!selected) return
    const ids = selectedGroup.map((l) => l.id)
    startDeleteTransition(async () => {
      for (const id of ids) {
        await deleteLead(id)
      }
      setLeads((prev) => prev.filter((l) => !ids.includes(l.id)))
      closeLead()
    })
  }

  const getDisplayStatus = (lead: Lead) =>
    savedStatus[lead.id] ?? lead.status

  function getQuote(lead: Lead): { total: number; currency: string } | null {
    const total = lead.form_data?._quote_total
    if (typeof total !== 'number' || total === 0) return null
    const currency = (lead.form_data?._quote_currency as string) ?? '$'
    return { total, currency }
  }

  const formDataEntries = !isSuperLeadSelected && selected?.form_data
    ? Object.entries(selected.form_data).filter(([key]) => !INTERNAL_KEYS.includes(key))
    : []

  const selectedQuote = selectedGroup.length > 0
    ? selectedGroup.map((l) => getQuote(l)).find((q) => q !== null) ?? null
    : selected ? getQuote(selected) : null

  const selectedPhone = selectedGroup.find((l) => l.phone)?.phone ?? selected?.phone

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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Source</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contacted</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Details</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {displayRows.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-4 text-center text-sm text-gray-500">
                    No leads yet. They will appear here once you receive them.
                  </td>
                </tr>
              ) : (
                displayRows.map((row) => {
                  const { primary: lead, group, isSuperLead } = row
                  const displayStatus = getDisplayStatus(lead)
                  const rowPhone = group.find((l) => l.phone)?.phone
                  const rowQuote = group.map((l) => getQuote(l)).find((q) => q !== null)
                  const isSelected = selected?.id === lead.id
                  return (
                    <tr
                      key={lead.id}
                      className={`hover:bg-gray-50 ${isSelected ? 'bg-indigo-50' : ''}`}
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        <div className="flex items-center gap-2">
                          {lead.name || '-'}
                          {isSuperLead && <SuperLeadBadge />}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {lead.email || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {rowPhone || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                        {rowQuote
                          ? `${rowQuote.currency}${rowQuote.total.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`
                          : <span className="text-gray-400 font-normal">—</span>
                        }
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-1 flex-wrap">
                          {group.map((l) => (
                            <SourceBadge key={l.id} formType={l.form_type} />
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <ContactBubbles
                          count={contactCounts[lead.id] ?? 0}
                          onChange={(n) => handleContactCount(lead.id, n)}
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColor(displayStatus)}`}>
                          {displayStatus}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(lead.created_at).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button
                          onClick={() => openLead(row)}
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
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-semibold text-gray-900">{selected.name || 'Unnamed Lead'}</h2>
                  {isSuperLeadSelected && <SuperLeadBadge />}
                </div>
                <p className="text-sm text-gray-500 flex items-center gap-2 flex-wrap">
                  {isSuperLeadSelected ? (
                    <>
                      {selectedGroup.map((l) => (
                        <SourceBadge key={l.id} formType={l.form_type} size="sm" />
                      ))}
                      · {new Date(selected.created_at).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })}
                    </>
                  ) : (
                    <>
                      {selected.form_type || 'Lead'} · {new Date(selected.created_at).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })}
                      <SourceBadge formType={selected.form_type} size="sm" />
                    </>
                  )}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {!confirmDelete ? (
                  <button
                    onClick={() => setConfirmDelete(true)}
                    className="text-red-400 hover:text-red-600 p-1 rounded-md"
                    aria-label="Delete lead"
                    title="Delete lead"
                  >
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">{isSuperLeadSelected ? 'Delete all?' : 'Delete?'}</span>
                    <button
                      onClick={handleDeleteLead}
                      disabled={isDeleting}
                      className="text-xs font-semibold text-white bg-red-600 hover:bg-red-700 px-2.5 py-1 rounded-md disabled:opacity-50"
                    >
                      {isDeleting ? 'Deleting…' : 'Yes, delete'}
                    </button>
                    <button
                      onClick={() => setConfirmDelete(false)}
                      disabled={isDeleting}
                      className="text-xs font-semibold text-gray-600 hover:text-gray-800 px-2.5 py-1 rounded-md border border-gray-300 disabled:opacity-50"
                    >
                      Cancel
                    </button>
                  </div>
                )}
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
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
              {/* Contact info */}
              <section>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Contact</h3>
                  <ContactBubbles
                    count={contactCounts[selected.id] ?? 0}
                    onChange={(n) => handleContactCount(selected.id, n)}
                  />
                </div>
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
                      {selectedPhone
                        ? <a href={`tel:${selectedPhone}`} className="text-indigo-600 hover:underline">{selectedPhone}</a>
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

              {/* Sources — super lead breakdown */}
              {isSuperLeadSelected && (
                <section>
                  <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Sources</h3>
                  <div className="space-y-3">
                    {selectedGroup.map((l) => {
                      const entries = l.form_data
                        ? Object.entries(l.form_data).filter(([key]) => !INTERNAL_KEYS.includes(key))
                        : []
                      const lQuote = getQuote(l)
                      return (
                        <div key={l.id} className="rounded-lg border border-gray-200 p-3 space-y-2">
                          <div className="flex items-center justify-between">
                            <SourceBadge formType={l.form_type} />
                            <span className="text-xs text-gray-400">
                              {new Date(l.created_at).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })}
                            </span>
                          </div>
                          {lQuote && (
                            <div className="flex justify-between text-xs pt-1">
                              <span className="text-gray-500">Quote</span>
                              <span className="font-semibold text-green-700">
                                {lQuote.currency}{lQuote.total.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                              </span>
                            </div>
                          )}
                          {entries.length > 0 && (
                            <dl className="space-y-1 pt-2 border-t border-gray-100">
                              {entries.map(([key, value]) => (
                                <div key={key} className="flex justify-between text-xs">
                                  <dt className="text-gray-500">{resolveLabel(key, fieldMap)}</dt>
                                  <dd className="text-gray-900 font-medium text-right max-w-[60%]">
                                    {resolveValue(key, value, fieldMap)}
                                  </dd>
                                </div>
                              ))}
                            </dl>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </section>
              )}

              {/* Form data — single lead */}
              {formDataEntries.length > 0 && (
                <section>
                  <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Form Details</h3>
                  <dl className="space-y-3">
                    {formDataEntries.map(([key, value]) => {
                      const label = resolveLabel(key, fieldMap)

                      if (isRouteValue(value)) {
                        const route = value as RouteValue
                        return (
                          <div key={key}>
                            <dt className="text-xs font-medium text-gray-500 mb-1.5">{label}</dt>
                            <dd>
                              <div className="rounded-lg bg-gray-50 border border-gray-200 p-3 space-y-2 text-sm">
                                {route.startAddress && (
                                  <div className="flex gap-3 items-start">
                                    <span className="shrink-0 text-xs font-semibold text-gray-400 w-6 mt-0.5">From</span>
                                    <span className="text-gray-900">{route.startAddress}</span>
                                  </div>
                                )}
                                {route.endAddress && (
                                  <div className="flex gap-3 items-start">
                                    <span className="shrink-0 text-xs font-semibold text-gray-400 w-6 mt-0.5">To</span>
                                    <span className="text-gray-900">{route.endAddress}</span>
                                  </div>
                                )}
                                {(route.distanceMiles != null || route.durationMinutes != null) && (
                                  <div className="flex gap-4 pt-2 border-t border-gray-200 text-xs text-gray-500">
                                    {route.distanceMiles != null && (
                                      <span className="font-medium text-gray-700">{route.distanceMiles.toFixed(1)} mi</span>
                                    )}
                                    {route.durationMinutes != null && (
                                      <span className="font-medium text-gray-700">{Math.round(route.durationMinutes)} min drive</span>
                                    )}
                                  </div>
                                )}
                              </div>
                            </dd>
                          </div>
                        )
                      }

                      return (
                        <div key={key} className="flex justify-between text-sm">
                          <dt className="text-gray-500">{label}</dt>
                          <dd className="text-gray-900 font-medium text-right max-w-[60%]">
                            {resolveValue(key, value, fieldMap)}
                          </dd>
                        </div>
                      )
                    })}
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
                    <div>
                      <p className="text-sm text-green-800 font-medium">Invoice sent!</p>
                      <p className="text-xs text-green-700 mt-0.5">
                        {invoiceSent === 'email+sms'
                          ? `Email → ${selected.email} · SMS → ${selectedPhone}`
                          : `Email → ${selected.email}`}
                      </p>
                    </div>
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
                    <p className="text-xs text-gray-400">
                      Email → {selected.email}{selectedPhone ? ` · SMS → ${selectedPhone}` : ''} · due in 7 days
                    </p>
                  </div>
                )}
              </section>

              {/* Send Agreement */}
              <section>
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Send Agreement</h3>
                {!selected?.email ? (
                  <p className="text-sm text-gray-500">No email address on file for this lead.</p>
                ) : agreementStatus === 'signed' ? (
                  <div className="rounded-lg bg-green-50 border border-green-200 px-4 py-3 flex items-center gap-2">
                    <svg className="w-4 h-4 text-green-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <div>
                      <p className="text-sm text-green-800 font-medium">Agreement signed!</p>
                    </div>
                  </div>
                ) : agreementStatus === 'sent' || agreementStatus === 'viewed' ? (
                  <div className="rounded-lg bg-blue-50 border border-blue-200 px-4 py-3 flex items-center gap-2">
                    <svg className="w-4 h-4 text-blue-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                      <p className="text-sm text-blue-800 font-medium">
                        Agreement {agreementStatus === 'viewed' ? 'viewed' : 'sent'}
                      </p>
                      <p className="text-xs text-blue-700 mt-0.5">Waiting for signature from {selected.email}</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {!agreementTemplateUrl && (
                      <p className="text-xs text-amber-600">
                        <a href="/settings" className="underline font-medium">Upload an agreement template in Settings</a> for a better experience.
                      </p>
                    )}
                    {agreementError && (
                      <p className="text-xs text-red-600">{agreementError}</p>
                    )}
                    <button
                      onClick={handleSendAgreement}
                      disabled={agreementSending}
                      className="w-full px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {agreementSending ? 'Sending…' : 'Send Agreement'}
                    </button>
                    <p className="text-xs text-gray-400">
                      Sends a signing link to {selected.email}
                    </p>
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
