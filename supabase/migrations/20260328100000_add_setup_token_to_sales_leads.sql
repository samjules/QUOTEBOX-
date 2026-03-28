ALTER TABLE sales_leads ADD COLUMN setup_token UUID DEFAULT gen_random_uuid();
CREATE UNIQUE INDEX idx_sales_leads_setup_token ON sales_leads (setup_token) WHERE setup_token IS NOT NULL;
