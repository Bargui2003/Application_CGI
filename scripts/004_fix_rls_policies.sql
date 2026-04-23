-- Fix RLS policies to allow unauthenticated access for development
-- This script adds additional policies that allow access without authentication

-- Drop existing RLS policies for stock_levels
DROP POLICY IF EXISTS "Users can view their own stock levels" ON public.stock_levels;
DROP POLICY IF EXISTS "Users can update their own stock levels" ON public.stock_levels;
DROP POLICY IF EXISTS "Users can insert their own stock levels" ON public.stock_levels;

-- Create new RLS policies for stock_levels (allow unauthenticated access)
CREATE POLICY "Allow anonymous access to stock_levels" ON public.stock_levels
  FOR ALL USING (true);

-- Drop existing RLS policies for production_records
DROP POLICY IF EXISTS "Users can view their own production records" ON public.production_records;
DROP POLICY IF EXISTS "Users can insert their own production records" ON public.production_records;
DROP POLICY IF EXISTS "Users can update their own production records" ON public.production_records;

-- Create new RLS policies for production_records (allow unauthenticated access)
CREATE POLICY "Allow anonymous access to production_records" ON public.production_records
  FOR ALL USING (true);

-- Drop existing RLS policies for stock_movements
DROP POLICY IF EXISTS "Users can view their own stock movements" ON public.stock_movements;
DROP POLICY IF EXISTS "Users can insert their own stock movements" ON public.stock_movements;

-- Create new RLS policies for stock_movements (allow unauthenticated access)
CREATE POLICY "Allow anonymous access to stock_movements" ON public.stock_movements
  FOR ALL USING (true);

-- Update stock_levels table to remove user_id requirement for initial data
-- First, let's add a default stock level record if none exists
INSERT INTO public.stock_levels (id, hd, ld, black_color, dryer, user_id)
SELECT 
  gen_random_uuid(),
  1000,
  1000,
  500,
  500,
  '00000000-0000-0000-0000-000000000000'::uuid
WHERE NOT EXISTS (
  SELECT 1 FROM public.stock_levels
)
ON CONFLICT DO NOTHING;
