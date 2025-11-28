-- Convert analyses bucket from public to private
-- Following SmileScore pattern for secure storage

-- Make bucket private
UPDATE storage.buckets SET public = false WHERE id = 'analyses';

-- Drop the existing public SELECT policy
DROP POLICY IF EXISTS "analyses_select_public" ON storage.objects;

-- Create new private SELECT policy (users can only view their own files)
CREATE POLICY "analyses_select_own" ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'analyses' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Service role can do everything (for admin operations via API)
CREATE POLICY "analyses_service_role_all" ON storage.objects
FOR ALL
TO service_role
USING (bucket_id = 'analyses')
WITH CHECK (bucket_id = 'analyses');

