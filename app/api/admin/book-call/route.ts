import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { alaskaWallTimeToUTC } from '@/lib/alaska-time'
import { createZoomMeeting } from '@/lib/zoom'
import { sendBookingConfirmation } from '@/lib/sales-lead-notify'
import { sendMetaCapiEvent } from '@/lib/meta-capi'

async function requireAdmin() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false
  const adminEmails = (process.env.ADMIN_EMAILS ?? '').split(',').map((e) => e.trim().toLowerCase())
  return adminEmails.includes((user.email ?? '').toLowerCase())
}

// Admin-only: book a Zoom call directly (phone sales) — no 24h buffer or
// 10am-earliest restriction, since this is a real person on the phone with a
// prospect right now, not a self-serve public form.
export async function POST(req: NextRequest) {
  if (!(await requireAdmin())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  try {
    const body = await req.json()
    const { name, email, phone, scheduled_date, scheduled_time, notes, client_timezone } = body

    if (!name || !email || !scheduled_date || !scheduled_time) {
      return NextResponse.json({ error: 'Name, email, date, and time are required' }, { status: 400 })
    }

    const scheduledAt = alaskaWallTimeToUTC(scheduled_date, scheduled_time)
    if (!scheduledAt) {
      return NextResponse.json({ error: 'Could not parse the selected date/time' }, { status: 400 })
    }

    let zoomMeetingId: string | null = null
    let zoomJoinUrl: string | null = null
    try {
      const meeting = await createZoomMeeting(`Quotebox call with ${name}`, scheduledAt.toISOString())
      zoomMeetingId = meeting.id
      zoomJoinUrl = meeting.joinUrl
    } catch (err) {
      console.error('Book-call Zoom meeting creation failed:', err)
      // Still book the call — just without a Zoom link, rather than failing the whole booking.
    }

    const admin = createAdminClient()
    const { data, error } = await admin.from('sales_leads').insert({
      name,
      email,
      phone: phone || null,
      scheduled_date,
      scheduled_time,
      scheduled_at: scheduledAt.toISOString(),
      source: 'phone_sales',
      notes: notes || null,
      zoom_meeting_id: zoomMeetingId,
      zoom_join_url: zoomJoinUrl,
      client_timezone: client_timezone || null,
    }).select().single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    try {
      await sendBookingConfirmation({ id: data.id, name, email, phone: phone || null, scheduled_date, scheduled_time, zoom_join_url: zoomJoinUrl, client_timezone: client_timezone || null })
    } catch (err) {
      console.error('Book-call confirmation error:', err)
    }
    sendMetaCapiEvent({ eventName: 'New', email, phone: phone || null }).catch(() => {})

    return NextResponse.json({ success: true, id: data.id, zoomJoinUrl })
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
}
