'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updateLeadStatus(leadId: string, status: string) {
  const supabase = createClient()
  await supabase.from('leads').update({ status }).eq('id', leadId)
  revalidatePath('/leads')
}
