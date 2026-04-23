-- Add missing columns to production_records table for magasinier workflow
-- Run this in your Supabase SQL Editor

-- Add status column with default 'draft'
ALTER TABLE public.production_records ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'draft';

-- Add validation tracking columns
ALTER TABLE public.production_records ADD COLUMN IF NOT EXISTS validated_by_magasinier TEXT;
ALTER TABLE public.production_records ADD COLUMN IF NOT EXISTS validated_at_magasinier TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.production_records ADD COLUMN IF NOT EXISTS magasinier_notes TEXT;

-- Add updated_at column for tracking modifications
ALTER TABLE public.production_records ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Verify the columns were added
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'production_records' 
  AND table_schema = 'public'
  AND column_name IN ('status', 'validated_by_magasinier', 'validated_at_magasinier', 'magasinier_notes', 'updated_at')
ORDER BY ordinal_position;

-- Show a sample of the table structure
SELECT * FROM public.production_records LIMIT 1;
