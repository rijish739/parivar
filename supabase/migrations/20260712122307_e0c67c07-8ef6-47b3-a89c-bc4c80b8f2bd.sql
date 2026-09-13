
-- Enums
CREATE TYPE public.app_role AS ENUM ('admin', 'user');
CREATE TYPE public.gender_type AS ENUM ('male', 'female');
CREATE TYPE public.marital_status_type AS ENUM ('never_married', 'divorced', 'widowed');
CREATE TYPE public.family_bg_type AS ENUM ('agriculture', 'business', 'service', 'other');
CREATE TYPE public.income_range AS ENUM ('below_5L', '5_10L', '10_20L', '20_50L', '50L_plus');
CREATE TYPE public.family_type AS ENUM ('nuclear', 'joint');
CREATE TYPE public.family_values AS ENUM ('traditional', 'moderate', 'liberal');
CREATE TYPE public.diet_type AS ENUM ('veg', 'non_veg', 'eggetarian');
CREATE TYPE public.manglik_type AS ENUM ('yes', 'no', 'partial', 'unknown');
CREATE TYPE public.location_pref AS ENUM ('same_city', 'same_state', 'open');
CREATE TYPE public.profile_visibility AS ENUM ('everyone', 'mutual_only');
CREATE TYPE public.photo_visibility AS ENUM ('public', 'blur_until_mutual');
CREATE TYPE public.interest_status AS ENUM ('pending', 'accepted', 'declined');

-- User roles
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role) $$;

CREATE POLICY "Users read own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins read all roles" ON public.user_roles FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Matches (needs to exist before are_matched function)
CREATE TABLE public.matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_a UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_b UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_a, user_b),
  CHECK (user_a < user_b)
);
CREATE INDEX ON public.matches(user_a);
CREATE INDEX ON public.matches(user_b);
GRANT SELECT ON public.matches TO authenticated;
GRANT ALL ON public.matches TO service_role;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own matches read" ON public.matches FOR SELECT TO authenticated USING (auth.uid() = user_a OR auth.uid() = user_b);

CREATE OR REPLACE FUNCTION public.are_matched(_a uuid, _b uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.matches
    WHERE user_a = LEAST(_a,_b) AND user_b = GREATEST(_a,_b)
  )
$$;

