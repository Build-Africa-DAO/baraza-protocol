-- A settled payment order is single-use. Wallet binding in the activation API
-- prevents replay during normal requests; this index is the database backstop.
CREATE UNIQUE INDEX IF NOT EXISTS memberships_payment_order_unique
  ON memberships (payment_order_id)
  WHERE payment_order_id IS NOT NULL;
