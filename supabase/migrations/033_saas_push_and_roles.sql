-- =============================================================================
-- Migration: 033_saas_push_and_roles.sql
-- Subsystem: Production SaaS Invites, Web Push & Officer Governance Hardening
-- Standard: S&P 500 Enterprise Fintech (ACID Sagas, Anti-SSRF, Trigger Guards)
-- Package: 1 — SaaS Community Invites, Officer Governance & Multi-Channel Push
-- Governing Specs:
--   - Package 1 Theoretical Solution Specification v2.0
--   - Baraza Protocol SAD §3.2 (Identity Lattice), §3.9 (Governance)
--   - Kenya Co-operative Societies Act (Cap 490B) — Secretary Role
--   - Kenya Data Protection Act 2019 §40 — Right to Erasure (ON DELETE CASCADE)
--   - W3C Push API & RFC 8291 / RFC 8292 — Message Encryption for Web Push
-- =============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- 0. Ensure auth.jwt() stub exists for local Docker PostgreSQL
--    (Supabase managed instances provide this natively; raw PG does not)
--    Wraps current_setting('request.jwt.claims') into JSONB, returning
--    empty object if the setting is absent (safe fallback for local dev).
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION auth.jwt()
RETURNS jsonb
LANGUAGE sql
STABLE
AS $$
  SELECT COALESCE(
    current_setting('request.jwt.claims', true)::jsonb,
    '{}'::jsonb
  );
$$;

-- ---------------------------------------------------------------------------
-- 1. Expand public.members role domain to include 'secretary'
--    (Kenya SACCO Societies Act: Secretary for minutes & membership registers)
--    Reference: 026_leverage_foundation.sql L88-89 original constraint
-- ---------------------------------------------------------------------------
ALTER TABLE public.members DROP CONSTRAINT IF EXISTS members_role_chk;
ALTER TABLE public.members ADD CONSTRAINT members_role_chk
    CHECK (role IN ('founder', 'admin', 'treasurer', 'secretary', 'member'));

-- ---------------------------------------------------------------------------
-- 2. Create public.user_push_subscriptions table
--    Polymorphic Identity (wallet_address | privy_did | user_profile_id)
--    ODPC Cascade: ON DELETE CASCADE on user_profile_id FK
--    Anti-SSRF: endpoint <= 2048 chars, RFC 8291 key bounds
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_push_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_profile_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    wallet_address TEXT,
    privy_did TEXT,
    endpoint TEXT NOT NULL UNIQUE,
    p256dh TEXT NOT NULL,
    auth TEXT NOT NULL,
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    -- At least one identity vector must be present
    CONSTRAINT chk_push_sub_identity CHECK (
        wallet_address IS NOT NULL OR privy_did IS NOT NULL OR user_profile_id IS NOT NULL
    ),
    -- RFC 8291 key bounds clamping & W3C Push API endpoint length ceiling
    CONSTRAINT chk_push_sub_keys_length CHECK (
        length(endpoint) <= 2048 AND
        length(p256dh) BETWEEN 64 AND 128 AND
        length(auth) BETWEEN 16 AND 48
    )
);

-- Indexes for polymorphic identity lookups & ODPC erasure queries
CREATE INDEX IF NOT EXISTS idx_push_subs_wallet ON public.user_push_subscriptions(wallet_address);
CREATE INDEX IF NOT EXISTS idx_push_subs_privy ON public.user_push_subscriptions(privy_did);
CREATE INDEX IF NOT EXISTS idx_push_subs_user ON public.user_push_subscriptions(user_profile_id);

