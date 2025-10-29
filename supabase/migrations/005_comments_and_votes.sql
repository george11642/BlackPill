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

