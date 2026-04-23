-- FINAL SQL FIX: Add enum value and update user
-- Run this in Supabase SQL Editor

-- Add magasinier to enum
ALTER TYPE user_role ADD VALUE 'magasinier';

-- Update user role
UPDATE public.users SET role = 'magasinier' WHERE username = 'magasinier';

-- Verify
SELECT id, username, email, role FROM public.users WHERE username = 'magasinier';
