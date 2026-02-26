#!/bin/bash
# check-backend-logs.sh — Tail and inspect gunicorn + nginx logs
# Usage: bash check-backend-logs.sh [lines]

LINES="${1:-50}"

echo "📋 Backend Log Viewer"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Showing last $LINES lines. Pass a number to change: bash check-backend-logs.sh 100"
echo ""

# ── Service status ─────────────────────────────────────────────────────────────
echo "── Service Status ────────────────────────────────────"
echo "Gunicorn: $(systemctl is-active gunicorn)"
echo "Nginx:    $(systemctl is-active nginx)"
echo ""

# ── Gunicorn logs ─────────────────────────────────────────────────────────────
echo "── Gunicorn Logs (last $LINES lines) ────────────────"
journalctl -u gunicorn -n "$LINES" --no-pager
echo ""

# ── Nginx error log ───────────────────────────────────────────────────────────
echo "── Nginx Error Log (last $LINES lines) ──────────────"
if [ -f /var/log/nginx/error.log ]; then
    tail -n "$LINES" /var/log/nginx/error.log
else
    echo "  (no nginx error log found)"
fi
echo ""

# ── Nginx access log (last 20 API hits) ───────────────────────────────────────
echo "── Recent API Hits (nginx access log) ───────────────"
if [ -f /var/log/nginx/access.log ]; then
    grep "/api/" /var/log/nginx/access.log | tail -n 20
else
    echo "  (no nginx access log found)"
fi
