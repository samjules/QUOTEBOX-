-- Scoped API-key access for external agents (e.g. Tim) to read analytics and
-- propose changes to automations/forms on behalf of one account.

CREATE TABLE agent_api_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  name text NOT NULL,
  key_hash text NOT NULL UNIQUE,       -- sha256 hex of the plaintext key; plaintext is shown once at creation and never stored
  key_prefix text NOT NULL,            -- first 8 chars of the plaintext, for display in the UI ("qbk_a1b2c3d4...")
  scopes text[] NOT NULL DEFAULT '{}', -- e.g. 'analytics:read', 'automations:read', 'automations:write', 'forms:read', 'forms:write'
  last_used_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE agent_api_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owner_all" ON agent_api_keys
  FOR ALL USING (
    account_id IN (SELECT id FROM accounts WHERE owner_id = auth.uid())
  );

-- Writes proposed by an agent (automation config changes, form create/edit) sit
-- here pending the account owner's approval in QuoteBox — nothing an agent
-- sends is applied until approved.
CREATE TABLE agent_proposed_changes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  api_key_id uuid NOT NULL REFERENCES agent_api_keys(id) ON DELETE CASCADE,
  target text NOT NULL CHECK (target IN ('automation', 'form')),
  action text NOT NULL CHECK (action IN ('update', 'create')),
  target_id uuid,               -- form id being updated; null for automation updates (one per account) and form creates
  changes jsonb NOT NULL,       -- proposed field values to apply on approval
  rationale text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz
);

ALTER TABLE agent_proposed_changes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owner_all" ON agent_proposed_changes
  FOR ALL USING (
    account_id IN (SELECT id FROM accounts WHERE owner_id = auth.uid())
  );

CREATE INDEX agent_proposed_changes_pending_idx ON agent_proposed_changes(account_id) WHERE status = 'pending';
