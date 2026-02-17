# Environment Configuration Guide

This guide explains how to set up environment variables for both backend and frontend applications.

## File Structure

Each project has two environment configuration examples:
- `.env.example.local` - Development/local configuration
- `.env.example.production` - Production configuration

## Backend Setup

### Local Development

1. Copy the local example to `.env`:
   ```bash
   cp backend/.env.example.local backend/.env
   ```

2. Edit `backend/.env` with your local values (if needed)

3. Key settings:
   - `DEBUG=True` - Enables Django debug mode
   - `MODE=development` - Sets development mode
   - `CORS_ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000` - Frontend origins
   - `DB_*` - Database credentials (update if using PostgreSQL locally)

### Production Deployment

1. Copy the production example to `.env`:
   ```bash
   cp backend/.env.example.production backend/.env
   ```

2. Edit `backend/.env` with actual production values:
   - `SECRET_KEY` - Generate a strong Django secret key
   - `ALLOWED_HOSTS` - Your production domain(s)
   - `CSRF_TRUSTED_ORIGINS` - Your frontend domain(s)
   - `CORS_ALLOWED_ORIGINS` - Your frontend domain(s) - **CRITICAL for API access**
   - `DB_*` - Production database credentials
   - `EMAIL_*` - Email configuration for notifications
   - `SSLCOMMERZ_*` - Payment gateway credentials

## Frontend Setup

### Local Development

1. Copy the local example to `.env`:
   ```bash
   cp frontend/.env.example.local frontend/.env
   ```

2. Key settings:
   - `REACT_APP_API_URL=http://localhost:8000/api` - Points to local backend
   - `REACT_APP_BACKEND_URL=http://localhost:8000` - For media/static files
   - `REACT_APP_SSLCOMMERZ_SANDBOX=true` - Use sandbox payment mode

### Production Deployment

1. Copy the production example to `.env`:
   ```bash
   cp frontend/.env.example.production frontend/.env
   ```

2. Edit `frontend/.env` with production values:
   - `REACT_APP_API_URL=https://rmmdc.edu.bd/api` - Your production API domain
   - `REACT_APP_BACKEND_URL=https://rmmdc.edu.bd` - Your production domain
   - `REACT_APP_SSLCOMMERZ_SANDBOX=false` - Use live payment mode

## CORS Configuration - Important!

**CORS (Cross-Origin Resource Sharing)** is critical for frontend-backend communication.

### What is CORS?

When your frontend makes API requests to the backend, browsers enforce the Same-Origin Policy. CORS headers tell the browser whether to allow these cross-origin requests.

### Configuration

**Backend** (`backend/.env`):
```
CORS_ALLOWED_ORIGINS=https://rmmdc.edu.bd,https://www.rmmdc.edu.bd
```

**Frontend** (`frontend/.env`):
```
REACT_APP_API_URL=https://rmmdc.edu.bd/api
```

The backend checks if the frontend's origin matches `CORS_ALLOWED_ORIGINS`. If not, the request is blocked with `ERR_BLOCKED_BY_CLIENT` error.

### Common Issues

1. **ERR_BLOCKED_BY_CLIENT** - Missing CORS headers
   - Solution: Ensure `CORS_ALLOWED_ORIGINS` includes your frontend domain
   - Frontend must use `REACT_APP_API_URL` pointing to the API endpoint

2. **Localhost with hardcoded production URL**
   - Don't hardcode `http://localhost:8000` in production builds
   - Frontend now uses `window.location.origin/api` as fallback
   - Always set `REACT_APP_API_URL` in production `.env`

3. **Media files returning 404**
   - Ensure `REACT_APP_BACKEND_URL` matches your backend domain
   - Avatar component constructs URLs like: `${REACT_APP_BACKEND_URL}/media/...`

## Deployment Checklist

### On Server

```bash
# Backend
cd /root/Omar-s-SMC
rm -f backend/.env
cp backend/.env.example.production backend/.env
# Edit backend/.env with actual production secrets

# Frontend
rm -f frontend/.env
cp frontend/.env.example.production frontend/.env

# Install dependencies and build
cd backend
source venv/bin/activate
pip install -r requirements.txt
python manage.py migrate --noinput
python manage.py collectstatic --noinput
deactivate

cd ../frontend
npm ci
npm run build

# Deploy frontend build
rsync -a --delete build/ /var/www/omar-smc/

# Restart services
systemctl restart gunicorn
systemctl reload nginx
```

### Verify

- ✅ Backend migrations applied
- ✅ Frontend build created and deployed to web root
- ✅ Gunicorn socket created at `/tmp/gunicorn.sock`
- ✅ Nginx serving frontend and proxying `/api/` requests
- ✅ CORS headers present in backend responses

Test with:
```bash
curl -H "Origin: https://rmmdc.edu.bd" \
  -H "Access-Control-Request-Method: GET" \
  -H "Access-Control-Request-Headers: Content-Type" \
  -X OPTIONS https://rmmdc.edu.bd/api/notices/ -v
```

Should return `Access-Control-Allow-Origin` in response headers.

## Environment Variables Reference

### Backend

| Variable | Local | Production | Purpose |
|----------|-------|------------|---------|
| `DEBUG` | `True` | `False` | Django debug mode |
| `MODE` | `development` | `production` | Application mode |
| `ALLOWED_HOSTS` | `localhost,127.0.0.1` | `rmmdc.edu.bd,www.rmmdc.edu.bd` | Allowed request hosts |
| `CORS_ALLOWED_ORIGINS` | `http://localhost:3000,...` | `https://rmmdc.edu.bd,...` | Allowed CORS origins |
| `DB_HOST` | `localhost` | `localhost` | Database server |
| `DB_NAME` | `smsp` | `smsp` | Database name |
| `SSLCOMMERZ_SANDBOX` | `True` | `False` | Payment gateway mode |

### Frontend

| Variable | Local | Production | Purpose |
|----------|-------|------------|---------|
| `REACT_APP_API_URL` | `http://localhost:8000/api` | `https://rmmdc.edu.bd/api` | API endpoint |
| `REACT_APP_BACKEND_URL` | `http://localhost:8000` | `https://rmmdc.edu.bd` | Backend base URL |
| `REACT_APP_SSLCOMMERZ_SANDBOX` | `true` | `false` | Payment gateway sandbox mode |

