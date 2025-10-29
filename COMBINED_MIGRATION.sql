-- Black Pill - Combined Database Migration
-- Generated: 2025-10-28T23:50:39.741Z
-- Run this entire file in Supabase SQL Editor


-- ============================================================
-- Migration 1/5: 001_initial_schema.sql
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (extends Supabase auth.users)
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  google_id TEXT UNIQUE,
  referral_code TEXT UNIQUE NOT NULL,
  referred_by UUID REFERENCES public.users(id),
  scans_remaining INT DEFAULT 1,
  total_scans_used INT DEFAULT 0,
  tier TEXT DEFAULT 'free' CHECK (tier IN ('free', 'basic', 'pro', 'unlimited')),
  username TEXT UNIQUE,
  avatar_url TEXT,
  bio TEXT,
  location TEXT,
  age_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_active TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- Analyses table
CREATE TABLE public.analyses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  image_url TEXT,
  image_thumbnail_url TEXT,
  score DECIMAL(3,1) NOT NULL CHECK (score >= 1 AND score <= 10),
  breakdown JSONB NOT NULL,
  tips JSONB NOT NULL,
  is_public BOOLEAN DEFAULT FALSE,
  view_count INT DEFAULT 0,
  like_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- Subscriptions table
CREATE TABLE public.subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
  stripe_customer_id TEXT UNIQUE,
  stripe_subscription_id TEXT UNIQUE,
  tier TEXT NOT NULL CHECK (tier IN ('basic', 'pro', 'unlimited')),
  status TEXT NOT NULL CHECK (status IN ('active', 'canceled', 'past_due', 'unpaid')),
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  canceled_at TIMESTAMPTZ
);

-- Referrals table
CREATE TABLE public.referrals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  from_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  to_user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  referral_code TEXT NOT NULL,
  bonus_scans_given INT DEFAULT 5,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired')),
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Leaderboard weekly table
CREATE TABLE public.leaderboard_weekly (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  score DECIMAL(3,1) NOT NULL,
  rank INT NOT NULL,
  week_starting DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, week_starting)
);

-- Share logs table
CREATE TABLE public.share_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  analysis_id UUID REFERENCES public.analyses(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Support tickets table
CREATE TABLE public.support_tickets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  assigned_to UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Creators table (Phase 2)
CREATE TABLE public.creators (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  instagram_handle TEXT,
  tiktok_handle TEXT,
  instagram_follower_count INT,
  tiktok_follower_count INT,
  affiliate_link TEXT UNIQUE NOT NULL,
  tier TEXT DEFAULT 'nano' CHECK (tier IN ('nano', 'micro', 'macro')),
  commission_rate DECIMAL(3,2) NOT NULL,
  total_earned DECIMAL(10,2) DEFAULT 0,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'suspended')),
  approved_at TIMESTAMPTZ,
  suspended_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Affiliate clicks table
CREATE TABLE public.affiliate_clicks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  creator_id UUID NOT NULL REFERENCES public.creators(id) ON DELETE CASCADE,
  device_id TEXT,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Affiliate conversions table
CREATE TABLE public.affiliate_conversions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  creator_id UUID NOT NULL REFERENCES public.creators(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  tier TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  commission_earned DECIMAL(10,2) NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'paid')),
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Affiliate coupons table
CREATE TABLE public.affiliate_coupons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  creator_id UUID NOT NULL REFERENCES public.creators(id) ON DELETE CASCADE,
  code TEXT UNIQUE NOT NULL,
  discount_percent INT NOT NULL CHECK (discount_percent >= 0 AND discount_percent <= 100),
  uses INT DEFAULT 0,
  max_uses INT,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_users_referral_code ON public.users(referral_code);
CREATE INDEX idx_users_tier ON public.users(tier);
CREATE INDEX idx_analyses_user_id ON public.analyses(user_id);
CREATE INDEX idx_analyses_created_at ON public.analyses(created_at DESC);
CREATE INDEX idx_analyses_score ON public.analyses(score DESC);
CREATE INDEX idx_analyses_is_public ON public.analyses(is_public) WHERE is_public = TRUE;
CREATE INDEX idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX idx_subscriptions_stripe_customer ON public.subscriptions(stripe_customer_id);
CREATE INDEX idx_referrals_from_user ON public.referrals(from_user_id);
CREATE INDEX idx_referrals_code ON public.referrals(referral_code);
CREATE INDEX idx_referrals_status ON public.referrals(status);
CREATE INDEX idx_leaderboard_week_score ON public.leaderboard_weekly(week_starting, score DESC);
CREATE INDEX idx_creators_tier ON public.creators(tier);
CREATE INDEX idx_creators_status ON public.creators(status);
CREATE INDEX idx_affiliate_clicks_creator_date ON public.affiliate_clicks(creator_id, created_at DESC);
CREATE INDEX idx_affiliate_conversions_creator ON public.affiliate_conversions(creator_id);

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to relevant tables
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_analyses_updated_at
  BEFORE UPDATE ON public.analyses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_support_tickets_updated_at
  BEFORE UPDATE ON public.support_tickets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_creators_updated_at
  BEFORE UPDATE ON public.creators
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();




