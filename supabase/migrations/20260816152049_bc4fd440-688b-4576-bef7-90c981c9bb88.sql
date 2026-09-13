REVOKE EXECUTE ON FUNCTION public.is_user_verified(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.is_profile_public(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.is_photo_public(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM anon;
REVOKE EXECUTE ON FUNCTION public.are_matched(uuid, uuid) FROM anon;