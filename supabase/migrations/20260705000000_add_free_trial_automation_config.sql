ALTER TABLE owner_automation_config
  ADD COLUMN ft_confirmation_email jsonb DEFAULT NULL,
  ADD COLUMN ft_confirmation_sms text DEFAULT NULL,
  ADD COLUMN ft_reminder_email jsonb DEFAULT NULL,
  ADD COLUMN ft_reminder_sms text DEFAULT NULL,
  ADD COLUMN ft_cancelled_email jsonb DEFAULT NULL;
