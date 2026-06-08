'use client'

import { useState, useMemo } from 'react'
import type { TimeEntry } from '@/lib/types'

interface MemberInfo {
  user_id: string
  name: string | null
  email: string
}

type FilterMode = 'today' | 'week' | 'month' | 'custom'

function formatDuration(ms: number) {
  const totalMin = Math.floor(ms / 60000)
  const h = Math.floor(totalMin / 60)
  const m = totalMin % 60
  if (h === 0) return `${m}m`
  return `${h}h ${m}m`
}

function formatHours(ms: number) {
  return (ms / 3600000).toFixed(1)
}

function durationMs(entry: TimeEntry) {
  const start = new Date(entry.clock_in).getTime()
  const end = entry.clock_out ? new Date(entry.clock_out).getTime() : Date.now()
  return end - start
}

function getMonday(d: Date) {
  const date = new Date(d)
  const day = date.getDay()
  const diff = day === 0 ? -6 : 1 - day
  date.setDate(date.getDate() + diff)
  return date
}

function toDateStr(d: Date) {
  return d.toISOString().slice(0, 10)
}

function computeDateRange(filter: FilterMode, customFrom: string, customTo: string): { from: string; to: string } {
  const now = new Date()
  switch (filter) {
    case 'today':
      return { from: toDateStr(now), to: toDateStr(now) }
    case 'week': {
      const monday = getMonday(now)
      return { from: toDateStr(monday), to: toDateStr(now) }
    }
    case 'month': {
      const first = new Date(now.getFullYear(), now.getMonth(), 1)
      return { from: toDateStr(first), to: toDateStr(now) }
    }
    case 'custom':
      return { from: customFrom, to: customTo }
  }
}

function filterLabel(filter: FilterMode) {
  switch (filter) {
    case 'today': return "Today's hours"
    case 'week': return 'This week'
    case 'month': return 'This month'
    case 'custom': return 'Custom range'
  }
}

function escapeCsvValue(val: string) {
  if (val.includes(',') || val.includes('"') || val.includes('\n')) {
    return `"${val.replace(/"/g, '""')}"`
  }
  return val
}

function getInitials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('')
}

