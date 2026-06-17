#!/bin/bash
# deploy-backend.sh — Install deps, migrate, collectstatic, fix permissions, restart gunicorn
set -e

PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
BACKEND_DIR="$PROJECT_ROOT/backend"
SCRIPTS_DIR="$PROJECT_ROOT/user-scripts"

echo "🐍 Backend Deployment"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

cd "$BACKEND_DIR"

# ── Virtual environment ────────────────────────────────────────────────────────
if [ ! -d "venv" ]; then
    echo "→ Creating virtual environment..."
    python3 -m venv venv
    echo "  ✓ venv created"
fi
source venv/bin/activate
echo "→ Virtual environment activated"

# ── Environment file ──────────────────────────────────────────────────────────
if [ ! -f ".env" ]; then
    echo "→ No .env found — copying from .env.example.production as a starting template."
    echo "  ⚠️  Edit backend/.env and set real values before the app will start."
    cp .env.example.production .env
else
    echo "→ .env already exists — keeping it (not overwriting with template)."
fi

# ── System dependencies (WeasyPrint, Pillow) ──────────────────────────────────
echo "→ Installing system dependencies..."
apt-get install -y -q \
    libpango-1.0-0 libpangoft2-1.0-0 libharfbuzz-subset0 \
    libjpeg-dev libopenjp2-7-dev libxcb1 > /dev/null
echo "  ✓ System dependencies installed"

# ── Python packages ───────────────────────────────────────────────────────────
echo "→ Installing Python dependencies..."
pip install -q -r requirements.txt
echo "  ✓ Python dependencies installed"

# ── Django setup ──────────────────────────────────────────────────────────────
echo "→ Running database migrations..."
python manage.py migrate --noinput
echo "  ✓ Migrations complete"

echo "→ Collecting static files..."
python manage.py collectstatic --noinput --clear
echo "  ✓ Static files collected"

deactivate

# ── Fix permissions ────────────────────────────────────────────────────────────
echo "→ Fixing media/static permissions..."
bash "$SCRIPTS_DIR/backend-permissions-check-and-fix.sh"

# ── Restart gunicorn ──────────────────────────────────────────────────────────
echo "→ Restarting gunicorn..."
systemctl restart gunicorn
sleep 2

if systemctl is-active --quiet gunicorn; then
    echo "  ✓ Gunicorn running"
else
    echo "  ❌ Gunicorn failed to start"
    echo "  Check logs: journalctl -u gunicorn -n 50"
    exit 1
fi

echo ""
echo "✅ Backend deployment complete!"
echo "   API base: https://rmmdc.edu.bd/api/"
echo "   Health:   https://rmmdc.edu.bd/health/"
