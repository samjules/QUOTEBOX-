import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

function isAdmin(email: string) {
  const adminEmails = (process.env.ADMIN_EMAILS ?? '').split(',').map((e) => e.trim().toLowerCase())
  return adminEmails.includes(email.toLowerCase())
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !isAdmin(user.email ?? '')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = createAdminClient()

  // Get the sales lead
  const { data: lead, error: leadErr } = await admin
    .from('sales_leads')
    .select('*')
    .eq('id', id)
    .single()

  if (leadErr || !lead) {
    return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
  }

  // Ensure setup_token exists (it should from default, but regenerate if cleared)
  let setupToken = lead.setup_token
  if (!setupToken) {
    const { data: updated } = await admin
      .from('sales_leads')
      .update({ setup_token: crypto.randomUUID() })
      .eq('id', id)
      .select('setup_token')
      .single()
    setupToken = updated?.setup_token
  }

  if (!setupToken) {
    return NextResponse.json({ error: 'Failed to generate setup token' }, { status: 500 })
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || new URL(req.url).origin
  const setupUrl = `${siteUrl}/setup/${setupToken}`

  // Send email
  const gmailUser = process.env.GMAIL_USER
  const gmailPass = process.env.GMAIL_APP_PASSWORD

  if (gmailUser && gmailPass) {
    try {
      const nodemailer = (await import('nodemailer')).default
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: { user: gmailUser, pass: gmailPass },
      })

      await transporter.sendMail({
        from: `"QuoteBox" <${gmailUser}>`,
        to: lead.email,
        subject: 'Your QuoteBox Account is Ready',
        html: `
          <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:560px;margin:0 auto">
            <div style="background:#1a1a2e;padding:28px 32px;border-radius:12px 12px 0 0;text-align:center">
              <span style="font-size:1.4rem;font-weight:700;color:white;letter-spacing:0.02em">
                Quote<span style="color:#FFE500">.</span>Box
              </span>
            </div>
            <div style="background:#ffffff;padding:32px;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 12px 12px">
              <h2 style="margin:0 0 12px;font-size:1.2rem;color:#1e293b">Hey ${lead.name}!</h2>
              <p style="color:#475569;font-size:0.95rem;line-height:1.6;margin:0 0 8px">
                Your QuoteBox account has been set up and is ready to go.
              </p>
              <p style="color:#475569;font-size:0.95rem;line-height:1.6;margin:0 0 8px">
                Your plan: <strong>${lead.tier} leads/month</strong> at <strong>$${Number(lead.monthly_total).toLocaleString()}/mo</strong>
              </p>
              <p style="color:#475569;font-size:0.95rem;line-height:1.6;margin:0 0 24px">
                Click below to set your password and log in.
              </p>
              <div style="text-align:center">
                <a href="${setupUrl}" style="display:inline-block;background:#FFE500;color:#0d0d1a;font-weight:700;font-size:1rem;padding:14px 40px;border-radius:10px;text-decoration:none">
                  Set Up My Account
                </a>
              </div>
              <p style="color:#94a3b8;font-size:0.78rem;margin:24px 0 0;text-align:center">
                If you didn't expect this email, you can ignore it.
              </p>
            </div>
          </div>
        `,
      })
    } catch (e) {
      console.error('Failed to send setup email:', e)
      return NextResponse.json({ error: 'Failed to send email' }, { status: 500 })
    }
  } else {
    return NextResponse.json({ error: 'Email not configured' }, { status: 500 })
  }

  // Update lead status to contacted
  await admin.from('sales_leads').update({
    status: 'contacted',
    updated_at: new Date().toISOString(),
  }).eq('id', id)

  return NextResponse.json({ success: true })
}
