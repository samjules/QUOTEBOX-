'use client'

import { useState, useEffect, useTransition } from 'react'
import { clockIn, clockOut } from './actions'
import type { TimeEntry } from '@/lib/types'

interface LeadOption {
  id: string
  name: string | null
}

function formatDuration(ms: number) {
  const totalSec = Math.floor(ms / 1000)
  const h = Math.floor(totalSec / 3600)
  const m = Math.floor((totalSec % 3600) / 60)
  const s = totalSec % 60
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
}

function durationBetween(start: string, end: string | null) {
  const s = new Date(start).getTime()
  const e = end ? new Date(end).getTime() : Date.now()
  return formatDuration(e - s)
}

export default function EmployeeTimeClock({
  openEntry,
  recentEntries,
  leads,
}: {
  openEntry: TimeEntry | null
  recentEntries: TimeEntry[]
  leads: LeadOption[]
}) {
  const [selectedLead, setSelectedLead] = useState<string>('')
  const [notes, setNotes] = useState('')
  const [isPending, startTransition] = useTransition()
  const [elapsed, setElapsed] = useState('00:00:00')
  const [error, setError] = useState<string | null>(null)

  // Live timer for active clock-in
  useEffect(() => {
    if (!openEntry) { setElapsed('00:00:00'); return }
    function tick() {
      setElapsed(durationBetween(openEntry!.clock_in, null))
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [openEntry])

  function handleClockIn() {
    setError(null)
    startTransition(async () => {
      try {
        await clockIn(selectedLead || null, notes || null)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to clock in')
      }
    })
  }

  function handleClockOut() {
    if (!openEntry) return
    setError(null)
    startTransition(async () => {
      try {
        await clockOut(openEntry.id)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to clock out')
      }
    })
  }

  const leadName = (id: string | null) =>
    id ? leads.find((l) => l.id === id)?.name || 'Unknown' : '-'

  return (
    <div className="space-y-6">
      {/* Clock In/Out Card */}
      <div className="bg-white shadow rounded-xl p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Time Clock</h2>

        {openEntry ? (
          <div className="space-y-4">
            <div className="text-center">
              <p className="text-sm text-gray-500 mb-1">Clocked in since {new Date(openEntry.clock_in).toLocaleTimeString()}</p>
              <p className="text-5xl font-mono font-bold text-brand-600">{elapsed}</p>
              {openEntry.lead_id && (
                <p className="text-sm text-gray-500 mt-2">Job: {leadName(openEntry.lead_id)}</p>
              )}
            </div>
            <button
              onClick={handleClockOut}
              disabled={isPending}
              className="w-full py-3 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition disabled:opacity-50"
            >
              {isPending ? 'Clocking out...' : 'Clock Out'}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Job / Lead (optional)</label>
              <select
                value={selectedLead}
                onChange={(e) => setSelectedLead(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none"
              >
                <option value="">No specific job</option>
                {leads.map((l) => (
                  <option key={l.id} value={l.id}>{l.name || `Lead ${l.id.slice(0, 8)}`}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes (optional)</label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="What are you working on?"
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none"
              />
            </div>
            <button
              onClick={handleClockIn}
              disabled={isPending}
              className="w-full py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition disabled:opacity-50"
            >
              {isPending ? 'Clocking in...' : 'Clock In'}
            </button>
          </div>
        )}

        {error && <p className="text-sm text-red-600 mt-3">{error}</p>}
      </div>

      {/* Recent Entries */}
      <div className="bg-white shadow rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-base font-semibold text-gray-900">Recent Time Entries</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Job</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Clock In</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Clock Out</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Duration</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Notes</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {recentEntries.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-sm text-gray-500">
                    No time entries yet. Clock in to get started.
                  </td>
                </tr>
              ) : (
                recentEntries.map((entry) => (
                  <tr key={entry.id}>
                    <td className="px-6 py-3 text-sm text-gray-900">
                      {new Date(entry.clock_in).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit' })}
                    </td>
                    <td className="px-6 py-3 text-sm text-gray-500">{leadName(entry.lead_id)}</td>
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
                      {durationBetween(entry.clock_in, entry.clock_out)}
                    </td>
                    <td className="px-6 py-3 text-sm text-gray-500 max-w-[200px] truncate">
                      {entry.notes || '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
