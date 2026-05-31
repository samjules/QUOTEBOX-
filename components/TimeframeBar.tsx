'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'

const OPTIONS = [
  { label: 'Today', value: 'today' },
  { label: 'Week', value: 'week' },
  { label: 'Month', value: 'month' },
  { label: 'Year', value: 'year' },
  { label: 'All Time', value: 'all' },
]

export default function TimeframeBar({ active }: { active: string }) {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()

  function select(value: string) {
    const next = new URLSearchParams(params.toString())
    next.set('timeframe', value)
    router.push(`${pathname}?${next.toString()}`)
  }

  return (
    <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1 w-fit">
      {OPTIONS.map((opt) => (
        <button
          key={opt.value}
          onClick={() => select(opt.value)}
          className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
            active === opt.value
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}
