import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}))
  const event = typeof body.event === 'string' ? body.event.slice(0, 60) : null
  if (!event) return NextResponse.json({ error: 'event required' }, { status: 400 })

  const admin = createAdminClient()
  const { error } = await admin.from('build_funnel_events').insert({ event })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
