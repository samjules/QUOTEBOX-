-- Enable RLS on billing (safe to run even if already enabled)
alter table billing enable row level security;

-- Drop existing policies if any (idempotent)
drop policy if exists "Users can view own billing" on billing;
drop policy if exists "Users can insert own billing" on billing;
drop policy if exists "Users can update own billing" on billing;

-- SELECT: user can read their own billing row
create policy "Users can view own billing"
  on billing for select
  using (
    account_id in (
      select id from accounts where owner_id = auth.uid()
    )
  );

-- INSERT: user can create a billing row for their own account
create policy "Users can insert own billing"
  on billing for insert
  with check (
    account_id in (
      select id from accounts where owner_id = auth.uid()
    )
  );

-- UPDATE: user can update their own billing row
create policy "Users can update own billing"
  on billing for update
  using (
    account_id in (
      select id from accounts where owner_id = auth.uid()
    )
  );
