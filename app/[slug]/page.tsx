import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import type { HostedForm } from '@/lib/types'
import QuoteForm from './QuoteForm'

export default async function PublicFormPage({
  params,
}: {
  params: { slug: string }
}) {
  const supabase = createClient()
  const { data: form } = await supabase
    .from('hosted_forms')
    .select('*')
    .eq('form_config->>slug', params.slug)
    .eq('is_active', true)
    .single()

  if (!form) notFound()

  return <QuoteForm form={form as HostedForm} />
}
