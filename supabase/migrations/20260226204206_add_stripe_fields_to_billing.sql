do $$
begin
  -- Add Stripe tracking columns if they don't already exist
  if not exists (
    select 1 from information_schema.columns
    where table_name = 'billing' and column_name = 'stripe_customer_id'
  ) then
    alter table billing add column stripe_customer_id text;
  end if;

  if not exists (
    select 1 from information_schema.columns
    where table_name = 'billing' and column_name = 'stripe_subscription_id'
  ) then
    alter table billing add column stripe_subscription_id text;
  end if;

  -- Drop any existing plan check constraint before touching data
  alter table billing drop constraint if exists billing_plan_check;

  -- Migrate old plan names → new tier names
  update billing set plan = 'starter'       where plan = 'base';
  update billing set plan = 'growth'        where plan = 'pro';
  update billing set plan = 'fully_managed' where plan = 'agency';
  -- Null out anything else that isn't a recognised tier
  update billing set plan = null
    where plan is not null
      and plan not in ('starter', 'growth', 'fully_managed');

  -- Re-add constraint now that all rows are clean
  alter table billing
    add constraint billing_plan_check
      check (plan is null or plan in ('starter', 'growth', 'fully_managed'));
end;
$$;
