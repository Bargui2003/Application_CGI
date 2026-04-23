-- SQL script to add missing columns to users table
-- Run this in your Supabase SQL editor

-- Add first_name column
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS first_name TEXT;

-- Add last_name column  
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS last_name TEXT;

-- Add phone column
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS phone TEXT;

-- Add avatar column
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS avatar TEXT;

-- Add updated_at column
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Verify the changes
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'users' AND table_schema = 'public' 
ORDER BY ordinal_position;
