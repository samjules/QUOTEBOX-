import { createAdminClient } from '@/lib/supabase/admin'
import CrmDashboard from './CrmDashboard'

export const dynamic = 'force-dynamic'

export interface SalesLead {
  id: string
  name: string
  email: string
  phone: string | null
  tier: number
  price_per_lead: number
  monthly_total: number
  scheduled_date: string | null
  scheduled_time: string | null
  status: string
  notes: string | null
  created_at: string
  updated_at: string
}

export default async function CrmPage() {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('sales_leads')
    .select('*')
    .order('scheduled_date', { ascending: true, nullsFirst: false })
    .order('created_at', { ascending: false })

  return <CrmDashboard leads={(data ?? []) as SalesLead[]} />
}
