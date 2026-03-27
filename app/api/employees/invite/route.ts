import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Verify caller is an account owner
  const { data: account } = await supabase
    .from('accounts')
    .select('id, business_name')
    .eq('owner_id', user.id)
    .single()

  if (!account) return NextResponse.json({ error: 'Only account owners can invite employees' }, { status: 403 })

  const { email } = await request.json()
  if (!email || typeof email !== 'string') {
    return NextResponse.json({ error: 'Email is required' }, { status: 400 })
  }

  const normalizedEmail = email.toLowerCase().trim()

  // Check for existing member
  const admin = createAdminClient()
  const { data: existing } = await admin
    .from('account_members')
    .select('id, accepted_at')
    .eq('account_id', account.id)
    .eq('email', normalizedEmail)
    .single()

  if (existing) {
    return NextResponse.json({
      error: existing.accepted_at ? 'This person is already a team member' : 'An invite has already been sent to this email',
    }, { status: 409 })
  }

  // Create member row
  const { data: member, error: insertErr } = await admin
    .from('account_members')
    .insert({
      account_id: account.id,
      email: normalizedEmail,
      role: 'employee',
    })
    .select('invite_token')
    .single()

  if (insertErr) {
    return NextResponse.json({ error: insertErr.message }, { status: 500 })
  }

  // Send invite email
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  const inviteUrl = `${siteUrl}/invite/${member.invite_token}`

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
        to: normalizedEmail,
        subject: `You're invited to join ${account.business_name} on QuoteBox`,
        html: `<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f5f5f0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f0;padding:32px 16px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">
        <tr><td style="background:#4f46e5;padding:28px 32px;text-align:center;">
          <div style="font-size:1.1rem;font-weight:700;color:#ffffff;">QuoteBox</div>
        </td></tr>
        <tr><td style="padding:36px 32px;">
          <h1 style="margin:0 0 16px;font-size:1.3rem;font-weight:700;color:#111827;">You've been invited!</h1>
          <p style="margin:0 0 24px;font-size:0.95rem;color:#4b5563;">
            <strong>${account.business_name}</strong> has invited you to join their team on QuoteBox.
          </p>
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr><td align="center">
              <a href="${inviteUrl}" style="display:inline-block;background:#4f46e5;color:#ffffff;font-size:0.95rem;font-weight:600;padding:12px 32px;border-radius:8px;text-decoration:none;">
                Accept Invite
              </a>
            </td></tr>
          </table>
          <p style="margin:24px 0 0;font-size:0.8rem;color:#9ca3af;">If you didn't expect this invitation, you can safely ignore this email.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`,
      })
    } catch {
      // Don't fail the invite if email fails
    }
  }

  return NextResponse.json({ success: true, inviteUrl })
}
