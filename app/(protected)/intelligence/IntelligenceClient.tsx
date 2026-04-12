'use client'

import { useEffect, useState, useCallback } from 'react'
import type { OutcomeSummary, ZipAggregate, LeadRow } from '@/lib/services/intelligence-repository'
import dynamic from 'next/dynamic'

const IntelligenceMap = dynamic(() => import('./IntelligenceMap'), { ssr: false })

interface Props {
  accountId: string
  snippet: string
  summary: OutcomeSummary
  mapboxToken: string
}

export default function IntelligenceClient({ accountId, snippet, summary, mapboxToken }: Props) {
  const [tab, setTab] = useState<'overview' | 'map' | 'leads'>('overview')
  const [copied, setCopied] = useState(false)
  const [zipAggregates, setZipAggregates] = useState<ZipAggregate[]>([])
  const [leads, setLeads] = useState<LeadRow[]>([])
  const [selectedZip, setSelectedZip] = useState<string | null>(null)
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [loading, setLoading] = useState(false)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (dateFrom) params.set('dateFrom', dateFrom)
      if (dateTo) params.set('dateTo', dateTo)

      const [aggRes, leadsRes] = await Promise.all([
        fetch(`/api/intelligence/zip-aggregates?${params}`),
        fetch(`/api/intelligence/leads?${params}`),
      ])

      if (aggRes.ok) setZipAggregates(await aggRes.json())
      if (leadsRes.ok) setLeads(await leadsRes.json())
    } catch (err) {
      console.error('Failed to fetch intelligence data:', err)
    } finally {
      setLoading(false)
    }
  }, [dateFrom, dateTo])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  function copySnippet() {
    navigator.clipboard.writeText(snippet)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-semibold text-gray-900">Lead Intelligence</h1>
        <p className="mt-1 text-sm text-gray-500">Track and analyze leads from your hosted quote forms</p>
      </div>

      {/* Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {(['overview', 'map', 'leads'] as const).map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                  tab === t
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {t === 'overview' ? 'Overview' : t === 'map' ? 'Map' : 'Leads'}
              </button>
            ))}
          </nav>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 space-y-6">
        {tab === 'overview' && (
          <>
            {/* Summary cards */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-4">
              <StatCard label="Total Leads" value={summary.total_leads} color="bg-indigo-600" />
              <StatCard label="Won" value={summary.won} color="bg-green-500" />
              <StatCard label="Lost" value={summary.lost} color="bg-red-500" />
              <StatCard
                label="Close Rate"
                value={summary.close_rate > 0 ? `${(summary.close_rate * 100).toFixed(1)}%` : '—'}
                color="bg-purple-600"
              />
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
              <StatCard
                label="Avg Job Value"
                value={summary.avg_job_value > 0 ? `$${summary.avg_job_value.toFixed(0)}` : '—'}
                color="bg-yellow-500"
              />
              <StatCard
                label="Total Revenue"
                value={summary.total_revenue > 0 ? `$${summary.total_revenue.toFixed(0)}` : '—'}
                color="bg-emerald-600"
              />
              <StatCard
                label="Scored Leads"
                value={`${summary.scored_leads}/${summary.total_leads}`}
                color="bg-blue-500"
              />
            </div>

            {/* Pixel Setup */}
            <div className="bg-white shadow rounded-xl p-6">
              <h2 className="text-base font-semibold text-gray-900 mb-2">Pixel Setup</h2>
              <p className="text-sm text-gray-500 mb-4">
                Add this snippet to your website to start collecting lead intelligence from your quote forms.
              </p>
              <div className="relative">
                <pre className="bg-gray-900 text-green-400 text-xs p-4 rounded-lg overflow-x-auto">
                  {snippet}
                </pre>
                <button
                  onClick={copySnippet}
                  className="absolute top-2 right-2 bg-gray-700 hover:bg-gray-600 text-white text-xs px-3 py-1.5 rounded-md transition-colors"
                >
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-3">
                The pixel passively tracks page views, scroll depth, and form submissions. It never reads form field values.
              </p>
            </div>
          </>
        )}

        {tab === 'map' && (
          <>
            {/* Date filters */}
            <div className="flex items-center gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">From</label>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">To</label>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm"
                />
              </div>
              <button
                onClick={fetchData}
                disabled={loading}
                className="mt-5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm px-4 py-1.5 rounded-lg transition-colors disabled:opacity-50"
              >
                {loading ? 'Loading...' : 'Apply'}
              </button>
            </div>

            {/* Map */}
            <div className="bg-white shadow rounded-xl overflow-hidden" style={{ height: '500px' }}>
              {mapboxToken ? (
                <IntelligenceMap
                  token={mapboxToken}
                  zipAggregates={zipAggregates}
                  onZipClick={(zip) => setSelectedZip(zip)}
                />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400 text-sm">
                  Mapbox token not configured
                </div>
              )}
            </div>

            {/* Zip Detail Sidebar */}
            {selectedZip && (
              <ZipDetailPanel
                postalCode={selectedZip}
                onClose={() => setSelectedZip(null)}
              />
            )}
          </>
        )}

        {tab === 'leads' && (
          <LeadTable leads={leads} onRefresh={fetchData} />
        )}
      </div>
    </div>
  )
}

