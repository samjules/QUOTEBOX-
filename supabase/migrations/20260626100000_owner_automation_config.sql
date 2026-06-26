CREATE TABLE IF NOT EXISTS owner_automation_config (
  id int PRIMARY KEY DEFAULT 1,
  welcome_email jsonb DEFAULT NULL,
  welcome_sms text DEFAULT NULL,
  no_leads_email jsonb DEFAULT NULL,
  no_leads_sms text DEFAULT NULL,
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT owner_automation_config_single_row CHECK (id = 1)
);

INSERT INTO owner_automation_config (id) VALUES (1) ON CONFLICT DO NOTHING;