-- Basic profile
CREATE TABLE public.profiles_basic (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  gender gender_type NOT NULL,
  date_of_birth DATE NOT NULL,
  height_cm INT,
  weight_kg INT,
  marital_status marital_status_type NOT NULL DEFAULT 'never_married',
  mother_tongue TEXT,
  current_city TEXT,
  native_place TEXT,
  is_verified BOOLEAN NOT NULL DEFAULT false,
  onboarding_complete BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles_basic TO authenticated;
GRANT ALL ON public.profiles_basic TO service_role;
ALTER TABLE public.profiles_basic ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own basic rw" ON public.profiles_basic FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "verified profiles visible" ON public.profiles_basic FOR SELECT TO authenticated USING (is_verified = true);
CREATE POLICY "admins all basic" ON public.profiles_basic FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Community details
CREATE TABLE public.community_details (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  bari TEXT, family_deity TEXT, gotra TEXT, family_background family_bg_type,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.community_details TO authenticated;
GRANT ALL ON public.community_details TO service_role;
ALTER TABLE public.community_details ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own community rw" ON public.community_details FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "verified community visible" ON public.community_details FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.profiles_basic p WHERE p.user_id = community_details.user_id AND p.is_verified));

-- Education & career
CREATE TABLE public.education_career (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  highest_qualification TEXT, field_of_study TEXT, occupation TEXT, company TEXT, annual_income income_range,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.education_career TO authenticated;
GRANT ALL ON public.education_career TO service_role;
ALTER TABLE public.education_career ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own ec rw" ON public.education_career FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "verified ec visible" ON public.education_career FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.profiles_basic p WHERE p.user_id = education_career.user_id AND p.is_verified));

-- Family (sensitive - matched only)
CREATE TABLE public.family_details (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  father_occupation TEXT, mother_occupation TEXT,
  siblings_married INT DEFAULT 0, siblings_unmarried INT DEFAULT 0,
  family_type family_type, family_values family_values,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.family_details TO authenticated;
GRANT ALL ON public.family_details TO service_role;
ALTER TABLE public.family_details ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own family rw" ON public.family_details FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "matched family visible" ON public.family_details FOR SELECT TO authenticated USING (public.are_matched(auth.uid(), user_id));

-- Lifestyle
CREATE TABLE public.lifestyle (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  diet diet_type, smoking BOOLEAN DEFAULT false, drinking BOOLEAN DEFAULT false,
  hobbies TEXT[] DEFAULT '{}',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.lifestyle TO authenticated;
GRANT ALL ON public.lifestyle TO service_role;
ALTER TABLE public.lifestyle ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own life rw" ON public.lifestyle FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "verified life visible" ON public.lifestyle FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.profiles_basic p WHERE p.user_id = lifestyle.user_id AND p.is_verified));

-- Horoscope (sensitive - matched only)
CREATE TABLE public.horoscope (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  provided BOOLEAN NOT NULL DEFAULT false,
  birth_date DATE, birth_time TIME, birth_place TEXT,
  rashi TEXT, nakshatra TEXT,
  manglik manglik_type DEFAULT 'unknown',
  matching_required BOOLEAN DEFAULT false,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.horoscope TO authenticated;
GRANT ALL ON public.horoscope TO service_role;
ALTER TABLE public.horoscope ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own horo rw" ON public.horoscope FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "matched horo visible" ON public.horoscope FOR SELECT TO authenticated USING (public.are_matched(auth.uid(), user_id) OR (matching_required = true));

-- Partner preferences
CREATE TABLE public.partner_preferences (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  age_min INT DEFAULT 21, age_max INT DEFAULT 40,
  height_min_cm INT DEFAULT 150, height_max_cm INT DEFAULT 195,
  education_pref TEXT, income_pref income_range,
  location_pref location_pref DEFAULT 'open',
  diet_pref diet_type, bari_pref TEXT,
  deal_breakers TEXT[] DEFAULT '{}',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.partner_preferences TO authenticated;
GRANT ALL ON public.partner_preferences TO service_role;
ALTER TABLE public.partner_preferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own prefs rw" ON public.partner_preferences FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "verified prefs visible" ON public.partner_preferences FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.profiles_basic p WHERE p.user_id = partner_preferences.user_id AND p.is_verified));

-- Privacy
CREATE TABLE public.privacy_settings (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  profile_visibility profile_visibility NOT NULL DEFAULT 'everyone',
  photo_visibility photo_visibility NOT NULL DEFAULT 'public',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.privacy_settings TO authenticated;
GRANT ALL ON public.privacy_settings TO service_role;
ALTER TABLE public.privacy_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own privacy rw" ON public.privacy_settings FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "verified privacy visible" ON public.privacy_settings FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.profiles_basic p WHERE p.user_id = privacy_settings.user_id AND p.is_verified));

-- Photos
CREATE TABLE public.profile_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  is_primary BOOLEAN NOT NULL DEFAULT false,
  position INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ON public.profile_photos(user_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profile_photos TO authenticated;
GRANT ALL ON public.profile_photos TO service_role;
ALTER TABLE public.profile_photos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own photos rw" ON public.profile_photos FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "verified photos visible" ON public.profile_photos FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.profiles_basic p WHERE p.user_id = profile_photos.user_id AND p.is_verified));

-- Interests
CREATE TABLE public.interests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status interest_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(sender_id, receiver_id),
  CHECK (sender_id <> receiver_id)
);
CREATE INDEX ON public.interests(receiver_id, status);
CREATE INDEX ON public.interests(sender_id, status);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.interests TO authenticated;
GRANT ALL ON public.interests TO service_role;
ALTER TABLE public.interests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sender or receiver read" ON public.interests FOR SELECT TO authenticated USING (auth.uid() = sender_id OR auth.uid() = receiver_id);
CREATE POLICY "sender insert" ON public.interests FOR INSERT TO authenticated WITH CHECK (auth.uid() = sender_id);
CREATE POLICY "receiver update status" ON public.interests FOR UPDATE TO authenticated USING (auth.uid() = receiver_id) WITH CHECK (auth.uid() = receiver_id);
CREATE POLICY "sender delete" ON public.interests FOR DELETE TO authenticated USING (auth.uid() = sender_id);

CREATE OR REPLACE FUNCTION public.handle_interest_accepted()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.status = 'accepted' AND (OLD.status IS DISTINCT FROM 'accepted') THEN
    INSERT INTO public.matches(user_a, user_b)
    VALUES (LEAST(NEW.sender_id, NEW.receiver_id), GREATEST(NEW.sender_id, NEW.receiver_id))
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER on_interest_accepted AFTER UPDATE ON public.interests
FOR EACH ROW EXECUTE FUNCTION public.handle_interest_accepted();

-- Messages
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (sender_id <> receiver_id)
);
CREATE INDEX ON public.messages(sender_id, receiver_id, created_at);
CREATE INDEX ON public.messages(receiver_id, sender_id, created_at);
GRANT SELECT, INSERT, UPDATE ON public.messages TO authenticated;
GRANT ALL ON public.messages TO service_role;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "participants read" ON public.messages FOR SELECT TO authenticated USING (auth.uid() IN (sender_id, receiver_id));
CREATE POLICY "matched send" ON public.messages FOR INSERT TO authenticated WITH CHECK (auth.uid() = sender_id AND public.are_matched(sender_id, receiver_id));
CREATE POLICY "receiver mark read" ON public.messages FOR UPDATE TO authenticated USING (auth.uid() = receiver_id) WITH CHECK (auth.uid() = receiver_id);

-- Auto-assign user role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.user_roles(user_id, role) VALUES (NEW.id, 'user') ON CONFLICT DO NOTHING;
  RETURN NEW;
END $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- updated_at
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

CREATE TRIGGER t_pb BEFORE UPDATE ON public.profiles_basic FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER t_cd BEFORE UPDATE ON public.community_details FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER t_ec BEFORE UPDATE ON public.education_career FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER t_fd BEFORE UPDATE ON public.family_details FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER t_ls BEFORE UPDATE ON public.lifestyle FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER t_hr BEFORE UPDATE ON public.horoscope FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER t_pp BEFORE UPDATE ON public.partner_preferences FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER t_ps BEFORE UPDATE ON public.privacy_settings FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER t_int BEFORE UPDATE ON public.interests FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
