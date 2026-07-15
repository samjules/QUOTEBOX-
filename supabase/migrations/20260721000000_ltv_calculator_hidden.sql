-- Lets an account hide the LTV Calculator card from their dashboard via Settings.
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS ltv_calculator_hidden BOOLEAN NOT NULL DEFAULT FALSE;
