-- Agreements: built-in e-signature system (replaces DocuSign)
CREATE TABLE agreements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'Service Agreement',
  document_url TEXT,
  token UUID NOT NULL DEFAULT gen_random_uuid(),
  status TEXT NOT NULL DEFAULT 'sent' CHECK (status IN ('sent', 'viewed', 'signed')),
  signer_name TEXT,
  signer_email TEXT,
  signature_data TEXT,
  signed_at TIMESTAMPTZ,
  signer_ip TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE UNIQUE INDEX idx_agreements_token ON agreements(token);
CREATE INDEX idx_agreements_account_id ON agreements(account_id);
CREATE INDEX idx_agreements_lead_id ON agreements(lead_id);

-- Enable RLS
ALTER TABLE agreements ENABLE ROW LEVEL SECURITY;

-- Owners can manage their account's agreements
CREATE POLICY "Owners manage agreements" ON agreements
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

-- Employees can read their account's agreements
CREATE POLICY "Employees read account agreements" ON agreements
  FOR SELECT
  USING (
    account_id IN (
      SELECT am.account_id FROM account_members am WHERE am.user_id = auth.uid()
    )
  );

-- Add agreement_template_url column to accounts
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS agreement_template_url TEXT;

-- Remove DocuSign columns from accounts (cleanup)
ALTER TABLE accounts
  DROP COLUMN IF EXISTS docusign_access_token,
  DROP COLUMN IF EXISTS docusign_refresh_token,
  DROP COLUMN IF EXISTS docusign_account_id,
  DROP COLUMN IF EXISTS docusign_user_id,
  DROP COLUMN IF EXISTS docusign_base_path,
  DROP COLUMN IF EXISTS docusign_connected_at;

-- Remove agreement fields from leads (old DocuSign fields)
ALTER TABLE leads
  DROP COLUMN IF EXISTS agreement_envelope_id,
  DROP COLUMN IF EXISTS agreement_status,
  DROP COLUMN IF EXISTS agreement_sent_at;
