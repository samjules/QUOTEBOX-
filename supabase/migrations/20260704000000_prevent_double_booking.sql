-- Resolve any existing double-bookings before enforcing uniqueness: keep the
-- earliest booking per (date, time) among pending/confirmed leads, cancel the rest.
WITH ranked AS (
  SELECT id, ROW_NUMBER() OVER (
    PARTITION BY scheduled_date, scheduled_time
    ORDER BY created_at ASC
  ) AS rn
  FROM free_trial_leads
  WHERE status IN ('pending_confirmation', 'confirmed')
)
UPDATE free_trial_leads
SET status = 'cancelled', cancelled_at = NOW()
WHERE id IN (SELECT id FROM ranked WHERE rn > 1);

CREATE UNIQUE INDEX idx_free_trial_leads_no_double_book
  ON free_trial_leads (scheduled_date, scheduled_time)
  WHERE status IN ('pending_confirmation', 'confirmed');
