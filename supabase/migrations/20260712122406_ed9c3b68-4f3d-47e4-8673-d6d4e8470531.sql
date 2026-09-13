
-- Photo storage policies: files stored under {user_id}/{filename}
CREATE POLICY "own photo upload" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'profile-photos' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "own photo update" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'profile-photos' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "own photo delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'profile-photos' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "verified photos read" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'profile-photos' AND (
    (storage.foldername(name))[1] = auth.uid()::text
    OR EXISTS (
      SELECT 1 FROM public.profiles_basic p
      WHERE p.user_id::text = (storage.foldername(name))[1] AND p.is_verified
    )
  ));
