-- SQL script to add 'magasinier' to enum with explicit commit
-- Run this in your Supabase SQL editor

-- Method 1: Try with explicit commit
ALTER TYPE user_role ADD VALUE 'magasinier';

-- Force commit (this should work in Supabase SQL editor)
COMMIT;

-- Method 2: Alternative approach - create a temporary function
CREATE OR REPLACE FUNCTION add_magasinier_user() 
RETURNS void AS $$
BEGIN
  -- This runs in a separate transaction
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
    'magasinier',
    NOW(),
    NOW()
  ) ON CONFLICT (username) DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- Call the function (this runs in its own transaction)
SELECT add_magasinier_user();

-- Clean up the function
DROP FUNCTION IF EXISTS add_magasinier_user();

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

-- Verify enum values
SELECT unnest(enum_range(NULL::user_role)) as user_roles;
