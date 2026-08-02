#!/usr/bin/env bash
# One-command local setup for the real estate marketplace monorepo.
#
# Usage:
#   ./setup.sh              # fresh database via migrations + seed (default)
#   ./setup.sh --from-dump  # restore database-dump.sql instead
#
# Safe to re-run: DB user/database creation is skipped if they already
# exist, and env files are only copied if they aren't already there.
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT_DIR"

DB_NAME="marketplace_dev"
DB_USER="marketplace"
DB_PASSWORD="marketplace_dev"
FROM_DUMP=false
[[ "${1:-}" == "--from-dump" ]] && FROM_DUMP=true

info()  { printf '\n\033[1;34m▸ %s\033[0m\n' "$1"; }
ok()    { printf '  \033[1;32m✓\033[0m %s\n' "$1"; }
warn()  { printf '  \033[1;33m!\033[0m %s\n' "$1"; }

# ---------------------------------------------------------------------------
info "Checking prerequisites"

command -v node >/dev/null || { echo "Node.js not found — install Node 22.x first: https://nodejs.org"; exit 1; }
command -v npm  >/dev/null || { echo "npm not found (should ship with Node)"; exit 1; }
command -v psql >/dev/null || { echo "PostgreSQL client (psql) not found — install PostgreSQL 16.x first"; exit 1; }
ok "node $(node -v), npm $(npm -v), $(psql --version | head -1)"

# ---------------------------------------------------------------------------
info "Installing dependencies (npm workspaces — one install for all apps)"
npm install
ok "dependencies installed"

# ---------------------------------------------------------------------------
info "Setting up PostgreSQL database"

# How to reach an admin connection varies a lot by platform/install method:
#   - Windows / many installers: "postgres" role, password prompt
#   - Linux (apt/yum): peer auth — must run AS the "postgres" OS user
#   - macOS Homebrew: no password, ambient OS user is already a superuser
# Try each in turn and use whichever one actually connects.
PSQL_ADMIN=()
if psql -U postgres -c "SELECT 1" >/dev/null 2>&1; then
  PSQL_ADMIN=(psql -U postgres)
elif command -v sudo >/dev/null && sudo -u postgres psql -c "SELECT 1" >/dev/null 2>&1; then
  PSQL_ADMIN=(sudo -u postgres psql)
elif psql -c "SELECT 1" >/dev/null 2>&1; then
  PSQL_ADMIN=(psql)
else
  warn "Couldn't find a way to connect to PostgreSQL as an admin."
  echo "  Create the role and database manually, then re-run this script:"
  echo "    psql -U postgres -c \"CREATE USER ${DB_USER} WITH PASSWORD '${DB_PASSWORD}' CREATEDB;\""
  echo "    psql -U postgres -c \"CREATE DATABASE ${DB_NAME} OWNER ${DB_USER};\""
  echo "  (On Linux you may need: sudo -u postgres psql -c \"...\")"
  exit 1
fi

ROLE_EXISTS=$("${PSQL_ADMIN[@]}" -tAc "SELECT 1 FROM pg_roles WHERE rolname='${DB_USER}'" 2>/dev/null || echo "")
if [[ "$ROLE_EXISTS" == "1" ]]; then
  ok "role '${DB_USER}' already exists"
else
  "${PSQL_ADMIN[@]}" -c "CREATE USER ${DB_USER} WITH PASSWORD '${DB_PASSWORD}' CREATEDB;"
  ok "created role '${DB_USER}'"
fi

DB_EXISTS=$("${PSQL_ADMIN[@]}" -tAc "SELECT 1 FROM pg_database WHERE datname='${DB_NAME}'" 2>/dev/null || echo "")
if [[ "$DB_EXISTS" == "1" ]]; then
  ok "database '${DB_NAME}' already exists"
else
  "${PSQL_ADMIN[@]}" -c "CREATE DATABASE ${DB_NAME} OWNER ${DB_USER};"
  ok "created database '${DB_NAME}'"
fi

# ---------------------------------------------------------------------------
info "Configuring environment files"

copy_env() {
  local example="$1" target="$2"
  if [[ -f "$target" ]]; then
    ok "$target already exists, leaving it as-is"
  else
    cp "$example" "$target"
    ok "created $target"
  fi
}
copy_env apps/api/.env.example    apps/api/.env
copy_env apps/web/.env.example    apps/web/.env.local
copy_env apps/mobile/.env.example apps/mobile/.env

# ---------------------------------------------------------------------------
info "Preparing the database schema"
cd "$ROOT_DIR/apps/api"
npx prisma generate

# Schema always comes from migrations, whichever data path is chosen below —
# database-dump.sql is data-only (see database-dump.sql itself / LOCAL_SETUP.md).
npx prisma migrate deploy

if $FROM_DUMP; then
  if [[ ! -f "$ROOT_DIR/database-dump.sql" ]]; then
    echo "database-dump.sql not found at repo root — cannot restore from dump."
    exit 1
  fi
  PGPASSWORD="$DB_PASSWORD" psql -h localhost -U "$DB_USER" -d "$DB_NAME" -f "$ROOT_DIR/database-dump.sql"
  ok "restored database-dump.sql"
else
  npx prisma db seed
  ok "ran migrations + seed"
fi
cd "$ROOT_DIR"

# ---------------------------------------------------------------------------
info "Done — start the app in three separate terminals:"
echo "
  cd apps/api && npm run start:dev     # http://localhost:4000  (docs at /docs)
  npm run dev:web                      # http://localhost:3000
  npm run dev:mobile                   # Expo dev tools
"
info "Seeded login (password for all: DevPass123!)"
echo "
  Admin:    +920000000001
  Dealer:   +920000000002  (Ahmed — City Realty)
  Dealer:   +920000000003  (Sara — Prime Homes)
  Customer: +920000000004  (Bilal Khan)
"
echo "See LOCAL_SETUP.md for the full walkthrough and known limitations."
