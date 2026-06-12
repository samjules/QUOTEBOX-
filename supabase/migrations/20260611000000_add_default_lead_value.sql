ALTER TABLE lead_automations
  ADD COLUMN IF NOT EXISTS default_lead_value numeric DEFAULT NULL;
