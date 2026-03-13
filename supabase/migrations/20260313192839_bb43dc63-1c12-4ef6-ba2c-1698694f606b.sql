-- Environment presets table for Feature Group D
CREATE TABLE public.environment_presets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  icon text NOT NULL DEFAULT '🏠',
  color text DEFAULT NULL,
  visible_sections jsonb NOT NULL DEFAULT '["front","tasks","messages","journal","calendar","safety","checkin","notes","insights","summary","trends"]'::jsonb,
  is_active boolean NOT NULL DEFAULT false,
  sort_order smallint NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.environment_presets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own presets" ON public.environment_presets
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own presets" ON public.environment_presets
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own presets" ON public.environment_presets
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users delete own presets" ON public.environment_presets
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX idx_environment_presets_user ON public.environment_presets(user_id);