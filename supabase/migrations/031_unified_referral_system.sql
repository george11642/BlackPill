-- Migration: Unified Referral and Commission System
-- Date: 2025-01-30
-- Description: Add referred_by tracking to subscriptions and unify referral/affiliate systems

-- Add referred_by_user_id to subscriptions table to track who referred the subscriber
ALTER TABLE public.subscriptions
ADD COLUMN IF NOT EXISTS referred_by_user_id UUID REFERENCES public.users(id) ON DELETE SET NULL;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_subscriptions_referred_by_user_id 
ON public.subscriptions(referred_by_user_id);

-- Function to check if a user has an active subscription
CREATE OR REPLACE FUNCTION user_has_active_subscription(p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS(
    SELECT 1 FROM public.subscriptions
    WHERE user_id = p_user_id
      AND status = 'active'
  );
END;
$$ LANGUAGE plpgsql;

-- Function to get referrer's commission rate (20% default, or based on affiliate tier)
CREATE OR REPLACE FUNCTION get_referrer_commission_rate(p_referrer_user_id UUID)
RETURNS DECIMAL(5,2) AS $$
DECLARE
  v_commission_rate DECIMAL(5,2) := 20.00;
  v_affiliate_record RECORD;
BEGIN
  -- Check if referrer has an affiliate record
  SELECT commission_rate INTO v_affiliate_record
  FROM public.affiliates
  WHERE user_id = p_referrer_user_id
    AND is_active = TRUE
  LIMIT 1;

  IF v_affiliate_record IS NOT NULL THEN
    -- Use affiliate's commission rate if they have one
    SELECT commission_rate INTO v_commission_rate
    FROM public.affiliates
    WHERE user_id = p_referrer_user_id
      AND is_active = TRUE
    LIMIT 1;
  END IF;

  RETURN v_commission_rate;
END;
$$ LANGUAGE plpgsql;

