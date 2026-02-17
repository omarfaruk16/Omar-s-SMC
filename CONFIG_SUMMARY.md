# ✅ Environment Configuration - Complete Summary

## What Was Done

### 1. ✅ Backend Environment Files
- **Renamed** `.env.example.prod` → `.env.example.production`
- **Kept only 2 example files:**
  - `backend/.env.example.local` - Development configuration
  - `backend/.env.example.production` - Production configuration
- **Enhanced** with CORS documentation and comments
- **Current .env files:** `.env`, `.env.example.local`, `.env.example.production`

### 2. ✅ Frontend Environment Files
- **Renamed** `.env.example.prod` → `.env.example.production`
- **Removed** temporary `.env.production` file I created
- **Kept only 2 example files:**
  - `frontend/.env.example.local` - Development configuration
  - `frontend/.env.example.production` - Production configuration
- **Added** `REACT_APP_BACKEND_URL` variable (for media files)
- **Current .env files:** `.env`, `.env.example.local`, `.env.example.production`

### 3. ✅ Frontend Code Updates (Production-Safe)

**File: [frontend/src/services/api.js](frontend/src/services/api.js)**
```javascript
// Now uses window.location.origin/api as fallback (production-safe)
// Won't hardcode localhost:8000 in production builds
const defaultApiBaseUrl = typeof window !== 'undefined'
  ? `${window.location.origin}/api`
  : 'http://localhost:8000/api';

export const API_BASE_URL = process.env.REACT_APP_API_URL || defaultApiBaseUrl;
```

**File: [frontend/src/components/Avatar.js](frontend/src/components/Avatar.js)**
```javascript
// Media URLs now use window.location.origin (production-safe)
const backendUrl = process.env.REACT_APP_BACKEND_URL || window.location.origin;
setCurrentImage(`${backendUrl}${image}`);
```

### 4. ✅ Documentation Created

#### [ENV_SETUP.md](ENV_SETUP.md)
- Complete environment setup guide
- Local vs Production configuration
- CORS explanation and troubleshooting
- Environment variables reference table
- Deployment checklist

#### [DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md)
- Detailed deployment instructions
- Before/after file structure
- Common troubleshooting section
- CORS testing commands

#### [deploy-production.sh](deploy-production.sh) ⭐
- Automated deployment script for production server
- One-line deployment: `bash deploy-production.sh`
- Handles all steps: env setup, backend build, frontend build, deployment, service restart
- With validation and error checking

#### [SERVER_COMMANDS.sh](SERVER_COMMANDS.sh)
- Quick reference for common server commands
- Manual step-by-step deployment
- Troubleshooting and log viewing commands

## Production CORS Fix

The original issue **ERR_BLOCKED_BY_CLIENT** was caused by:
1. ❌ Frontend hardcoding `http://localhost:8000` in production builds
2. ❌ Backend CORS not configured properly
3. ❌ Adblock blocking `localhost` requests

### ✅ Solution Implemented:
1. Frontend now uses `window.location.origin/api` as default
2. Frontend `.env.example.production` sets `REACT_APP_API_URL=https://rmmdc.edu.bd/api`
3. Backend `.env.example.production` sets `CORS_ALLOWED_ORIGINS=https://rmmdc.edu.bd,https://www.rmmdc.edu.bd`
4. Both configs ensure same-origin requests (no adblock issues)

## Server Deployment Instructions

### Quick Deploy (Recommended)
```bash
cd /root/Omar-s-SMC
bash deploy-production.sh
```

### Manual Deploy
```bash
# 1. Setup environments
cd /root/Omar-s-SMC
rm -f backend/.env frontend/.env
cp backend/.env.example.production backend/.env
cp frontend/.env.example.production frontend/.env

# 2. Edit backend/.env with secrets
nano backend/.env

# 3. Build backend
cd backend
source venv/bin/activate
pip install -r requirements.txt
python manage.py migrate --noinput
python manage.py collectstatic --noinput
deactivate

# 4. Build frontend
cd ../frontend
npm ci
npm run build

# 5. Deploy
rsync -av --delete build/ /var/www/omar-smc/

# 6. Restart services
systemctl restart gunicorn
systemctl reload nginx

# 7. Verify
curl https://rmmdc.edu.bd/api/notices/
```

## Backend `.env.example.production` Key Variables

```dotenv
# Security
SECRET_KEY=your-production-secret-key-here
DEBUG=False
ALLOWED_HOSTS=rmmdc.edu.bd,www.rmmdc.edu.bd,82.112.238.218

# CSRF & CORS (Critical for frontend)
CSRF_TRUSTED_ORIGINS=https://rmmdc.edu.bd,https://www.rmmdc.edu.bd
CORS_ALLOWED_ORIGINS=https://rmmdc.edu.bd,https://www.rmmdc.edu.bd
FRONTEND_BASE_URL=https://rmmdc.edu.bd

# Database (Production)
DB_USER=omar
DB_PASSWORD=omarsstrongpassword123
DB_NAME=smsp
DB_HOST=localhost
DB_PORT=5432

# Email & OTP
EMAIL_HOST=smtp.gmail.com
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password

# Payment Gateway (LIVE)
SSLCOMMERZ_SANDBOX=False
SSLCOMMERZ_STORE_ID=your_live_store_id
SSLCOMMERZ_STORE_PASSWORD=your_live_store_password

# Web Push
WEBPUSH_PUBLIC_KEY=your_public_key
WEBPUSH_PRIVATE_KEY=your_private_key
```

