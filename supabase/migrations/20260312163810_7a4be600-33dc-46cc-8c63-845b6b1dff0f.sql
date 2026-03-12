
-- ============================================================
-- Mosaic: Full Production Schema
-- ============================================================

-- Custom types
CREATE TYPE public.visibility AS ENUM ('private', 'shared', 'emergency-only');
CREATE TYPE public.front_status AS ENUM (
  'fronting', 'co-fronting', 'co-conscious', 'passive-influence',
  'blurry', 'unknown', 'dormant', 'unavailable', 'stuck', 'nonverbal'
);
CREATE TYPE public.memory_continuity AS ENUM ('present', 'partial', 'absent', 'unknown');
CREATE TYPE public.task_category AS ENUM (
  'general', 'medication', 'hygiene', 'meals', 'hydration', 'therapy', 'mobility', 'community'
);
CREATE TYPE public.safety_plan_type AS ENUM (
  'grounding', 'crisis', 'shutdown', 'meltdown', 'flashback', 'seizure', 'medical', 'hospital-card'
);
CREATE TYPE public.journal_type AS ENUM (
  'text', 'mood', 'sensory', 'flashback', 'medical', 'seizure', 'victory', 'memory-reconstruction'
);
CREATE TYPE public.message_priority AS ENUM ('low', 'normal', 'high', 'urgent');

-- ============================================================
-- Shared trigger function for updated_at
-- ============================================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- ============================================================
-- 1. Profiles
-- ============================================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  system_name TEXT DEFAULT 'My System',
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', 'New User'));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- 2. Alters (soft-delete via archived_at)
-- ============================================================
CREATE TABLE public.alters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  nickname TEXT,
  pronouns TEXT NOT NULL DEFAULT 'they/them',
  role TEXT,
  age_range TEXT,
  species TEXT,
  communication_style TEXT,
  -- SENSITIVE FIELDS (candidates for future field-level encryption)
  access_needs TEXT,
  triggers_to_avoid TEXT,
  grounding_preferences TEXT,
  safe_foods TEXT,
  music_preferences TEXT,
  fronting_confidence TEXT CHECK (fronting_confidence IN ('high', 'medium', 'low', 'uncertain')),
  color TEXT,
  emoji TEXT,
  notes TEXT,
  visibility public.visibility NOT NULL DEFAULT 'shared',
  private_fields TEXT[],
  is_active BOOLEAN NOT NULL DEFAULT true,
  archived_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.alters ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own alters" ON public.alters FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own alters" ON public.alters FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own alters" ON public.alters FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own alters" ON public.alters FOR DELETE USING (auth.uid() = user_id);
CREATE INDEX idx_alters_user_id ON public.alters(user_id);
CREATE INDEX idx_alters_active ON public.alters(user_id, is_active) WHERE archived_at IS NULL;
CREATE TRIGGER update_alters_updated_at BEFORE UPDATE ON public.alters FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- 3. Front Events
-- ============================================================
CREATE TABLE public.front_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  alter_ids TEXT[] NOT NULL DEFAULT '{}',
  status public.front_status NOT NULL DEFAULT 'unknown',
  start_time TIMESTAMPTZ NOT NULL DEFAULT now(),
  end_time TIMESTAMPTZ,
  memory_continuity public.memory_continuity NOT NULL DEFAULT 'unknown',
  trigger_info TEXT,
  symptoms TEXT,
  notes TEXT,
  location TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.front_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own front events" ON public.front_events FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own front events" ON public.front_events FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own front events" ON public.front_events FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own front events" ON public.front_events FOR DELETE USING (auth.uid() = user_id);
CREATE INDEX idx_front_events_user_id ON public.front_events(user_id);
CREATE INDEX idx_front_events_start ON public.front_events(user_id, start_time DESC);
CREATE TRIGGER update_front_events_updated_at BEFORE UPDATE ON public.front_events FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- 4. Journal Entries (soft-delete)
-- ============================================================
CREATE TABLE public.journal_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  alter_id TEXT,
  title TEXT,
  content TEXT NOT NULL,
  mood SMALLINT CHECK (mood BETWEEN 1 AND 5),
  type public.journal_type NOT NULL DEFAULT 'text',
  tags TEXT[] NOT NULL DEFAULT '{}',
  visibility public.visibility NOT NULL DEFAULT 'shared',
  is_draft BOOLEAN NOT NULL DEFAULT false,
  archived_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own journal" ON public.journal_entries FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own journal" ON public.journal_entries FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own journal" ON public.journal_entries FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own journal" ON public.journal_entries FOR DELETE USING (auth.uid() = user_id);
CREATE INDEX idx_journal_user_id ON public.journal_entries(user_id);
CREATE INDEX idx_journal_created ON public.journal_entries(user_id, created_at DESC);
CREATE TRIGGER update_journal_updated_at BEFORE UPDATE ON public.journal_entries FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- 5. Internal Messages
-- ============================================================
CREATE TABLE public.internal_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  from_alter_id TEXT,
  to_alter_ids TEXT[] NOT NULL DEFAULT '{}',
  content TEXT NOT NULL,
  priority public.message_priority NOT NULL DEFAULT 'normal',
  is_pinned BOOLEAN NOT NULL DEFAULT false,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.internal_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own messages" ON public.internal_messages FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own messages" ON public.internal_messages FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own messages" ON public.internal_messages FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own messages" ON public.internal_messages FOR DELETE USING (auth.uid() = user_id);
