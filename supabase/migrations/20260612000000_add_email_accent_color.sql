ALTER TABLE lead_automations
  ADD COLUMN IF NOT EXISTS accent_color text DEFAULT '#5b50d6';
