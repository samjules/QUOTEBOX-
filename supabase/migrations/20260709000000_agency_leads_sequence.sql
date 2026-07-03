ALTER TABLE agency_lead_contacts
  ADD COLUMN status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'unsubscribed')),
  ADD COLUMN enrolled_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

CREATE TABLE agency_lead_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id UUID NOT NULL REFERENCES agency_lead_contacts(id) ON DELETE CASCADE,
  step TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'skipped')),
  scheduled_at TIMESTAMPTZ NOT NULL,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (contact_id, step)
);

ALTER TABLE agency_lead_steps ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_full" ON agency_lead_steps FOR ALL USING (true) WITH CHECK (true);

CREATE INDEX idx_agency_lead_steps_due ON agency_lead_steps (status, scheduled_at);

-- Replaced by the hardcoded 16-step sequence in lib/agency-leads.ts (matches the
-- owner-onboarding pattern, where only a couple of steps are admin-editable and
-- the rest are scripted) — the free-form config columns are no longer used.
ALTER TABLE owner_automation_config
  DROP COLUMN agency_leads_email,
  DROP COLUMN agency_leads_sms;
