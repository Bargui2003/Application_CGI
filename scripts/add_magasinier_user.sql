-- SQL script to add the magasinier user
-- Run this in your Supabase SQL editor

-- Insert the magasinier user
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
