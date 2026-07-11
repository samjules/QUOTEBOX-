-- Tracks the real appointment instant (for 24h-buffer enforcement + reminder
-- scheduling) and whether confirmation/reminder messages have gone out, for
-- sales_leads bookings (case study walkthrough, $297 setup calls).
ALTER TABLE sales_leads ADD COLUMN IF NOT EXISTS scheduled_at TIMESTAMPTZ;
ALTER TABLE sales_leads ADD COLUMN IF NOT EXISTS confirmation_sent_at TIMESTAMPTZ;
ALTER TABLE sales_leads ADD COLUMN IF NOT EXISTS reminder_sent_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_sales_leads_scheduled_at ON sales_leads (scheduled_at) WHERE scheduled_at IS NOT NULL;
