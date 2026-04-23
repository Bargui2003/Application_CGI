-- Alternative approach: Use a stored procedure to handle the enum addition and user creation
-- Run this in your Supabase SQL editor

-- Create a procedure that handles both steps in separate transactions
CREATE OR REPLACE PROCEDURE create_magasinier_user()
LANGUAGE plpgsql
AS $$
BEGIN
  -- First, add the enum value if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'magasinier' 
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role')
  ) THEN
    EXECUTE 'ALTER TYPE user_role ADD VALUE ''magasinier''';
  END IF;
  
  -- Then create the user
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
$$;

-- Execute the procedure
CALL create_magasinier_user();

-- Clean up
DROP PROCEDURE create_magasinier_user();

-- Verify results
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
