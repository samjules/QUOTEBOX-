CREATE TABLE free_trial_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  has_junk_or_moving_company BOOLEAN NOT NULL,
  can_spend_50_per_day BOOLEAN NOT NULL,
  willing_ios_app BOOLEAN NOT NULL,
  qualified BOOLEAN NOT NULL,
  scheduled_date DATE,
  scheduled_time TEXT,
  scheduled_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'pending_confirmation'
    CHECK (status IN ('pending_confirmation', 'confirmed', 'cancelled', 'completed')),
  reminder_sent_at TIMESTAMPTZ,
  confirmed_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE free_trial_leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_full" ON free_trial_leads FOR ALL USING (true) WITH CHECK (true);

CREATE INDEX idx_free_trial_leads_scheduled_at ON free_trial_leads (scheduled_at);
CREATE INDEX idx_free_trial_leads_status ON free_trial_leads (status);
CREATE INDEX idx_free_trial_leads_phone ON free_trial_leads (phone);
