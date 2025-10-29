-- Migration: Fix subscriptions table schema
-- Date: 2025-01-29
-- Description: Add source column and make user_id nullable for web flow support

-- Add source column to track subscription origin (app vs web)
ALTER TABLE public.subscriptions 
ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'web' CHECK (source IN ('app', 'web'));

-- Create index for analytics queries
CREATE INDEX IF NOT EXISTS idx_subscriptions_source ON public.subscriptions(source);

-- Make user_id nullable to support web flow subscriptions before app signup
-- First, drop the NOT NULL constraint
ALTER TABLE public.subscriptions 
ALTER COLUMN user_id DROP NOT NULL;

-- Drop the UNIQUE constraint on user_id (since web flow can have NULL user_id)
-- We'll use a partial unique index instead that only applies when user_id is NOT NULL
ALTER TABLE public.subscriptions 
DROP CONSTRAINT IF EXISTS subscriptions_user_id_key;

-- Create a partial unique index for user_id (only when NOT NULL)
CREATE UNIQUE INDEX IF NOT EXISTS subscriptions_user_id_unique 
ON public.subscriptions(user_id) 
WHERE user_id IS NOT NULL;

-- Update comment to document the schema change
COMMENT ON COLUMN public.subscriptions.source IS 'Tracks subscription origin: app (from mobile app) or web (from web marketing page)';
COMMENT ON COLUMN public.subscriptions.user_id IS 'User ID - NULL allowed for web flow subscriptions before app signup';