-- Auto-update updated_at on row modification (consistent with user_profiles trigger in 032)
DROP TRIGGER IF EXISTS push_subs_set_updated_at ON public.user_push_subscriptions;
CREATE TRIGGER push_subs_set_updated_at
    BEFORE UPDATE ON public.user_push_subscriptions
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- RLS: Users can only manage their own push subscriptions
ALTER TABLE public.user_push_subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own push subscriptions" ON public.user_push_subscriptions;
CREATE POLICY "Users can manage their own push subscriptions"
    ON public.user_push_subscriptions
    FOR ALL
    USING (
      (wallet_address IS NOT NULL AND wallet_address = auth.jwt()->>'sub')
      OR (privy_did IS NOT NULL AND privy_did = auth.jwt()->>'sub')
      OR (user_profile_id IN (SELECT id FROM public.user_profiles WHERE wallet_address = auth.jwt()->>'sub'))
    )
    WITH CHECK (
      (wallet_address IS NOT NULL AND wallet_address = auth.jwt()->>'sub')
      OR (privy_did IS NOT NULL AND privy_did = auth.jwt()->>'sub')
      OR (user_profile_id IN (SELECT id FROM public.user_profiles WHERE wallet_address = auth.jwt()->>'sub'))
    );

-- Service role bypass for background notification dispatch
DROP POLICY IF EXISTS "service_role_all_push_subs" ON public.user_push_subscriptions;
CREATE POLICY "service_role_all_push_subs" ON public.user_push_subscriptions TO service_role USING (true) WITH CHECK (true);

