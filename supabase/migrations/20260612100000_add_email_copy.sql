ALTER TABLE lead_automations
  ADD COLUMN IF NOT EXISTS email_copy jsonb DEFAULT NULL;
