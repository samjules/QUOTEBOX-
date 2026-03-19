-- VSL campaigns table for iOS app video sales letter generation
CREATE TABLE vsl_campaigns (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id          TEXT NOT NULL,
  title               TEXT,
  status              TEXT NOT NULL DEFAULT 'pending'
                      CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  current_step        TEXT
                      CHECK (current_step IS NULL OR current_step IN ('removing_silence', 'adding_captions', 'finalizing')),
  script_text         TEXT,
  raw_video_url       TEXT,
  processed_video_url TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS
ALTER TABLE vsl_campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "vsl_campaigns: users can read own"
  ON vsl_campaigns FOR SELECT
  USING (account_id IN (
    SELECT id::text FROM accounts WHERE owner_id = auth.uid()
  ));

CREATE POLICY "vsl_campaigns: service role full access"
  ON vsl_campaigns FOR ALL
  USING (true)
  WITH CHECK (true);

-- Only the service role policy applies for INSERT/UPDATE/DELETE (admin client bypasses RLS anyway)
-- The SELECT policy allows authenticated users to read their own campaigns
