import { createAdminClient } from '@/lib/supabase/admin'
import LeadsManager from './LeadsManager'

export const dynamic = 'force-dynamic'

export interface SalesLead {
  id: string
  name: string
  email: string
  phone: string | null
  tier: number | null
  price_per_lead: number
  monthly_total: number | null
  scheduled_date: string | null
  scheduled_time: string | null
  status: string
  notes: string | null
  created_at: string
  updated_at: string
  meta_lead_id: string | null
  source: string | null
}

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
  zoom_join_url: string | null
}

export default async function LeadsPage() {
  const admin = createAdminClient()

  const [salesResult, freeTrialResult] = await Promise.all([
    admin.from('sales_leads').select('*').order('scheduled_date', { ascending: true, nullsFirst: false }).order('created_at', { ascending: false }),
    admin.from('free_trial_leads').select('*').order('scheduled_date', { ascending: true, nullsFirst: false }).order('created_at', { ascending: false }),
  ])

  return (
    <LeadsManager
      salesLeads={(salesResult.data ?? []) as SalesLead[]}
      freeTrialLeads={(freeTrialResult.data ?? []) as FreeTrialLead[]}
    />
  )
}
