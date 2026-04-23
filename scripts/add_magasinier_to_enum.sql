-- SQL script to add 'magasinier' to the user_role enum
-- Run this in your Supabase SQL editor

-- First, add 'magasinier' to the user_role enum
ALTER TYPE user_role ADD VALUE 'magasinier';

-- Verify the enum values
SELECT unnest(enum_range(NULL::user_role)) as user_roles;

-- Now insert the magasinier user
INSERT INTO public.users (
  username,
  email,
  password_hash,
  first_name,
  last_name,
  phone,
  role,
  created_at,
  updated_at
) VALUES (
  'magasinier',
  'magasinier@cgi.com',
  'magasinier',  -- In production, use proper password hashing
  'Magasinier',
  'CGI',
  '0123456789',
  'magasinier',
  NOW(),
  NOW()
) ON CONFLICT (username) DO NOTHING;

-- Verify the user was created
SELECT 
  id,
  username,
  email,
  role,
  first_name,
  last_name,
  created_at
FROM public.users 
WHERE username = 'magasinier';
