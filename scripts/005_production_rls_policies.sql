-- =====================================================
-- PRODUCTION RLS POLICIES FOR SUPABASE
-- Script pour activer le Row Level Security (RLS) en production
-- =====================================================

-- 1. ENABLE RLS ON ALL TABLES
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.production_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_activity ENABLE ROW LEVEL SECURITY;

-- 2. DROP EXISTING INSECURE POLICIES
DROP POLICY IF EXISTS "Allow anonymous access to stock_levels" ON public.stock_levels;
DROP POLICY IF EXISTS "Allow anonymous access to production_records" ON public.production_records;
DROP POLICY IF EXISTS "Allow anonymous access to stock_movements" ON public.stock_movements;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own stock levels" ON public.stock_levels;
DROP POLICY IF EXISTS "Users can update their own stock levels" ON public.stock_levels;
DROP POLICY IF EXISTS "Users can insert their own stock levels" ON public.stock_levels;
DROP POLICY IF EXISTS "Users can view their own production records" ON public.production_records;
DROP POLICY IF EXISTS "Users can insert their own production records" ON public.production_records;
DROP POLICY IF EXISTS "Users can update their own production records" ON public.production_records;
DROP POLICY IF EXISTS "Users can view their own stock movements" ON public.stock_movements;
DROP POLICY IF EXISTS "Users can insert their own stock movements" ON public.stock_movements;
DROP POLICY IF EXISTS "Users can view their own activity" ON public.user_activity;
DROP POLICY IF EXISTS "Users can insert their own activity" ON public.user_activity;

-- 3. PROFILES TABLE POLICIES
-- Admins can view all profiles
CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  USING (
    auth.uid() IN (
      SELECT id FROM public.profiles WHERE role = 'admin'
    )
  );

-- Users can view their own profile
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

-- Admins can update all profiles
CREATE POLICY "Admins can update profiles"
  ON public.profiles FOR UPDATE
  USING (
    auth.uid() IN (
      SELECT id FROM public.profiles WHERE role = 'admin'
    )
  );

-- Users can update their own profile
CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- 4. STOCK_LEVELS TABLE POLICIES
-- Everyone can view stock levels (shared resource)
CREATE POLICY "Everyone can view stock levels"
  ON public.stock_levels FOR SELECT
  USING (true);

-- Only admins can insert stock levels
CREATE POLICY "Admins can insert stock levels"
  ON public.stock_levels FOR INSERT
  WITH CHECK (
    auth.uid() IN (
      SELECT id FROM public.profiles WHERE role = 'admin'
    )
  );

-- Only admins can update stock levels
CREATE POLICY "Admins can update stock levels"
  ON public.stock_levels FOR UPDATE
  USING (
    auth.uid() IN (
      SELECT id FROM public.profiles WHERE role = 'admin'
    )
  );

-- 5. PRODUCTION_RECORDS TABLE POLICIES
-- Conducteurs can view/insert their own records
CREATE POLICY "Conducteurs can view their own production records"
  ON public.production_records FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Conducteurs can insert their own production records"
  ON public.production_records FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Conducteurs can update their own production records"
  ON public.production_records FOR UPDATE
  USING (auth.uid() = user_id);

-- Magasinniers can view all records and update status
CREATE POLICY "Magasinniers can view all production records"
  ON public.production_records FOR SELECT
  USING (
    auth.uid() IN (
      SELECT id FROM public.profiles WHERE role = 'magasinier'
    )
  );

CREATE POLICY "Magasinniers can update production record status"
  ON public.production_records FOR UPDATE
  USING (
    auth.uid() IN (
      SELECT id FROM public.profiles WHERE role = 'magasinier'
    )
  );

-- Admins can view/update/delete all records
CREATE POLICY "Admins can view all production records"
  ON public.production_records FOR SELECT
  USING (
    auth.uid() IN (
      SELECT id FROM public.profiles WHERE role = 'admin'
    )
  );

CREATE POLICY "Admins can update all production records"
  ON public.production_records FOR UPDATE
  USING (
    auth.uid() IN (
      SELECT id FROM public.profiles WHERE role = 'admin'
    )
  );

CREATE POLICY "Admins can delete production records"
  ON public.production_records FOR DELETE
  USING (
    auth.uid() IN (
      SELECT id FROM public.profiles WHERE role = 'admin'
    )
  );

-- 6. STOCK_MOVEMENTS TABLE POLICIES
-- Everyone can view stock movements (audit trail)
CREATE POLICY "Everyone can view stock movements"
  ON public.stock_movements FOR SELECT
  USING (true);

-- Only admins can insert movements
CREATE POLICY "Admins can insert stock movements"
  ON public.stock_movements FOR INSERT
  WITH CHECK (
    auth.uid() IN (
      SELECT id FROM public.profiles WHERE role = 'admin'
    )
  );

-- 7. USER_ACTIVITY TABLE POLICIES
-- Users can view their own activity
CREATE POLICY "Users can view their own activity"
  ON public.user_activity FOR SELECT
  USING (auth.uid() = user_id);

-- Admins can view all activity
CREATE POLICY "Admins can view all activity"
  ON public.user_activity FOR SELECT
  USING (
    auth.uid() IN (
      SELECT id FROM public.profiles WHERE role = 'admin'
    )
  );

-- Users can insert their own activity
CREATE POLICY "Users can insert their own activity"
  ON public.user_activity FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- NOTES
-- =====================================================

-- RLS is now enabled with role-based access control
-- - ADMIN: Full access to all tables
-- - CONDUCTEUR: Can create/view/update their own production records
-- - MAGASINIER: Can view all records and update status
-- - Stock levels are viewable by everyone (shared resource)
-- - Stock movements are auditable by everyone

-- To test:
-- 1. Create users with different roles
-- 2. Login as each role
-- 3. Verify access restrictions
-- 4. Check that unauthorized access returns empty results or errors
