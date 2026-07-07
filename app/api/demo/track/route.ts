import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isDemoVariant } from '@/lib/demo-variant'

export async function POST(req: NextRequest) {
  try {
    const { variant, event } = await req.json()

    if (!isDemoVariant(variant)) {
      return NextResponse.json({ error: 'Invalid variant' }, { status: 400 })
    }
    if (event !== 'view' && event !== 'booked') {
      return NextResponse.json({ error: 'Invalid event' }, { status: 400 })
    }

    const supabase = createAdminClient()
    const { error } = await supabase
      .from('demo_variant_events')
      .insert({ variant, event_type: event })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
}
