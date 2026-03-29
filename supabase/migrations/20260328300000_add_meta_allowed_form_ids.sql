ALTER TABLE accounts ADD COLUMN IF NOT EXISTS meta_allowed_form_ids JSONB DEFAULT '[]';
