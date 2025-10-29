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

