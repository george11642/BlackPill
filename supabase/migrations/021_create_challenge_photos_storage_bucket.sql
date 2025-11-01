-- Create storage bucket for challenge photos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'challenge-photos',
  'challenge-photos',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/jpg']
)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for challenge-photos bucket
-- Users can upload their own photos
CREATE POLICY "challenge_photos_upload_own" ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'challenge-photos' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Public read access for challenge photos
CREATE POLICY "challenge_photos_select_public" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'challenge-photos');

-- Users can update their own photos
CREATE POLICY "challenge_photos_update_own" ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'challenge-photos' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Users can delete their own photos
CREATE POLICY "challenge_photos_delete_own" ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'challenge-photos' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

