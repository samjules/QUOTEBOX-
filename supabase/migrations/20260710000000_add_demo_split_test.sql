CREATE TABLE demo_variant_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  variant TEXT NOT NULL CHECK (variant IN ('quote_form', 'ios_app')),
  event_type TEXT NOT NULL CHECK (event_type IN ('view', 'booked')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE demo_variant_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_full" ON demo_variant_events FOR ALL USING (true) WITH CHECK (true);

CREATE INDEX idx_demo_variant_events_variant_event ON demo_variant_events (variant, event_type);

ALTER TABLE free_trial_leads ADD COLUMN demo_variant TEXT;