-- ============================================================
-- Migration 2/5: 002_row_level_security.sql
-- ============================================================

-- Enable Row Level Security on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leaderboard_weekly ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.share_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_clicks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_conversions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_coupons ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "users_select_own" ON public.users
  FOR SELECT
  USING (auth.uid() = id OR deleted_at IS NULL);

CREATE POLICY "users_update_own" ON public.users
  FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "users_insert_own" ON public.users
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Analyses policies
CREATE POLICY "analyses_select" ON public.analyses
  FOR SELECT
  USING (auth.uid() = user_id OR is_public = TRUE);

CREATE POLICY "analyses_insert_own" ON public.analyses
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "analyses_update_own" ON public.analyses
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "analyses_delete_own" ON public.analyses
  FOR DELETE
  USING (auth.uid() = user_id);

-- Subscriptions policies
CREATE POLICY "subscriptions_select_own" ON public.subscriptions
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "subscriptions_insert_own" ON public.subscriptions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "subscriptions_update_own" ON public.subscriptions
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Referrals policies
CREATE POLICY "referrals_select_participants" ON public.referrals
  FOR SELECT
  USING (auth.uid() = from_user_id OR auth.uid() = to_user_id);

CREATE POLICY "referrals_insert" ON public.referrals
  FOR INSERT
  WITH CHECK (TRUE);

CREATE POLICY "referrals_update_participants" ON public.referrals
  FOR UPDATE
  USING (auth.uid() = from_user_id OR auth.uid() = to_user_id);

-- Leaderboard policies (public read)
CREATE POLICY "leaderboard_select_all" ON public.leaderboard_weekly
  FOR SELECT
  USING (TRUE);

-- Share logs policies
CREATE POLICY "share_logs_select_own" ON public.share_logs
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "share_logs_insert_own" ON public.share_logs
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Support tickets policies
CREATE POLICY "support_tickets_select_own" ON public.support_tickets
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "support_tickets_insert_own" ON public.support_tickets
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "support_tickets_update_own" ON public.support_tickets
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Creators policies
CREATE POLICY "creators_select_own" ON public.creators
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "creators_insert_own" ON public.creators
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "creators_update_own" ON public.creators
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Affiliate clicks policies (public insert for tracking)
CREATE POLICY "affiliate_clicks_insert" ON public.affiliate_clicks
  FOR INSERT
  WITH CHECK (TRUE);

CREATE POLICY "affiliate_clicks_select_own" ON public.affiliate_clicks
  FOR SELECT
  USING (
    creator_id IN (
      SELECT id FROM public.creators WHERE user_id = auth.uid()
    )
  );

-- Affiliate conversions policies
CREATE POLICY "affiliate_conversions_select_own" ON public.affiliate_conversions
  FOR SELECT
  USING (
    creator_id IN (
      SELECT id FROM public.creators WHERE user_id = auth.uid()
    )
  );

-- Affiliate coupons policies
CREATE POLICY "affiliate_coupons_select_all" ON public.affiliate_coupons
  FOR SELECT
  USING (TRUE);

CREATE POLICY "affiliate_coupons_insert_own" ON public.affiliate_coupons
  FOR INSERT
  WITH CHECK (
    creator_id IN (
      SELECT id FROM public.creators WHERE user_id = auth.uid()
    )
  );




-- ============================================================
-- Migration 3/5: 003_storage_buckets.sql
-- ============================================================

-- Create storage buckets for user uploads
INSERT INTO storage.buckets (id, name, public)
VALUES ('analyses', 'analyses', true);

-- Storage policies for analyses bucket
CREATE POLICY "analyses_upload_own" ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'analyses' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "analyses_select_public" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'analyses');

CREATE POLICY "analyses_update_own" ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'analyses' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "analyses_delete_own" ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'analyses' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );




-- ============================================================
-- Migration 4/5: 004_review_queue_and_preferences.sql
-- ============================================================

-- Manual review queue for flagged content
CREATE TABLE public.review_queue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  analysis_id UUID REFERENCES public.analyses(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  flagged_by TEXT DEFAULT 'system',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by UUID,
  reviewed_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User preferences table
CREATE TABLE public.user_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
  marketing_emails BOOLEAN DEFAULT FALSE,
  push_notifications BOOLEAN DEFAULT TRUE,
  profile_visibility TEXT DEFAULT 'public' CHECK (profile_visibility IN ('public', 'private')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User bans/suspensions table
CREATE TABLE public.user_bans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  ban_type TEXT NOT NULL CHECK (ban_type IN ('warning', 'temporary', 'permanent')),
  duration_days INT,
  expires_at TIMESTAMPTZ,
  issued_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_review_queue_status ON public.review_queue(status);
CREATE INDEX idx_review_queue_created ON public.review_queue(created_at DESC);
CREATE INDEX idx_user_preferences_user ON public.user_preferences(user_id);
CREATE INDEX idx_user_bans_user ON public.user_bans(user_id);
CREATE INDEX idx_user_bans_expires ON public.user_bans(expires_at) WHERE expires_at IS NOT NULL;

-- RLS Policies
ALTER TABLE public.review_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_bans ENABLE ROW LEVEL SECURITY;

-- Review queue: Admin only (in production, add admin role check)
CREATE POLICY "review_queue_select_admin" ON public.review_queue
  FOR SELECT
  USING (TRUE); -- In production: Check if user is admin

-- User preferences: Own only
CREATE POLICY "user_preferences_select_own" ON public.user_preferences
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "user_preferences_insert_own" ON public.user_preferences
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user_preferences_update_own" ON public.user_preferences
  FOR UPDATE
  USING (auth.uid() = user_id);

-- User bans: Own read only
CREATE POLICY "user_bans_select_own" ON public.user_bans
  FOR SELECT
  USING (auth.uid() = user_id);

-- Updated trigger for preferences
CREATE TRIGGER update_user_preferences_updated_at
  BEFORE UPDATE ON public.user_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();




-- ============================================================
-- Migration 5/5: 005_comments_and_votes.sql
-- ============================================================

-- Comments table for community feature (Phase 2, F9)
CREATE TABLE public.comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  analysis_id UUID NOT NULL REFERENCES public.analyses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  parent_id UUID REFERENCES public.comments(id) ON DELETE CASCADE,
  is_flagged BOOLEAN DEFAULT FALSE,
  flagged_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- Votes table (upvotes/downvotes)
CREATE TABLE public.votes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  voteable_type TEXT NOT NULL CHECK (voteable_type IN ('analysis', 'comment')),
  voteable_id UUID NOT NULL,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  vote_type TEXT NOT NULL CHECK (vote_type IN ('upvote', 'downvote')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(voteable_type, voteable_id, user_id)
);

-- Indexes
CREATE INDEX idx_comments_analysis ON public.comments(analysis_id);
CREATE INDEX idx_comments_user ON public.comments(user_id);
CREATE INDEX idx_comments_parent ON public.comments(parent_id) WHERE parent_id IS NOT NULL;
CREATE INDEX idx_comments_created ON public.comments(created_at DESC);
CREATE INDEX idx_votes_voteable ON public.votes(voteable_type, voteable_id);
CREATE INDEX idx_votes_user ON public.votes(user_id);

-- RLS Policies
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.votes ENABLE ROW LEVEL SECURITY;

-- Comments: can view on public analyses, can edit own
CREATE POLICY "comments_select_public" ON public.comments
  FOR SELECT
  USING (
    is_flagged = FALSE AND
    deleted_at IS NULL AND
    analysis_id IN (
      SELECT id FROM public.analyses WHERE is_public = TRUE AND deleted_at IS NULL
    )
  );

CREATE POLICY "comments_insert_own" ON public.comments
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "comments_update_own" ON public.comments
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "comments_delete_own" ON public.comments
  FOR DELETE
  USING (auth.uid() = user_id);

-- Votes: can view all, can insert/update/delete own
CREATE POLICY "votes_select_all" ON public.votes
  FOR SELECT
  USING (TRUE);

CREATE POLICY "votes_insert_own" ON public.votes
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "votes_delete_own" ON public.votes
  FOR DELETE
  USING (auth.uid() = user_id);

-- Triggers
CREATE TRIGGER update_comments_updated_at
  BEFORE UPDATE ON public.comments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();



