-- Create timelapses storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'timelapses',
  'timelapses',
  false, -- Private bucket
  52428800, -- 50MB limit per file
  ARRAY['image/png', 'image/jpeg', 'video/mp4', 'video/quicktime']
)
ON CONFLICT (id) DO NOTHING;

-- Create RLS policies for timelapses bucket
-- Users can only access their own timelapses
CREATE POLICY "Users can upload their own timelapses"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'timelapses' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view their own timelapses"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'timelapses' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own timelapses"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'timelapses' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Create user_timelapses table to track generated timelapses
CREATE TABLE IF NOT EXISTS public.user_timelapses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  analysis_ids JSONB NOT NULL, -- Array of analysis IDs used
  frame_urls JSONB, -- Array of frame URLs (temporary, until video is generated)
  video_url TEXT, -- URL to final video file (when implemented)
  duration DECIMAL(5,2) NOT NULL, -- Duration in seconds
  resolution JSONB, -- { width: 1080, height: 1080 }
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index for quick user lookups
CREATE INDEX IF NOT EXISTS idx_user_timelapses_user_id ON public.user_timelapses(user_id);
CREATE INDEX IF NOT EXISTS idx_user_timelapses_created_at ON public.user_timelapses(created_at DESC);

-- Enable RLS
ALTER TABLE public.user_timelapses ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own timelapses"
ON public.user_timelapses FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own timelapses"
ON public.user_timelapses FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own timelapses"
ON public.user_timelapses FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own timelapses"
ON public.user_timelapses FOR DELETE
USING (auth.uid() = user_id);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_timelapses_updated_at
BEFORE UPDATE ON public.user_timelapses
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

