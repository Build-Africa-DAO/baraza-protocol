-- 046_fix_sole_admin_cascade_delete.sql
-- Fix V17: Bypass SOLE_ADMIN_DEADLOCK when parent community is being dropped or deleted

CREATE OR REPLACE FUNCTION public.check_sole_admin_before_demotion()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
    v_admin_count INT;
    v_target_comm_id TEXT;
BEGIN
    IF TG_OP = 'DELETE' THEN
        IF OLD.role IN ('founder', 'admin') AND OLD.activation_status = 'active' THEN
            v_target_comm_id := OLD.community_id;

            -- Serialize admin changes on community row lock (Dijkstra's Resource Hierarchy)
            PERFORM 1 FROM public.communities WHERE id = v_target_comm_id FOR UPDATE;
            IF NOT FOUND THEN
                -- Community row is already deleted (cascading community drop)
                RETURN OLD;
            END IF;

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
            IF NOT FOUND THEN
                RETURN NEW;
            END IF;

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
$function$;
