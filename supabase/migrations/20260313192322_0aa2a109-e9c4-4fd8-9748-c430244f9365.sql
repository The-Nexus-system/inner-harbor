-- Create alter_permissions table for Feature Group A
CREATE TABLE public.alter_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  alter_id uuid NOT NULL REFERENCES public.alters(id) ON DELETE CASCADE,
  scope text NOT NULL,
  granted boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(alter_id, scope)
);

ALTER TABLE public.alter_permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own alter permissions" ON public.alter_permissions
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own alter permissions" ON public.alter_permissions
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own alter permissions" ON public.alter_permissions
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users delete own alter permissions" ON public.alter_permissions
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX idx_alter_permissions_user ON public.alter_permissions(user_id);
CREATE INDEX idx_alter_permissions_alter ON public.alter_permissions(alter_id);

-- Add interface_mode column to alters for Feature Group B
ALTER TABLE public.alters ADD COLUMN interface_mode text NOT NULL DEFAULT 'standard';

-- Add auto_switch_interface_mode to app_settings
ALTER TABLE public.app_settings ADD COLUMN auto_switch_interface boolean NOT NULL DEFAULT false;