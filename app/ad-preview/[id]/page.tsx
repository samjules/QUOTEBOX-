import { createAdminClient } from '@/lib/supabase/admin'
import { notFound } from 'next/navigation'
import AdPreviewClient from './AdPreviewClient'

export const metadata = { title: 'Ad Preview' }

export default async function AdPreviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const admin = createAdminClient()
  const { data: mockup } = await admin
    .from('meta_mockups')
    .select('*')
    .eq('id', id)
    .single()

  if (!mockup) notFound()

  return <AdPreviewClient mockup={mockup} />
}
