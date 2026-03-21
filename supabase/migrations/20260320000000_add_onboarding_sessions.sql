-- Pay-per-lead onboarding sessions
CREATE TABLE onboarding_sessions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id    TEXT NOT NULL,
  token         TEXT NOT NULL UNIQUE,
  status        TEXT NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending', 'in_progress', 'completed', 'form_built')),
  step_data     JSONB NOT NULL DEFAULT '{}',
  current_step  INT NOT NULL DEFAULT 1,
  created_by    UUID,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS
ALTER TABLE onboarding_sessions ENABLE ROW LEVEL SECURITY;

-- Public read/write by token (handled via service role in API routes)
CREATE POLICY "onboarding_sessions: service role full access"
  ON onboarding_sessions FOR ALL
  USING (true)
  WITH CHECK (true);

-- Index for token lookups
CREATE INDEX idx_onboarding_sessions_token ON onboarding_sessions (token);
CREATE INDEX idx_onboarding_sessions_account ON onboarding_sessions (account_id);
