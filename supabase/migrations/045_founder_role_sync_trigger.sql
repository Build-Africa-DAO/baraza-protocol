-- 045_founder_role_sync_trigger.sql
-- Fix V16: Dynamic founder role assignment in sync_membership_to_member()

CREATE OR REPLACE FUNCTION public.sync_membership_to_member()
RETURNS trigger AS $$
DECLARE
  v_role text := 'member';
BEGIN
  -- If this member is the community creator, assign founder role
  IF EXISTS (
    SELECT 1 FROM public.communities
    WHERE id = NEW.community_id
      AND created_by = NEW.wallet_address
  ) THEN
    v_role := 'founder';
  END IF;

  INSERT INTO public.members (
    member_id,
    auth_user_id,
    community_id,
    phone_hash,
    wallet_address,
    role,
    activation_status,
    activation_payment_ref,
    activated_at,
    created_at,
    updated_at
  ) VALUES (
    NEW.member_id,
    COALESCE(NEW.user_id_hash, NEW.wallet_address),
    NEW.community_id,
    NEW.phone_hash,
    NEW.wallet_address,
    v_role,
    LOWER(NEW.status),
    NEW.payment_order_id,
    NEW.activated_at,
    COALESCE(NEW.joined_at, now()),
    now()
  )
  ON CONFLICT (member_id) DO UPDATE SET
    wallet_address = EXCLUDED.wallet_address,
    role = CASE 
      WHEN EXCLUDED.role = 'founder' OR public.members.role = 'founder' THEN 'founder' 
      ELSE EXCLUDED.role 
    END,
    activation_status = EXCLUDED.activation_status,
    activated_at = EXCLUDED.activated_at,
    phone_hash = COALESCE(EXCLUDED.phone_hash, public.members.phone_hash),
    updated_at = now();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
