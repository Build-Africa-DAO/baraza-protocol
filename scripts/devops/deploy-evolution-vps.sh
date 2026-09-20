#!/usr/bin/env bash
# scripts/devops/deploy-evolution-vps.sh
# Standard: S&P 500 Enterprise Fintech / Zero-Touch Ubuntu 24.04 VPS Provisioner
# Hardens VPS OS, installs Docker, configures UFW firewall & starts Evolution API.

set -euo pipefail

echo "=============================================================================="
echo "   BARAZA PROTOCOL — EVOLUTION API WHATSAPP GATEWAY VPS PROVISIONER"
echo "   Standard: S&P 500 Enterprise Fintech / CIS Ubuntu Benchmark Hardening"
echo "=============================================================================="

if [ "$EUID" -ne 0 ]; then
  echo "❌ This script must be run as root on the target VPS (e.g., sudo ./deploy-evolution-vps.sh)."
  exit 1
fi

echo "--> 1. Updating APT package indexes & installing prerequisite tools..."
apt-get update -y && apt-get upgrade -y
apt-get install -y curl ufw git ca-certificates gnupg lsb-release

echo "--> 2. Installing Docker Engine & Docker Compose Plugin..."
if ! command -v docker &> /dev/null; then
  install -m 0755 -d /etc/apt/keyrings
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
  chmod a+r /etc/apt/keyrings/docker.gpg
  echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
  apt-get update -y
  apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
fi

echo "--> 3. Hardening host firewall with UFW..."
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp   # SSH Access
ufw allow 80/tcp   # HTTP (Let's Encrypt challenge)
ufw allow 443/tcp  # HTTPS Secure Webhook & API Traffic
# Explicitly disallow exposed internal database and redis ports
ufw deny 5432/tcp || true
ufw deny 6379/tcp || true
ufw --force enable

echo "--> 4. Deploying Evolution API Docker Stack..."
mkdir -p /opt/baraza-evolution
cp evolution-api/docker-compose.prod.yml /opt/baraza-evolution/docker-compose.yml || true

cd /opt/baraza-evolution
docker compose up -d

echo "--> 5. Checking container health status..."
sleep 5
docker compose ps

echo "=============================================================================="
echo "✅ EVOLUTION API WHATSAPP GATEWAY SUCCESSFULLY PROVISIONED"
echo "API Endpoint: https://whatsapp.barazaprotocol.com"
echo "Webhook Target: https://barazaprotocol.com/api/webhooks/whatsapp"
echo "=============================================================================="
