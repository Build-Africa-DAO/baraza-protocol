#!/bin/bash
set -e

echo "==> Baraza Protocol: Applying PostgreSQL migrations in order..."

for file in $(ls -1 /docker-entrypoint-initdb.d/migrations/*.sql | sort); do
  echo "--> Applying migration: $(basename "$file")"
  psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" -f "$file"
done

echo "==> Granting schema privileges to PostgREST roles..."
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" << 'EOF'
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

-- Enforce strict role quarantine on CR-007 and sovereign auth subsystem tables
REVOKE ALL ON public.steward_mutations, public.payment_exceptions, public.artizen_settlement_ledger, public.auth_otp_challenges, public.auth_sessions, public.notification_outbox FROM anon, authenticated;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER ON public.artizen_campaigns FROM anon, authenticated;

DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
    EXECUTE format('DROP POLICY IF EXISTS "service_role_all_%I" ON %I;', r.tablename, r.tablename);
    EXECUTE format('CREATE POLICY "service_role_all_%I" ON %I TO service_role USING (true) WITH CHECK (true);', r.tablename, r.tablename);
  END LOOP;
END $$;
EOF

echo "==> Ensuring dedicated evolution database exists..."
psql --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" -tc "SELECT 1 FROM pg_database WHERE datname = 'evolution'" | grep -q 1 || psql --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" -c "CREATE DATABASE evolution;"

echo "==> All Baraza migrations, databases, and permissions applied successfully!"
