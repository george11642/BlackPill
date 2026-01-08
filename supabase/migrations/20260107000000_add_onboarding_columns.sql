-- Add onboarding-related columns to users table

-- Track onboarding completion status
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE;

ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMPTZ;

-- Store user's selected goals from onboarding as JSON
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS selected_goals JSONB DEFAULT '[]'::jsonb;

-- Create index for querying users who haven't completed onboarding
CREATE INDEX IF NOT EXISTS idx_users_onboarding_completed
ON public.users(onboarding_completed)
WHERE onboarding_completed = FALSE;