/* ── Sub-components ──────────────────────────────────────── */

function StatCard({ label, value, color }: { label: string; value: string | number; color: string }) {
  return (
    <div className="bg-white overflow-hidden shadow rounded-xl">
      <div className="p-5">
        <div className="flex items-center">
          <div className={`flex-shrink-0 h-12 w-12 rounded-md ${color} flex items-center justify-center text-white`}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <div className="ml-5">
            <p className="text-sm font-medium text-gray-500">{label}</p>
            <p className="text-2xl font-semibold text-gray-900">{value}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

function ZipDetailPanel({ postalCode, onClose }: { postalCode: string; onClose: () => void }) {
  const [detail, setDetail] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/intelligence/zip-detail?postalCode=${postalCode}`)
        if (res.ok) setDetail(await res.json())
      } catch {}
      setLoading(false)
    }
    load()
  }, [postalCode])

  return (
    <div className="bg-white shadow rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Zip Code: {postalCode}
        </h3>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {loading ? (
        <p className="text-sm text-gray-400">Loading...</p>
      ) : detail ? (
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div><span className="text-gray-500">City:</span> <span className="font-medium">{detail.city}</span></div>
          <div><span className="text-gray-500">State:</span> <span className="font-medium">{detail.state}</span></div>
          <div><span className="text-gray-500">Leads:</span> <span className="font-medium">{detail.lead_count}</span></div>
          <div><span className="text-gray-500">Avg Score:</span> <span className="font-medium">{detail.avg_quality_score}</span></div>
          <div><span className="text-gray-500">Close Rate:</span> <span className="font-medium">{detail.close_rate > 0 ? `${(detail.close_rate * 100).toFixed(1)}%` : '—'}</span></div>
          <div><span className="text-gray-500">Avg Job Value:</span> <span className="font-medium">{detail.avg_job_value > 0 ? `$${detail.avg_job_value.toFixed(0)}` : '—'}</span></div>
          {detail.median_income && (
            <div><span className="text-gray-500">Median Income:</span> <span className="font-medium">${detail.median_income.toLocaleString()}</span></div>
          )}
          {detail.population && (
            <div><span className="text-gray-500">Population:</span> <span className="font-medium">{detail.population.toLocaleString()}</span></div>
          )}
        </div>
      ) : (
        <p className="text-sm text-gray-400">No data available for this zip code.</p>
      )}
    </div>
  )
}

function LeadTable({ leads, onRefresh }: { leads: LeadRow[]; onRefresh: () => void }) {
  const [outcomeLoading, setOutcomeLoading] = useState<string | null>(null)

  async function setOutcome(leadId: string, status: 'won' | 'lost', actualValue?: number) {
    setOutcomeLoading(leadId)
    try {
      await fetch('/api/intelligence/outcomes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          intelligence_lead_id: leadId,
          status,
          actual_value: actualValue,
        }),
      })
      onRefresh()
    } catch {}
    setOutcomeLoading(null)
  }

  const qualityColors: Record<string, string> = {
    hot: 'bg-red-100 text-red-700',
    warm: 'bg-orange-100 text-orange-700',
    cool: 'bg-blue-100 text-blue-700',
    cold: 'bg-gray-100 text-gray-500',
  }

  return (
    <div className="bg-white shadow rounded-xl overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100">
        <h2 className="text-base font-semibold text-gray-900">Intelligence Leads</h2>
      </div>
      {leads.length === 0 ? (
        <div className="px-6 py-10 text-center text-sm text-gray-400">
          No intelligence leads yet. Set up the pixel to start tracking.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Location</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Quality</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Score</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Outcome</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 bg-white">
              {leads.map((lead) => (
                <tr key={lead.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 text-sm">
                    <p className="font-medium text-gray-900">{lead.city ?? '—'}, {lead.region ?? ''}</p>
                    <p className="text-xs text-gray-400">{lead.postal_code ?? '—'}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold ${qualityColors[lead.quality] ?? qualityColors.cold}`}>
                      {lead.quality}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right text-sm font-medium text-gray-900">
                    {lead.quality_score?.toFixed(1) ?? '—'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {new Date(lead.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {lead.outcome_status ? (
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${
                        lead.outcome_status === 'won' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'
                      }`}>
                        {lead.outcome_status}
                        {lead.actual_value ? ` ($${lead.actual_value})` : ''}
                      </span>
                    ) : (
                      <span className="text-gray-400 text-xs">No outcome</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    {!lead.outcome_status && (
                      <div className="flex gap-1 justify-end">
                        <button
                          onClick={() => setOutcome(lead.id, 'won')}
                          disabled={outcomeLoading === lead.id}
                          className="text-xs bg-green-50 text-green-700 hover:bg-green-100 px-2 py-1 rounded transition-colors disabled:opacity-50"
                        >
                          Won
                        </button>
                        <button
                          onClick={() => setOutcome(lead.id, 'lost')}
                          disabled={outcomeLoading === lead.id}
                          className="text-xs bg-red-50 text-red-600 hover:bg-red-100 px-2 py-1 rounded transition-colors disabled:opacity-50"
                        >
                          Lost
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
