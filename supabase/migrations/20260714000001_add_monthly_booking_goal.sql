-- Captured during /build signup ("how many booked jobs do you want this month?")
-- so we can design an email nurture flow around each business's own stated goal.
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS monthly_booking_goal INTEGER;
