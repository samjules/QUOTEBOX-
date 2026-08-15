-- Adds read access to individual leads and outbound new-lead webhooks to the
-- agent API, so external systems (e.g. a client's CRM) can pull lead records
-- and be notified in near-real-time when a new one comes in.

ALTER TABLE agent_api_keys ADD COLUMN webhook_url text;
ALTER TABLE agent_api_keys ADD COLUMN webhook_secret text;
