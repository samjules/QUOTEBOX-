ALTER TABLE accounts ADD COLUMN IF NOT EXISTS logo_url TEXT;
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS upsell_purchased_at TIMESTAMPTZ;

ALTER TABLE billing DROP CONSTRAINT IF EXISTS billing_plan_check;

ALTER TABLE billing
  ADD CONSTRAINT billing_plan_check
    CHECK (plan IS NULL OR plan IN ('starter', 'growth', 'fully_managed', 'pro', 'pay_per_lead', 'trial'));
