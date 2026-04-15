-- ============================================================
-- 🏆 GB MARKETPLACE - TURBO AUTH & JWT SYNC OVERHAUL
-- ============================================================

-- 1. [DB] SAFE JWT SYNC (NON-BLOCKING)
CREATE OR REPLACE FUNCTION public.sync_user_claims_safe()
RETURNS trigger AS $$
BEGIN
  BEGIN
    UPDATE auth.users
    SET raw_app_meta_data = 
      coalesce(raw_app_meta_data, '{}'::jsonb) 
      || jsonb_build_object(
        'role', NEW.role,
        'is_banned', coalesce(NEW.is_banned, false)
      )
    WHERE id = NEW.id;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'JWT Sync failed for user %: %', NEW.id, SQLERRM;
  END;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth;

-- Trigger for NEW Inserts (Always sync)
DROP TRIGGER IF EXISTS trg_sync_claims_insert ON public.profiles;
CREATE TRIGGER trg_sync_claims_insert
AFTER INSERT ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.sync_user_claims_safe();

-- Trigger for UPDATES (Only sync if data changed)
DROP TRIGGER IF EXISTS trg_sync_claims_update ON public.profiles;
CREATE TRIGGER trg_sync_claims_update
AFTER UPDATE ON public.profiles
FOR EACH ROW
WHEN (
    OLD.role IS DISTINCT FROM NEW.role OR 
    OLD.is_banned IS DISTINCT FROM NEW.is_banned
)
EXECUTE FUNCTION public.sync_user_claims_safe();

-- 2. [DB] ONE-TIME SYNC FOR EXISTING USERS
DO $$
BEGIN
  UPDATE auth.users u
  SET raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || jsonb_build_object('role', p.role, 'is_banned', coalesce(p.is_banned, false))
  FROM public.profiles p
  WHERE u.id = p.id;
END $$;

-- 3. [DB] RLS OPTIMIZATION (FAST JWT PATH)
-- Remove slow EXISTS/SELECT checks and use JWT claims

-- Tables: Invoices
DROP POLICY IF EXISTS "Banned users cannot purchase" ON public.invoices;
CREATE POLICY "Banned users cannot purchase" ON public.invoices 
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND 
    coalesce(auth.jwt() -> 'app_metadata' ->> 'is_banned', 'false')::boolean = false
  );

DROP POLICY IF EXISTS "Users can view own invoices" ON public.invoices;
CREATE POLICY "Users can view own invoices" ON public.invoices
  FOR SELECT USING (
    auth.uid() = user_id OR 
    coalesce(auth.jwt() -> 'app_metadata' ->> 'role', 'user') = 'admin'
  );

-- Tables: Topups
DROP POLICY IF EXISTS "Banned users cannot topup" ON public.topups;
CREATE POLICY "Banned users cannot topup" ON public.topups 
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND 
    coalesce(auth.jwt() -> 'app_metadata' ->> 'is_banned', 'false')::boolean = false
  );

DROP POLICY IF EXISTS "Users can view own topups" ON public.topups;
CREATE POLICY "Users can view own topups" ON public.topups
  FOR SELECT USING (
    auth.uid() = user_id OR 
    coalesce(auth.jwt() -> 'app_metadata' ->> 'role', 'user') = 'admin'
  );

-- Tables: Profiles (Self-view and Admin-view)
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Profiles are viewable by everyone" ON public.profiles
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
CREATE POLICY "Admins can update all profiles" ON public.profiles
  FOR UPDATE USING (
    coalesce(auth.jwt() -> 'app_metadata' ->> 'role', 'user') = 'admin'
  );

-- 4. [DB] PERFORMANCE INDEXES
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_topups_user_status ON public.topups(user_id, status);
CREATE INDEX IF NOT EXISTS idx_notifications_user_recent ON public.notifications(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_invoices_user_id ON public.invoices(user_id);

-- 5. REFRESH SCHEMA
NOTIFY pgrst, 'reload schema';
