CREATE TABLE IF NOT EXISTS owner_onboarding_steps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  step text NOT NULL,           -- 'welcome' | 'no_leads_followup'
  status text NOT NULL DEFAULT 'pending',  -- 'pending' | 'sent' | 'skipped'
  scheduled_at timestamptz NOT NULL,
  sent_at timestamptz,
  created_at timestamptz DEFAULT now(),
  UNIQUE (account_id, step)
);

CREATE INDEX IF NOT EXISTS owner_onboarding_steps_pending
  ON owner_onboarding_steps (status, scheduled_at)
  WHERE status = 'pending';

-- Store owner calendar booking URL at the system level
ALTER TABLE accounts
  ADD COLUMN IF NOT EXISTS phone text;
