import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { Lead } from '@/lib/types'
import CalendarView from '@/components/CalendarView'

export default async function CalendarPage() {
  const supabase = createClient()

  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/login')

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: account } = await supabase
    .from('accounts')
    .select('id, business_name')
    .eq('owner_id', user.id)
    .single()

  if (!account) redirect('/login')

  const admin = createAdminClient()
  const { data: leads } = await admin
    .from('leads')
    .select('id, account_id, hosted_form_id, name, email, phone, form_type, form_data, status, created_at')
    .eq('account_id', account.id)
    .eq('status', 'booked')
    .not('form_data->>_booking_date', 'is', null)
    .order('created_at', { ascending: true })

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <CalendarView leads={(leads ?? []) as Lead[]} />
      </div>
    </div>
  )
}
