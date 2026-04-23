-- FINAL SOLUTION: Workaround for enum transaction issue
-- Run this in your Supabase SQL editor

-- Step 1: Add 'magasinier' to the enum
ALTER TYPE user_role ADD VALUE 'magasinier';

-- Step 2: Create user with existing role first (using 'admin' as temporary role)
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
  'magasinier',
  'Magasinier',
  'CGI',
  '0123456789',
  'admin',  -- Use existing enum value temporarily
  NOW(),
  NOW()
) ON CONFLICT (username) DO NOTHING;

-- Step 3: Update the role to 'magasinier' (this should work now)
UPDATE public.users 
SET role = 'magasinier', updated_at = NOW()
WHERE username = 'magasinier';

-- Verify the user was created with correct role
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

-- Show all enum values
SELECT unnest(enum_range(NULL::user_role)) as user_roles;
