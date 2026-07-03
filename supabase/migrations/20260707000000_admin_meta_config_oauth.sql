ALTER TABLE admin_meta_config
  DROP COLUMN page_access_token,
  ADD COLUMN meta_access_token text,
  ADD COLUMN meta_user_id text,
  ADD COLUMN meta_connected_at timestamptz;

ALTER TABLE admin_meta_config RENAME COLUMN page_id TO meta_page_id;
ALTER TABLE admin_meta_config RENAME COLUMN allowed_form_ids TO meta_allowed_form_ids;
