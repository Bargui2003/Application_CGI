-- Add rejection status and tracking columns
-- Run this in your Supabase SQL Editor

-- Add rejection tracking columns
ALTER TABLE public.production_records ADD COLUMN IF NOT EXISTS rejected_by_magasinier TEXT;
ALTER TABLE public.production_records ADD COLUMN IF NOT EXISTS rejected_at_magasinier TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.production_records ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- Verify the columns were added
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'production_records' 
  AND table_schema = 'public'
  AND column_name IN ('rejected_by_magasinier', 'rejected_at_magasinier', 'rejection_reason')
ORDER BY ordinal_position;
