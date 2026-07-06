-- Lets the PPL onboarding invite flow send an SMS in addition to email.
ALTER TABLE onboarding_sessions
  ADD COLUMN IF NOT EXISTS lead_phone TEXT;
