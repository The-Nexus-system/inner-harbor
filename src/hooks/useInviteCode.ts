/**
 * Mosaic — Invite Code Validation Hook
 * 
 * Uses security-definer RPC functions to validate and redeem
 * invite codes without exposing raw table data to anon users.
 */
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export function useInviteCode() {
  const [validating, setValidating] = useState(false);

  const validateCode = useCallback(async (code: string): Promise<{ valid: boolean; error?: string }> => {
    if (!code.trim()) return { valid: false, error: 'Please enter an invite code.' };
    setValidating(true);
    try {
      const { data, error } = await supabase.rpc('validate_invite_code', {
        p_code: code.trim(),
      });

      if (error || !data) {
        return { valid: false, error: 'Could not validate invite code.' };
      }

      const result = data as { valid: boolean };
      if (!result.valid) {
        return { valid: false, error: 'Invalid or expired invite code.' };
      }

      return { valid: true };
    } catch {
      return { valid: false, error: 'Could not validate invite code.' };
    } finally {
      setValidating(false);
    }
  }, []);

  const redeemCode = useCallback(async (code: string, _userId: string) => {
    try {
      await supabase.rpc('redeem_invite_code', { p_code: code.trim() });
    } catch {}
  }, []);

  const checkInviteOnly = useCallback(async (): Promise<boolean> => {
    try {
      const { data } = await supabase.rpc('check_registration_flags');
      if (data && typeof data === 'object') {
        return !!(data as { invite_only: boolean }).invite_only;
      }
      return false;
    } catch {
      return false;
    }
  }, []);

  /** Check if new account registration is completely disabled */
  const checkRegistrationDisabled = useCallback(async (): Promise<boolean> => {
    try {
      const { data } = await supabase.rpc('check_registration_flags');
      if (data && typeof data === 'object') {
        return !!(data as { registration_disabled: boolean }).registration_disabled;
      }
      return false;
    } catch {
      return false;
    }
  }, []);

  return { validateCode, redeemCode, checkInviteOnly, checkRegistrationDisabled, validating };
}
