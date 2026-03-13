
-- Login history table
CREATE TABLE public.login_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  login_at timestamptz NOT NULL DEFAULT now(),
  ip_address text,
  user_agent text,
  device_label text,
  success boolean NOT NULL DEFAULT true,
  logout_at timestamptz
);

ALTER TABLE public.login_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own login history" ON public.login_history
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users insert own login history" ON public.login_history
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own login history" ON public.login_history
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX idx_login_history_user_id ON public.login_history(user_id);
CREATE INDEX idx_login_history_login_at ON public.login_history(login_at DESC);

-- Share access log table
CREATE TABLE public.share_access_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id uuid NOT NULL REFERENCES public.support_contacts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  accessed_at timestamptz NOT NULL DEFAULT now(),
  ip_address text,
  user_agent text,
  sections_viewed text[] NOT NULL DEFAULT '{}'
);

ALTER TABLE public.share_access_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own share access logs" ON public.share_access_log
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Anon can log share access" ON public.share_access_log
  FOR INSERT TO anon WITH CHECK (true);

CREATE INDEX idx_share_access_log_contact ON public.share_access_log(contact_id);
CREATE INDEX idx_share_access_log_user ON public.share_access_log(user_id);

-- Add expiration to support_contacts
ALTER TABLE public.support_contacts 
  ADD COLUMN IF NOT EXISTS expires_at timestamptz,
  ADD COLUMN IF NOT EXISTS access_count integer NOT NULL DEFAULT 0;

-- Add indexes to audit_log for better querying
CREATE INDEX IF NOT EXISTS idx_audit_log_user_created ON public.audit_log(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_action ON public.audit_log(action);
