alter table billing
  add column if not exists trial_ends_at timestamptz;
