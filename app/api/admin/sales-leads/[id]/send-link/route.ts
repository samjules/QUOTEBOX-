import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

function isAdmin(email: string) {
  const adminEmails = (process.env.ADMIN_EMAILS ?? '').split(',').map((e) => e.trim().toLowerCase())
  return adminEmails.includes(email.toLowerCase())
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  // Auth check
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

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || new URL(req.url).origin

  // Check if user already exists
  const { data: existingUsers } = await admin.auth.admin.listUsers()
  const existingUser = existingUsers?.users?.find(
    (u) => u.email?.toLowerCase() === lead.email.toLowerCase()
  )

  let userId: string

  if (existingUser) {
    userId = existingUser.id
  } else {
    // Create auth user (no password — they'll use magic link)
    const { data: authData, error: authErr } = await admin.auth.admin.createUser({
      email: lead.email,
      email_confirm: true,
      user_metadata: { full_name: lead.name },
    })

    if (authErr || !authData?.user) {
      return NextResponse.json({ error: authErr?.message ?? 'Failed to create user' }, { status: 500 })
    }

    userId = authData.user.id

    // Create account
    const { data: newAccount, error: accErr } = await admin
      .from('accounts')
      .insert({ business_name: lead.name, owner_id: userId })
      .select('id')
      .single()

    if (accErr || !newAccount) {
      return NextResponse.json({ error: accErr?.message ?? 'Failed to create account' }, { status: 500 })
    }

    // Create billing with pay_per_lead plan
    await admin.from('billing').insert({
      account_id: newAccount.id,
      plan: 'pay_per_lead',
      credit_balance: 0,
      total_spent: 0,
    })
  }

  // Generate magic link
  const { data: linkData, error: linkErr } = await admin.auth.admin.generateLink({
    type: 'magiclink',
    email: lead.email,
    options: {
      redirectTo: `${siteUrl}/dashboard`,
    },
  })

  if (linkErr || !linkData?.properties?.hashed_token) {
    return NextResponse.json({ error: linkErr?.message ?? 'Failed to generate link' }, { status: 500 })
  }

  const tokenHash = linkData.properties.hashed_token
  const confirmUrl = `${siteUrl}/api/auth/confirm?token_hash=${tokenHash}&type=magiclink&next=${encodeURIComponent('/dashboard')}`

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
              <span style="font-family:'Oswald',sans-serif;font-size:1.4rem;font-weight:700;color:white;letter-spacing:0.02em">
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
                Click below to log in — no password needed.
              </p>
              <div style="text-align:center">
                <a href="${confirmUrl}" style="display:inline-block;background:#FFE500;color:#0d0d1a;font-weight:700;font-size:1rem;padding:14px 40px;border-radius:10px;text-decoration:none">
                  Log In to QuoteBox
                </a>
              </div>
              <p style="color:#94a3b8;font-size:0.78rem;margin:24px 0 0;text-align:center">
                This link expires in 24 hours. If you didn't expect this email, you can ignore it.
              </p>
            </div>
          </div>
        `,
      })
    } catch (e) {
      console.error('Failed to send magic link email:', e)
    }
  }

  // Update lead status to contacted
  await admin.from('sales_leads').update({
    status: 'contacted',
    updated_at: new Date().toISOString(),
  }).eq('id', id)

  return NextResponse.json({ success: true, accountCreated: !existingUser })
}
