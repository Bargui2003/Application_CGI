-- STEP 1: Add 'magasinier' to the user_role enum
-- Run this FIRST in your Supabase SQL editor

-- Add 'magasinier' to the user_role enum
ALTER TYPE user_role ADD VALUE 'magasinier';

-- Verify the enum values
SELECT unnest(enum_range(NULL::user_role)) as user_roles;

-- IMPORTANT: Run this script first, wait for it to complete,
-- then run step2_create_magasinier_user.sql
