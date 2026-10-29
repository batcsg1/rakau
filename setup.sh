#!/usr/bin/env bash
# Sets up, builds and starts Rākau: the Django API (rakau_backend) and the Expo client (rakau_frontend).
#
# Usage:
#   ./setup.sh               install, migrate, seed species, type-check, then start both servers
#   ./setup.sh --setup-only  install, migrate, seed species and type-check without starting anything
#   ./setup.sh --check       also run the API tests and both linters before starting
#
# Safe to re-run: existing .env files and the virtual environment are reused, never overwritten.

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$ROOT_DIR/rakau_backend"
FRONTEND_DIR="$ROOT_DIR/rakau_frontend"

API_HOST="0.0.0.0"
API_PORT="8000"
API_URL="http://127.0.0.1:$API_PORT/api"
EXPO_PORT="8081"
API_STARTUP_TIMEOUT_SECONDS=30

SETUP_ONLY=false
RUN_CHECKS=false

for arg in "$@"; do
  case "$arg" in
    --setup-only) SETUP_ONLY=true ;;
    --check) RUN_CHECKS=true ;;
    -h | --help)
      sed -n '2,9p' "${BASH_SOURCE[0]}" | sed 's/^# \{0,1\}//'
      exit 0
      ;;
    *)
      echo "Unknown option: $arg (see --help)" >&2
      exit 1
      ;;
  esac
done

step() { printf '\n\033[1;32m==> %s\033[0m\n' "$1"; }
fail() {
  printf '\033[1;31mError:\033[0m %s\n' "$1" >&2
  exit 1
}

require_command() {
  command -v "$1" >/dev/null 2>&1 || fail "$1 is required but was not found on your PATH."
}

# ---------------------------------------------------------------------------
# Prerequisites
# ---------------------------------------------------------------------------

step "Checking prerequisites"

if command -v python3 >/dev/null 2>&1; then
  PYTHON=python3
elif command -v python >/dev/null 2>&1; then
  PYTHON=python
else
  fail "Python 3 is required but was not found on your PATH."
fi
require_command node
require_command npm

echo "$($PYTHON --version), Node $(node --version), npm $(npm --version)"

# ---------------------------------------------------------------------------
# Backend
# ---------------------------------------------------------------------------

step "Backend: virtual environment and dependencies"

cd "$BACKEND_DIR"
[ -d venv ] || "$PYTHON" -m venv venv

# venv/Scripts on Windows (Git Bash), venv/bin everywhere else
if [ -d venv/Scripts ]; then
  VENV_PYTHON="$BACKEND_DIR/venv/Scripts/python"
else
  VENV_PYTHON="$BACKEND_DIR/venv/bin/python"
fi

"$VENV_PYTHON" -m pip install --quiet --upgrade pip
"$VENV_PYTHON" -m pip install --quiet -r requirements.txt

step "Backend: environment variables"

if [ -f .env ]; then
  echo "Using existing rakau_backend/.env"
else
  secret_key="$("$VENV_PYTHON" -c 'import secrets; print(secrets.token_urlsafe(50))')"
  cat >.env <<EOF
DJANGO_SECRET_KEY=$secret_key
DJANGO_DEBUG=True
DJANGO_ALLOWED_HOSTS=localhost,127.0.0.1,10.0.2.2
DJANGO_CORS_ALLOWED_ORIGINS=http://localhost:$EXPO_PORT,http://127.0.0.1:$EXPO_PORT
EOF
  echo "Created rakau_backend/.env with local development defaults"
fi

step "Backend: database migrations"

"$VENV_PYTHON" manage.py migrate --no-input

step "Backend: species catalogue"

"$VENV_PYTHON" -m seeding

step "Backend: system checks"

"$VENV_PYTHON" manage.py check

if [ "$RUN_CHECKS" = true ]; then
  step "Backend: lint and tests"
  "$VENV_PYTHON" -m ruff check .
  "$VENV_PYTHON" -m ruff format --check .
  "$VENV_PYTHON" manage.py test
fi

# ---------------------------------------------------------------------------
# Frontend
# ---------------------------------------------------------------------------

step "Frontend: dependencies"

cd "$FRONTEND_DIR"
npm install --no-audit --no-fund

step "Frontend: environment variables"

if [ -f .env ]; then
  echo "Using existing rakau_frontend/.env"
else
  echo "EXPO_PUBLIC_API_URL=$API_URL" >.env
  echo "Created rakau_frontend/.env pointing at $API_URL"
  echo "(On a physical device, change it to http://<your-LAN-IP>:$API_PORT/api)"
fi

step "Frontend: type check"

npm run --silent typecheck

if [ "$RUN_CHECKS" = true ]; then
  step "Frontend: lint and formatting"
  npm run --silent lint
  npm run --silent format:check
fi

if [ "$SETUP_ONLY" = true ]; then
  step "Setup complete"
  echo "Run ./setup.sh again (without --setup-only) to start the API and the Expo dev server."
  exit 0
fi

# ---------------------------------------------------------------------------
# Start both servers
# ---------------------------------------------------------------------------

step "Starting the API on http://127.0.0.1:$API_PORT"

cd "$BACKEND_DIR"
"$VENV_PYTHON" manage.py runserver "$API_HOST:$API_PORT" &
API_PID=$!

# Stop the API (and runserver's autoreload child) when Expo exits or the script is interrupted
stop_api() {
  pkill -P "$API_PID" 2>/dev/null || true
  kill "$API_PID" 2>/dev/null || true
}
trap stop_api EXIT
trap 'exit 130' INT
trap 'exit 143' TERM

waited=0
until "$VENV_PYTHON" -c "import urllib.request as r; r.urlopen('$API_URL/trees/', timeout=1)" 2>/dev/null; do
  kill -0 "$API_PID" 2>/dev/null || fail "The API failed to start; see the output above."
  [ "$waited" -lt "$API_STARTUP_TIMEOUT_SECONDS" ] || fail "The API didn't respond within ${API_STARTUP_TIMEOUT_SECONDS}s."
  sleep 1
  waited=$((waited + 1))
done

step "Starting the Expo dev server (press w for web, a for Android, i for iOS; Ctrl+C stops both)"

cd "$FRONTEND_DIR"
npx expo start --port "$EXPO_PORT"
