CREATE TABLE admin_meta_config (
  id int PRIMARY KEY DEFAULT 1,
  page_id text,
  page_access_token text,
  allowed_form_ids jsonb DEFAULT '[]'::jsonb,
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT admin_meta_config_single_row CHECK (id = 1)
);

INSERT INTO admin_meta_config (id) VALUES (1) ON CONFLICT DO NOTHING;

ALTER TABLE admin_meta_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_full" ON admin_meta_config FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE sales_leads ADD COLUMN meta_lead_id text;
ALTER TABLE sales_leads ADD COLUMN source text;

CREATE UNIQUE INDEX idx_sales_leads_meta_lead_id ON sales_leads (meta_lead_id) WHERE meta_lead_id IS NOT NULL;
