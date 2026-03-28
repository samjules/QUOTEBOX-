CREATE TABLE sales_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  tier INT NOT NULL CHECK (tier IN (25, 50, 100, 200)),
  price_per_lead NUMERIC(10,2) NOT NULL DEFAULT 30.00,
  monthly_total NUMERIC(10,2) NOT NULL,
  scheduled_date DATE,
  scheduled_time TEXT,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new','contacted','closed','lost')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE sales_leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_full" ON sales_leads FOR ALL USING (true) WITH CHECK (true);

CREATE INDEX idx_sales_leads_scheduled ON sales_leads (scheduled_date, scheduled_time);