CREATE INDEX idx_messages_user_id ON public.internal_messages(user_id);
CREATE INDEX idx_messages_created ON public.internal_messages(user_id, created_at DESC);
CREATE TRIGGER update_messages_updated_at BEFORE UPDATE ON public.internal_messages FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- 6. Tasks (soft-delete)
-- ============================================================
CREATE TABLE public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  assigned_to TEXT NOT NULL DEFAULT 'system',
  is_completed BOOLEAN NOT NULL DEFAULT false,
  due_date DATE,
  is_recurring BOOLEAN NOT NULL DEFAULT false,
  category public.task_category NOT NULL DEFAULT 'general',
  archived_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own tasks" ON public.tasks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own tasks" ON public.tasks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own tasks" ON public.tasks FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own tasks" ON public.tasks FOR DELETE USING (auth.uid() = user_id);
CREATE INDEX idx_tasks_user_id ON public.tasks(user_id);
CREATE INDEX idx_tasks_due ON public.tasks(user_id, due_date) WHERE archived_at IS NULL;
CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON public.tasks FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- 7. Safety Plans (SENSITIVE)
-- ============================================================
CREATE TABLE public.safety_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type public.safety_plan_type NOT NULL,
  title TEXT NOT NULL,
  steps TEXT[] NOT NULL DEFAULT '{}',
  trusted_contacts JSONB NOT NULL DEFAULT '[]',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.safety_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own safety plans" ON public.safety_plans FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own safety plans" ON public.safety_plans FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own safety plans" ON public.safety_plans FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own safety plans" ON public.safety_plans FOR DELETE USING (auth.uid() = user_id);
CREATE INDEX idx_safety_plans_user_id ON public.safety_plans(user_id);
CREATE TRIGGER update_safety_plans_updated_at BEFORE UPDATE ON public.safety_plans FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- 8. Calendar Events
-- ============================================================
CREATE TABLE public.calendar_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  event_date DATE NOT NULL,
  event_time TIME,
  preferred_fronter TEXT,
  support_needed TEXT,
  sensory_prep TEXT,
  recovery_time TEXT,
  transport_notes TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own calendar" ON public.calendar_events FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own calendar" ON public.calendar_events FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own calendar" ON public.calendar_events FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own calendar" ON public.calendar_events FOR DELETE USING (auth.uid() = user_id);
CREATE INDEX idx_calendar_user_id ON public.calendar_events(user_id);
CREATE INDEX idx_calendar_date ON public.calendar_events(user_id, event_date);
CREATE TRIGGER update_calendar_updated_at BEFORE UPDATE ON public.calendar_events FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- 9. Daily Check-Ins
-- ============================================================
CREATE TABLE public.daily_check_ins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  check_date DATE NOT NULL DEFAULT CURRENT_DATE,
  alter_id TEXT,
  mood SMALLINT NOT NULL CHECK (mood BETWEEN 1 AND 5),
  stress SMALLINT NOT NULL CHECK (stress BETWEEN 1 AND 5),
  pain SMALLINT NOT NULL CHECK (pain BETWEEN 1 AND 5),
  fatigue SMALLINT NOT NULL CHECK (fatigue BETWEEN 1 AND 5),
  dissociation SMALLINT NOT NULL CHECK (dissociation BETWEEN 1 AND 5),
  seizure_risk SMALLINT CHECK (seizure_risk BETWEEN 1 AND 5),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, check_date)
);
ALTER TABLE public.daily_check_ins ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own checkins" ON public.daily_check_ins FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own checkins" ON public.daily_check_ins FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own checkins" ON public.daily_check_ins FOR UPDATE USING (auth.uid() = user_id);
CREATE INDEX idx_checkins_user_date ON public.daily_check_ins(user_id, check_date DESC);
CREATE TRIGGER update_checkins_updated_at BEFORE UPDATE ON public.daily_check_ins FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- 10. App Settings (per-user)
-- ============================================================
CREATE TABLE public.app_settings (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  high_contrast BOOLEAN NOT NULL DEFAULT false,
  dark_mode BOOLEAN NOT NULL DEFAULT false,
  font_size TEXT NOT NULL DEFAULT 'medium' CHECK (font_size IN ('small', 'medium', 'large', 'xlarge')),
  spacing TEXT NOT NULL DEFAULT 'normal' CHECK (spacing IN ('compact', 'normal', 'spacious')),
  reduced_motion BOOLEAN NOT NULL DEFAULT false,
  plain_language BOOLEAN NOT NULL DEFAULT false,
  sound_off BOOLEAN NOT NULL DEFAULT true,
  screen_reader_optimized BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own settings" ON public.app_settings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own settings" ON public.app_settings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own settings" ON public.app_settings FOR UPDATE USING (auth.uid() = user_id);
CREATE TRIGGER update_settings_updated_at BEFORE UPDATE ON public.app_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- 11. Audit Log (append-only, SENSITIVE)
-- ============================================================
CREATE TABLE public.audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  resource_type TEXT,
  resource_id TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;
-- Insert-only: users can log actions but never modify or delete
CREATE POLICY "Users insert own audit entries" ON public.audit_log FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users read own audit log" ON public.audit_log FOR SELECT USING (auth.uid() = user_id);
-- No UPDATE or DELETE policies — append-only by design
CREATE INDEX idx_audit_user_id ON public.audit_log(user_id);
CREATE INDEX idx_audit_created ON public.audit_log(user_id, created_at DESC);
CREATE INDEX idx_audit_action ON public.audit_log(user_id, action);
