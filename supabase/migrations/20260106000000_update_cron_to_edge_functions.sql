-- Update cron jobs to use consolidated Supabase Edge Functions
-- Old: https://black-pill.app/api/cron/X
-- New: https://wzsxpxwwgaqiaoxdyhnf.supabase.co/functions/v1/cron?job=X

-- Update function to check subscription renewals
CREATE OR REPLACE FUNCTION public.check_renewals_cron()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  supabase_url TEXT;
  cron_secret TEXT;
  request_id BIGINT;
BEGIN
  -- Use Supabase Edge Functions URL
  supabase_url := 'https://wzsxpxwwgaqiaoxdyhnf.supabase.co';

  -- Get cron secret from Vault (required)
  SELECT decrypted_secret INTO cron_secret FROM vault.decrypted_secrets WHERE name = 'CRON_SECRET';

  -- If no secret configured, skip (security requirement)
  IF cron_secret IS NULL OR cron_secret = '' THEN
    RAISE NOTICE 'CRON_SECRET not configured in Vault, skipping renewal check';
    RETURN;
  END IF;

  -- Make HTTP request to consolidated cron Edge Function
  SELECT net.http_post(
    url := supabase_url || '/functions/v1/cron?job=check-renewals',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || cron_secret
    ),
    body := jsonb_build_object('timestamp', now())
  ) INTO request_id;

  RAISE NOTICE 'Renewal check triggered via Edge Function, request_id: %', request_id;
END;
$$;

-- Update function to recalculate leaderboard
CREATE OR REPLACE FUNCTION public.recalculate_leaderboard_cron()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  supabase_url TEXT;
  cron_secret TEXT;
  request_id BIGINT;
BEGIN
  -- Use Supabase Edge Functions URL
  supabase_url := 'https://wzsxpxwwgaqiaoxdyhnf.supabase.co';

  -- Get cron secret from Vault (required)
  SELECT decrypted_secret INTO cron_secret FROM vault.decrypted_secrets WHERE name = 'CRON_SECRET';

  -- If no secret configured, skip (security requirement)
  IF cron_secret IS NULL OR cron_secret = '' THEN
    RAISE NOTICE 'CRON_SECRET not configured in Vault, skipping leaderboard recalculation';
    RETURN;
  END IF;

  -- Make HTTP request to consolidated cron Edge Function
  SELECT net.http_post(
    url := supabase_url || '/functions/v1/cron?job=recalculate-leaderboard',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || cron_secret
    ),
    body := jsonb_build_object('timestamp', now())
  ) INTO request_id;

  RAISE NOTICE 'Leaderboard recalculation triggered via Edge Function, request_id: %', request_id;
END;
$$;

-- Update function to send daily morning routine reminders
CREATE OR REPLACE FUNCTION public.daily_morning_cron()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  supabase_url TEXT;
  cron_secret TEXT;
  request_id BIGINT;
BEGIN
  -- Use Supabase Edge Functions URL
  supabase_url := 'https://wzsxpxwwgaqiaoxdyhnf.supabase.co';

  -- Get cron secret from Vault (required)
  SELECT decrypted_secret INTO cron_secret FROM vault.decrypted_secrets WHERE name = 'CRON_SECRET';

  -- If no secret configured, skip (security requirement)
  IF cron_secret IS NULL OR cron_secret = '' THEN
    RAISE NOTICE 'CRON_SECRET not configured in Vault, skipping morning reminders';
    RETURN;
  END IF;

  -- Make HTTP request to consolidated cron Edge Function
  SELECT net.http_post(
    url := supabase_url || '/functions/v1/cron?job=daily-morning',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || cron_secret
    ),
    body := jsonb_build_object('timestamp', now())
  ) INTO request_id;

  RAISE NOTICE 'Daily morning reminders triggered via Edge Function, request_id: %', request_id;
END;
$$;

-- Update function to send daily evening reminders and check streaks
CREATE OR REPLACE FUNCTION public.daily_evening_cron()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  supabase_url TEXT;
  cron_secret TEXT;
  request_id BIGINT;
BEGIN
  -- Use Supabase Edge Functions URL
  supabase_url := 'https://wzsxpxwwgaqiaoxdyhnf.supabase.co';

  -- Get cron secret from Vault (required)
  SELECT decrypted_secret INTO cron_secret FROM vault.decrypted_secrets WHERE name = 'CRON_SECRET';

  -- If no secret configured, skip (security requirement)
  IF cron_secret IS NULL OR cron_secret = '' THEN
    RAISE NOTICE 'CRON_SECRET not configured in Vault, skipping evening reminders';
    RETURN;
  END IF;

  -- Make HTTP request to consolidated cron Edge Function
  SELECT net.http_post(
    url := supabase_url || '/functions/v1/cron?job=daily-evening',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || cron_secret
    ),
    body := jsonb_build_object('timestamp', now())
  ) INTO request_id;

  RAISE NOTICE 'Daily evening reminders triggered via Edge Function, request_id: %', request_id;
END;
$$;

-- Update function to generate insights for active users
CREATE OR REPLACE FUNCTION public.generate_insights_cron()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  supabase_url TEXT;
  cron_secret TEXT;
  request_id BIGINT;
BEGIN
  -- Use Supabase Edge Functions URL
  supabase_url := 'https://wzsxpxwwgaqiaoxdyhnf.supabase.co';

  -- Get cron secret from Vault (required)
  SELECT decrypted_secret INTO cron_secret FROM vault.decrypted_secrets WHERE name = 'CRON_SECRET';

  -- If no secret configured, skip (security requirement)
  IF cron_secret IS NULL OR cron_secret = '' THEN
    RAISE NOTICE 'CRON_SECRET not configured in Vault, skipping insight generation';
    RETURN;
  END IF;

  -- Make HTTP request to consolidated cron Edge Function
  SELECT net.http_post(
    url := supabase_url || '/functions/v1/cron?job=generate-insights',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || cron_secret
    ),
    body := jsonb_build_object('timestamp', now())
  ) INTO request_id;

  RAISE NOTICE 'Insight generation triggered via Edge Function, request_id: %', request_id;
END;
$$;

-- Update function to send goal reminders
CREATE OR REPLACE FUNCTION public.goal_reminders_cron()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  supabase_url TEXT;
  cron_secret TEXT;
  request_id BIGINT;
BEGIN
  -- Use Supabase Edge Functions URL
  supabase_url := 'https://wzsxpxwwgaqiaoxdyhnf.supabase.co';

  -- Get cron secret from Vault (required)
  SELECT decrypted_secret INTO cron_secret FROM vault.decrypted_secrets WHERE name = 'CRON_SECRET';

  -- If no secret configured, skip (security requirement)
  IF cron_secret IS NULL OR cron_secret = '' THEN
    RAISE NOTICE 'CRON_SECRET not configured in Vault, skipping goal reminders';
    RETURN;
  END IF;

  -- Make HTTP request to consolidated cron Edge Function
  SELECT net.http_post(
    url := supabase_url || '/functions/v1/cron?job=goal-reminders',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || cron_secret
    ),
    body := jsonb_build_object('timestamp', now())
  ) INTO request_id;

  RAISE NOTICE 'Goal reminders triggered via Edge Function, request_id: %', request_id;
END;
$$;
