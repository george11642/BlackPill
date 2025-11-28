-- Add subscription tracking fields to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS unblur_credits INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS analyses_used_this_month INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS coach_messages_used_this_month INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS tier TEXT DEFAULT 'free';

-- Function to decrement unblur credits
CREATE OR REPLACE FUNCTION decrement_unblur_credits(user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  current_credits INTEGER;
BEGIN
  SELECT unblur_credits INTO current_credits FROM users WHERE id = user_id;
  
  IF current_credits > 0 THEN
    UPDATE users SET unblur_credits = unblur_credits - 1 WHERE id = user_id;
    RETURN TRUE;
  ELSE
    RETURN FALSE;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to reset monthly usage (to be called by cron)
CREATE OR REPLACE FUNCTION reset_monthly_usage()
RETURNS VOID AS $$
BEGIN
  UPDATE users SET 
    analyses_used_this_month = 0,
    coach_messages_used_this_month = 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

