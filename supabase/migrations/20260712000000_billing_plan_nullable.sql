-- billing.plan has a NOT NULL constraint that predates the migrations folder, but every
-- code path that creates a billing row for a not-yet-subscribed account (create-account
-- routes, the billing page's fallback insert, the free-signup wizard) inserts plan: null,
-- matching the app's Billing['plan'] type (`... | null`) and every null-check downstream.
-- That NOT NULL constraint has been silently failing all of those inserts.
ALTER TABLE billing ALTER COLUMN plan DROP NOT NULL;