## Frontend `.env.example.production` Key Variables

```dotenv
# API Endpoint
REACT_APP_API_URL=https://rmmdc.edu.bd/api
REACT_APP_BACKEND_URL=https://rmmdc.edu.bd

# Payment Gateway (LIVE)
REACT_APP_SSLCOMMERZ_SANDBOX=false

# Payment Fees
REACT_APP_TESTIMONIAL_FEE_AMOUNT=3500
REACT_APP_ADMISSION_FORM_FEE_AMOUNT=3500
```

## Verification Commands

### Test API Connectivity
```bash
curl https://rmmdc.edu.bd/api/notices/
```

### Check CORS Headers
```bash
curl -I -X OPTIONS https://rmmdc.edu.bd/api/notices/ \
  -H "Origin: https://rmmdc.edu.bd" \
  -H "Access-Control-Request-Method: GET"
```

Response should include:
```
Access-Control-Allow-Origin: https://rmmdc.edu.bd
Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS
Access-Control-Allow-Credentials: true
```

### View Service Logs
```bash
# Gunicorn logs
journalctl -u gunicorn -n 50 -f

# Nginx logs
tail -f /var/log/nginx/error.log
tail -f /var/log/nginx/access.log
```

## Troubleshooting

### 1. ERR_BLOCKED_BY_CLIENT (CORS Error)
**Problem:** API requests blocked in production
**Cause:** 
- `CORS_ALLOWED_ORIGINS` doesn't include frontend domain
- Frontend using `http://localhost:8000` in production
- Adblock blocking requests

**Solution:**
```bash
# Verify backend .env
grep CORS_ALLOWED_ORIGINS backend/.env
# Should show: CORS_ALLOWED_ORIGINS=https://rmmdc.edu.bd,https://www.rmmdc.edu.bd

# Verify frontend .env
grep REACT_APP_API_URL frontend/.env
# Should show: REACT_APP_API_URL=https://rmmdc.edu.bd/api

# Restart gunicorn
systemctl restart gunicorn
```

### 2. Frontend returns 404 on media/logo
**Problem:** Avatar images and logo not loading
**Cause:** 
- Missing `REACT_APP_BACKEND_URL`
- Nginx not serving `/media/` path

**Solution:**
```bash
# Check frontend .env
grep REACT_APP_BACKEND_URL frontend/.env

# Verify nginx media alias
grep -A2 "location /media/" /etc/nginx/sites-enabled/omar-smc

# Should be: alias /root/Omar-s-SMC/backend/media/;
```

### 3. 401 Login Error
**Problem:** Login fails with 401
**Cause:** 
- Database not migrated
- Wrong credentials

**Solution:**
```bash
cd backend
source venv/bin/activate
python manage.py migrate --noinput
python manage.py createsuperuser
deactivate
systemctl restart gunicorn
```

### 4. Gunicorn Not Starting
**Problem:** `systemctl status gunicorn` shows failed
**Cause:**
- Missing dependencies
- Python syntax error
- Wrong working directory

**Solution:**
```bash
# Check logs
journalctl -u gunicorn -n 50

# Verify venv
ls /root/Omar-s-SMC/backend/venv/bin/activate

# Test Django
source /root/Omar-s-SMC/backend/venv/bin/activate
python /root/Omar-s-SMC/backend/manage.py check
deactivate
```

## Summary of Changes

✅ **Environment Files**
- Backend: 2 example files (local + production)
- Frontend: 2 example files (local + production)
- Removed old `.env.example.prod` and temporary files
- Added comprehensive CORS documentation

✅ **Frontend Code**
- Production-safe API base URL (uses `window.location.origin`)
- Production-safe media URLs (uses `window.location.origin`)
- No hardcoded localhost in production builds

✅ **Documentation**
- 4 comprehensive guides created
- Automated deployment script ready
- Troubleshooting section included
- CORS explanation and testing commands

✅ **CORS Configuration**
- Properly configured in backend settings.py
- Environment variables clearly documented
- Testing commands provided

## What To Do Next on Server

```bash
# 1. SSH into server
ssh root@82.112.238.218

# 2. Navigate to project
cd /root/Omar-s-SMC

# 3. Run automated deployment
bash deploy-production.sh

# 4. Edit backend/.env with secrets (prompted by script)
nano backend/.env

# 5. Restart gunicorn
systemctl restart gunicorn

# 6. Verify
curl https://rmmdc.edu.bd
```

---

**Status:** ✅ All configuration ready for production deployment  
**Date Updated:** February 17, 2026  
**Domain:** https://rmmdc.edu.bd  
**Server:** 82.112.238.218 (Ubuntu 24.04 LTS)
