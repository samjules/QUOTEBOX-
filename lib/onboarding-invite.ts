import { sendSms } from '@/lib/sms'

interface SendOnboardingInviteArgs {
  leadName: string
  leadEmail: string
  leadPhone?: string | null
  url: string
}

export async function sendOnboardingInviteNotifications({ leadName, leadEmail, leadPhone, url }: SendOnboardingInviteArgs) {
  let emailSent = false
  let smsSent = false

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
        to: leadEmail,
        subject: "You're invited to Quotebox — Pay Per Lead",
        html: `
          <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:560px;margin:0 auto">
            <div style="background:#1a1a2e;padding:28px 32px;border-radius:12px 12px 0 0;text-align:center">
              <span style="font-size:1.4rem;font-weight:700;color:white;letter-spacing:0.02em">
                Quote<span style="color:#FFE500">.</span>Box
              </span>
            </div>
            <div style="background:#ffffff;padding:32px;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 12px 12px">
              <h2 style="margin:0 0 12px;font-size:1.2rem;color:#1e293b">Hey ${leadName}!</h2>
              <p style="color:#475569;font-size:0.95rem;line-height:1.6;margin:0 0 8px">
                You're invited to set up your Quotebox Pay Per Lead account.
              </p>
              <p style="color:#475569;font-size:0.95rem;line-height:1.6;margin:0 0 24px">
                Click below to create your password, activate your $750/mo plan, and get your quote form live.
              </p>
              <div style="text-align:center">
                <a href="${url}" style="display:inline-block;background:#FFE500;color:#0d0d1a;font-weight:700;font-size:1rem;padding:14px 40px;border-radius:10px;text-decoration:none">
                  Get Started
                </a>
              </div>
              <p style="color:#94a3b8;font-size:0.78rem;margin:24px 0 0;text-align:center">
                If you didn't expect this email, you can ignore it.
              </p>
            </div>
          </div>
        `,
      })
      emailSent = true
    } catch (e) {
      console.error('Failed to send onboarding invite email:', e)
    }
  }

  if (leadPhone) {
    smsSent = await sendSms(
      leadPhone,
      `Hi ${leadName.split(' ')[0]}, this is Quotebox! Set up your Pay Per Lead account here: ${url}`
    )
  }

  return { emailSent, smsSent }
}
