-- Add cron jobs for daily morning reminders, evening reminders, and insight generation
-- These jobs are scheduled via Supabase pg_cron

-- Create function to send daily morning routine reminders
CREATE OR REPLACE FUNCTION public.daily_morning_cron()
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
    RAISE NOTICE 'CRON_SECRET not configured in Vault, skipping morning reminders';
    RETURN;
  END IF;
  
  -- Make HTTP request with Authorization header
  SELECT net.http_post(
    url := app_url || '/api/cron/daily-morning',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || cron_secret
    ),
    body := jsonb_build_object('timestamp', now())
  ) INTO request_id;
  
  RAISE NOTICE 'Daily morning reminders triggered, request_id: %', request_id;
END;
$$;

-- Create function to send daily evening reminders and check streaks
CREATE OR REPLACE FUNCTION public.daily_evening_cron()
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
    RAISE NOTICE 'CRON_SECRET not configured in Vault, skipping evening reminders';
    RETURN;
  END IF;
  
  -- Make HTTP request with Authorization header
  SELECT net.http_post(
    url := app_url || '/api/cron/daily-evening',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || cron_secret
    ),
    body := jsonb_build_object('timestamp', now())
  ) INTO request_id;
  
  RAISE NOTICE 'Daily evening reminders triggered, request_id: %', request_id;
END;
$$;

-- Create function to generate insights for active users
CREATE OR REPLACE FUNCTION public.generate_insights_cron()
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
    RAISE NOTICE 'CRON_SECRET not configured in Vault, skipping insight generation';
    RETURN;
  END IF;
  
  -- Make HTTP request with Authorization header
  SELECT net.http_post(
    url := app_url || '/api/cron/generate-insights',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || cron_secret
    ),
    body := jsonb_build_object('timestamp', now())
  ) INTO request_id;
  
  RAISE NOTICE 'Insight generation triggered, request_id: %', request_id;
END;
$$;

-- Schedule cron job for daily morning reminders (08:00 UTC - adjust timezone as needed)
SELECT cron.schedule(
  'daily-morning-reminders',
  '0 8 * * *', -- Daily at 08:00 UTC
  $$SELECT public.daily_morning_cron()$$
);

-- Schedule cron job for daily evening reminders (20:00 UTC - adjust timezone as needed)
SELECT cron.schedule(
  'daily-evening-reminders',
  '0 20 * * *', -- Daily at 20:00 UTC
  $$SELECT public.daily_evening_cron()$$
);

-- Schedule cron job for insight generation (weekly on Sunday at 02:00 UTC)
SELECT cron.schedule(
  'generate-insights-weekly',
  '0 2 * * 0', -- Weekly on Sunday at 02:00 UTC
  $$SELECT public.generate_insights_cron()$$
);

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.daily_morning_cron() TO postgres;
GRANT EXECUTE ON FUNCTION public.daily_evening_cron() TO postgres;
GRANT EXECUTE ON FUNCTION public.generate_insights_cron() TO postgres;

