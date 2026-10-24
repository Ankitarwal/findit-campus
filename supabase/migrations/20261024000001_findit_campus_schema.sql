-- ==============================================================================
-- FindIt Campus: Production Database Migration
-- Includes: Tables, Foreign Keys, Indexes, Triggers, Storage, and Row Level Security
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. PROFILES TABLE (Mirrors auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  display_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'admin')),
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Trigger to create profile when auth.users is created
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name, role)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
    'student' -- Strict security: All new signups are students. Admin privileges must be granted by existing admin.
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    display_name = COALESCE(EXCLUDED.display_name, public.profiles.display_name);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Helper function to check if requesting user is an admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- 3. ITEM REPORTS TABLE
CREATE TABLE IF NOT EXISTS public.item_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reference_code TEXT NOT NULL UNIQUE,
  reporter_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  report_type TEXT NOT NULL CHECK (report_type IN ('lost', 'found')),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN (
    'id_cards',
    'electronics',
    'bags_wallets',
    'keys',
    'books_stationery',
    'clothing_accessories',
    'other'
  )),
  location TEXT NOT NULL,
  occurred_at TIMESTAMPTZ NOT NULL,
  image_path TEXT,
  distinguishing_features TEXT,
  contact_phone TEXT,
  withhold_public_details BOOLEAN NOT NULL DEFAULT false,
  status TEXT NOT NULL DEFAULT 'reported' CHECK (status IN (
    'reported',
    'potential_match',
    'claim_requested',
    'under_review',
    'returned',
    'rejected',
    'cancelled',
    'closed'
  )),
  ai_analysis JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Ensure column exists if table was created in an earlier iteration
ALTER TABLE public.item_reports ADD COLUMN IF NOT EXISTS contact_phone TEXT;

-- 4. ITEM MATCHES TABLE (Gemma 4 Matches)
CREATE TABLE IF NOT EXISTS public.item_matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lost_report_id UUID NOT NULL REFERENCES public.item_reports(id) ON DELETE CASCADE,
  found_report_id UUID NOT NULL REFERENCES public.item_reports(id) ON DELETE CASCADE,
  relevance_score INTEGER NOT NULL CHECK (relevance_score >= 0 AND relevance_score <= 100),
  match_reasons JSONB NOT NULL DEFAULT '[]'::jsonb,
  conflicts JSONB NOT NULL DEFAULT '[]'::jsonb,
  missing_information JSONB NOT NULL DEFAULT '[]'::jsonb,
  recommendation TEXT NOT NULL DEFAULT 'request_review' CHECK (recommendation IN ('request_review', 'inconclusive', 'unlikely_match')),
  model_name TEXT NOT NULL DEFAULT 'gemma-4-26b-a4b-it',
  review_status TEXT NOT NULL DEFAULT 'pending' CHECK (review_status IN ('pending', 'verified', 'dismissed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT unique_match_pair UNIQUE (lost_report_id, found_report_id)
);

-- 5. CLAIMS TABLE
CREATE TABLE IF NOT EXISTS public.claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID NOT NULL REFERENCES public.item_reports(id) ON DELETE CASCADE,
  claimant_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  private_claim_details TEXT NOT NULL,
  verification_answer TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  contact_phone TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'under_review', 'approved', 'rejected', 'cancelled')),
  reviewed_by UUID REFERENCES public.profiles(id),
  admin_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 6. NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('match_found', 'claim_submitted', 'claim_status', 'report_update', 'system')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  related_report_id UUID REFERENCES public.item_reports(id) ON DELETE SET NULL,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 7. AUDIT LOGS TABLE (Immutable log)
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 8. PERFORMANCE INDEXES
CREATE INDEX IF NOT EXISTS idx_item_reports_type_status ON public.item_reports(report_type, status);
CREATE INDEX IF NOT EXISTS idx_item_reports_category ON public.item_reports(category);
CREATE INDEX IF NOT EXISTS idx_item_reports_occurred_at ON public.item_reports(occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_item_reports_reporter ON public.item_reports(reporter_id);
CREATE INDEX IF NOT EXISTS idx_item_matches_lost ON public.item_matches(lost_report_id);
CREATE INDEX IF NOT EXISTS idx_item_matches_found ON public.item_matches(found_report_id);
CREATE INDEX IF NOT EXISTS idx_claims_report_id ON public.claims(report_id);
CREATE INDEX IF NOT EXISTS idx_claims_claimant_id ON public.claims(claimant_id);
CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON public.notifications(recipient_id, read_at);

-- 9. ENABLE ROW LEVEL SECURITY (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.item_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.item_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- 10. RLS POLICIES (Idempotent with DROP POLICY IF EXISTS)

-- A. PROFILES
DROP POLICY IF EXISTS "Profiles are viewable by authenticated users" ON public.profiles;
CREATE POLICY "Profiles are viewable by authenticated users"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own display profile" ON public.profiles;
CREATE POLICY "Users can update own display profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id AND 
    (role = (SELECT role FROM public.profiles WHERE id = auth.uid()) OR public.is_admin())
  );

-- B. ITEM REPORTS
DROP POLICY IF EXISTS "Public reports viewable by everyone" ON public.item_reports;
CREATE POLICY "Public reports viewable by everyone"
  ON public.item_reports FOR SELECT
  TO authenticated, anon
  USING (status != 'rejected' OR auth.uid() = reporter_id OR public.is_admin());

DROP POLICY IF EXISTS "Users can create their own reports" ON public.item_reports;
CREATE POLICY "Users can create their own reports"
  ON public.item_reports FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = reporter_id);

