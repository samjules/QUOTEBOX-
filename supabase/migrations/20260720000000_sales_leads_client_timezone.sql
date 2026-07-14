-- Client's local timezone (IANA), captured from the state picked on admin/book-call,
-- so confirmation/reminder emails and texts can show the client's own local time
-- alongside the Alaska time.
ALTER TABLE sales_leads ADD COLUMN IF NOT EXISTS client_timezone TEXT;
