import { createAdminClient } from '@/lib/supabase/admin'
import MetaMockupManager from './MetaMockupManager'

export const metadata = { title: 'Meta Mockup — Admin' }

export default async function MetaMockupPage() {
  const admin = createAdminClient()

  // Load all hosted forms with account business names
  const { data: forms } = await admin
    .from('hosted_forms')
    .select('id, form_name, form_config, account_id, accounts(business_name)')
    .order('created_at', { ascending: false })

  // Load existing mockups
  const { data: mockups } = await admin
    .from('meta_mockups')
    .select('*')
    .order('created_at', { ascending: false })

  const formOptions = (forms ?? []).map((f) => ({
    id: f.id,
    form_name: f.form_name as string,
    slug: (f.form_config as Record<string, unknown>)?.slug as string ?? '',
    business_name: (f.accounts as unknown as { business_name: string | null } | null)?.business_name ?? 'Unknown',
  }))

  return <MetaMockupManager forms={formOptions} initialMockups={mockups ?? []} />
}
