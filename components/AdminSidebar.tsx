'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface NavItem {
  href: string
  label: string
  icon: React.ReactNode
  group?: number
}

const navItems: NavItem[] = [
  {
    href: '/admin', label: 'Accounts', group: 1,
    icon: <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
  },
  {
    href: '/admin/crm', label: 'CRM', group: 1,
    icon: <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>,
  },
  {
    href: '/admin/owner-automations', label: 'Owner Automations', group: 1,
    icon: <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>,
  },
  {
    href: '/admin/meta-mockup', label: 'Meta Mockup', group: 1,
    icon: <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 18.5A2.5 2.5 0 1012 13.5 2.5 2.5 0 0012 18.5zM12 13.5V7m0 0l-3 3m3-3l3 3" /><rect x="3" y="3" width="18" height="18" rx="3" strokeWidth={1.75}/></svg>,
  },
  {
    href: '/admin/secret-test-page', label: 'Bookings', group: 1,
    icon: <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 15a3 3 0 100-6 3 3 0 000 6z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>,
  },
  {
    href: '/dashboard', label: 'Back to App', group: 2,
    icon: <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>,
  },
]

function NavDivider() {
  return <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '6px 12px' }} />
}

export default function AdminSidebar() {
  const pathname = usePathname()
  const router = useRouter()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const rendered: React.ReactNode[] = []
  let lastGroup: number | undefined = undefined
  for (const item of navItems) {
    if (lastGroup !== undefined && item.group !== lastGroup) {
      rendered.push(<NavDivider key={`div-${item.group}`} />)
    }
    lastGroup = item.group
    const isActive = item.href === '/admin'
      ? pathname === '/admin'
      : pathname === item.href || pathname.startsWith(item.href + '/')

    rendered.push(
      <Link
        key={item.href}
        href={item.href}
        className="group flex items-center gap-3 px-3 py-[9px] mx-1 rounded-lg text-[13px] font-medium transition-all duration-150 active:scale-95 focus-visible:outline-none"
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
      </Link>
    )
  }

  return (
    <div
      className="w-60 flex-shrink-0 flex flex-col h-full"
      style={{ background: '#13122b', borderRight: '1px solid rgba(255,255,255,0.07)' }}
    >
      {/* Brand */}
      <div
        className="flex items-center px-5 py-5 flex-shrink-0"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}
      >
        <div className="flex items-center gap-3">
          <img src="/quotebox_icon.png" alt="QuoteBox" className="w-8 h-8 rounded-xl object-cover flex-shrink-0" />
          <div>
            <span className="text-white font-bold text-[15px] leading-none tracking-tight block" style={{ fontFamily: "'Nautic', sans-serif" }}>
              QuoteBox
            </span>
            <span className="text-[10px] font-semibold tracking-widest uppercase" style={{ color: '#ffe500', opacity: 0.8 }}>Admin</span>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3">
        {rendered}
      </nav>

      {/* Sign out */}
      <div className="p-3 pt-2" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-all duration-150 active:scale-95"
          style={{ color: 'rgba(255,255,255,0.4)', background: 'transparent' }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLElement).style.background = 'rgba(239,68,68,0.1)'
            ;(e.currentTarget as HTMLElement).style.color = '#f87171'
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLElement).style.background = 'transparent'
            ;(e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.4)'
          }}
        >
          <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Sign out
        </button>
      </div>
    </div>
  )
}
