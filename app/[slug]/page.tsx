import { notFound } from 'next/navigation'
import type { HostedForm } from '@/lib/types'
import QuoteForm from './QuoteForm'
import QuizForm from './QuizForm'
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

  const { data: account } = await admin
    .from('accounts')
    .select('business_name')
    .eq('id', form.account_id)
    .single()

  const businessName = account?.business_name ?? ''

  const typedForm = form as HostedForm
  if (typedForm.form_config?.quiz) {
    return <QuizForm form={typedForm} businessName={businessName} />
  }

  return <QuoteForm form={typedForm} businessName={businessName} />
}
