#!/bin/bash
# backend-permissions-check-and-fix.sh
# Checks and fixes filesystem permissions so nginx (www-data) can serve media files
set -e

PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
BACKEND_DIR="$PROJECT_ROOT/backend"
MEDIA_DIR="$BACKEND_DIR/media"

echo "🔒 Backend Permissions Check & Fix"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# ── /root/ traversal permissions ──────────────────────────────────────────────
echo ""
echo "→ Checking /root/ traversal for nginx..."
ROOT_EXEC=$(stat -c "%a" /root/ 2>/dev/null || echo "000")
if [[ "$ROOT_EXEC" == *"5"* ]] || [[ "$ROOT_EXEC" == *"7"* ]] || (( (8#$ROOT_EXEC & 1) == 1 )); then
    echo "  ✓ /root/ already traversable"
else
    chmod o+x /root/
    echo "  ✓ Fixed: chmod o+x /root/"
fi

# ── Project directory traversal ───────────────────────────────────────────────
for DIR in "$PROJECT_ROOT" "$BACKEND_DIR" "$MEDIA_DIR"; do
    if [ -d "$DIR" ]; then
        PERM=$(stat -c "%a" "$DIR")
        echo "→ $DIR [permissions: $PERM]"
        chmod o+x "$DIR"
        echo "  ✓ Ensured o+x on $DIR"
    fi
done

# ── Media subdirectories — create if missing ───────────────────────────────────
echo ""
echo "→ Ensuring all media subdirectories exist..."
for SUBDIR in users notices results materials material_attachments admissions/logos admissions/backgrounds; do
    FULL="$MEDIA_DIR/$SUBDIR"
    mkdir -p "$FULL"
    chmod o+rx "$FULL"
    GITKEEP="$FULL/.gitkeep"
    [ -f "$GITKEEP" ] || touch "$GITKEEP"
    echo "  ✓ $MEDIA_DIR/$SUBDIR"
done

# ── Fix all existing media files ───────────────────────────────────────────────
echo ""
echo "→ Fixing permissions on existing media files..."
find "$MEDIA_DIR" -type f ! -name '.gitkeep' -exec chmod 644 {} \;
find "$MEDIA_DIR" -type d -exec chmod 755 {} \;
echo "  ✓ All media files: 644, directories: 755"

# ── Staticfiles ───────────────────────────────────────────────────────────────
STATIC_DIR="$BACKEND_DIR/staticfiles"
if [ -d "$STATIC_DIR" ]; then
    echo ""
    echo "→ Fixing staticfiles permissions..."
    chmod -R o+rx "$STATIC_DIR"
    echo "  ✓ Staticfiles readable by nginx"
fi

# ── Summary ───────────────────────────────────────────────────────────────────
echo ""
echo "✅ Permissions check complete!"
echo ""
echo "   Media root:     $MEDIA_DIR"
echo "   Gunicorn user:  root"
echo "   Nginx user:     www-data"
echo ""
echo "   Verify nginx can read a test file:"
echo "   sudo -u www-data ls $MEDIA_DIR"
