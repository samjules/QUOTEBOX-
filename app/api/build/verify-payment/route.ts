import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendSms } from '@/lib/sms'

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}))
  const sessionId = typeof body.sessionId === 'string' ? body.sessionId : null
  const accountId = typeof body.accountId === 'string' ? body.accountId : null

  if (!sessionId || !accountId) {
    return NextResponse.json({ error: 'sessionId and accountId required' }, { status: 400 })
  }

  const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/verify-subscription-session`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
    },
    body: JSON.stringify({ sessionId, accountId }),
  })

  const data = await res.json()
  if (!res.ok) {
    return NextResponse.json({ error: data.error ?? 'Payment verification failed' }, { status: 500 })
  }

  // Best-effort: notify the team when the $297 done-for-you upsell was purchased,
  // so a human picks up the manual setup work — no automated fulfillment yet.
  if (data.upsell === 'yes') {
    const admin = createAdminClient()
    const { data: account } = await admin
      .from('accounts')
      .select('business_name')
      .eq('id', accountId)
      .single()

    await admin.from('accounts').update({ upsell_purchased_at: new Date().toISOString() }).eq('id', accountId)

    const businessName = account?.business_name ?? 'A new account'
    const apiKey = process.env.RESEND_API_KEY
    const from = process.env.RESEND_FROM_EMAIL || 'Sam at QuoteBox <sam@quote-box.com>'
    const adminEmail = (process.env.ADMIN_EMAILS ?? '').split(',').map((e) => e.trim()).filter(Boolean)[0]

    if (apiKey && adminEmail) {
      try {
        const resend = new Resend(apiKey)
        await resend.emails.send({
          from,
          to: adminEmail,
          subject: `$297 done-for-you upsell purchased — ${businessName}`,
          html: `<p><strong>${businessName}</strong> just purchased the $297 done-for-you setup on the $1 trial flow. Reach out to get their SMS/email sequence, CRM pipeline, and pricing rules configured.</p>`,
        })
      } catch (err) {
        console.error('Upsell notification email error:', err)
      }
    }

    const ownerPhone = process.env.OWNER_PHONE
    if (ownerPhone) {
      try {
        await sendSms(ownerPhone, `Done-for-you upsell ($297) purchased by ${businessName}. Reach out to get it set up.`)
      } catch (err) {
        console.error('Upsell notification SMS error:', err)
      }
    }
  }

  return NextResponse.json({ success: true, plan: data.plan })
}
