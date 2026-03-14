'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { Lead } from '@/lib/types'

interface Props {
  leads: Lead[]
}

const DAY_HEADERS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

export default function CalendarView({ leads }: Props) {
  const [currentMonth, setCurrentMonth] = useState(() => new Date())
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null)

  const year = currentMonth.getFullYear()
  const month = currentMonth.getMonth()

  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const totalCells = Math.ceil((firstDay + daysInMonth) / 7) * 7

  // Group booked leads by their _booking_date (YYYY-MM-DD)
  const leadsByDate = leads.reduce<Record<string, Lead[]>>((acc, lead) => {
    const date = (lead.form_data as Record<string, unknown>)?._booking_date as string | undefined
    if (!date) return acc
    acc[date] = [...(acc[date] ?? []), lead]
    return acc
  }, {})

  const todayStr = new Date().toISOString().slice(0, 10)

  function prevMonth() {
    setCurrentMonth(d => new Date(d.getFullYear(), d.getMonth() - 1, 1))
    setSelectedLeadId(null)
  }

  function nextMonth() {
    setCurrentMonth(d => new Date(d.getFullYear(), d.getMonth() + 1, 1))
    setSelectedLeadId(null)
  }

  function cellDateStr(dayNum: number) {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`
  }

  const monthPrefix = `${year}-${String(month + 1).padStart(2, '0')}-`
  const hasLeadsThisMonth = Object.keys(leadsByDate).some(d => d.startsWith(monthPrefix))

  function pillStyle(status: Lead['status']) {
    if (status === 'booked') return { bg: 'bg-indigo-600 hover:bg-indigo-700', detail: 'bg-indigo-50 border-indigo-200', accent: 'text-indigo-700' }
    return { bg: 'bg-yellow-400 hover:bg-yellow-500', detail: 'bg-yellow-50 border-yellow-200', accent: 'text-yellow-700' }
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Calendar</h1>
        <div className="flex items-center gap-3">
          <button
            onClick={prevMonth}
            className="p-2 rounded-lg hover:bg-gray-100 transition text-gray-600"
            aria-label="Previous month"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <span className="text-lg font-semibold text-gray-800 w-44 text-center">
            {MONTH_NAMES[month]} {year}
          </span>
          <button
            onClick={nextMonth}
            className="p-2 rounded-lg hover:bg-gray-100 transition text-gray-600"
            aria-label="Next month"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Calendar card */}
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
        {/* Day headers */}
        <div className="grid grid-cols-7 border-b border-gray-200">
          {DAY_HEADERS.map(day => (
            <div key={day} className="py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide">
              {day}
            </div>
          ))}
        </div>

        {/* Grid cells */}
        <div className="grid grid-cols-7">
          {Array.from({ length: totalCells }).map((_, idx) => {
            const dayNum = idx - firstDay + 1
            const isCurrentMonth = dayNum >= 1 && dayNum <= daysInMonth
            const dateStr = isCurrentMonth ? cellDateStr(dayNum) : ''
            const isToday = dateStr === todayStr
            const dayLeads = isCurrentMonth ? (leadsByDate[dateStr] ?? []) : []

            return (
              <div
                key={idx}
                className={`min-h-[100px] border-b border-r border-gray-100 p-1.5 ${
                  !isCurrentMonth ? 'bg-gray-50' : ''
                }`}
              >
                {isCurrentMonth && (
                  <>
                    {/* Day number */}
                    <div className={`flex justify-end mb-1`}>
                      <span
                        className={`text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full ${
                          isToday
                            ? 'bg-indigo-600 text-white'
                            : 'text-gray-500'
                        }`}
                      >
                        {dayNum}
                      </span>
                    </div>

                    {/* Event pills */}
                    <div className="space-y-1">
                      {dayLeads.map(lead => {
                        const ps = pillStyle(lead.status)
                        const isBooked = lead.status === 'booked'
                        return (
                        <div key={lead.id}>
                          <button
                            onClick={() =>
                              setSelectedLeadId(prev => (prev === lead.id ? null : lead.id))
                            }
                            className={`w-full text-left px-2 py-1 rounded text-xs font-medium truncate transition ${ps.bg} ${isBooked ? 'text-white' : 'text-gray-900'}`}
                          >
                            {lead.name ?? 'Unnamed'}
                            {(lead.form_data as Record<string, unknown>)?._amount
                              ? ` · $${(lead.form_data as Record<string, unknown>)._amount}`
                              : ''}
                          </button>

                          {/* Inline detail panel */}
                          {selectedLeadId === lead.id && (
                            <div className={`mt-1 p-2 border rounded text-xs text-gray-700 space-y-0.5 ${ps.detail}`}>
                              <p className="font-semibold text-gray-900">{lead.name ?? '—'}</p>
                              {lead.phone && <p>{lead.phone}</p>}
                              {lead.email && <p className="truncate">{lead.email}</p>}
                              <p className={`font-medium ${ps.accent}`}>{dateStr}</p>
                              {(lead.form_data as Record<string, unknown>)?._amount != null && (
                                <p>${String((lead.form_data as Record<string, unknown>)._amount)}</p>
                              )}
                              <p className="capitalize text-gray-500">{lead.status}</p>
                              <Link
                                href="/leads"
                                className={`inline-block mt-1 hover:underline font-medium ${ps.accent}`}
                              >
                                View in Leads →
                              </Link>
                            </div>
                          )}
                        </div>
                        )
                      })}
                    </div>
                  </>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Empty state */}
      {!hasLeadsThisMonth && (
        <p className="mt-8 text-center text-gray-400 text-sm">
          No appointments scheduled this month.
        </p>
      )}
    </div>
  )
}
