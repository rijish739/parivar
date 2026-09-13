
-- 1) Lock down SECURITY DEFINER trigger functions from being callable by clients.
--    (Triggers still execute them; RLS-invoked functions remain granted.)
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_interest_accepted() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.touch_updated_at() FROM PUBLIC;
DO $$ BEGIN
  BEGIN REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated; EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN REVOKE EXECUTE ON FUNCTION public.handle_interest_accepted() FROM anon, authenticated; EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN REVOKE EXECUTE ON FUNCTION public.touch_updated_at() FROM anon, authenticated; EXCEPTION WHEN OTHERS THEN NULL; END;
END $$;

-- 2) profiles_basic: honor profile_visibility preference (default 'everyone')
DROP POLICY IF EXISTS "verified profiles visible" ON public.profiles_basic;
CREATE POLICY "verified profiles visible" ON public.profiles_basic
  FOR SELECT TO authenticated
  USING (
    is_verified = true
    AND (
      auth.uid() = user_id
      OR public.are_matched(auth.uid(), user_id)
      OR EXISTS (
        SELECT 1 FROM public.privacy_settings ps
        WHERE ps.user_id = profiles_basic.user_id
          AND ps.profile_visibility::text = 'everyone'
      )
    )
  );

-- 3) community_details: honor profile_visibility (used in discovery cards)
DROP POLICY IF EXISTS "verified community visible" ON public.community_details;
CREATE POLICY "verified community visible" ON public.community_details
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles_basic p
      WHERE p.user_id = community_details.user_id AND p.is_verified
    )
    AND (
      auth.uid() = user_id
      OR public.are_matched(auth.uid(), user_id)
      OR EXISTS (
        SELECT 1 FROM public.privacy_settings ps
        WHERE ps.user_id = community_details.user_id
          AND ps.profile_visibility::text = 'everyone'
      )
    )
  );

-- 4) Sensitive detail tables: require match (or owner)
DROP POLICY IF EXISTS "verified ec visible" ON public.education_career;
CREATE POLICY "matched ec visible" ON public.education_career
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.are_matched(auth.uid(), user_id));

DROP POLICY IF EXISTS "verified life visible" ON public.lifestyle;
CREATE POLICY "matched life visible" ON public.lifestyle
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.are_matched(auth.uid(), user_id));

DROP POLICY IF EXISTS "verified prefs visible" ON public.partner_preferences;
CREATE POLICY "matched prefs visible" ON public.partner_preferences
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.are_matched(auth.uid(), user_id));

-- 5) profile_photos: honor photo_visibility (default 'public')
DROP POLICY IF EXISTS "verified photos visible" ON public.profile_photos;
CREATE POLICY "verified photos visible" ON public.profile_photos
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles_basic p
      WHERE p.user_id = profile_photos.user_id AND p.is_verified
    )
    AND (
      auth.uid() = user_id
      OR public.are_matched(auth.uid(), user_id)
      OR EXISTS (
        SELECT 1 FROM public.privacy_settings ps
        WHERE ps.user_id = profile_photos.user_id
          AND ps.photo_visibility::text = 'public'
      )
    )
  );

-- 6) Storage bucket policy: honor photo_visibility
DROP POLICY IF EXISTS "verified photos read" ON storage.objects;
CREATE POLICY "verified photos read" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'profile-photos'
    AND (
      (storage.foldername(name))[1] = auth.uid()::text
      OR EXISTS (
        SELECT 1 FROM public.profiles_basic p
        WHERE p.user_id::text = (storage.foldername(objects.name))[1]
          AND p.is_verified
          AND (
            public.are_matched(auth.uid(), p.user_id)
            OR EXISTS (
              SELECT 1 FROM public.privacy_settings ps
              WHERE ps.user_id = p.user_id
                AND ps.photo_visibility::text = 'public'
            )
          )
      )
    )
  );
