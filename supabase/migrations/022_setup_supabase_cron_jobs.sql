-- Enable required extensions for cron jobs (if not already enabled)
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Create function to check subscription renewals
CREATE OR REPLACE FUNCTION public.check_renewals_cron()
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
    RAISE NOTICE 'CRON_SECRET not configured in Vault, skipping renewal check';
    RETURN;
  END IF;
  
  -- Make HTTP request with Authorization header
  SELECT net.http_post(
    url := app_url || '/api/cron/check-renewals',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || cron_secret
    ),
    body := jsonb_build_object('timestamp', now())
  ) INTO request_id;
  
  RAISE NOTICE 'Renewal check triggered, request_id: %', request_id;
END;
$$;

-- Create function to recalculate leaderboard
CREATE OR REPLACE FUNCTION public.recalculate_leaderboard_cron()
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
    RAISE NOTICE 'CRON_SECRET not configured in Vault, skipping leaderboard recalculation';
    RETURN;
  END IF;
  
  -- Make HTTP request with Authorization header
  SELECT net.http_post(
    url := app_url || '/api/cron/recalculate-leaderboard',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || cron_secret
    ),
    body := jsonb_build_object('timestamp', now())
  ) INTO request_id;
  
  RAISE NOTICE 'Leaderboard recalculation triggered, request_id: %', request_id;
END;
$$;

-- Schedule cron job to check subscription renewals (daily at midnight UTC)
SELECT cron.schedule(
  'check-subscription-renewals',
  '0 0 * * *', -- Daily at 00:00 UTC
  $$SELECT public.check_renewals_cron()$$
);

-- Schedule cron job to recalculate leaderboard (weekly on Sunday at midnight UTC)
SELECT cron.schedule(
  'recalculate-leaderboard',
  '0 0 * * 0', -- Weekly on Sunday at 00:00 UTC
  $$SELECT public.recalculate_leaderboard_cron()$$
);

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.check_renewals_cron() TO postgres;
GRANT EXECUTE ON FUNCTION public.recalculate_leaderboard_cron() TO postgres;

