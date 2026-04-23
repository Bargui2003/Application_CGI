-- SCRIPT TO UPDATE USER_ROLE ENUM AND ADD MAGASINIER USER
-- Run this in your Supabase SQL Editor

-- Step 1: Add 'magasinier' to the existing user_role enum
ALTER TYPE user_role ADD VALUE 'magasinier';

-- Step 2: Verify the enum has been updated
SELECT unnest(enum_range(NULL::user_role)) as available_roles;

-- Step 3: Add the magasinier user
INSERT INTO users (email, username, password_hash, role)
VALUES (
  'magasinier@cgi.com',
  'magasinier',
  'magasinier',  -- Password: magasinier
  'magasinier'
) ON CONFLICT (username) DO NOTHING;

-- Step 4: Update existing user if it exists with wrong role
UPDATE users 
SET role = 'magasinier', updated_at = NOW()
WHERE username = 'magasinier';

-- Step 5: Verify the magasinier user was created
SELECT 
  id, 
  email, 
  username, 
  role, 
  created_at, 
  updated_at 
FROM users 
WHERE username = 'magasinier';

-- Step 6: Show all users to verify
SELECT id, email, username, role, created_at FROM users ORDER BY created_at;
