#!/bin/bash
# deploy-frontend.sh — Build and deploy the React frontend to /var/www/omar-smc
set -e

PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
FRONTEND_DIR="$PROJECT_ROOT/frontend"
WEB_ROOT="/var/www/omar-smc"

echo "⚛️  Frontend Deployment"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

cd "$FRONTEND_DIR"

# Copy production env
echo "→ Removing old .env and creating fresh one from .env.example.production..."
rm -f .env
cp .env.example.production .env
echo "  ✓ .env configured"

# Install dependencies
echo "→ Installing Node dependencies..."
npm install --prefer-offline
echo "  ✓ Dependencies installed"

# Build
echo "→ Building production bundle..."
npm run build
echo "  ✓ Build complete"

# Deploy
echo "→ Deploying to $WEB_ROOT..."
if [ ! -d "$WEB_ROOT" ]; then
    echo "  ❌ Web root $WEB_ROOT not found. Create it first: mkdir -p $WEB_ROOT"
    exit 1
fi
rsync -a --delete build/ "$WEB_ROOT/"
chown -R www-data:www-data "$WEB_ROOT/"
echo "  ✓ Frontend deployed"

# Reload nginx
echo "→ Reloading nginx..."
systemctl reload nginx
echo "  ✓ Nginx reloaded"

echo ""
echo "✅ Frontend deployment complete!"
echo "   URL: https://rmmdc.edu.bd"
