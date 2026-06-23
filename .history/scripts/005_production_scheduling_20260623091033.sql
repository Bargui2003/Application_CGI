-- ========================================
-- PRODUCTION SCHEDULING SYSTEM
-- Gestion des équipes et planification
-- ========================================

-- Table des équipes (3 équipes fixes)
CREATE TABLE IF NOT EXISTS public.teams (
  id BIGINT PRIMARY KEY,
  name TEXT NOT NULL,
  shift_start TIME NOT NULL,
  shift_end TIME NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insérer les 3 équipes
INSERT INTO public.teams (id, name, shift_start, shift_end) VALUES
  (1, 'Équipe 1', '07:00'::TIME, '15:00'::TIME),
  (2, 'Équipe 2', '15:00'::TIME, '23:00'::TIME),
  (3, 'Équipe 3', '23:00'::TIME, '07:00'::TIME)
ON CONFLICT (id) DO NOTHING;

-- Ajouter colonnes manquantes à production_records
ALTER TABLE public.production_records 
  ADD COLUMN IF NOT EXISTS article_name TEXT,
  ADD COLUMN IF NOT EXISTS order_time TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS team_id BIGINT REFERENCES public.teams(id),
  ADD COLUMN IF NOT EXISTS total_schedule_time NUMERIC,
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'en_attente';

-- Table : Planification de production par équipe
CREATE TABLE IF NOT EXISTS public.production_timeline (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  production_id UUID REFERENCES public.production_records(id) ON DELETE CASCADE,
  team_id BIGINT REFERENCES public.teams(id),
  article_name TEXT,
  time_start TIMESTAMP WITH TIME ZONE,
  time_end TIMESTAMP WITH TIME ZONE,
  time_used NUMERIC DEFAULT 0,
  setup_time NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'en_attente',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table : Signalements de problèmes par équipe
CREATE TABLE IF NOT EXISTS public.production_issues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  production_timeline_id UUID REFERENCES public.production_timeline(id) ON DELETE CASCADE,
  team_id BIGINT REFERENCES public.teams(id),
  issue_description TEXT NOT NULL,
  time_actual_used NUMERIC,
  status TEXT DEFAULT 'signalée',
  corrected_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  corrected_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.production_timeline ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.production_issues ENABLE ROW LEVEL SECURITY;

-- RLS Policies for teams (lecture seule)
CREATE POLICY "Anyone can view teams" ON public.teams
  FOR SELECT USING (true);

-- RLS Policies for production_timeline
CREATE POLICY "Anyone can view production_timeline" ON public.production_timeline
  FOR SELECT USING (true);

CREATE POLICY "Conducteurs can insert production_timeline" ON public.production_timeline
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Conducteurs can update production_timeline" ON public.production_timeline
  FOR UPDATE USING (true);

-- RLS Policies for production_issues
CREATE POLICY "Conducteurs can insert production_issues" ON public.production_issues
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Conducteurs can view their team issues" ON public.production_issues
  FOR SELECT USING (team_id IN (SELECT id FROM public.teams));

CREATE POLICY "Admin can view all issues" ON public.production_issues
  FOR SELECT USING (true);

CREATE POLICY "Admin can update issues" ON public.production_issues
  FOR UPDATE USING (true);
