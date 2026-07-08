-- Tracks button presses through the /build funnel (which CTA, which wizard step
-- completed) so drop-off points are visible on /admin/build-analytics alongside
-- the existing page-view count and accounts-created count.
CREATE TABLE build_funnel_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE build_funnel_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_full" ON build_funnel_events FOR ALL USING (true) WITH CHECK (true);
CREATE INDEX idx_build_funnel_events_event ON build_funnel_events (event);
