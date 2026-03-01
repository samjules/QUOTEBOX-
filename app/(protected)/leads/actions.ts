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

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

export async function updateLeadStatus(leadId: string, status: string) {
  const supabase = createClient()

  // When marking as booked, fire a deal notification for the landing page social proof
  if (status === 'booked') {
    const { data: lead } = await supabase
      .from('leads')
      .select('name, form_data, account_id')
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
        const admin = createAdminClient()
        await admin.from('deal_notifications').insert({
          account_id: lead.account_id,
          display_name: account?.business_name ?? 'A local business',
          amount,
        })
      }
    }
  }

  await supabase.from('leads').update({ status }).eq('id', leadId)
  revalidatePath('/leads')
}
