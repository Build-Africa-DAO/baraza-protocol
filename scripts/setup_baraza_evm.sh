#!/usr/bin/env bash
# =============================================================================
# setup_baraza_evm.sh
#
# Clones BuilderOSS/nouns-protocol into contracts/evm and rebrands
# Nouns/Builder references to Baraza for the Baraza project.
#
# Usage:
#   chmod +x scripts/setup_baraza_evm.sh
#   ./scripts/setup_baraza_evm.sh
#
# Run from the root of the Baraza monorepo.
# =============================================================================

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

log() { echo -e "${CYAN}[baraza]${NC} $*"; }
success() { echo -e "${GREEN}[ok]${NC} $*"; }
warn() { echo -e "${YELLOW}[warn]${NC} $*"; }
error() { echo -e "${RED}[error]${NC} $*"; exit 1; }

REPO_URL="https://github.com/BuilderOSS/nouns-protocol.git"
TARGET_DIR="contracts/evm"

log "Running pre-flight checks..."

command -v git >/dev/null 2>&1 || error "git is not installed."
command -v sed >/dev/null 2>&1 || error "sed is not installed."
command -v find >/dev/null 2>&1 || error "find is not installed."
command -v grep >/dev/null 2>&1 || error "grep is not installed."

if [ ! -d ".git" ]; then
  error "Run this script from the Baraza repository root."
fi

if [ -d "$TARGET_DIR" ]; then
  error "'$TARGET_DIR' already exists. Move or remove it before running this script."
fi

success "Pre-flight checks passed."

log "Creating contracts directory structure..."
mkdir -p contracts/solana
mkdir -p contracts/stellar
success "Directory structure ready."

log "Cloning BuilderOSS/nouns-protocol into $TARGET_DIR ..."
log "The nouns-builder frontend is intentionally excluded."
git clone --depth 1 "$REPO_URL" "$TARGET_DIR"
success "Clone complete."

log "Removing upstream git history and origin..."
rm -rf "$TARGET_DIR/.git"
success "Upstream git metadata removed."

log "Running content rebrand: Nouns/Builder -> Baraza..."
log "Targeting: *.sol, *.ts, *.tsx, *.js, *.json, *.toml, *.txt, *.md"

if sed --version >/dev/null 2>&1; then
  SED_INPLACE=(sed -i)
else
  SED_INPLACE=(sed -i '')
fi

mapfile -t FILES < <(find "$TARGET_DIR" -type f \
  \( -name "*.sol" \
  -o -name "*.ts" \
  -o -name "*.tsx" \
  -o -name "*.js" \
  -o -name "*.json" \
  -o -name "*.toml" \
  -o -name "*.txt" \
  -o -name "*.md" \) \
  ! -path "*/node_modules/*" \
  ! -path "*/lib/*" \
  ! -path "*/out/*" \
  ! -path "*/cache/*" \
  ! -path "*/broadcast/*")

TOTAL=${#FILES[@]}
log "Found $TOTAL files to process."

CHANGED=0
for FILE in "${FILES[@]}"; do
  if grep -qE 'NounsBuilder|nounsBuilder|nouns_builder|NounsDAO|nounsDAO|NounsToken|nounsToken|Nouns|nouns|Builder|builder' "$FILE" 2>/dev/null; then
    "${SED_INPLACE[@]}" \
      -e 's/NounsBuilder/Baraza/g' \
      -e 's/nounsBuilder/baraza/g' \
      -e 's/nouns_builder/baraza/g' \
      -e 's/NounsDAO/BarazaDAO/g' \
      -e 's/nounsDAO/barazaDAO/g' \
      -e 's/NounsToken/BarazaToken/g' \
      -e 's/nounsToken/barazaToken/g' \
      -e 's/Nouns/Baraza/g' \
      -e 's/nouns/baraza/g' \
      -e 's/Builder/Baraza/g' \
      -e 's/builder/baraza/g' \
      "$FILE"
    CHANGED=$((CHANGED + 1))
  fi
done

success "Rebrand complete. Modified $CHANGED / $TOTAL files."

REMAPPINGS="$TARGET_DIR/remappings.txt"
if [ -f "$REMAPPINGS" ]; then
  warn "Review remappings.txt. Path-based entries may need manual correction:"
  echo ""
  cat "$REMAPPINGS"
  echo ""
fi

FOUNDRY_TOML="$TARGET_DIR/foundry.toml"
if [ -f "$FOUNDRY_TOML" ]; then
  log "foundry.toml after rebrand:"
  echo ""
  cat "$FOUNDRY_TOML"
  echo ""
fi

log "Scanning for high-signal leftover Nouns/Builder references..."
LEFTOVERS=$(grep -rn \
  --include="*.sol" --include="*.ts" --include="*.tsx" \
  --include="*.js" --include="*.json" --include="*.toml" \
  -E 'NounsBuilder|nounsBuilder|nouns_builder|NounsDAO|nounsDAO|NounsToken|nounsToken|BuilderDAO' \
  "$TARGET_DIR" 2>/dev/null || true)

if [ -n "$LEFTOVERS" ]; then
  warn "Leftover references found. Review manually:"
  echo ""
  echo "$LEFTOVERS"
  echo ""
else
  success "No high-signal NounsBuilder/NounsDAO/BuilderDAO leftovers found."
fi

warn "File and directory names are not renamed by this script. Review contract names and deployment scripts manually before deployment."

if command -v forge >/dev/null 2>&1; then
  log "forge detected. Running forge build..."
  (
    cd "$TARGET_DIR"
    forge build
  ) && success "forge build passed." || warn "forge build failed. Check imports, remappings, and renamed symbols before deploying."
else
  warn "forge not found in PATH. Install Foundry and run 'forge build' in $TARGET_DIR."
fi

echo ""
echo -e "${BOLD}${GREEN}Baraza EVM contracts setup complete.${NC}"
echo ""
echo -e "  ${CYAN}Repo cloned to:${NC}   $TARGET_DIR"
echo -e "  ${CYAN}Upstream origin:${NC}  removed"
echo -e "  ${CYAN}Branding:${NC}         Nouns/Builder -> Baraza"
echo ""
echo -e "${BOLD}Next steps:${NC}"
echo "  1. cd $TARGET_DIR"
echo "  2. Review remappings.txt and foundry.toml manually"
echo "  3. forge build"
echo "  4. forge test"
echo "  5. Update deployment scripts with Baraza RPC and wallet config"
echo "  6. Deploy to testnet"
echo "  7. Record deployed addresses in addresses/ and .env.local"
echo "  8. Transfer ownership to the Gnosis Safe after deploy"
