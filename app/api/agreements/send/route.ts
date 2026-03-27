import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: account } = await supabase
    .from('accounts')
    .select('id, business_name, agreement_template_url')
    .eq('owner_id', user.id)
    .single()

  if (!account) return NextResponse.json({ error: 'Account not found' }, { status: 404 })

  const { leadId } = await request.json()
  if (!leadId) return NextResponse.json({ error: 'leadId is required' }, { status: 400 })

  const admin = createAdminClient()

  // Get lead info
  const { data: lead } = await admin
    .from('leads')
    .select('id, name, email, account_id')
    .eq('id', leadId)
    .eq('account_id', account.id)
    .single()

  if (!lead) return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
  if (!lead.email) return NextResponse.json({ error: 'Lead has no email address' }, { status: 400 })

  // Create agreement
  const { data: agreement, error: insertErr } = await admin
    .from('agreements')
    .insert({
      account_id: account.id,
      lead_id: lead.id,
      title: 'Service Agreement',
      document_url: account.agreement_template_url || null,
      signer_name: lead.name,
      signer_email: lead.email,
    })
    .select('id, token')
    .single()

  if (insertErr) return NextResponse.json({ error: insertErr.message }, { status: 500 })

  // Send signing email
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  const signUrl = `${siteUrl}/sign/${agreement.token}`

  const gmailUser = process.env.GMAIL_USER
  const gmailPass = process.env.GMAIL_APP_PASSWORD
  if (gmailUser && gmailPass) {
    try {
      const nodemailer = await import('nodemailer')
      const transporter = nodemailer.default.createTransport({
        service: 'gmail',
        auth: { user: gmailUser, pass: gmailPass },
      })
      await transporter.sendMail({
        from: `"${account.business_name}" <${gmailUser}>`,
        to: lead.email,
        subject: `${account.business_name} — Agreement for your signature`,
        html: `<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f5f5f0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f0;padding:32px 16px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">
        <tr><td style="background:#1a1a2e;padding:28px 32px;text-align:center;">
          <div style="font-size:1.1rem;font-weight:700;color:#ffffff;">${account.business_name}</div>
          <div style="font-size:0.75rem;color:rgba(255,255,255,0.7);margin-top:4px;">Powered by QuoteBox</div>
        </td></tr>
        <tr><td style="padding:36px 32px;">
          <p style="margin:0 0 8px;font-size:1rem;color:#6b7280;">Hi ${lead.name || 'there'},</p>
          <h1 style="margin:0 0 24px;font-size:1.3rem;font-weight:700;color:#111827;">Please sign your agreement</h1>
          <p style="margin:0 0 24px;font-size:0.95rem;color:#4b5563;">
            <strong>${account.business_name}</strong> has sent you a service agreement for your review and signature.
          </p>
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr><td align="center">
              <a href="${signUrl}" style="display:inline-block;background:#4f46e5;color:#ffffff;font-size:0.95rem;font-weight:600;padding:14px 40px;border-radius:8px;text-decoration:none;">
                Review &amp; Sign
              </a>
            </td></tr>
          </table>
          <p style="margin:24px 0 0;font-size:0.8rem;color:#9ca3af;">If you didn't request this, you can safely ignore this email.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`,
      })
    } catch {
      // Don't fail if email fails
    }
  }

  return NextResponse.json({ success: true, agreementId: agreement.id })
}
