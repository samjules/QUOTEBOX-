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
  maxPrice?: number
}

interface EmailPayload {
  customerName: string
  customerEmail: string
  formName: string
  businessName?: string
  currency: string
  total: number
  totalMax?: number
  rangeReason?: string
  hours?: number
  bufferHours?: number
  openEndedText?: string
  estimatedHours?: number
  estimatedRate?: number
  minApplied: boolean
  lineItems: LineItem[]
  emailSubject?: string
  emailIntro?: string
  emailOutro?: string
  emailHeaderImage?: string
  emailAccentColor?: string
}

function isHexDark(hex: string): boolean {
  const h = hex.replace('#', '')
  if (h.length < 6) return true
  const r = parseInt(h.slice(0, 2), 16)
  const g = parseInt(h.slice(2, 4), 16)
  const b = parseInt(h.slice(4, 6), 16)
  return (r * 299 + g * 587 + b * 114) / 1000 < 140
}

function buildEmailHtml(p: EmailPayload): string {
  const showTotal = p.total > 0
  const hasRange = showTotal && p.totalMax != null && p.totalMax > p.total
  const hasLineItems = p.lineItems.length > 0
  const headerBg = p.emailAccentColor || '#1a1a2e'
  const headerFg = isHexDark(headerBg) ? '#ffffff' : '#0f172a'
  const totalNumColor = isHexDark(headerBg) ? '#FFE500' : '#0f172a'

  const priceCell = (value: number) =>
    value > 0
      ? `<span style="font-size:13px;font-weight:700;color:#1e293b;">${p.currency}${value.toFixed(2)}</span>`
      : '<span style="font-size:13px;color:#94a3b8;">—</span>'

  const lineItemRows = p.lineItems
    .map((item) =>
      hasRange
        ? `
      <tr>
        <td style="padding:10px 0;border-bottom:1px solid #f1f5f9;vertical-align:top;">
          <div style="font-size:13px;font-weight:600;color:#334155;">${esc(item.label)}</div>
          <div style="font-size:13px;color:#64748b;margin-top:2px;">${esc(item.value)}</div>
        </td>
        <td style="padding:10px 0;border-bottom:1px solid #f1f5f9;text-align:right;vertical-align:top;white-space:nowrap;">
          ${priceCell(item.price)}
        </td>
        <td style="padding:10px 0;border-bottom:1px solid #f1f5f9;text-align:right;vertical-align:top;white-space:nowrap;">
          ${priceCell(item.maxPrice ?? item.price)}
        </td>
      </tr>`
        : `
      <tr>
        <td style="padding:10px 0;border-bottom:1px solid #f1f5f9;vertical-align:top;">
          <div style="font-size:13px;font-weight:600;color:#334155;">${esc(item.label)}</div>
          <div style="font-size:13px;color:#64748b;margin-top:2px;">${esc(item.value)}</div>
        </td>
        <td style="padding:10px 0;border-bottom:1px solid #f1f5f9;text-align:right;vertical-align:top;white-space:nowrap;">
          ${priceCell(item.price)}
        </td>
      </tr>`
    )
    .join('')

  const lineItemHeaderRow = hasRange
    ? `
      <tr>
        <td style="padding:0 0 6px;"></td>
        <td style="padding:0 0 6px;text-align:right;">
          <span style="font-size:10px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:#94a3b8;">Low</span>
        </td>
        <td style="padding:0 0 6px;text-align:right;">
          <span style="font-size:10px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:#94a3b8;">High</span>
        </td>
      </tr>`
    : ''

  // Hour ticks from the base estimate up to base+buffer, capped at 7 so the
  // row never gets too cramped on a narrow email client.
  const hoursNumberLine = (() => {
    if (!hasRange || p.hours == null || p.bufferHours == null || p.bufferHours <= 0) return ''
    const baseHours = p.hours
    const bufferHours = p.bufferHours
    const tickCount = Math.min(Math.max(Math.round(bufferHours) + 1, 2), 7)
    const step = bufferHours / (tickCount - 1)
    const fmt = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(1))

    const cells = Array.from({ length: tickCount }, (_, i) => {
      const h = baseHours + step * i
      const isFirst = i === 0
      return `
        <td style="width:${(100 / tickCount).toFixed(2)}%;text-align:center;padding-top:14px;border-top:2px solid #e2e8f0;">
          <div style="width:10px;height:10px;border-radius:50%;margin:-7px auto 8px;border:2px solid #ffffff;background:${isFirst ? '#FFE500' : '#cbd5e1'};"></div>
          ${isFirst
            ? `<span style="display:inline-block;background:#FFE500;color:#1a1a2e;font-size:11px;font-weight:800;padding:3px 8px;border-radius:999px;">${fmt(h)}h</span>`
            : `<span style="font-size:11px;font-weight:600;color:#94a3b8;">${fmt(h)}h</span>`}
        </td>`
    }).join('')

    return `
              <!-- Hours number line -->
              <p style="margin:0 0 14px;font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#94a3b8;">Estimated Time On Site</p>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>${cells}</tr>
              </table>
              <p style="margin:10px 0 28px;font-size:12px;color:#94a3b8;text-align:center;">Quoted at <strong style="color:#1e293b;">${fmt(baseHours)}h</strong> — may run longer depending on the job</p>`
  })()

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Your quote from ${esc(p.formName)}</title>
</head>
<body style="margin:0;padding:0;background:#f7f6f3;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f7f6f3;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;">

          <!-- Header -->
          <tr>
            <td style="background:${headerBg};border-radius:14px 14px 0 0;padding:0;overflow:hidden;">
              ${p.emailHeaderImage ? `<img src="${p.emailHeaderImage}" alt="" width="520" style="display:block;width:100%;max-height:160px;object-fit:cover;" />` : ''}
              <div style="padding:20px 28px;">
                <span style="font-family:Georgia,serif;font-size:18px;font-weight:900;color:${headerFg};letter-spacing:0.02em;">
                  Quote<span style="color:${totalNumColor};">.</span>Box
                </span>
                ${p.businessName ? `<div style="font-size:12px;color:${headerFg === '#ffffff' ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.5)'};margin-top:4px;">on behalf of <strong style="color:${headerFg};">${esc(p.businessName)}</strong></div>` : ''}
              </div>
            </td>
          </tr>

          <!-- Accent strip -->
          <tr>
            <td style="background:${headerBg};opacity:0.7;height:3px;font-size:0;line-height:0;">&nbsp;</td>
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
              <table width="100%" cellpadding="0" cellspacing="0" style="background:${headerBg};border-radius:12px;margin-bottom:28px;">
                <tr>
                  <td style="padding:24px;text-align:center;">
                    <div style="font-size:11px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:${headerFg === '#ffffff' ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.4)'};margin-bottom:8px;">
                      ${p.openEndedText ? 'Starting At' : hasRange ? 'Estimated Range' : p.minApplied ? 'Minimum Quote (estimate)' : 'Estimated Total'}
                    </div>
                    <div style="font-size:42px;font-weight:900;color:${totalNumColor};line-height:1;">${p.openEndedText ? `${p.currency}${p.total.toFixed(2)}+` : hasRange ? `${p.currency}${p.total.toFixed(2)}&ndash;${p.currency}${p.totalMax!.toFixed(2)}` : `${p.currency}${p.total.toFixed(2)}`}</div>
                    ${p.estimatedHours && p.estimatedRate ? `
                    <div style="font-size:13px;font-weight:700;color:${headerFg === '#ffffff' ? 'rgba(255,255,255,0.85)' : '#334155'};margin-top:8px;">
                      Est. ${p.estimatedHours.toFixed(1)} hours @ ${p.currency}${p.estimatedRate}/hr
                    </div>` : ''}
                    <div style="font-size:12px;color:${headerFg === '#ffffff' ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.35)'};margin-top:8px;">${p.openEndedText ? esc(p.openEndedText) + (p.estimatedHours && p.estimatedRate ? ' This is how your quote is calculated — the job may take more or less time.' : '') : hasRange && p.rangeReason ? esc(p.rangeReason) : 'This is an estimate — final price confirmed on booking'}</div>
                  </td>
                </tr>
              </table>` : ''}

              ${hoursNumberLine}

              ${hasLineItems ? `
              <!-- Line items -->
              <p style="margin:0 0 12px;font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#94a3b8;">Your selections</p>
              <table width="100%" cellpadding="0" cellspacing="0">
                ${lineItemHeaderRow}
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
              <p style="margin:0 0 4px;font-size:12px;color:#94a3b8;">
                ${p.businessName ? `Sent by <strong style="color:#94a3b8;">${esc(p.businessName)}</strong> via ` : 'Sent via '}
                <a href="https://quote-box.com" style="color:#94a3b8;text-decoration:none;">Quote.Box</a>
                &nbsp;&middot;&nbsp; This is an automated quote summary
              </p>
              <p style="margin:0;font-size:11px;color:#cbd5e1;">This is an automated message — please do not reply to this email.</p>
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
