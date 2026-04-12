import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getAccountForUser } from '@/lib/account'
import { getOutcomeSummary } from '@/lib/services/intelligence-repository'
import IntelligenceClient from './IntelligenceClient'

export const dynamic = 'force-dynamic'

export default async function IntelligencePage() {
  const supabase = createClient()

  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/login')

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const ctx = await getAccountForUser(supabase, user.id)
  if (!ctx) {
    return <div className="p-8 text-red-600">No account found.</div>
  }

  const summary = await getOutcomeSummary(supabase, ctx.accountId)

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.quote-box.com'
  const endpoint = `${siteUrl}/api/pixel/event`
  const snippet = `<script src="${siteUrl}/pixel/qb.min.js" data-api-key="${ctx.accountId}" data-endpoint="${endpoint}" async></script>`

  return (
    <IntelligenceClient
      accountId={ctx.accountId}
      snippet={snippet}
      summary={summary}
      mapboxToken={process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? ''}
    />
  )
}
