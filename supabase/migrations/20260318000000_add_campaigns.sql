-- ============================================================
-- Video Teleprompter / Auto-Editing Campaign Tables
-- New module — does NOT modify any existing tables
-- ============================================================

-- ----------------------------------------------------------------
-- campaigns
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS campaigns (
  id                   UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id              UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status               TEXT        NOT NULL DEFAULT 'processing'
                                   CHECK (status IN ('processing', 'complete', 'failed')),
  original_video_url   TEXT        NOT NULL,
  processed_video_url  TEXT,
  script               JSONB,
  retry_count          INTEGER     NOT NULL DEFAULT 0,
  error_message        TEXT,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------
-- campaign_steps
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS campaign_steps (
  id           UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id  UUID        NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  step         TEXT        NOT NULL
               CHECK (step IN ('transcribing', 'editing', 'captioning', 'rendering')),
  status       TEXT        NOT NULL DEFAULT 'pending'
               CHECK (status IN ('pending', 'processing', 'complete', 'failed')),
  error        TEXT,
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (campaign_id, step)
);

-- ----------------------------------------------------------------
-- Indexes
-- ----------------------------------------------------------------
CREATE INDEX IF NOT EXISTS campaigns_user_id_idx       ON campaigns (user_id);
CREATE INDEX IF NOT EXISTS campaigns_status_idx        ON campaigns (status);
CREATE INDEX IF NOT EXISTS campaign_steps_campaign_idx ON campaign_steps (campaign_id);

-- ----------------------------------------------------------------
-- updated_at trigger helper (reuse pattern already in codebase)
-- ----------------------------------------------------------------
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER campaigns_updated_at
  BEFORE UPDATE ON campaigns
  FOR EACH ROW EXECUTE PROCEDURE set_updated_at();

CREATE TRIGGER campaign_steps_updated_at
  BEFORE UPDATE ON campaign_steps
  FOR EACH ROW EXECUTE PROCEDURE set_updated_at();

-- ----------------------------------------------------------------
-- Row Level Security
-- ----------------------------------------------------------------
ALTER TABLE campaigns      ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_steps ENABLE ROW LEVEL SECURITY;

-- campaigns: users see / modify only their own rows
CREATE POLICY "campaigns: select own"
  ON campaigns FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "campaigns: insert own"
  ON campaigns FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "campaigns: update own"
  ON campaigns FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "campaigns: delete own"
  ON campaigns FOR DELETE
  USING (user_id = auth.uid());

-- campaign_steps: derived access through campaigns
CREATE POLICY "campaign_steps: select via campaign"
  ON campaign_steps FOR SELECT
  USING (
    campaign_id IN (
      SELECT id FROM campaigns WHERE user_id = auth.uid()
    )
  );
