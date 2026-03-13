
-- Sensory profiles table
CREATE TABLE public.sensory_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  alter_id TEXT,
  label TEXT NOT NULL DEFAULT 'Default Profile',
  visual SMALLINT NOT NULL DEFAULT 3,
  auditory SMALLINT NOT NULL DEFAULT 3,
  tactile SMALLINT NOT NULL DEFAULT 3,
  olfactory SMALLINT NOT NULL DEFAULT 3,
  gustatory SMALLINT NOT NULL DEFAULT 3,
  vestibular SMALLINT NOT NULL DEFAULT 3,
  proprioceptive SMALLINT NOT NULL DEFAULT 3,
  safe_environments TEXT,
  sensory_triggers TEXT,
  coping_strategies TEXT,
  notes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.sensory_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own sensory profiles" ON public.sensory_profiles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own sensory profiles" ON public.sensory_profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own sensory profiles" ON public.sensory_profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users delete own sensory profiles" ON public.sensory_profiles FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Communication cards table
CREATE TABLE public.communication_cards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  label TEXT NOT NULL,
  emoji TEXT,
  category TEXT NOT NULL DEFAULT 'general',
  color TEXT,
  sort_order SMALLINT NOT NULL DEFAULT 0,
  is_phrase BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.communication_cards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own communication cards" ON public.communication_cards FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own communication cards" ON public.communication_cards FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own communication cards" ON public.communication_cards FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users delete own communication cards" ON public.communication_cards FOR DELETE TO authenticated USING (auth.uid() = user_id);
