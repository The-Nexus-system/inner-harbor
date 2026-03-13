
-- =============================================
-- Feature Group F: Support Portal
-- =============================================

-- Support contacts table (caregivers, therapists, etc.)
CREATE TABLE public.support_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  role text NOT NULL DEFAULT 'caregiver',
  email text,
  phone text,
  notes text,
  share_token text UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  shared_sections jsonb NOT NULL DEFAULT '["safety","calendar","tasks"]'::jsonb,
  is_active boolean NOT NULL DEFAULT true,
  last_accessed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.support_contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own support contacts" ON public.support_contacts FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own support contacts" ON public.support_contacts FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own support contacts" ON public.support_contacts FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users delete own support contacts" ON public.support_contacts FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Public read policy for portal access via share token (no auth required)
CREATE POLICY "Portal access via share token" ON public.support_contacts FOR SELECT TO anon USING (is_active = true AND share_token IS NOT NULL);

-- =============================================
-- Feature Group G: Medication Tracking
-- =============================================

CREATE TABLE public.medications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  dosage text,
  frequency text NOT NULL DEFAULT 'daily',
  schedule_times text[] NOT NULL DEFAULT '{}',
  prescriber text,
  pharmacy text,
  purpose text,
  side_effects text,
  notes text,
  is_active boolean NOT NULL DEFAULT true,
  start_date date,
  end_date date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.medications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own medications" ON public.medications FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own medications" ON public.medications FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own medications" ON public.medications FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users delete own medications" ON public.medications FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Medication log for tracking adherence
CREATE TABLE public.medication_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  medication_id uuid NOT NULL REFERENCES public.medications(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'taken',
  scheduled_time text,
  taken_at timestamptz NOT NULL DEFAULT now(),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.medication_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own medication logs" ON public.medication_logs FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own medication logs" ON public.medication_logs FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own medication logs" ON public.medication_logs FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users delete own medication logs" ON public.medication_logs FOR DELETE TO authenticated USING (auth.uid() = user_id);