DROP POLICY IF EXISTS "Reporters or admins can update reports" ON public.item_reports;
CREATE POLICY "Reporters or admins can update reports"
  ON public.item_reports FOR UPDATE
  TO authenticated
  USING (auth.uid() = reporter_id OR public.is_admin())
  WITH CHECK (auth.uid() = reporter_id OR public.is_admin());

-- C. ITEM MATCHES
DROP POLICY IF EXISTS "Matches visible to involved parties or admins" ON public.item_matches;
CREATE POLICY "Matches visible to involved parties or admins"
  ON public.item_matches FOR SELECT
  TO authenticated
  USING (
    public.is_admin() OR
    EXISTS (
      SELECT 1 FROM public.item_reports r
      WHERE (r.id = lost_report_id OR r.id = found_report_id) AND r.reporter_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Admins or service role manage matches" ON public.item_matches;
CREATE POLICY "Admins or service role manage matches"
  ON public.item_matches FOR ALL
  TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS "Users can insert matches for their reports" ON public.item_matches;
CREATE POLICY "Users can insert matches for their reports"
  ON public.item_matches FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_admin() OR
    EXISTS (
      SELECT 1 FROM public.item_reports r
      WHERE (r.id = lost_report_id OR r.id = found_report_id) AND r.reporter_id = auth.uid()
    )
  );

-- D. CLAIMS (STRICT PRIVACY)
DROP POLICY IF EXISTS "Claims visible only to claimant, finder, or admins" ON public.claims;
CREATE POLICY "Claims visible only to claimant, finder, or admins"
  ON public.claims FOR SELECT
  TO authenticated
  USING (
    claimant_id = auth.uid() OR
    public.is_admin() OR
    EXISTS (
      SELECT 1 FROM public.item_reports r
      WHERE r.id = report_id AND r.reporter_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Authenticated users can submit claims" ON public.claims;
CREATE POLICY "Authenticated users can submit claims"
  ON public.claims FOR INSERT
  TO authenticated
  WITH CHECK (
    claimant_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.item_reports r
      WHERE r.id = report_id AND r.reporter_id != auth.uid()
    )
  );

DROP POLICY IF EXISTS "Admins or finders can update claims" ON public.claims;
CREATE POLICY "Admins or finders can update claims"
  ON public.claims FOR UPDATE
  TO authenticated
  USING (
    public.is_admin() OR
    EXISTS (
      SELECT 1 FROM public.item_reports r
      WHERE r.id = report_id AND r.reporter_id = auth.uid()
    )
  );

-- E. NOTIFICATIONS
DROP POLICY IF EXISTS "Users read own notifications" ON public.notifications;
CREATE POLICY "Users read own notifications"
  ON public.notifications FOR SELECT
  TO authenticated
  USING (recipient_id = auth.uid());

DROP POLICY IF EXISTS "Users update own notifications" ON public.notifications;
CREATE POLICY "Users update own notifications"
  ON public.notifications FOR UPDATE
  TO authenticated
  USING (recipient_id = auth.uid())
  WITH CHECK (recipient_id = auth.uid());

DROP POLICY IF EXISTS "Authenticated users can create notifications" ON public.notifications;
CREATE POLICY "Authenticated users can create notifications"
  ON public.notifications FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- F. AUDIT LOGS (Admins only read, append only)
DROP POLICY IF EXISTS "Admins read audit logs" ON public.audit_logs;
CREATE POLICY "Admins read audit logs"
  ON public.audit_logs FOR SELECT
  TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS "Authenticated users or system can append audit logs" ON public.audit_logs;
CREATE POLICY "Authenticated users or system can append audit logs"
  ON public.audit_logs FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- 11. STORAGE BUCKET CONFIGURATION (item-photos & item-images)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('item-photos', 'item-photos', true, 5242880, ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/webp']),
  ('item-images', 'item-images', true, 5242880, ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/webp'])
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];

-- Storage policies for item-photos and item-images
DROP POLICY IF EXISTS "Public item photos are viewable" ON storage.objects;
CREATE POLICY "Public item photos are viewable"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id IN ('item-photos', 'item-images'));

DROP POLICY IF EXISTS "Authenticated users can upload item photos" ON storage.objects;
CREATE POLICY "Authenticated users can upload item photos"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id IN ('item-photos', 'item-images'));

DROP POLICY IF EXISTS "Users can update own item photos" ON storage.objects;
CREATE POLICY "Users can update own item photos"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id IN ('item-photos', 'item-images') AND auth.uid() = owner);
