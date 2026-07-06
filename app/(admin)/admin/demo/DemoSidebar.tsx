'use client'

import { DEMO_BUSINESS_NAME } from '@/lib/demo-data'

export type DemoTab = 'dashboard' | 'leads' | 'calendar' | 'hosted-forms' | 'form-builder' | 'analytics' | 'billing'

interface NavItem {
  tab: DemoTab
  label: string
  icon: React.ReactNode
  group: number
}

const navItems: NavItem[] = [
  { tab: 'dashboard', label: 'Dashboard', group: 1, icon: <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg> },
  { tab: 'leads', label: 'Leads', group: 1, icon: <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg> },
  { tab: 'calendar', label: 'Calendar', group: 1, icon: <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 9v7.5" /></svg> },
  { tab: 'hosted-forms', label: 'Hosted Forms', group: 2, icon: <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg> },
  { tab: 'form-builder', label: 'Form Builder', group: 2, icon: <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg> },
  { tab: 'analytics', label: 'Analytics', group: 2, icon: <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg> },
  { tab: 'billing', label: 'Billing & Credits', group: 3, icon: <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg> },
]

function NavDivider() {
  return <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '6px 12px' }} />
}

export default function DemoSidebar({ activeTab, onSelect, onExit }: { activeTab: DemoTab; onSelect: (t: DemoTab) => void; onExit: () => void }) {
  const rendered: React.ReactNode[] = []
  let lastGroup: number | undefined = undefined
  for (const item of navItems) {
    if (lastGroup !== undefined && item.group !== lastGroup) {
      rendered.push(<NavDivider key={`div-${item.group}`} />)
    }
    lastGroup = item.group
    const isActive = activeTab === item.tab
    rendered.push(
      <button
        key={item.tab}
        onClick={() => onSelect(item.tab)}
        className="group flex items-center gap-3 px-3 py-[9px] mx-1 rounded-lg text-[13px] font-medium transition-all duration-150 active:scale-95 w-[calc(100%-8px)] text-left"
        style={isActive ? {
          background: 'rgba(91,91,214,0.2)',
          color: '#b8b8f0',
          borderLeft: '2px solid #5b5bd6',
          paddingLeft: 10,
        } : {
          color: 'rgba(255,255,255,0.55)',
          borderLeft: '2px solid transparent',
          paddingLeft: 10,
        }}
        onMouseEnter={e => {
          if (!isActive) {
            (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.06)'
            ;(e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.88)'
          }
        }}
        onMouseLeave={e => {
          if (!isActive) {
            (e.currentTarget as HTMLElement).style.background = 'transparent'
            ;(e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.55)'
          }
        }}
      >
        <span className="flex-shrink-0 w-[18px] h-[18px] flex items-center justify-center">
          {item.icon}
        </span>
        {item.label}
      </button>
    )
  }

  return (
    <div className="w-60 flex-shrink-0 flex flex-col h-full" style={{ background: '#13122b', borderRight: '1px solid rgba(255,255,255,0.07)' }}>
      {/* Logo / Brand */}
      <div className="flex items-center px-5 py-5 flex-shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        <div className="flex items-center gap-3">
          <img src="/quotebox_icon.png" alt="QuoteBox" className="w-8 h-8 rounded-xl object-cover flex-shrink-0" />
          <span className="text-white font-bold text-[15px] leading-none tracking-tight" style={{ fontFamily: "'Nautic', sans-serif" }}>
            QuoteBox
          </span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3">
        {rendered}
      </nav>

      {/* Business name (stands in for the real client-logo slot) */}
      <div className="flex items-center justify-center px-4 py-3" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <span className="text-white/60 text-[12px] font-semibold truncate">{DEMO_BUSINESS_NAME}</span>
      </div>

      {/* User + Sign Out */}
      <div className="p-3 pt-2" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        <div className="flex items-center gap-2.5 px-2 py-2 mb-1">
          <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0" style={{ background: 'rgba(91,91,214,0.5)' }}>
            S
          </div>
          <span className="text-[12px] text-white/40 truncate">My Account</span>
        </div>
        <button
          onClick={onExit}
          className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-all duration-150 active:scale-95"
          style={{ color: 'rgba(255,255,255,0.4)', background: 'transparent' }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(239,68,68,0.1)'; (e.currentTarget as HTMLElement).style.color = '#f87171' }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.4)' }}
        >
          <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Exit demo
        </button>
      </div>
    </div>
  )
}
