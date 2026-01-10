-- Migration: Fix Referral RLS Policy
-- Date: 2026-01-09
-- Description: Restrict referral insertions to prevent fraud
-- Previously: WITH CHECK (TRUE) allowed any user to create referrals
-- Now: Only allow authenticated users to create referrals where they are the referred user

-- Drop the overly permissive policy
DROP POLICY IF EXISTS "referrals_insert" ON public.referrals;

-- Create a more restrictive policy
-- Only the referred user (to_user_id) can create their own referral record
-- This happens after signup when the user confirms the referral
CREATE POLICY "referrals_insert_own" ON public.referrals
  FOR INSERT
  WITH CHECK (auth.uid() = to_user_id);

-- Add comment explaining the policy
COMMENT ON POLICY "referrals_insert_own" ON public.referrals IS
  'Users can only create referral records where they are the referred party (to_user_id). This prevents referral fraud by ensuring only authenticated users can claim referrals for themselves.';
