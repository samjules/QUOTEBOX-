'use client'

import { DEMO_LEADS } from '@/lib/demo-data'

const STATUS_BADGE: Record<string, { bg: string; text: string }> = {
  new: { bg: '#eef2ff', text: '#5b5bd6' },
  contacted: { bg: '#fef3c7', text: '#b45309' },
  booked: { bg: '#dcfce7', text: '#15803d' },
  lost: { bg: '#f3f4f6', text: '#6b7280' },
}

export default function DemoLeads() {
  return (
    <div className="py-6" style={{ background: '#f5f5f7', minHeight: '100%' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-semibold text-gray-900">Leads</h1>
        <p className="mt-1 text-sm text-gray-500">Everyone who's requested a quote</p>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        <div className="bg-white shadow rounded-xl overflow-hidden">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Recent Leads</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {['Name', 'Email', 'Phone', 'Service', 'Quote', 'Status', 'Date'].map((h) => (
                    <th key={h} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {DEMO_LEADS.map((lead) => {
                  const badge = STATUS_BADGE[lead.status]
                  return (
                    <tr key={lead.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{lead.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{lead.email}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{lead.phone}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{lead.service}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">${lead.quote}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize" style={{ background: badge.bg, color: badge.text }}>
                          {lead.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(lead.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
