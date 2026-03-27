ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS agreement_envelope_id TEXT,
  ADD COLUMN IF NOT EXISTS agreement_status TEXT,
  ADD COLUMN IF NOT EXISTS agreement_sent_at TIMESTAMPTZ;