export default function OwnerTimeView({
  entries,
  members,
}: {
  entries: TimeEntry[]
  members: MemberInfo[]
}) {
  const [filter, setFilter] = useState<FilterMode>('week')
  const [customFrom, setCustomFrom] = useState('')
  const [customTo, setCustomTo] = useState('')

  const { from: dateFrom, to: dateTo } = computeDateRange(filter, customFrom, customTo)

  const filtered = useMemo(() => {
    return entries.filter((e) => {
      if (dateFrom && new Date(e.clock_in) < new Date(dateFrom)) return false
      if (dateTo && new Date(e.clock_in) > new Date(dateTo + 'T23:59:59')) return false
      return true
    })
  }, [entries, dateFrom, dateTo])

  // Group by employee
  const byEmployee = useMemo(() => {
    const map = new Map<string, TimeEntry[]>()
    for (const entry of filtered) {
      const existing = map.get(entry.user_id) || []
      existing.push(entry)
      map.set(entry.user_id, existing)
    }
    return map
  }, [filtered])

  const memberName = (userId: string) => {
    const m = members.find((m) => m.user_id === userId)
    return m?.name || m?.email || userId.slice(0, 8)
  }

  // Stats
  const totalMs = filtered.reduce((sum, e) => sum + durationMs(e), 0)
  const uniqueEmployees = new Set(filtered.map((e) => e.user_id))
  const sessionCount = filtered.length
  const zeroSessions = filtered.filter((e) => e.clock_out && durationMs(e) < 60000).length
  const clockedIn = entries.filter((e) => !e.clock_out)
  const allEmployees = new Set(entries.map((e) => e.user_id))

  function exportCsv() {
    const rows = [['Employee', 'Date', 'Clock In', 'Clock Out', 'Duration', 'Notes']]
    for (const entry of filtered) {
      rows.push([
        escapeCsvValue(memberName(entry.user_id)),
        new Date(entry.clock_in).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' }),
        new Date(entry.clock_in).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        entry.clock_out
          ? new Date(entry.clock_out).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
          : 'Active',
        formatDuration(durationMs(entry)),
        escapeCsvValue(entry.notes || ''),
      ])
    }
    const csv = rows.map((r) => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `time-entries-${toDateStr(new Date())}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const filters: FilterMode[] = ['today', 'week', 'month', 'custom']
  const filterLabels: Record<FilterMode, string> = {
    today: 'Today',
    week: 'This Week',
    month: 'This Month',
    custom: 'Custom',
  }

  return (
    <div className="space-y-6">
      {/* Stats row */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total hours */}
        <div className="bg-white overflow-hidden shadow rounded-xl">
          <div className="p-5 flex items-center gap-4">
            <div className="h-12 w-12 rounded-md bg-brand-600 text-white flex-shrink-0 flex items-center justify-center">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>
            </div>
            <div>
              <p className="text-3xl font-semibold text-gray-900">{formatHours(totalMs)}h</p>
              <p className="text-sm font-medium text-gray-500">Total hours</p>
              <p className="text-xs text-gray-400 mt-0.5">{uniqueEmployees.size} employee(s) active</p>
            </div>
          </div>
        </div>

        {/* Period hours */}
        <div className="bg-white overflow-hidden shadow rounded-xl">
          <div className="p-5 flex items-center gap-4">
            <div className="h-12 w-12 rounded-md bg-yellow-500 text-white flex-shrink-0 flex items-center justify-center">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" /></svg>
            </div>
            <div>
              <p className="text-3xl font-semibold text-gray-900">{formatHours(totalMs)}h</p>
              <p className="text-sm font-medium text-gray-500">{filterLabel(filter)}</p>
              <p className="text-xs text-gray-400 mt-0.5">across {uniqueEmployees.size} employee(s)</p>
            </div>
          </div>
        </div>

        {/* Sessions */}
        <div className="bg-white overflow-hidden shadow rounded-xl">
          <div className="p-5 flex items-center gap-4">
            <div className="h-12 w-12 rounded-md bg-green-500 text-white flex-shrink-0 flex items-center justify-center">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0ZM3.75 12h.007v.008H3.75V12Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm-.375 5.25h.007v.008H3.75v-.008Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" /></svg>
            </div>
            <div>
              <p className="text-3xl font-semibold text-gray-900">{sessionCount}</p>
              <p className="text-sm font-medium text-gray-500">Sessions</p>
              <p className="text-xs text-gray-400 mt-0.5">
                {zeroSessions > 0 ? `${zeroSessions} flagged (0m)` : 'No flagged entries'}
              </p>
            </div>
          </div>
        </div>

        {/* Currently clocked in */}
        <div className="bg-white overflow-hidden shadow rounded-xl">
          <div className="p-5 flex items-center gap-4">
            <div className="h-12 w-12 rounded-md bg-brand-600 text-white flex-shrink-0 flex items-center justify-center">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 0 1 0 1.972l-11.54 6.347a1.125 1.125 0 0 1-1.667-.986V5.653Z" /></svg>
            </div>
            <div>
              <p className="text-3xl font-semibold text-gray-900">{clockedIn.length}</p>
              <p className="text-sm font-medium text-gray-500">Currently clocked in</p>
              <p className="text-xs text-gray-400 mt-0.5">of {allEmployees.size} employee(s)</p>
            </div>
          </div>
        </div>
      </div>

      {/* Team Hours card */}
      <div className="bg-white shadow rounded-xl overflow-hidden">
        {/* Toolbar */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3 flex-wrap">
            <h2 className="text-lg font-semibold text-gray-900">Team Hours</h2>
            <div className="flex items-center rounded-lg border border-gray-200 p-0.5">
              {filters.map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                    filter === f
                      ? 'bg-brand-100 text-brand-700 font-semibold'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {filterLabels[f]}
                </button>
              ))}
            </div>
          </div>
          <button
            onClick={exportCsv}
            className="bg-brand-600 text-white text-sm font-semibold rounded-lg px-4 py-2 hover:bg-brand-700 transition-colors"
          >
            Export CSV
          </button>
        </div>

        {/* Custom date inputs */}
        {filter === 'custom' && (
          <div className="px-6 py-3 border-b border-gray-200 bg-gray-50/50 flex gap-4 flex-wrap items-end">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">From</label>
              <input
                type="date"
                value={customFrom}
                onChange={(e) => setCustomFrom(e.target.value)}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">To</label>
              <input
                type="date"
                value={customTo}
                onChange={(e) => setCustomTo(e.target.value)}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none"
              />
            </div>
            {(customFrom || customTo) && (
              <button
                onClick={() => { setCustomFrom(''); setCustomTo('') }}
                className="text-sm text-gray-500 hover:text-gray-700 px-3 py-2"
              >
                Clear
              </button>
            )}
          </div>
        )}

        {/* Per-employee sections */}
        {Array.from(byEmployee.entries()).map(([userId, userEntries]) => {
          const totalMs = userEntries.reduce((sum, e) => sum + durationMs(e), 0)
          const name = memberName(userId)
          const initials = getInitials(name)
          return (
            <div key={userId}>
              {/* Employee header */}
              <div className="px-6 py-4 border-b border-gray-200 flex items-center gap-3 bg-gray-50/50">
                <div className="h-9 w-9 rounded-full bg-brand-600 text-white text-sm font-semibold flex items-center justify-center">
                  {initials}
                </div>
                <h3 className="text-base font-semibold text-gray-900">{name}</h3>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-brand-100 text-brand-700">
                  {formatDuration(totalMs)}
                </span>
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
                    {userEntries.map((entry) => {
                      const ms = durationMs(entry)
                      const isZero = entry.clock_out && ms < 60000
                      return (
                        <tr key={entry.id} className={isZero ? 'bg-amber-50/50' : ''}>
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
                          <td className={`px-6 py-3 text-sm font-medium ${isZero ? 'text-amber-600' : 'text-gray-900'}`}>
                            {isZero ? (
                              <>
                                <span className="w-2 h-2 rounded-full bg-amber-500 inline-block mr-1.5" />
                                {formatDuration(ms)}
                                <span className="px-1.5 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-700 ml-1.5">Accidental</span>
                              </>
                            ) : (
                              <>
                                <span className="w-2 h-2 rounded-full bg-green-500 inline-block mr-1.5" />
                                {formatDuration(ms)}
                              </>
                            )}
                          </td>
                          <td className="px-6 py-3 text-sm text-gray-500 max-w-[200px] truncate">
                            {entry.notes || <span className="italic text-gray-400">—</span>}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )
        })}

        {byEmployee.size === 0 && (
          <div className="p-8 text-center text-gray-500">
            No time entries found for the selected period.
          </div>
        )}
      </div>
    </div>
  )
}
