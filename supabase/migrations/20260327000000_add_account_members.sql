-- Account Members: employee/team system
CREATE TABLE account_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  email TEXT NOT NULL,
  name TEXT,
  role TEXT NOT NULL DEFAULT 'employee' CHECK (role IN ('owner', 'employee')),
  invite_token UUID DEFAULT gen_random_uuid(),
  invited_at TIMESTAMPTZ DEFAULT now(),
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Unique constraint: one email per account
CREATE UNIQUE INDEX idx_account_members_account_email ON account_members(account_id, email);

-- Index for invite token lookups
CREATE UNIQUE INDEX idx_account_members_invite_token ON account_members(invite_token) WHERE invite_token IS NOT NULL;

-- Index for user lookups
CREATE INDEX idx_account_members_user_id ON account_members(user_id) WHERE user_id IS NOT NULL;

-- Enable RLS
ALTER TABLE account_members ENABLE ROW LEVEL SECURITY;

-- Owners can do everything with their account's members
CREATE POLICY "Owners manage members" ON account_members
  FOR ALL
  USING (
    account_id IN (
      SELECT id FROM accounts WHERE owner_id = auth.uid()
    )
  )
  WITH CHECK (
    account_id IN (
      SELECT id FROM accounts WHERE owner_id = auth.uid()
    )
  );

-- Employees can read their own membership
CREATE POLICY "Employees read own membership" ON account_members
  FOR SELECT
  USING (user_id = auth.uid());

-- Backfill: create owner rows for all existing accounts
INSERT INTO account_members (account_id, user_id, email, role, accepted_at)
SELECT
  a.id,
  a.owner_id,
  u.email,
  'owner',
  now()
FROM accounts a
JOIN auth.users u ON u.id = a.owner_id
ON CONFLICT (account_id, email) DO NOTHING;
