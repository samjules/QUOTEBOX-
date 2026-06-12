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
    <div
      className="flex items-center p-1 gap-0.5"
      style={{
        background: 'rgba(0,0,0,0.12)',
        borderRadius: 10,
        backdropFilter: 'blur(8px)',
        border: '1px solid rgba(255,255,255,0.15)',
      }}
    >
      {OPTIONS.map((opt) => {
        const isActive = active === opt.value
        return (
          <button
            key={opt.value}
            onClick={() => select(opt.value)}
            className="relative px-3 py-1.5 text-[13px] font-medium rounded-[7px] transition-all duration-150 outline-none focus-visible:ring-2 focus-visible:ring-[#5b5bd6]"
            style={isActive ? {
              background: 'rgba(255,255,255,0.95)',
              color: '#111',
              boxShadow: '0 1px 4px rgba(0,0,0,0.14), 0 0 0 0.5px rgba(0,0,0,0.06)',
            } : {
              color: 'rgba(255,255,255,0.7)',
              background: 'transparent',
            }}
          >
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}
