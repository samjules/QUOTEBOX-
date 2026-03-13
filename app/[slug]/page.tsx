import { notFound } from 'next/navigation'
import type { HostedForm } from '@/lib/types'
import QuoteForm from './QuoteForm'
import { createAdminClient } from '@/lib/supabase/admin'

// Never cache — always fetch fresh form data so edits/deletes are instant
export const dynamic = 'force-dynamic'

export default async function PublicFormPage({
  params,
}: {
  params: { slug: string }
}) {
  // Use admin client (service role) so RLS never blocks reads and edits
  // appear immediately without any caching or policy delay.
  const admin = createAdminClient()

  const { data: rows } = await admin
    .from('hosted_forms')
    .select('*')
    .eq('form_config->>slug', params.slug)
    .eq('is_active', true)
    .order('updated_at', { ascending: false })
    .limit(1)

  const form = rows?.[0] ?? null
  if (!form) notFound()

  const [{ data: billing }, { data: account }] = await Promise.all([
    admin.from('billing').select('credit_balance').eq('account_id', form.account_id).single(),
    admin.from('accounts').select('business_name').eq('id', form.account_id).single(),
  ])

  const hasCredits = (billing?.credit_balance ?? 0) >= 15
  const businessName = account?.business_name ?? ''

  return <QuoteForm form={form as HostedForm} hasCredits={hasCredits} businessName={businessName} />
}
