#!/bin/bash

# Omar SMC - Deployment Script
# Usage: bash deploy.sh

set -e  # Exit on error

echo "🚀 Starting Omar SMC Deployment..."

# Verify we're in the right directory
if [ ! -d "backend" ] || [ ! -d "frontend" ]; then
    echo "❌ Error: backend/ and frontend/ directories not found"
    echo "Please run this script from the repository root"
    exit 1
fi

REPO_DIR=$(pwd)

# ============================================
# 1. SETUP ENVIRONMENT FILES
# ============================================
echo ""
echo "📝 Setting up environment files..."

# Backend
echo "  → Backend .env"
rm -f backend/.env
cp backend/.env.example.production backend/.env
echo "    ✓ Created backend/.env from .env.example.production"
echo "    ⚠️  REMEMBER: Edit backend/.env with actual production secrets!"

# Frontend
echo "  → Frontend .env"
rm -f frontend/.env
cp frontend/.env.example.production frontend/.env
echo "    ✓ Created frontend/.env from .env.example.production"

# ============================================
# 2. BACKEND BUILD
# ============================================
echo ""
echo "🔧 Building backend..."

cd "$REPO_DIR/backend"

# Activate virtual environment
if [ ! -d "venv" ]; then
    echo "❌ Error: virtual environment not found at backend/venv"
    echo "Please set up the virtual environment first"
    exit 1
fi

source venv/bin/activate

echo "  → Installing dependencies"
pip install -q -r requirements.txt
echo "    ✓ Dependencies installed"

echo "  → Running migrations"
python manage.py migrate --noinput
echo "    ✓ Migrations applied"

echo "  → Collecting static files"
python manage.py collectstatic --noinput --clear
echo "    ✓ Static files collected"

deactivate
echo "  → Virtual environment deactivated"

# ============================================
# 3. FRONTEND BUILD
# ============================================
echo ""
echo "🏗️  Building frontend..."

cd "$REPO_DIR/frontend"

echo "  → Cleaning npm cache and node_modules"
npm cache clean --force 2>/dev/null || true
find . -name node_modules -type d -exec rm -rf {} + 2>/dev/null || true
rm -f package-lock.json

echo "  → Installing dependencies"
npm install
echo "    ✓ Dependencies installed"

echo "  → Building production bundle"
npm run build
echo "    ✓ Production build completed"

# ============================================
# 4. DEPLOY FRONTEND
# ============================================
echo ""
echo "📦 Deploying frontend..."

WEB_ROOT="/var/www/omar-smc"

if [ ! -d "$WEB_ROOT" ]; then
    echo "❌ Error: Web root not found at $WEB_ROOT"
    exit 1
fi

echo "  → Syncing build/ to $WEB_ROOT/"
rsync -av --delete build/ "$WEB_ROOT/"
echo "    ✓ Frontend deployed"

# ============================================
# 5. RESTART SERVICES
# ============================================
echo ""
echo "🔄 Restarting services..."

echo "  → Restarting gunicorn"
systemctl restart gunicorn
sleep 2
if systemctl is-active --quiet gunicorn; then
    echo "    ✓ Gunicorn started"
else
    echo "    ❌ Gunicorn failed to start"
    echo "    Check logs: journalctl -u gunicorn -n 50"
    exit 1
fi

echo "  → Reloading nginx"
systemctl reload nginx
sleep 1
if systemctl is-active --quiet nginx; then
    echo "    ✓ Nginx reloaded"
else
    echo "    ❌ Nginx failed to reload"
    exit 1
fi

# ============================================
# 6. VERIFICATION
# ============================================
echo ""
echo "✅ Deployment Summary"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Frontend:"
echo "  Location: $WEB_ROOT"
echo "  Built at: $(date)"
echo ""
echo "Backend:"
echo "  Status:   $(systemctl is-active gunicorn)"
echo "  Socket:   /tmp/gunicorn.sock"
echo ""
echo "⚠️  IMPORTANT NEXT STEPS:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "1. Edit backend/.env with production secrets:"
echo "   nano backend/.env"
echo ""
echo "   REQUIRED FIELDS:"
echo "   - SECRET_KEY (generate new one)"
echo "   - DB_USER, DB_PASSWORD, DB_HOST (PostgreSQL credentials)"
echo "   - EMAIL_HOST_USER, EMAIL_HOST_PASSWORD"
echo "   - SSLCOMMERZ_STORE_ID, SSLCOMMERZ_STORE_PASSWORD"
echo "   - WEBPUSH_PUBLIC_KEY, WEBPUSH_PRIVATE_KEY"
echo ""
echo "2. Restart gunicorn after editing:"
echo "   systemctl restart gunicorn"
echo ""
echo "3. Verify API is working:"
echo "   curl https://rmmdc.edu.bd/api/notices/"
echo ""
echo "4. Test in browser:"
echo "   https://rmmdc.edu.bd"
echo "   Check browser console (F12) for errors"
echo ""
echo "✨ Deployment complete!"
echo ""
