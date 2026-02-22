# Environment Files Cleanup Summary

## Changes Made

### Backend
- ✅ Renamed `.env.example.prod` → `.env.example.production`
- ✅ Updated both `.env.example.production` and `.env.example.local` with CORS documentation
- ✅ Added comments explaining `CORS_ALLOWED_ORIGINS` and `CSRF_TRUSTED_ORIGINS`
- ✅ Now only 2 env files: `.env.example.local` and `.env.example.production`

### Frontend
- ✅ Renamed `.env.example.prod` → `.env.example.production`
- ✅ Deleted temporary `.env.production` file
- ✅ Updated both `.env.example.production` and `.env.example.local` with comments
- ✅ Added `REACT_APP_BACKEND_URL` variable (for media files)
- ✅ Now only 2 env files: `.env.example.local` and `.env.example.production`

### Code Changes
- ✅ [frontend/src/services/api.js](frontend/src/services/api.js) - Uses `window.location.origin/api` as fallback (production-safe)
- ✅ [frontend/src/components/Avatar.js](frontend/src/components/Avatar.js) - Uses `window.location.origin` for media URLs

### Documentation
- ✅ Created [ENV_SETUP.md](ENV_SETUP.md) - Comprehensive guide for environment setup and CORS configuration

## Files Now in Repository

### Backend
```
backend/.env.example.local
backend/.env.example.production
```

### Frontend
```
frontend/.env.example.local
frontend/.env.example.production
```

## Deployment Instructions for Server

### 1. Pull the repository
```bash
cd /root/Omar-s-SMC
git pull origin main  # or your branch
```

### 2. Set up environment files

**Backend:**
```bash
# Remove old .env
rm -f backend/.env

# Copy production example
cp backend/.env.example.production backend/.env

# Edit with actual values (use vi or nano)
nano backend/.env
```

**Frontend:**
```bash
# Remove old .env
rm -f frontend/.env

# Copy production example
cp frontend/.env.example.production frontend/.env
```

### 3. Build and Deploy

**Backend:**
```bash
cd backend
source venv/bin/activate
pip install -r requirements.txt
python manage.py migrate --noinput
python manage.py collectstatic --noinput
deactivate
```

**Frontend:**
```bash
cd ../frontend
npm ci  # Clean install from package-lock.json
npm run build
```

### 4. Deploy frontend
```bash
# Deploy built files to web root
rsync -av --delete build/ /var/www/omar-smc/
```

### 5. Restart services
```bash
systemctl restart gunicorn
systemctl reload nginx
```

### 6. Verify
- Check gunicorn status: `systemctl status gunicorn`
- Check nginx status: `systemctl status nginx`
- View gunicorn logs: `journalctl -u gunicorn -n 50 -f`
- Visit https://rmmdc.edu.bd and check browser console for errors

## Important CORS Configuration

The backend checks if requests come from allowed origins:

**Backend (.env):**
```
CORS_ALLOWED_ORIGINS=https://rmmdc.edu.bd,https://www.rmmdc.edu.bd
```

**Frontend (.env):**
```
REACT_APP_API_URL=https://rmmdc.edu.bd/api
REACT_APP_BACKEND_URL=https://rmmdc.edu.bd
```

These must match for API calls to work. If they don't:
- Browser error: `ERR_BLOCKED_BY_CLIENT`
- Network tab shows request blocked
- Check backend `.env` for `CORS_ALLOWED_ORIGINS`
- Check frontend `.env` for `REACT_APP_API_URL`

## Media File Serving Configuration

The application serves user profile images, materials, and results files through the `/media/` endpoint.

### Development (Django serves media)
```bash
# In backend/.env
DEBUG=True
SERVE_MEDIA=True  # Django serves media in development
MODE=development
```

### Production (Nginx serves media)
In production, Nginx should serve media files directly for better performance:

**Backend (.env):**
```bash
DEBUG=False
SERVE_MEDIA=False  # Let Nginx serve media in production
MODE=production
```

**Nginx Configuration (add to your vhost config):**
```nginx
# Media files served by Nginx
location /media/ {
    alias /root/Omar-s-SMC/backend/media/;
    expires 30d;
}

# Django static files served by Nginx
location /django-static/ {
    alias /root/Omar-s-SMC/backend/staticfiles/;
    expires 30d;
}

# API proxy to Gunicorn
location /api/ {
    proxy_pass http://127.0.0.1:8000;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

### Frontend Avatar URLs
The Avatar component is smart about URL construction:
1. First tries `REACT_APP_API_URL` environment variable (e.g., `https://rmmdc.edu.bd/api`)
2. Falls back to `REACT_APP_BACKEND_URL` if set (e.g., `https://rmmdc.edu.bd`)
3. Finally uses `window.location.origin` as last resort

Backend API responses return relative URLs (e.g., `/media/users/avatar.jpg`). The Avatar component prepends the backend origin to make them absolute, allowing correct requests to Nginx at `/media/` endpoint.

## Testing CORS Headers

On the server, verify CORS headers are being sent:
```bash
curl -i -X OPTIONS https://rmmdc.edu.bd/api/notices/ \
  -H "Origin: https://rmmdc.edu.bd" \
  -H "Access-Control-Request-Method: GET" \
  -H "Access-Control-Request-Headers: Content-Type"
```

Should include response headers like:
```
Access-Control-Allow-Origin: https://rmmdc.edu.bd
Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS
Access-Control-Allow-Credentials: true
```

## Troubleshooting

### 401 Unauthorized on login
- Check email configuration in `backend/.env`
- Verify database connection

### 404 on media files
- Ensure `REACT_APP_BACKEND_URL` is set correctly in frontend `.env`
- Check `/root/Omar-s-SMC/backend/media/` permissions and file existence
- Verify Nginx alias is correct and points to actual media directory
- Ensure `SERVE_MEDIA=False` in backend `.env` (production)
- Check Nginx logs: `tail -f /var/log/nginx/error.log` for `open() "/root/Omar-s-SMC/backend/media/..." failed`

### API requests blocked (ERR_BLOCKED_BY_CLIENT)
- Disable adblock extensions for the domain
- Verify `CORS_ALLOWED_ORIGINS` includes your domain with https://
- Check browser console for specific CORS error message
- Restart gunicorn: `systemctl restart gunicorn`

### Manifest/icon 404
- Frontend references `public/logo192.png`
- Create the file or update `public/manifest.json` to remove reference
- Not critical for functionality
