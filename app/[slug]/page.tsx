import { createClient } from '@supabase/supabase-js'
import { notFound } from 'next/navigation'
import type { HostedForm } from '@/lib/types'
import QuoteForm from './QuoteForm'

export default async function PublicFormPage({
  params,
}: {
  params: { slug: string }
}) {
  // Use a plain anon client (no cookie session) so visitor auth state
  // never interferes with the public RLS policy on hosted_forms.
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const { data: rows } = await supabase
    .from('hosted_forms')
    .select('*')
    .eq('form_config->>slug', params.slug)
    .eq('is_active', true)
    .limit(1)

  const form = rows?.[0] ?? null
  if (!form) notFound()

  return <QuoteForm form={form as HostedForm} />
}