-- ---------------------------------------------------------------------------
-- 3. Atomic Invite Acceptance Stored Procedure
--    Zero-TOCTOU: SELECT ... FOR UPDATE OF ci serializes concurrent redeemers
--    Zero Partial Failure: All mutations in single PL/pgSQL function block
--    Invariant I-INV-1: Capacity Conservation
--    Invariant I-INV-2: Idempotent Re-Entrance (already-member short-circuit)
--    search_path pinned to public (anti-schema-hijacking, audit F-PD-07)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.accept_community_invite_atomic(
    p_code TEXT,
    p_member_id TEXT,
    p_auth_user_id TEXT,
    p_wallet_address TEXT
)
RETURNS TABLE (
    success BOOLEAN,
    community_id TEXT,
    community_name TEXT,
    role TEXT,
    already_member BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_invite RECORD;
    v_comm RECORD;
    v_existing RECORD;
BEGIN
    -- Step 1: Check if caller is already a member in this community
    -- Deliberately does NOT filter activation_status — prevents circumventing
    -- a suspension/revocation by re-joining via invite (security-positive design)
    SELECT m.member_id, m.role INTO v_existing
    FROM public.members m
    JOIN public.community_invites ci ON ci.community_id = m.community_id
    WHERE ci.code = p_code
      AND (m.auth_user_id = p_auth_user_id OR m.wallet_address = p_wallet_address)
    LIMIT 1;

    IF v_existing.member_id IS NOT NULL THEN
        SELECT c.id, c.name INTO v_comm
        FROM public.communities c
        JOIN public.community_invites ci ON ci.community_id = c.id
        WHERE ci.code = p_code;

        RETURN QUERY SELECT true, v_comm.id, v_comm.name, v_existing.role, true;
        RETURN;
    END IF;

    -- Step 2: Lock invite row FOR UPDATE and check parent community status
    -- The FOR UPDATE OF ci acquires an exclusive row lock, serializing all
    -- concurrent redemption attempts into a strict total order (Theorem 1)
    SELECT ci.*, c.name AS comm_name, c.status AS comm_status
    INTO v_invite
    FROM public.community_invites ci
    JOIN public.communities c ON c.id = ci.community_id
    WHERE ci.code = p_code
    FOR UPDATE OF ci;

    IF v_invite.code IS NULL THEN
        RAISE EXCEPTION 'INVITE_NOT_FOUND' USING ERRCODE = 'P0002';
    END IF;

    IF v_invite.comm_status != 'active' AND v_invite.comm_status != 'ACTIVE' THEN
        RAISE EXCEPTION 'COMMUNITY_NOT_ACTIVE' USING ERRCODE = '22023';
    END IF;

    IF v_invite.expires_at <= now() THEN
        RAISE EXCEPTION 'INVITE_EXPIRED' USING ERRCODE = '22023';
    END IF;

    IF v_invite.uses_count >= v_invite.max_uses THEN
        RAISE EXCEPTION 'INVITE_CAPACITY_EXHAUSTED' USING ERRCODE = '22023';
    END IF;

    -- Step 3: Atomic state transitions inside single transaction boundary
    -- All three writes commit or roll back together (Theorem 2)
    UPDATE public.community_invites
    SET uses_count = uses_count + 1
    WHERE code = p_code;

    INSERT INTO public.members (
        member_id, community_id, auth_user_id, wallet_address, role, activation_status
    ) VALUES (
        p_member_id, v_invite.community_id, p_auth_user_id, p_wallet_address, 'member', 'active'
    );

    -- Atomically increment community member_count (audit remediation)
    UPDATE public.communities
    SET member_count = COALESCE(member_count, 0) + 1
    WHERE id = v_invite.community_id;

    -- Immutable audit trail for regulatory compliance
    INSERT INTO public.community_audit_logs (
        community_id, actor_wallet, action_type, target_subject, details
    ) VALUES (
        v_invite.community_id, p_wallet_address, 'MEMBER_JOINED_VIA_INVITE', p_code,
        jsonb_build_object('invite_code', p_code, 'uses_count', v_invite.uses_count + 1, 'max_uses', v_invite.max_uses)
    );

    RETURN QUERY SELECT true, v_invite.community_id, v_invite.comm_name, 'member'::text, false;
END;
$$;

-- Principle of least privilege: revoke from public, grant only to required roles
REVOKE EXECUTE ON FUNCTION public.accept_community_invite_atomic FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.accept_community_invite_atomic TO anon, authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 4. Sole Admin Deadlock Guard Database Trigger
--    Binds to BEFORE UPDATE OR DELETE (audit fix: F-PD-03 deletion bypass)
--    Serializes via FOR UPDATE on parent community row (Theorem 3)
--    Invariant I-ROLE-2: |Admins| >= 1 under all concurrent interleavings
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.check_sole_admin_before_demotion()
RETURNS TRIGGER AS $$
DECLARE
    v_admin_count INT;
    v_target_comm_id TEXT;
BEGIN
    IF TG_OP = 'DELETE' THEN
        IF OLD.role IN ('founder', 'admin') AND OLD.activation_status = 'active' THEN
            v_target_comm_id := OLD.community_id;

            -- Serialize admin changes on community row lock (Dijkstra's Resource Hierarchy)
            PERFORM 1 FROM public.communities WHERE id = v_target_comm_id FOR UPDATE;

            SELECT COUNT(*) INTO v_admin_count
            FROM public.members
            WHERE community_id = v_target_comm_id
              AND role IN ('founder', 'admin')
              AND activation_status = 'active'
              AND member_id != OLD.member_id;

            IF v_admin_count < 1 THEN
                RAISE EXCEPTION 'SOLE_ADMIN_DEADLOCK: Community must retain at least one active founder or administrator'
                    USING ERRCODE = '23514';
            END IF;
        END IF;
        RETURN OLD;
    ELSIF TG_OP = 'UPDATE' THEN
        IF (OLD.role IN ('founder', 'admin') AND NEW.role NOT IN ('founder', 'admin'))
           OR (OLD.activation_status = 'active' AND NEW.activation_status != 'active' AND OLD.role IN ('founder', 'admin')) THEN
            v_target_comm_id := OLD.community_id;

            -- Serialize admin changes on community row lock (Dijkstra's Resource Hierarchy)
            PERFORM 1 FROM public.communities WHERE id = v_target_comm_id FOR UPDATE;

            SELECT COUNT(*) INTO v_admin_count
            FROM public.members
            WHERE community_id = v_target_comm_id
              AND role IN ('founder', 'admin')
              AND activation_status = 'active'
              AND member_id != OLD.member_id;

            IF v_admin_count < 1 THEN
                RAISE EXCEPTION 'SOLE_ADMIN_DEADLOCK: Community must retain at least one active founder or administrator'
                    USING ERRCODE = '23514';
            END IF;
        END IF;
        RETURN NEW;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql
SET search_path = public;

DROP TRIGGER IF EXISTS trg_sole_admin_guard ON public.members;
CREATE TRIGGER trg_sole_admin_guard
BEFORE UPDATE OR DELETE ON public.members
FOR EACH ROW
EXECUTE FUNCTION public.check_sole_admin_before_demotion();

COMMIT;
