'use server'

import { createClient } from '@/lib/supabase/server'
import { getAccountForUser } from '@/lib/account'
import { revalidatePath } from 'next/cache'

export async function clockIn(leadId: string | null, notes: string | null) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const ctx = await getAccountForUser(supabase, user.id)
  if (!ctx) throw new Error('No account found')

  // Prevent double clock-in
  const { data: open } = await supabase
    .from('time_entries')
    .select('id')
    .eq('user_id', user.id)
    .is('clock_out', null)
    .limit(1)
    .single()

  if (open) throw new Error('Already clocked in')

  const { error } = await supabase.from('time_entries').insert({
    account_id: ctx.accountId,
    user_id: user.id,
    lead_id: leadId || null,
    notes: notes || null,
  })

  if (error) throw new Error(error.message)
  revalidatePath('/time-clock')
}

export async function clockOut(entryId: string) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { error } = await supabase
    .from('time_entries')
    .update({ clock_out: new Date().toISOString() })
    .eq('id', entryId)
    .eq('user_id', user.id)

  if (error) throw new Error(error.message)
  revalidatePath('/time-clock')
}
