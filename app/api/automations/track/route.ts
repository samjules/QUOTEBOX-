import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

// 1x1 transparent GIF
const PIXEL = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64')

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const event = searchParams.get('e')   // 'o' = open, 'c' = click
  const accountId = searchParams.get('a')
  const leadId = searchParams.get('l')
  const step = searchParams.get('s')
  const redirectUrl = searchParams.get('r')

  if (accountId && leadId && step && event) {
    const eventType = event === 'o' ? 'email_open' : event === 'c' ? 'link_click' : null
    if (eventType) {
      const admin = createAdminClient()
      admin.from('automation_events').insert({
        account_id: accountId,
        lead_id: leadId,
        step,
        event_type: eventType,
      }).then(() => {}).catch(() => {})
    }
  }

  if (event === 'c' && redirectUrl) {
    return NextResponse.redirect(decodeURIComponent(redirectUrl))
  }

  return new NextResponse(PIXEL, {
    status: 200,
    headers: {
      'Content-Type': 'image/gif',
      'Cache-Control': 'no-store, no-cache, must-revalidate',
    },
  })
}
