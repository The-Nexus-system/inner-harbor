/**
 * Mosaic — Invite Code Validation Hook
 */
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export function useInviteCode() {
  const [validating, setValidating] = useState(false);

  const validateCode = useCallback(async (code: string): Promise<{ valid: boolean; error?: string }> => {
    if (!code.trim()) return { valid: false, error: 'Please enter an invite code.' };
    setValidating(true);
    try {
      const { data, error } = await supabase
        .from('invite_codes')
        .select('id, code, max_uses, use_count, is_active, expires_at')
        .eq('code', code.trim().toUpperCase())
        .eq('is_active', true)
        .maybeSingle();

      if (error || !data) {
        return { valid: false, error: 'Invalid invite code.' };
      }
      if (data.expires_at && new Date(data.expires_at) < new Date()) {
        return { valid: false, error: 'This invite code has expired.' };
      }
      if (data.use_count >= data.max_uses) {
        return { valid: false, error: 'This invite code has already been used.' };
      }
      return { valid: true };
    } catch {
      return { valid: false, error: 'Could not validate invite code.' };
    } finally {
      setValidating(false);
    }
  }, []);

  const redeemCode = useCallback(async (code: string, userId: string) => {
    try {
      const { data } = await supabase
        .from('invite_codes')
        .select('id, use_count')
        .eq('code', code.trim().toUpperCase())
        .maybeSingle();

      if (data) {
        await supabase
          .from('invite_codes')
          .update({
            use_count: data.use_count + 1,
            used_by: userId,
            used_at: new Date().toISOString(),
          })
          .eq('id', data.id);
      }
    } catch {}
  }, []);

  const checkInviteOnly = useCallback(async (): Promise<boolean> => {
    try {
      const { data } = await supabase
        .from('app_config')
        .select('invite_only')
        .limit(1)
        .maybeSingle();
      return data?.invite_only ?? false;
    } catch {
      return false;
    }
  }, []);

  /** Check if new account registration is completely disabled */
  const checkRegistrationDisabled = useCallback(async (): Promise<boolean> => {
    try {
      const { data } = await supabase
        .from('app_config')
        .select('*')
        .limit(1)
        .maybeSingle();
      return (data as any)?.registration_disabled ?? false;
    } catch {
      return false;
    }
  }, []);

  return { validateCode, redeemCode, checkInviteOnly, checkRegistrationDisabled, validating };
}
