-- Removes the retired /demo A/B split-test system (dead since /demo now just
-- redirects to /build) and replaces it with simple /build funnel analytics:
-- page views vs. accounts actually created from that funnel.
DROP TABLE IF EXISTS demo_variant_events;

CREATE TABLE build_page_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE build_page_views ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_full" ON build_page_views FOR ALL USING (true) WITH CHECK (true);
CREATE INDEX idx_build_page_views_created_at ON build_page_views (created_at);

-- Tags which funnel an account came from — 'build' for every account created via
-- the /build $1-trial signup flow, reused for other entry points later if needed.
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS signup_source TEXT;
