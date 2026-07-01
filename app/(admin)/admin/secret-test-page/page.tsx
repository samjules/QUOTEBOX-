import { createAdminClient } from '@/lib/supabase/admin'
import SecretTestPageManager from './SecretTestPageManager'

export interface FreeTrialLead {
  id: string
  name: string
  email: string
  phone: string
  has_junk_or_moving_company: boolean
  can_spend_50_per_day: boolean
  willing_ios_app: boolean
  qualified: boolean
  scheduled_date: string | null
  scheduled_time: string | null
  status: string
  reminder_sent_at: string | null
  confirmed_at: string | null
  cancelled_at: string | null
  created_at: string
}

export default async function SecretTestPage() {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('free_trial_leads')
    .select('*')
    .order('scheduled_date', { ascending: true, nullsFirst: false })
    .order('created_at', { ascending: false })

  return <SecretTestPageManager leads={(data ?? []) as FreeTrialLead[]} />
}
