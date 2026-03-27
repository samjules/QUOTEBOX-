import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getAccountForUser } from '@/lib/account'
import EmployeeTimeClock from './EmployeeTimeClock'
import OwnerTimeView from './OwnerTimeView'

export default async function TimeClockPage() {
  const supabase = createClient()

  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/login')

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const ctx = await getAccountForUser(supabase, user.id)
  if (!ctx) redirect('/login')

  const admin = createAdminClient()

  if (ctx.role === 'owner') {
    // Owner sees all employee time entries
    const { data: entries } = await admin
      .from('time_entries')
      .select('*')
      .eq('account_id', ctx.accountId)
      .order('clock_in', { ascending: false })
      .limit(200)

    const { data: members } = await admin
      .from('account_members')
      .select('user_id, name, email')
      .eq('account_id', ctx.accountId)
      .not('user_id', 'is', null)

    return (
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-2xl font-semibold text-gray-900">Time Clock</h1>
          <p className="mt-1 text-sm text-gray-500">View and export employee hours</p>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-4">
          <OwnerTimeView
            entries={entries ?? []}
            members={(members ?? []).filter((m): m is { user_id: string; name: string | null; email: string } => !!m.user_id)}
          />
        </div>
      </div>
    )
  }

  // Employee view
  const { data: openEntry } = await supabase
    .from('time_entries')
    .select('*')
    .eq('user_id', user.id)
    .is('clock_out', null)
    .limit(1)
    .single()

  const { data: recentEntries } = await supabase
    .from('time_entries')
    .select('*')
    .eq('user_id', user.id)
    .order('clock_in', { ascending: false })
    .limit(50)

  // Leads for the job selector
  const { data: leads } = await admin
    .from('leads')
    .select('id, name')
    .eq('account_id', ctx.accountId)
    .in('status', ['new', 'contacted', 'booked'])
    .order('created_at', { ascending: false })
    .limit(100)

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-semibold text-gray-900">Time Clock</h1>
        <p className="mt-1 text-sm text-gray-500">Track your working hours</p>
      </div>
      <div className="max-w-2xl mx-auto px-4 sm:px-6 md:px-8 py-4">
        <EmployeeTimeClock
          openEntry={openEntry ?? null}
          recentEntries={recentEntries ?? []}
          leads={(leads ?? []).map((l) => ({ id: l.id, name: l.name }))}
        />
      </div>
    </div>
  )
}
