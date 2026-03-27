import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
  const { token, signatureData, signerName } = await request.json()

  if (!token || !signatureData) {
    return NextResponse.json({ error: 'Token and signature are required' }, { status: 400 })
  }

  const admin = createAdminClient()

  // Look up agreement
  const { data: agreement, error: lookupErr } = await admin
    .from('agreements')
    .select('id, account_id, signer_email, status, lead_id')
    .eq('token', token)
    .single()

  if (lookupErr || !agreement) {
    return NextResponse.json({ error: 'Invalid agreement link' }, { status: 404 })
  }

  if (agreement.status === 'signed') {
    return NextResponse.json({ error: 'This agreement has already been signed' }, { status: 409 })
  }

  // Get signer IP
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || request.headers.get('x-real-ip')
    || 'unknown'

  // Update agreement
  const { error: updateErr } = await admin
    .from('agreements')
    .update({
      status: 'signed',
      signature_data: signatureData,
      signer_name: signerName || agreement.signer_email,
      signed_at: new Date().toISOString(),
      signer_ip: ip,
    })
    .eq('id', agreement.id)

  if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 })

  // Send confirmation email to signer + notification to owner
  const gmailUser = process.env.GMAIL_USER
  const gmailPass = process.env.GMAIL_APP_PASSWORD
  if (gmailUser && gmailPass) {
    try {
      const { data: account } = await admin
        .from('accounts')
        .select('business_name, owner_id')
        .eq('id', agreement.account_id)
        .single()

      const { data: owner } = account?.owner_id
        ? await admin.auth.admin.getUserById(account.owner_id)
        : { data: null }

      const nodemailer = await import('nodemailer')
      const transporter = nodemailer.default.createTransport({
        service: 'gmail',
        auth: { user: gmailUser, pass: gmailPass },
      })

      const businessName = account?.business_name || 'Your service provider'

      // Confirmation to signer
      if (agreement.signer_email) {
        await transporter.sendMail({
          from: `"${businessName}" <${gmailUser}>`,
          to: agreement.signer_email,
          subject: `Agreement signed — ${businessName}`,
          html: `<p>Hi ${signerName || 'there'},</p><p>Your agreement with <strong>${businessName}</strong> has been signed successfully.</p><p>A copy will be provided by ${businessName} for your records.</p>`,
        }).catch(() => {})
      }

      // Notification to owner
      if (owner?.user?.email) {
        await transporter.sendMail({
          from: `"QuoteBox" <${gmailUser}>`,
          to: owner.user.email,
          subject: `Agreement signed by ${signerName || agreement.signer_email}`,
          html: `<p>The agreement for <strong>${agreement.signer_email}</strong> has been signed.</p><p>View details in your <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/leads">Leads dashboard</a>.</p>`,
        }).catch(() => {})
      }
    } catch {
      // Don't fail if email fails
    }
  }

  return NextResponse.json({ success: true })
}
