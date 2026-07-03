ALTER TABLE free_trial_leads ADD COLUMN funnel TEXT NOT NULL DEFAULT 'free_trial';

CREATE TABLE agency_lead_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT,
  email TEXT,
  phone TEXT,
  source TEXT NOT NULL, -- 'meta' | 'demo'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE agency_lead_contacts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_full" ON agency_lead_contacts FOR ALL USING (true) WITH CHECK (true);

CREATE INDEX idx_agency_lead_contacts_email ON agency_lead_contacts (email);
CREATE INDEX idx_agency_lead_contacts_phone ON agency_lead_contacts (phone);

ALTER TABLE owner_automation_config
  ADD COLUMN agency_leads_email jsonb DEFAULT NULL,
  ADD COLUMN agency_leads_sms text DEFAULT NULL;
