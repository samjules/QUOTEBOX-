ALTER TABLE accounts
  ADD COLUMN IF NOT EXISTS docusign_access_token TEXT,
  ADD COLUMN IF NOT EXISTS docusign_refresh_token TEXT,
  ADD COLUMN IF NOT EXISTS docusign_account_id TEXT,
  ADD COLUMN IF NOT EXISTS docusign_user_id TEXT,
  ADD COLUMN IF NOT EXISTS docusign_base_path TEXT,
  ADD COLUMN IF NOT EXISTS docusign_connected_at TIMESTAMPTZ;
