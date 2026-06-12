-- Allow pay_per_lead as a valid billing plan
ALTER TABLE billing DROP CONSTRAINT IF EXISTS billing_plan_check;
ALTER TABLE billing
  ADD CONSTRAINT billing_plan_check
    CHECK (plan IS NULL OR plan IN ('starter', 'growth', 'fully_managed', 'pay_per_lead'));
