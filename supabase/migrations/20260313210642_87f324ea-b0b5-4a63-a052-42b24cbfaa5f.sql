
-- Fix overly permissive anon insert policy on share_access_log
DROP POLICY "Anon can log share access" ON public.share_access_log;

CREATE POLICY "Anon can log share access for active contacts" ON public.share_access_log
  FOR INSERT TO anon 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.support_contacts sc
      WHERE sc.id = contact_id
        AND sc.is_active = true
        AND sc.share_token IS NOT NULL
        AND (sc.expires_at IS NULL OR sc.expires_at > now())
    )
  );
