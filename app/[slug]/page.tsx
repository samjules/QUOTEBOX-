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

  return (
    <>
      <link
        href="https://api.mapbox.com/mapbox-gl-js/v3.0.0/mapbox-gl.css"
        rel="stylesheet"
      />
      <QuoteForm form={form as HostedForm} />
    </>
  )
}
