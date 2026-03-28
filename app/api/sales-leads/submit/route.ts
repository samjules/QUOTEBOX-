import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

const VALID_TIERS = [25, 50, 100, 200]
const PRICE_PER_LEAD = 30

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, email, phone, tier, scheduled_date, scheduled_time } = body

    if (!name || !email || !tier) {
      return NextResponse.json({ error: 'Name, email, and tier are required' }, { status: 400 })
    }

    if (!VALID_TIERS.includes(tier)) {
      return NextResponse.json({ error: 'Invalid tier' }, { status: 400 })
    }

    const monthly_total = tier * PRICE_PER_LEAD

    const supabase = createAdminClient()
    const { data, error } = await supabase.from('sales_leads').insert({
      name,
      email,
      phone: phone || null,
      tier,
      price_per_lead: PRICE_PER_LEAD,
      monthly_total,
      scheduled_date: scheduled_date || null,
      scheduled_time: scheduled_time || null,
    }).select().single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, id: data.id })
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
}
