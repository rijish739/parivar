-- Auto-verify profiles for testing (skips manual verification step)
ALTER TABLE public.profiles_basic ALTER COLUMN is_verified SET DEFAULT true;
UPDATE public.profiles_basic SET is_verified = true WHERE is_verified = false;