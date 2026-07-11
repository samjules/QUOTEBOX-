import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { cancelOwnerSequence } from '@/lib/owner-automations'
import { alaskaWallTimeToUTC } from '@/lib/alaska-time'
import { isSlotBookable } from '@/lib/booking'
import { sendBookingConfirmation } from '@/lib/sales-lead-notify'

const VALID_REVENUES = [
  'Under $10k/mo',
  '$10k–$50k/mo',
  '$50k–$100k/mo',
  '$100k+/mo',
]

// Sources a public form is allowed to self-report. 'meta' is reserved for the
// internal Meta lead-sync webhook, not settable from this client-facing route.
const VALID_PUBLIC_SOURCES = ['case_study']

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, email, phone, monthly_revenue, scheduled_date, scheduled_time, source, sms_consent } = body

    if (!name || !email) {
      return NextResponse.json({ error: 'Name and email are required' }, { status: 400 })
    }

    if (monthly_revenue && !VALID_REVENUES.includes(monthly_revenue)) {
      return NextResponse.json({ error: 'Invalid monthly revenue value' }, { status: 400 })
    }

    if (source && !VALID_PUBLIC_SOURCES.includes(source)) {
      return NextResponse.json({ error: 'Invalid source value' }, { status: 400 })
    }

    // Appointments need a real 24h buffer and nothing before 10am — enforced
    // client-side too, but re-checked here since the client can't be trusted.
    if (scheduled_date && scheduled_time && !isSlotBookable(scheduled_date, scheduled_time)) {
      return NextResponse.json({ error: 'That time is no longer available — please pick a slot at least 24 hours out.' }, { status: 400 })
    }

    const scheduledAt = scheduled_date && scheduled_time ? alaskaWallTimeToUTC(scheduled_date, scheduled_time) : null

    const supabase = createAdminClient()
    const { data, error } = await supabase.from('sales_leads').insert({
      name,
      email,
      phone: phone || null,
      monthly_revenue: monthly_revenue || null,
      scheduled_date: scheduled_date || null,
      scheduled_time: scheduled_time || null,
      scheduled_at: scheduledAt ? scheduledAt.toISOString() : null,
      source: source || null,
      sms_consent: sms_consent === true,
    }).select().single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (scheduled_date && scheduled_time) {
      try {
        await sendBookingConfirmation({ id: data.id, name, email, phone: phone || null, scheduled_date, scheduled_time })
      } catch (err) {
        console.error('Sales lead booking confirmation error:', err)
      }
    }

    // If this email belongs to a QuoteBox account owner, stop their nurture sequence
    const { data: authUsers } = await supabase.auth.admin.listUsers()
    const match = authUsers?.users?.find((u) => u.email?.toLowerCase() === email.toLowerCase())
    if (match) {
      const { data: account } = await supabase
        .from('accounts')
        .select('id')
        .eq('owner_id', match.id)
        .single()
      if (account) await cancelOwnerSequence(account.id)
    }

    return NextResponse.json({ success: true, id: data.id })
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
}
