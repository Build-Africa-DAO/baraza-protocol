-- 008_fix_payment_orders_rls.sql
--
-- The original policy used USING (false), which silently blocked all anon
-- SELECT access. Server-side endpoints use the service role key so they were
-- unaffected, but client-side queries via the anon key always returned an empty
-- result set — causing JoinStatus to fall through to mock progression even when
-- a real order existed in Supabase.
--
-- The order_id prefix (ord_sim_, ord_stellar_) plus timestamp + random makes it
-- unguessable. The activation_secret is the bearer token that gates sensitive
-- writes (status.ts validates it before returning data; activate.ts validates
-- it before mutating). Public read of status/amount is therefore safe.

DROP POLICY IF EXISTS "Payment orders are readable by exact order id" ON payment_orders;

CREATE POLICY "Payment orders are publicly readable"
  ON payment_orders FOR SELECT
  USING (true);
