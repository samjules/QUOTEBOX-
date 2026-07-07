-- Per-business average local driving speed, used to compute drive time from the
-- route API's distance (distance_miles / avg_driving_mph) instead of trusting the
-- API's own duration estimate, which has proven unreliable. Reused across every
-- future quote calculation for that account rather than asked per submission.
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS avg_driving_mph INTEGER;
