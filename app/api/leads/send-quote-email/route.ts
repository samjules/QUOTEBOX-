import nodemailer from 'nodemailer'
import { NextRequest, NextResponse } from 'next/server'

function esc(s: string) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

interface LineItem {
  label: string
  value: string
  price: number
}

interface EmailPayload {
  customerName: string
  customerEmail: string
  formName: string
  currency: string
  total: number
  minApplied: boolean
  lineItems: LineItem[]
  emailSubject?: string
  emailIntro?: string
  emailOutro?: string
}

function buildEmailHtml(p: EmailPayload): string {
  const showTotal = p.total > 0
  const hasLineItems = p.lineItems.length > 0

  const lineItemRows = p.lineItems
    .map(
      (item) => `
      <tr>
        <td style="padding:10px 0;border-bottom:1px solid #f1f5f9;vertical-align:top;">
          <div style="font-size:13px;font-weight:600;color:#334155;">${item.label}</div>
          <div style="font-size:13px;color:#64748b;margin-top:2px;">${item.value}</div>
        </td>
        <td style="padding:10px 0;border-bottom:1px solid #f1f5f9;text-align:right;vertical-align:top;white-space:nowrap;">
          ${item.price > 0 ? `<span style="font-size:13px;font-weight:700;color:#1e293b;">${p.currency}${item.price.toFixed(2)}</span>` : '<span style="font-size:13px;color:#94a3b8;">—</span>'}
        </td>
      </tr>`
    )
    .join('')

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Your quote from ${p.formName}</title>
</head>
<body style="margin:0;padding:0;background:#f7f6f3;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f7f6f3;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;">

          <!-- Header -->
          <tr>
            <td style="background:#1a1a2e;border-radius:14px 14px 0 0;padding:24px 32px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <span style="font-family:Georgia,serif;font-size:18px;font-weight:900;color:white;letter-spacing:0.02em;">
                      Quote<span style="color:#FFE500;">.</span>Box
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Yellow accent strip -->
          <tr>
            <td style="background:#FFE500;height:4px;font-size:0;line-height:0;">&nbsp;</td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="background:white;padding:32px 32px 28px;border-radius:0 0 14px 14px;">

              <p style="margin:0 0 8px;font-size:15px;color:#64748b;">Hi ${esc(p.customerName)},</p>
              <p style="margin:0 0 28px;font-size:15px;color:#334155;line-height:1.6;">
                ${p.emailIntro ? esc(p.emailIntro) : `Thank you for your enquiry with <strong>${esc(p.formName)}</strong>. Here&rsquo;s a summary of your quote.`}
              </p>

              ${showTotal ? `
              <!-- Total box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#1a1a2e;border-radius:12px;margin-bottom:28px;">
                <tr>
                  <td style="padding:24px;text-align:center;">
                    <div style="font-size:11px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:rgba(255,255,255,0.5);margin-bottom:8px;">
                      ${p.minApplied ? 'Minimum Quote (estimate)' : 'Estimated Total'}
                    </div>
                    <div style="font-size:42px;font-weight:900;color:#FFE500;line-height:1;">${p.currency}${p.total.toFixed(2)}</div>
                    <div style="font-size:12px;color:rgba(255,255,255,0.4);margin-top:8px;">This is an estimate — final price confirmed on booking</div>
                  </td>
                </tr>
              </table>` : ''}

              ${hasLineItems ? `
              <!-- Line items -->
              <p style="margin:0 0 12px;font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#94a3b8;">Your selections</p>
              <table width="100%" cellpadding="0" cellspacing="0">
                ${lineItemRows}
              </table>
              <div style="margin-top:4px;"></div>` : ''}

              <p style="margin:28px 0 0;font-size:14px;color:#64748b;line-height:1.6;">
                ${p.emailOutro ? esc(p.emailOutro) : `We&rsquo;ll be in touch shortly to confirm your booking. If you have any questions in the meantime, just reply to this email.`}
              </p>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:24px 0 8px;text-align:center;">
              <p style="margin:0;font-size:12px;color:#94a3b8;">
                Sent via <a href="https://quote-box.com" style="color:#94a3b8;text-decoration:none;">Quote.Box</a>
                &nbsp;&middot;&nbsp; This is an automated quote summary
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

export async function POST(request: NextRequest) {
  const gmailUser = process.env.GMAIL_USER
  const gmailPass = process.env.GMAIL_APP_PASSWORD
  if (!gmailUser || !gmailPass) {
    // Silently skip if not configured — don't break the lead flow
    return NextResponse.json({ skipped: true })
  }

  let payload: EmailPayload
  try {
    payload = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
  }

  const { customerName, customerEmail, formName } = payload
  if (!customerEmail || !customerName || !formName) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: gmailUser,
      pass: gmailPass,
    },
  })

  try {
    await transporter.sendMail({
      from: `"Quote.Box" <${gmailUser}>`,
      to: customerEmail,
      subject: payload.emailSubject || `Your quote from ${formName}`,
      html: buildEmailHtml(payload),
    })
  } catch (err) {
    console.error('Gmail send error:', err)
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 })
  }

  return NextResponse.json({ sent: true })
}
