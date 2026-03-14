-- 1. Create security-definer function to check if invite code is valid
CREATE OR REPLACE FUNCTION public.validate_invite_code(p_code text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'valid', true,
    'id', ic.id
  ) INTO v_result
  FROM public.invite_codes ic
  WHERE ic.code = upper(trim(p_code))
    AND ic.is_active = true
    AND ic.use_count < ic.max_uses
    AND (ic.expires_at IS NULL OR ic.expires_at > now());

  IF v_result IS NULL THEN
    RETURN jsonb_build_object('valid', false);
  END IF;

  RETURN v_result;
END;
$$;

-- 2. Create security-definer function to redeem invite code
CREATE OR REPLACE FUNCTION public.redeem_invite_code(p_code text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.invite_codes
  SET use_count = use_count + 1,
      used_at = now()
  WHERE code = upper(trim(p_code))
    AND is_active = true
    AND use_count < max_uses
    AND (expires_at IS NULL OR expires_at > now());

  RETURN FOUND;
END;
$$;

-- 3. Create security-definer function to check app registration flags
CREATE OR REPLACE FUNCTION public.check_registration_flags()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_invite_only boolean := false;
  v_reg_disabled boolean := false;
BEGIN
  SELECT true INTO v_invite_only
  FROM public.app_config
  WHERE invite_only = true
  LIMIT 1;

  SELECT true INTO v_reg_disabled
  FROM public.app_config
  WHERE registration_disabled = true
  LIMIT 1;

  RETURN jsonb_build_object(
    'invite_only', COALESCE(v_invite_only, false),
    'registration_disabled', COALESCE(v_reg_disabled, false)
  );
END;
$$;

-- 4. Drop dangerous anon policies on invite_codes
DROP POLICY IF EXISTS "Anon can read active invite codes" ON public.invite_codes;
DROP POLICY IF EXISTS "Anon can update invite code use count" ON public.invite_codes;

-- 5. Drop dangerous anon policy on app_config
DROP POLICY IF EXISTS "Anon can read config for invite check" ON public.app_config;

-- 6. Fix support_contacts: drop the overly permissive portal access policy
DROP POLICY IF EXISTS "Portal access via share token" ON public.support_contacts;

-- 7. Create a security-definer function for share token portal access
CREATE OR REPLACE FUNCTION public.get_support_contact_by_token(p_token text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'id', sc.id,
    'name', sc.name,
    'role', sc.role,
    'shared_sections', sc.shared_sections,
    'user_id', sc.user_id
  ) INTO v_result
  FROM public.support_contacts sc
  WHERE sc.share_token = p_token
    AND sc.is_active = true;

  RETURN v_result;
END;
$$;

-- 8. Grant execute on new functions to anon and authenticated
GRANT EXECUTE ON FUNCTION public.validate_invite_code(text) TO anon;
GRANT EXECUTE ON FUNCTION public.validate_invite_code(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.redeem_invite_code(text) TO anon;
GRANT EXECUTE ON FUNCTION public.redeem_invite_code(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_registration_flags() TO anon;
GRANT EXECUTE ON FUNCTION public.check_registration_flags() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_support_contact_by_token(text) TO anon;
GRANT EXECUTE ON FUNCTION public.get_support_contact_by_token(text) TO authenticated;