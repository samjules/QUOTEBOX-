import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createAdminClient } from '@/lib/supabase/admin'
import { alaskaWallTimeToUTC, isQualified, buildBookingConfirmationEmail, buildBookingConfirmationSms } from '@/lib/free-trial'
import { sendSms } from '@/lib/sms'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      name, email, phone,
      hasJunkOrMovingCompany, canSpend50PerDay, willingIosApp,
      scheduled_date, scheduled_time,
    } = body

    if (!name || !email || !phone) {
      return NextResponse.json({ error: 'Name, email, and phone are required' }, { status: 400 })
    }
    if (typeof hasJunkOrMovingCompany !== 'boolean' || typeof canSpend50PerDay !== 'boolean' || typeof willingIosApp !== 'boolean') {
      return NextResponse.json({ error: 'Missing qualification answers' }, { status: 400 })
    }

    const qualified = isQualified({ hasJunkOrMovingCompany, canSpend50PerDay, willingIosApp })
    if (!qualified) {
      return NextResponse.json({ error: 'Not qualified' }, { status: 400 })
    }
    if (!scheduled_date || !scheduled_time) {
      return NextResponse.json({ error: 'Please pick a date and time' }, { status: 400 })
    }

    const scheduledAt = alaskaWallTimeToUTC(scheduled_date, scheduled_time)
    if (!scheduledAt) {
      return NextResponse.json({ error: 'Invalid time' }, { status: 400 })
    }

    const supabase = createAdminClient()
    const { data, error } = await supabase.from('free_trial_leads').insert({
      name,
      email,
      phone,
      has_junk_or_moving_company: hasJunkOrMovingCompany,
      can_spend_50_per_day: canSpend50PerDay,
      willing_ios_app: willingIosApp,
      qualified: true,
      scheduled_date,
      scheduled_time,
      scheduled_at: scheduledAt.toISOString(),
    }).select().single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Best-effort instant confirmation — don't fail the booking if these error out
    const firstName = name.trim().split(/\s+/)[0] || 'there'
    const dateLabel = new Date(scheduled_date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })

    const apiKey = process.env.RESEND_API_KEY
    const from = process.env.RESEND_FROM_EMAIL || 'Sam at QuoteBox <sam@quote-box.com>'
    if (apiKey) {
      try {
        const resend = new Resend(apiKey)
        const { subject, html } = buildBookingConfirmationEmail(firstName, dateLabel, scheduled_time)
        await resend.emails.send({ from, to: email, subject, html })
      } catch (err) {
        console.error('Free trial booking confirmation email error:', err)
      }
    }
    try {
      await sendSms(phone, buildBookingConfirmationSms(firstName, dateLabel, scheduled_time))
    } catch (err) {
      console.error('Free trial booking confirmation SMS error:', err)
    }

    return NextResponse.json({ success: true, id: data.id })
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
}
