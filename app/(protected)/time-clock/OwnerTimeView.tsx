'use client'

import { useState } from 'react'
import type { TimeEntry } from '@/lib/types'

interface MemberInfo {
  user_id: string
  name: string | null
  email: string
}

function formatDuration(ms: number) {
  const totalMin = Math.floor(ms / 60000)
  const h = Math.floor(totalMin / 60)
  const m = totalMin % 60
  if (h === 0) return `${m}m`
  return `${h}h ${m}m`
}

function durationMs(entry: TimeEntry) {
  const start = new Date(entry.clock_in).getTime()
  const end = entry.clock_out ? new Date(entry.clock_out).getTime() : Date.now()
  return end - start
}

export default function OwnerTimeView({
  entries,
  members,
}: {
  entries: TimeEntry[]
  members: MemberInfo[]
}) {
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  // Filter entries by date range
  const filtered = entries.filter((e) => {
    if (dateFrom && new Date(e.clock_in) < new Date(dateFrom)) return false
    if (dateTo && new Date(e.clock_in) > new Date(dateTo + 'T23:59:59')) return false
    return true
  })

  // Group by employee
  const byEmployee = new Map<string, TimeEntry[]>()
  for (const entry of filtered) {
    const existing = byEmployee.get(entry.user_id) || []
    existing.push(entry)
    byEmployee.set(entry.user_id, existing)
  }

  const memberName = (userId: string) => {
    const m = members.find((m) => m.user_id === userId)
    return m?.name || m?.email || userId.slice(0, 8)
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-white shadow rounded-xl p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Team Hours</h2>
        <div className="flex gap-4 flex-wrap">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">From</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">To</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
            />
          </div>
          {(dateFrom || dateTo) && (
            <div className="flex items-end">
              <button
                onClick={() => { setDateFrom(''); setDateTo('') }}
                className="text-sm text-gray-500 hover:text-gray-700 px-3 py-2"
              >
                Clear
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Per-employee summary */}
      {Array.from(byEmployee.entries()).map(([userId, userEntries]) => {
        const totalMs = userEntries.reduce((sum, e) => sum + durationMs(e), 0)
        return (
          <div key={userId} className="bg-white shadow rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-base font-semibold text-gray-900">{memberName(userId)}</h3>
              <span className="text-sm font-medium text-indigo-600">{formatDuration(totalMs)} total</span>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Clock In</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Clock Out</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Duration</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Notes</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {userEntries.map((entry) => (
                    <tr key={entry.id}>
                      <td className="px-6 py-3 text-sm text-gray-900">
                        {new Date(entry.clock_in).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })}
                      </td>
                      <td className="px-6 py-3 text-sm text-gray-500">
                        {new Date(entry.clock_in).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="px-6 py-3 text-sm text-gray-500">
                        {entry.clock_out
                          ? new Date(entry.clock_out).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
                          : <span className="text-green-600 font-medium">Active</span>
                        }
                      </td>
                      <td className="px-6 py-3 text-sm font-medium text-gray-900">
                        {formatDuration(durationMs(entry))}
                      </td>
                      <td className="px-6 py-3 text-sm text-gray-500 max-w-[200px] truncate">
                        {entry.notes || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      })}

      {byEmployee.size === 0 && (
        <div className="bg-white shadow rounded-xl p-8 text-center text-gray-500">
          No time entries found for the selected period.
        </div>
      )}
    </div>
  )
}
