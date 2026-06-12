import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import type { HostedForm } from '@/lib/types'
import { createAdminClient } from '@/lib/supabase/admin'
import ThankYouClient from './ThankYouClient'

export const dynamic = 'force-dynamic'

export default async function ThankYouPage({
  params,
}: {
  params: { slug: string }
}) {
  const admin = createAdminClient()

  const { data: rows } = await admin
    .from('hosted_forms')
    .select('*')
    .eq('form_config->>slug', params.slug)
    .eq('is_active', true)
    .limit(1)

  const form = rows?.[0] ?? null
  if (!form) notFound()

  return (
    <Suspense>
      <ThankYouClient form={form as HostedForm} />
    </Suspense>
  )
}
