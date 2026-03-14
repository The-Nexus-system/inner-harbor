-- Fix 1: Restrict app_config INSERT to only allow one row per user (admin protection)
-- Drop existing insert policy and replace with a more restrictive one
DROP POLICY IF EXISTS "Users insert own config" ON public.app_config;
CREATE POLICY "Users insert own config once" ON public.app_config
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND NOT EXISTS (SELECT 1 FROM public.app_config WHERE user_id = auth.uid())
  );

-- Fix 2: Fix share_access_log anon INSERT to enforce user_id matches contact owner
DROP POLICY IF EXISTS "Anon can log share access for active contacts" ON public.share_access_log;
CREATE POLICY "Anon can log share access for active contacts" ON public.share_access_log
  FOR INSERT TO anon
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.support_contacts sc
      WHERE sc.id = share_access_log.contact_id
        AND sc.is_active = true
        AND share_access_log.user_id = sc.user_id
    )
  );