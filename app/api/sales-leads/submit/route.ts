import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

const VALID_REVENUES = [
  'Under $10k/mo',
  '$10k–$50k/mo',
  '$50k–$100k/mo',
  '$100k+/mo',
]

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, email, phone, monthly_revenue, scheduled_date, scheduled_time } = body

    if (!name || !email) {
      return NextResponse.json({ error: 'Name and email are required' }, { status: 400 })
    }

    if (monthly_revenue && !VALID_REVENUES.includes(monthly_revenue)) {
      return NextResponse.json({ error: 'Invalid monthly revenue value' }, { status: 400 })
    }

    const supabase = createAdminClient()
    const { data, error } = await supabase.from('sales_leads').insert({
      name,
      email,
      phone: phone || null,
      monthly_revenue: monthly_revenue || null,
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
