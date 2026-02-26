#!/bin/bash
# full-deploy.sh — Full production deployment: pull latest code, deploy backend + frontend
set -e

PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SCRIPTS_DIR="$PROJECT_ROOT/user-scripts"

echo "🚀 Full Production Deployment — Omar SMC"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Project root: $PROJECT_ROOT"
echo "Started at:   $(date)"
echo ""

# ── Verify we're in the right place ──────────────────────────────────────────
if [ ! -d "$PROJECT_ROOT/backend" ] || [ ! -d "$PROJECT_ROOT/frontend" ]; then
    echo "❌ backend/ or frontend/ directory not found in $PROJECT_ROOT"
    exit 1
fi

# ── Pull latest code ──────────────────────────────────────────────────────────
echo "── Step 1/3: Pull latest code ───────────────────────"
cd "$PROJECT_ROOT"
git pull
echo "  ✓ Code updated"
echo ""

# ── Deploy backend ────────────────────────────────────────────────────────────
echo "── Step 2/3: Deploy backend ──────────────────────────"
bash "$SCRIPTS_DIR/deploy-backend.sh"
echo ""

# ── Deploy frontend ────────────────────────────────────────────────────────────
echo "── Step 3/3: Deploy frontend ─────────────────────────"
bash "$SCRIPTS_DIR/deploy-frontend.sh"
echo ""

# ── Final health check ─────────────────────────────────────────────────────────
echo "── Health Check ──────────────────────────────────────"
sleep 2
HEALTH=$(curl -s -o /dev/null -w "%{http_code}" https://rmmdc.edu.bd/health/ 2>/dev/null || echo "unreachable")
API=$(curl -s -o /dev/null -w "%{http_code}" https://rmmdc.edu.bd/api/notices/ 2>/dev/null || echo "unreachable")

echo "   /health/       → HTTP $HEALTH"
echo "   /api/notices/  → HTTP $API"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Full deployment complete!"
echo "   Finished at: $(date)"
echo "   Site: https://rmmdc.edu.bd"
echo ""
echo "   If something looks wrong:"
echo "   → bash user-scripts/check-backend-logs.sh"
