-- 010_fix_payment_orders_rls.sql
--
-- Keep payment_orders closed to anon clients. Payment status reads must go
-- through /api/payment-orders/status, which uses the service role key and
-- validates activation_secret_hash before returning safe order data.
-- activate.ts validates the same secret before mutating membership state.

DROP POLICY IF EXISTS "Payment orders are readable by exact order id" ON payment_orders;
DROP POLICY IF EXISTS "Payment orders are publicly readable" ON payment_orders;

CREATE POLICY "Payment orders are readable by exact order id"
  ON payment_orders FOR SELECT
  USING (false);
