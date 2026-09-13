
-- Helpers bypass RLS on privacy_settings/profiles_basic to break policy recursion.
CREATE OR REPLACE FUNCTION public.is_profile_public(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE(
    (SELECT ps.profile_visibility::text = 'everyone'
       FROM public.privacy_settings ps WHERE ps.user_id = _user_id),
    true
  )
$$;

CREATE OR REPLACE FUNCTION public.is_photo_public(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE(
    (SELECT ps.photo_visibility::text = 'public'
       FROM public.privacy_settings ps WHERE ps.user_id = _user_id),
    true
  )
$$;

CREATE OR REPLACE FUNCTION public.is_user_verified(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.profiles_basic p WHERE p.user_id = _user_id AND p.is_verified)
$$;

REVOKE EXECUTE ON FUNCTION public.is_profile_public(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_photo_public(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_user_verified(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_profile_public(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_photo_public(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_user_verified(uuid) TO authenticated;

DROP POLICY IF EXISTS "verified profiles visible" ON public.profiles_basic;
CREATE POLICY "verified profiles visible" ON public.profiles_basic
  FOR SELECT TO authenticated
  USING (
    is_verified = true
    AND (
      auth.uid() = user_id
      OR public.are_matched(auth.uid(), user_id)
      OR public.is_profile_public(user_id)
    )
  );

DROP POLICY IF EXISTS "verified community visible" ON public.community_details;
CREATE POLICY "verified community visible" ON public.community_details
  FOR SELECT TO authenticated
  USING (
    public.is_user_verified(user_id)
    AND (
      auth.uid() = user_id
      OR public.are_matched(auth.uid(), user_id)
      OR public.is_profile_public(user_id)
    )
  );

DROP POLICY IF EXISTS "verified photos visible" ON public.profile_photos;
CREATE POLICY "verified photos visible" ON public.profile_photos
  FOR SELECT TO authenticated
  USING (
    public.is_user_verified(user_id)
    AND (
      auth.uid() = user_id
      OR public.are_matched(auth.uid(), user_id)
      OR public.is_photo_public(user_id)
    )
  );

DROP POLICY IF EXISTS "verified photos read" ON storage.objects;
CREATE POLICY "verified photos read" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'profile-photos'
    AND (
      (storage.foldername(name))[1] = auth.uid()::text
      OR (
        public.is_user_verified(((storage.foldername(name))[1])::uuid)
        AND (
          public.are_matched(auth.uid(), ((storage.foldername(name))[1])::uuid)
          OR public.is_photo_public(((storage.foldername(name))[1])::uuid)
        )
      )
    )
  );
