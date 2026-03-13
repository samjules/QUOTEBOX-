'use server'

// MIGRATION REQUIRED — run once in the Supabase SQL editor before deal notifications work:
//   CREATE TABLE IF NOT EXISTS deal_notifications (
//     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
//     account_id UUID REFERENCES accounts(id),
//     display_name TEXT NOT NULL,
//     amount NUMERIC NOT NULL DEFAULT 0,
//     created_at TIMESTAMPTZ DEFAULT now()
//   );
//   ALTER TABLE deal_notifications ENABLE ROW LEVEL SECURITY;
//   CREATE POLICY "Public can read deal notifications" ON deal_notifications FOR SELECT USING (true);
//   CREATE POLICY "Service role can insert" ON deal_notifications FOR INSERT WITH CHECK (true);
//
// LEAD_ID MIGRATION — run once to sync banner with live booked leads:
//   ALTER TABLE deal_notifications ADD COLUMN IF NOT EXISTS lead_id UUID;
//   TRUNCATE deal_notifications;
//   INSERT INTO deal_notifications (account_id, display_name, amount, created_at, lead_id)
//   SELECT l.account_id, COALESCE(a.business_name, 'A local business'),
//          (l.form_data->>'_quote_total')::numeric, l.created_at, l.id
//   FROM leads l JOIN accounts a ON a.id = l.account_id
//   WHERE l.status = 'booked'
//     AND (l.form_data->>'_quote_total') IS NOT NULL
//     AND (l.form_data->>'_quote_total')::numeric > 0;

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

function buildBookingEmailHtml({ customerName, businessName, formName, bookingDate, amount, currency, accentColor }: {
  customerName: string
  businessName: string
  formName: string
  bookingDate: string | null
  amount: number
  currency: string
  accentColor: string
}) {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f5f0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f0;padding:32px 16px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">
        <!-- Header -->
        <tr>
          <td style="background:${accentColor};padding:28px 32px;text-align:center;">
            <div style="font-size:1.1rem;font-weight:700;color:#ffffff;letter-spacing:0.5px;">${businessName}</div>
            <div style="font-size:0.75rem;color:rgba(255,255,255,0.7);margin-top:4px;">Powered by QuoteBox</div>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:36px 32px;">
            <p style="margin:0 0 8px;font-size:1rem;color:#6b7280;">Hi ${customerName},</p>
            <h1 style="margin:0 0 24px;font-size:1.5rem;font-weight:700;color:#111827;">Your appointment is confirmed!</h1>
            <p style="margin:0 0 24px;font-size:0.95rem;color:#4b5563;">Your booking for <strong>${formName}</strong> with <strong>${businessName}</strong> has been confirmed.</p>
            ${bookingDate ? `
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
              <tr>
                <td style="background:#f9fafb;border:2px solid ${accentColor};border-radius:12px;padding:20px;text-align:center;">
                  <div style="font-size:1.6rem;margin-bottom:6px;">📅</div>
                  <div style="font-size:1.1rem;font-weight:700;color:#111827;">${bookingDate}</div>
                </td>
              </tr>
            </table>` : ''}
            ${amount > 0 ? `
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
              <tr>
                <td style="background:#f9fafb;border-radius:10px;padding:16px 20px;text-align:center;">
                  <div style="font-size:0.8rem;color:#6b7280;margin-bottom:4px;text-transform:uppercase;letter-spacing:0.5px;">Estimated Total</div>
                  <div style="font-size:1.4rem;font-weight:700;color:#111827;">${currency}${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                </td>
              </tr>
            </table>` : ''}
            <p style="margin:0;font-size:0.875rem;color:#6b7280;">If you need to reschedule or have any questions, simply reply to this email.</p>
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="padding:20px 32px;border-top:1px solid #f0f0ee;text-align:center;">
            <p style="margin:0;font-size:0.75rem;color:#9ca3af;">This confirmation was sent by ${businessName} via QuoteBox.</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}

export async function updateLeadStatus(leadId: string, status: string) {
  const supabase = createClient()
  const admin = createAdminClient()

  // When marking as booked, fire a deal notification for the landing page social proof
  if (status === 'booked') {
    const { data: lead } = await supabase
      .from('leads')
      .select('name, email, form_data, account_id, hosted_form_id')
      .eq('id', leadId)
      .single()

    if (lead) {
      const { data: account } = await supabase
        .from('accounts')
        .select('business_name')
        .eq('id', lead.account_id)
        .single()

      const formData = lead.form_data as Record<string, unknown> | null
      const amount = Number(formData?._quote_total) || 0

      if (amount > 0) {
        // Upsert by lead_id so re-booking doesn't create duplicates
        await admin.from('deal_notifications').upsert({
          lead_id: leadId,
          account_id: lead.account_id,
          display_name: account?.business_name ?? 'A local business',
          amount,
        }, { onConflict: 'lead_id', ignoreDuplicates: false })
      }

      // Send booking confirmation email to the customer
      const bookingDate = formData?._booking_date as string | undefined
      if (lead.email && lead.name) {
        const { data: hostedForm } = await supabase
          .from('hosted_forms')
          .select('form_name, form_config')
          .eq('id', lead.hosted_form_id ?? '')
          .single()

        const gmailUser = process.env.GMAIL_USER
        const gmailPass = process.env.GMAIL_APP_PASSWORD
        if (gmailUser && gmailPass) {
          const nodemailer = await import('nodemailer')
          const transporter = nodemailer.default.createTransport({ service: 'gmail', auth: { user: gmailUser, pass: gmailPass } })
          const formattedDate = bookingDate
            ? new Date(bookingDate + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
            : null
          const currency = (formData?._quote_currency as string) || '$'
          const businessName = account?.business_name ?? 'Your service provider'
          const formName = hostedForm?.form_name ?? 'your service'
          const accentColor = (hostedForm?.form_config as { brand_color?: string })?.brand_color || '#1a1a2e'

          await transporter.sendMail({
            from: `"${businessName}" <${gmailUser}>`,
            to: lead.email,
            subject: `Your booking is confirmed${formattedDate ? ` — ${formattedDate}` : ''}`,
            html: buildBookingEmailHtml({ customerName: lead.name, businessName, formName, bookingDate: formattedDate, amount, currency, accentColor }),
          }).catch(() => {}) // never block the status update
        }
      }
    }
  }

  // When un-booking a lead, remove its deal notification
  if (status !== 'booked') {
    await admin.from('deal_notifications').delete().eq('lead_id', leadId)
  }

  await supabase.from('leads').update({ status }).eq('id', leadId)
  revalidatePath('/leads')
}

export async function saveLeadNote(leadId: string, notes: string) {
  const supabase = createClient()
  await supabase.from('leads').update({ notes }).eq('id', leadId)
  revalidatePath('/leads')
}

export async function deleteLead(leadId: string) {
  const supabase = createClient()
  const admin = createAdminClient()

  // Verify ownership — only delete if the lead belongs to the current user's account
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data: account } = await supabase
    .from('accounts')
    .select('id')
    .eq('owner_id', user.id)
    .single()

  if (!account) throw new Error('Unauthorized')

  // Remove deal notification before deleting the lead
  await admin.from('deal_notifications').delete().eq('lead_id', leadId)

  const { error } = await supabase
    .from('leads')
    .delete()
    .eq('id', leadId)
    .eq('account_id', account.id)

  if (error) throw new Error(error.message)

  revalidatePath('/leads')
}
