-- tracks email opens, link clicks, and form submits per automation step
CREATE TABLE automation_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  lead_id uuid NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  step text NOT NULL,
  event_type text NOT NULL CHECK (event_type IN ('email_open', 'link_click', 'form_submit')),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE automation_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owner_all" ON automation_events
  FOR ALL USING (
    account_id IN (SELECT id FROM accounts WHERE owner_id = auth.uid())
  );

CREATE INDEX automation_events_lead_idx ON automation_events(lead_id);
CREATE INDEX automation_events_account_idx ON automation_events(account_id, created_at DESC);

-- hero image URL stored per account automation config
ALTER TABLE lead_automations ADD COLUMN IF NOT EXISTS hero_image_url text;
