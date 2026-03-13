
-- Invite codes table for invite-only registration
CREATE TABLE public.invite_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  used_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  used_at timestamptz,
  expires_at timestamptz,
  max_uses integer NOT NULL DEFAULT 1,
  use_count integer NOT NULL DEFAULT 0,
  notes text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- App-level config table (single row per user for deployment settings)
CREATE TABLE public.app_config (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  invite_only boolean NOT NULL DEFAULT false,
  demo_mode boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- RLS for invite_codes
ALTER TABLE public.invite_codes ENABLE ROW LEVEL SECURITY;

-- Anyone can validate a code (for signup)
CREATE POLICY "Anon can read active invite codes"
  ON public.invite_codes FOR SELECT TO anon
  USING (is_active = true AND (expires_at IS NULL OR expires_at > now()));

-- Authenticated users manage their own codes
CREATE POLICY "Users read own invite codes"
  ON public.invite_codes FOR SELECT TO authenticated
  USING (created_by = auth.uid());

CREATE POLICY "Users insert own invite codes"
  ON public.invite_codes FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users update own invite codes"
  ON public.invite_codes FOR UPDATE TO authenticated
  USING (created_by = auth.uid());

CREATE POLICY "Users delete own invite codes"
  ON public.invite_codes FOR DELETE TO authenticated
  USING (created_by = auth.uid());

-- Anon can increment use_count when redeeming
CREATE POLICY "Anon can update invite code use count"
  ON public.invite_codes FOR UPDATE TO anon
  USING (is_active = true AND (expires_at IS NULL OR expires_at > now()));

-- RLS for app_config
ALTER TABLE public.app_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own config"
  ON public.app_config FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users insert own config"
  ON public.app_config FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users update own config"
  ON public.app_config FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

-- Anon can read config to check invite_only mode
CREATE POLICY "Anon can read config for invite check"
  ON public.app_config FOR SELECT TO anon
  USING (true);
