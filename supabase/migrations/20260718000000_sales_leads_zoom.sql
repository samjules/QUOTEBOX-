-- Zoom meeting support for admin-booked phone-sales calls (sales_leads.source = 'phone_sales').
ALTER TABLE sales_leads ADD COLUMN IF NOT EXISTS zoom_meeting_id TEXT;
ALTER TABLE sales_leads ADD COLUMN IF NOT EXISTS zoom_join_url TEXT;
