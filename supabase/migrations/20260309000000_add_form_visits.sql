create table if not exists form_visits (
  id uuid primary key default gen_random_uuid(),
  hosted_form_id uuid references hosted_forms(id) on delete cascade not null,
  account_id uuid not null,
  visited_at timestamptz default now() not null
);

create index if not exists form_visits_account_id_idx on form_visits(account_id);
create index if not exists form_visits_form_id_idx on form_visits(hosted_form_id);
create index if not exists form_visits_visited_at_idx on form_visits(visited_at);

alter table form_visits enable row level security;

-- Account owners can read their own visit data
create policy "Account owners can view their form visits"
  on form_visits for select
  using (
    account_id in (select id from accounts where owner_id = auth.uid())
  );

-- Allow anonymous inserts (public form visitors)
create policy "Allow anonymous visit inserts"
  on form_visits for insert
  with check (true);
