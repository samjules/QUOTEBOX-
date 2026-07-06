-- PPL onboarding now starts from a raw lead (no account yet) and gates on
-- password creation + a $750/mo Stripe subscription before the wizard steps.
ALTER TABLE onboarding_sessions ALTER COLUMN account_id DROP NOT NULL;

ALTER TABLE onboarding_sessions
  ADD COLUMN IF NOT EXISTS lead_name TEXT,
  ADD COLUMN IF NOT EXISTS lead_email TEXT,
  ADD COLUMN IF NOT EXISTS password_set_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_onboarding_sessions_lead_email ON onboarding_sessions (lead_email);
