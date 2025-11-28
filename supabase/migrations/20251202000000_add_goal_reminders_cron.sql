-- Add cron job for goal reminder notifications
-- Checks goals approaching deadline and sends push notifications

-- Create function to send goal reminders
CREATE OR REPLACE FUNCTION public.goal_reminders_cron()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  app_url TEXT;
  cron_secret TEXT;
  request_id BIGINT;
BEGIN
  -- Use production app URL
  app_url := 'https://black-pill.app';
  
  -- Get cron secret from Vault (required)
  SELECT decrypted_secret INTO cron_secret FROM vault.decrypted_secrets WHERE name = 'CRON_SECRET';
  
  -- If no secret configured, skip (security requirement)
  IF cron_secret IS NULL OR cron_secret = '' THEN
    RAISE NOTICE 'CRON_SECRET not configured in Vault, skipping goal reminders';
    RETURN;
  END IF;
  
  -- Make HTTP request with Authorization header
  SELECT net.http_post(
    url := app_url || '/api/cron/goal-reminders',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || cron_secret
    ),
    body := jsonb_build_object('timestamp', now())
  ) INTO request_id;
  
  RAISE NOTICE 'Goal reminders triggered, request_id: %', request_id;
END;
$$;

-- Schedule cron job for goal reminders (daily at 09:00 UTC)
SELECT cron.schedule(
  'goal-reminders-daily',
  '0 9 * * *', -- Daily at 09:00 UTC
  $$SELECT public.goal_reminders_cron()$$
);

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.goal_reminders_cron() TO postgres;

