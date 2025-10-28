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

