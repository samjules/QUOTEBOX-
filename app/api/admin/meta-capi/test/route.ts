import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

async function requireAdmin() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false
  const adminEmails = (process.env.ADMIN_EMAILS ?? '').split(',').map((e) => e.trim().toLowerCase())
  return adminEmails.includes((user.email ?? '').toLowerCase())
}

// Fires one real Meta CAPI event with dummy data and returns Meta's raw
// response, so you can confirm the token + dataset connection works without
// going through a full lead-capture flow. Visit this URL while logged in as
// admin: /api/admin/meta-capi/test
export async function GET() {
  if (!(await requireAdmin())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const token = process.env.META_CAPI_ACCESS_TOKEN
  if (!token) return NextResponse.json({ error: 'META_CAPI_ACCESS_TOKEN is not set' }, { status: 400 })

  const testEventCode = process.env.META_CAPI_TEST_EVENT_CODE
  const { createHash } = await import('crypto')
  const sha256 = (v: string) => createHash('sha256').update(v.trim().toLowerCase()).digest('hex')

  const payload = {
    data: [{
      action_source: 'system_generated',
      event_name: 'New',
      event_time: Math.floor(Date.now() / 1000),
      custom_data: { event_source: 'crm', lead_event_source: 'Quotebox' },
      user_data: { em: [sha256('test@quote-box.com')], ph: [sha256('19075551234')] },
    }],
    ...(testEventCode ? { test_event_code: testEventCode } : {}),
  }

  const res = await fetch(`https://graph.facebook.com/v25.0/614817694167232/events?access_token=${token}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  const body = await res.json().catch(() => null)

  return NextResponse.json({ metaStatus: res.status, metaResponse: body, sentTestEventCode: testEventCode ?? null })
}
