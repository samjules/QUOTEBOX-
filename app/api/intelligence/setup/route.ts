import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getAccountForUser } from '@/lib/account'

/**
 * GET /api/intelligence/setup
 * Returns the account_id (used as API key for pixel) and embed snippet.
 */
export async function GET() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const ctx = await getAccountForUser(supabase, user.id)
  if (!ctx) {
    return NextResponse.json({ error: 'No account found' }, { status: 404 })
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.quote-box.com'
  const endpoint = `${siteUrl}/api/pixel/event`

  return NextResponse.json({
    api_key: ctx.accountId,
    endpoint,
    snippet: `<script src="${siteUrl}/pixel/qb.min.js" data-api-key="${ctx.accountId}" data-endpoint="${endpoint}" async></script>`,
  })
}
