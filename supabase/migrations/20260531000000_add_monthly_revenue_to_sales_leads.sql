ALTER TABLE sales_leads
  ADD COLUMN IF NOT EXISTS monthly_revenue TEXT;

ALTER TABLE sales_leads
  ALTER COLUMN tier DROP NOT NULL,
  ALTER COLUMN monthly_total DROP NOT NULL;

ALTER TABLE sales_leads
  DROP CONSTRAINT IF EXISTS sales_leads_tier_check;
