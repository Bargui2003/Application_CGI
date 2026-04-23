-- Create profiles table for user management
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  role TEXT DEFAULT 'operator',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create stock_levels table
CREATE TABLE IF NOT EXISTS public.stock_levels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  hd NUMERIC DEFAULT 1000,
  ld NUMERIC DEFAULT 1000,
  black_color NUMERIC DEFAULT 500,
  dryer NUMERIC DEFAULT 500,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create production_records table
CREATE TABLE IF NOT EXISTS public.production_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  total_quantity NUMERIC NOT NULL,
  pieces_count NUMERIC NOT NULL,
  waste_percentage NUMERIC NOT NULL,
  useful_quantity NUMERIC NOT NULL,
  hd_percentage NUMERIC NOT NULL,
  ld_percentage NUMERIC NOT NULL,
  hd_quantity NUMERIC NOT NULL,
  ld_quantity NUMERIC NOT NULL,
  black_color_quantity NUMERIC NOT NULL,
  dryer_quantity NUMERIC NOT NULL,
  weight_per_piece NUMERIC NOT NULL,
  diameter TEXT NOT NULL,
  pressure TEXT NOT NULL,
  speed NUMERIC NOT NULL,
  production_time NUMERIC NOT NULL,
  total_length NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create stock_movements table
CREATE TABLE IF NOT EXISTS public.stock_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  material TEXT NOT NULL,
  material_label TEXT NOT NULL,
  quantity NUMERIC NOT NULL,
  operation TEXT NOT NULL,
  before_value NUMERIC NOT NULL,
  after_value NUMERIC NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_activity table for audit trail
CREATE TABLE IF NOT EXISTS public.user_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.production_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_activity ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for profiles
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Create RLS policies for stock_levels
CREATE POLICY "Users can view their own stock levels" ON public.stock_levels
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own stock levels" ON public.stock_levels
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own stock levels" ON public.stock_levels
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for production_records
CREATE POLICY "Users can view their own production records" ON public.production_records
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own production records" ON public.production_records
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own production records" ON public.production_records
  FOR UPDATE USING (auth.uid() = user_id);

-- Create RLS policies for stock_movements
CREATE POLICY "Users can view their own stock movements" ON public.stock_movements
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own stock movements" ON public.stock_movements
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for user_activity
CREATE POLICY "Users can view their own activity" ON public.user_activity
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own activity" ON public.user_activity
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create function to handle new user profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', new.email),
    COALESCE(new.raw_user_meta_data->>'role', 'operator')
  );

  -- Create initial stock levels
  INSERT INTO public.stock_levels (user_id, hd, ld, black_color, dryer)
  VALUES (new.id, 1000, 1000, 500, 500);

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for new user profile
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
