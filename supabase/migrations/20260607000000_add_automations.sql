-- per-account automation config (one row per account, auto-created on first meta lead)
CREATE TABLE lead_automations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  is_enabled boolean NOT NULL DEFAULT true,
  discount_percent integer NOT NULL DEFAULT 10,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(account_id)
);

ALTER TABLE lead_automations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owner_all" ON lead_automations
  FOR ALL USING (
    account_id IN (SELECT id FROM accounts WHERE owner_id = auth.uid())
  );

-- tracks each automation step per lead
CREATE TABLE automation_steps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  lead_id uuid NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  step text NOT NULL CHECK (step IN ('initial_contact', 'day1_followup', 'discount_offer', 'mark_lost')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'skipped')),
  scheduled_at timestamptz NOT NULL,
  sent_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE automation_steps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owner_all" ON automation_steps
  FOR ALL USING (
    account_id IN (SELECT id FROM accounts WHERE owner_id = auth.uid())
  );

CREATE INDEX automation_steps_pending_idx ON automation_steps(scheduled_at) WHERE status = 'pending';
CREATE INDEX automation_steps_lead_idx ON automation_steps(lead_id);
