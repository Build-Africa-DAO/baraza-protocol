#!/usr/bin/env bash
# app/scripts/runCurlMasterAudit.sh
# Standard: S&P 500 Enterprise Fintech (System curl Execution & Audit Runner)
set -euo pipefail

echo "=========================================================================="
echo "          BARAZA PROTOCOL END-TO-END CURL AUDIT HARNESS                   "
echo "=========================================================================="
echo "Target 1: Live Docker Database & Gateway (http://127.0.0.1:54321)"
echo "Target 2: Multi-Rail Integration Emulator (http://127.0.0.1:9099)"
echo "Target 3: Core Backend API Bridge (http://127.0.0.1:4000)"
echo "=========================================================================="

SERVICE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoic2VydmljZV9yb2xlIiwiaXNzIjoic3VwYWJhc2UiLCJpYXQiOjE2MDAwMDAwMDAsImV4cCI6MjUwMDAwMDAwMH0.YEHFlsDyYXjxJ5oIZyJ6HuS62T6qaal7bGnWI5GxbRs"

echo ""
echo "--- [Phase 1: Direct Database Gateway curl Tests] ---"
echo "1.1 Checking communities table count via curl..."
curl -s -i "http://127.0.0.1:54321/rest/v1/communities?select=count" \
  -H "apikey: ${SERVICE_KEY}" \
  -H "Authorization: Bearer ${SERVICE_KEY}" | grep -E "HTTP/|count"

echo "1.2 Checking payment_orders table count via curl..."
curl -s -i "http://127.0.0.1:54321/rest/v1/payment_orders?select=count" \
  -H "apikey: ${SERVICE_KEY}" \
  -H "Authorization: Bearer ${SERVICE_KEY}" | grep -E "HTTP/|count"

echo "1.3 Checking compliance_alerts table count via curl..."
curl -s -i "http://127.0.0.1:54321/rest/v1/compliance_alerts?select=count" \
  -H "apikey: ${SERVICE_KEY}" \
  -H "Authorization: Bearer ${SERVICE_KEY}" | grep -E "HTTP/|count"

echo "1.4 Checking journal_entries table count via curl..."
curl -s -i "http://127.0.0.1:54321/rest/v1/journal_entries?select=count" \
  -H "apikey: ${SERVICE_KEY}" \
  -H "Authorization: Bearer ${SERVICE_KEY}" | grep -E "HTTP/|count"

echo ""
echo "--- [Phase 2: Comprehensive Automated curl Test Suite (Vitest + curl)] ---"
cd "$(dirname "$0")/.."
npx vitest run src/lib/__tests__/curlEndpointAuditSuite.test.ts

echo ""
echo "=========================================================================="
echo "               CURL ENDPOINT AUDIT COMPLETED SUCCESSFULLY                 "
echo "=========================================================================="
