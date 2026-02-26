#!/bin/bash
# restart-backend.sh — Restart gunicorn and report status
set -e

echo "🔄 Restarting Backend (Gunicorn)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

systemctl restart gunicorn
sleep 2

STATUS=$(systemctl is-active gunicorn)
if [ "$STATUS" = "active" ]; then
    echo "✅ Gunicorn is running"
    echo ""
    systemctl status gunicorn --no-pager -n 10
else
    echo "❌ Gunicorn failed to start (status: $STATUS)"
    echo ""
    echo "Last 30 log lines:"
    journalctl -u gunicorn -n 30 --no-pager
    exit 1
fi
