-- TCPA-style SMS opt-in tracking for sales_leads (case study, setup booking, etc).
-- Defaults false — consent must be an affirmative, unforced checkbox action.
ALTER TABLE sales_leads ADD COLUMN IF NOT EXISTS sms_consent BOOLEAN NOT NULL DEFAULT false;
