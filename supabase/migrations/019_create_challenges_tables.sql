-- Migration: Create structured challenges tables
-- Date: 2025-10-30
-- Description: F19 - Structured Challenges & Photo Verification

-- Challenges (pre-built programs)
CREATE TABLE public.challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  duration_days INT NOT NULL CHECK (duration_days > 0),
  difficulty TEXT NOT NULL CHECK (difficulty IN ('beginner', 'intermediate', 'advanced', 'expert')),
  focus_areas TEXT[], -- ['skin', 'jawline', 'overall']
  requirements JSONB NOT NULL, -- Requirements and tasks
  schedule JSONB NOT NULL, -- Daily/weekly schedule
  rewards JSONB NOT NULL, -- Badges, scans, discounts
  photo_guidance JSONB NOT NULL, -- Photo verification parameters
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Challenge participations
CREATE TABLE public.challenge_participations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id UUID REFERENCES public.challenges(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'abandoned')),
  current_day INT DEFAULT 1 CHECK (current_day > 0),
  compliance_rate NUMERIC CHECK (compliance_rate >= 0 AND compliance_rate <= 1),
  calibration_photo_url TEXT, -- Baseline photo for verification
  UNIQUE(challenge_id, user_id)
);

-- Challenge check-ins (photo submissions)
CREATE TABLE public.challenge_checkins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participation_id UUID REFERENCES public.challenge_participations(id) ON DELETE CASCADE,
  day INT NOT NULL CHECK (day > 0),
  photo_url TEXT NOT NULL,
  photo_verified BOOLEAN DEFAULT false,
  verification_data JSONB, -- Lighting, angle, distance consistency data
  score NUMERIC,
  notes TEXT,
  checked_in_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_challenges_active ON public.challenges(is_active, difficulty);
CREATE INDEX idx_challenge_participations_user ON public.challenge_participations(user_id, status);
CREATE INDEX idx_challenge_participations_status ON public.challenge_participations(status);
CREATE INDEX idx_challenge_checkins_participation ON public.challenge_checkins(participation_id, day);

-- RLS Policies
ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenge_participations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenge_checkins ENABLE ROW LEVEL SECURITY;

-- Challenges are public (read-only for authenticated users)
CREATE POLICY "Authenticated users can view challenges" ON public.challenges 
  FOR SELECT USING (auth.role() = 'authenticated' AND is_active = true);

-- Users see own participations
CREATE POLICY "Users see own participations" ON public.challenge_participations 
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users create own participations" ON public.challenge_participations 
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own participations" ON public.challenge_participations 
  FOR UPDATE USING (auth.uid() = user_id);

-- Users see own check-ins
CREATE POLICY "Users see own check-ins" ON public.challenge_checkins 
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.challenge_participations 
      WHERE challenge_participations.id = challenge_checkins.participation_id 
      AND challenge_participations.user_id = auth.uid()
    )
  );
CREATE POLICY "Users create own check-ins" ON public.challenge_checkins 
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.challenge_participations 
      WHERE challenge_participations.id = challenge_checkins.participation_id 
      AND challenge_participations.user_id = auth.uid()
    )
  );

-- Comments for documentation
COMMENT ON TABLE public.challenges IS 'Pre-built challenge programs (7/30/60/90-day)';
COMMENT ON TABLE public.challenge_participations IS 'User participation in challenges';
COMMENT ON TABLE public.challenge_checkins IS 'Photo check-ins with verification data';

