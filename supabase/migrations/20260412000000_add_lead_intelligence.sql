-- Lead Intelligence Pixel System tables
-- Phase 1: Session/event tracking, lead scoring
-- Phase 2: Zip enrichment, map dashboard
-- Phase 3: Outcome tracking

-- Enums
create type pixel_event_type as enum (
  'page_view', 'scroll_depth', 'field_focus', 'form_submit_detected',
  'time_on_page', 'session_end'
);

create type lead_quality as enum ('hot', 'warm', 'cool', 'cold');

create type outcome_status as enum ('won', 'lost');

-- Pixel sessions: one row per visitor page load
create table if not exists pixel_sessions (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null,
  hosted_form_id uuid references hosted_forms(id) on delete set null,
  session_token text not null,
  -- Geo (resolved from IP, raw IP never stored)
  city text,
  region text,
  postal_code text,
  country text default 'US',
  latitude double precision,
  longitude double precision,
  -- UTM params
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_term text,
  utm_content text,
  -- Device
  user_agent text,
  device_type text, -- desktop, mobile, tablet
  -- Consent
  consent_given boolean default false,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

create index pixel_sessions_account_id_idx on pixel_sessions(account_id);
create index pixel_sessions_hosted_form_id_idx on pixel_sessions(hosted_form_id);
create index pixel_sessions_postal_code_idx on pixel_sessions(postal_code);
create index pixel_sessions_created_at_idx on pixel_sessions(created_at);
create unique index pixel_sessions_token_idx on pixel_sessions(session_token);

-- Pixel events: telemetry from each session
create table if not exists pixel_events (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references pixel_sessions(id) on delete cascade not null,
  event_type pixel_event_type not null,
  payload jsonb default '{}'::jsonb,
  created_at timestamptz default now() not null
);

create index pixel_events_session_id_idx on pixel_events(session_id);
create index pixel_events_event_type_idx on pixel_events(event_type);
create index pixel_events_created_at_idx on pixel_events(created_at);

-- Intelligence leads: one per form submission detected by pixel
create table if not exists intelligence_leads (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null,
  session_id uuid references pixel_sessions(id) on delete set null,
  hosted_form_id uuid references hosted_forms(id) on delete set null,
  -- Quality scoring
  quality lead_quality default 'cold',
  quality_score numeric(5,2) default 0,
  engagement_score numeric(5,2) default 0,
  zip_quality_score numeric(5,2) default 0,
  outcome_score numeric(5,2) default 0,
  -- Geo (copied from session for fast queries)
  postal_code text,
  city text,
  region text,
  latitude double precision,
  longitude double precision,
  -- Metadata
  created_at timestamptz default now() not null,
  scored_at timestamptz
);

create index intelligence_leads_account_id_idx on intelligence_leads(account_id);
create index intelligence_leads_postal_code_idx on intelligence_leads(postal_code);
create index intelligence_leads_quality_idx on intelligence_leads(quality);
create index intelligence_leads_created_at_idx on intelligence_leads(created_at);

-- Outcomes: won/lost tracking (Phase 3)
create table if not exists outcomes (
  id uuid primary key default gen_random_uuid(),
  intelligence_lead_id uuid references intelligence_leads(id) on delete cascade not null unique,
  status outcome_status not null,
  actual_value numeric(10,2),
  notes text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

create index outcomes_lead_id_idx on outcomes(intelligence_lead_id);

-- Zip enrichment: static lookup for city/state/coords/demographics
create table if not exists zip_enrichment (
  postal_code text primary key,
  city text not null,
  state text not null,
  latitude double precision not null,
  longitude double precision not null,
  median_income integer,
  population integer
);

-- RLS policies
alter table pixel_sessions enable row level security;
alter table pixel_events enable row level security;
alter table intelligence_leads enable row level security;
alter table outcomes enable row level security;
alter table zip_enrichment enable row level security;

-- Pixel sessions: anonymous insert (from pixel), owner can read
create policy "Allow anonymous pixel session inserts"
  on pixel_sessions for insert
  with check (true);

create policy "Account owners can view their pixel sessions"
  on pixel_sessions for select
  using (
    account_id in (select id from accounts where owner_id = auth.uid())
  );

create policy "Allow anonymous pixel session updates"
  on pixel_sessions for update
  using (true)
  with check (true);

-- Pixel events: anonymous insert, owner can read via session
create policy "Allow anonymous pixel event inserts"
  on pixel_events for insert
  with check (true);

create policy "Account owners can view their pixel events"
  on pixel_events for select
  using (
    session_id in (
      select id from pixel_sessions
      where account_id in (select id from accounts where owner_id = auth.uid())
    )
  );

-- Intelligence leads: service role insert, owner can read
create policy "Allow anonymous intelligence lead inserts"
  on intelligence_leads for insert
  with check (true);

create policy "Account owners can view their intelligence leads"
  on intelligence_leads for select
  using (
    account_id in (select id from accounts where owner_id = auth.uid())
  );

create policy "Allow intelligence lead updates"
  on intelligence_leads for update
  using (true)
  with check (true);

-- Outcomes: owner can manage
create policy "Account owners can manage outcomes"
  on outcomes for all
  using (
    intelligence_lead_id in (
      select id from intelligence_leads
      where account_id in (select id from accounts where owner_id = auth.uid())
    )
  );

-- Zip enrichment: anyone can read
create policy "Anyone can read zip enrichment"
  on zip_enrichment for select
  using (true);

create policy "Allow zip enrichment inserts"
  on zip_enrichment for insert
  with check (true);
