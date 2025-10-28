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

