-- Update all hosted forms that have quote_display = 'live' to 'after_submit'
-- so the price is only revealed after the customer presses submit.
UPDATE hosted_forms
SET form_config = jsonb_set(form_config, '{quote_display}', '"after_submit"')
WHERE form_config->>'quote_display' = 'live';
