# 🚀 Deployment Guide

## Part 1: Deploy Backend on Render

### Prerequisites
- GitHub account
- Render account (free tier available)
- Backend code pushed to GitHub

### Step 1: Prepare Backend for Deployment

1. **Update `requirements.txt`** (already done, but verify):
```txt
Django==4.2.0
djangorestframework==3.14.0
djangorestframework-simplejwt==5.2.2
django-cors-headers==4.0.0
psycopg2-binary==2.9.6
gunicorn==20.1.0
whitenoise==6.4.0
python-decouple==3.8
Pillow==10.0.0
```

2. **Create `build.sh` in backend folder**:
```bash
#!/usr/bin/env bash
# exit on error
set -o errexit

pip install -r requirements.txt

python manage.py collectstatic --no-input
python manage.py migrate
python create_admin.py
```

3. **Update `backend/config/settings.py`** for production:

Add at the top after imports:
```python
from decouple import config
import dj_database_url
```

Update these settings:
```python
# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = config('DEBUG', default=False, cast=bool)

ALLOWED_HOSTS = config('ALLOWED_HOSTS', default='localhost,127.0.0.1').split(',')

# Add your Render domain after deployment
# ALLOWED_HOSTS = ['your-app.onrender.com', 'localhost']

# Database
if DEBUG:
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': BASE_DIR / 'db.sqlite3',
        }
    }
else:
    DATABASES = {
        'default': dj_database_url.config(
            default=config('DATABASE_URL'),
            conn_max_age=600
        )
    }

# Static files (CSS, JavaScript, Images)
STATIC_URL = 'static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'

STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'

# Media files
MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

# Update CORS for production
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    # Add your Hostinger domain after deployment
    # "https://yourdomain.com",
]
```

4. **Update `backend/config/wsgi.py`**:
```python
import os
from django.core.wsgi import application as django_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

application = django_application
```

### Step 2: Push to GitHub

```bash
# In your project root
git init
git add .
git commit -m "Prepare for deployment"
git branch -M main
git remote add origin https://github.com/yourusername/school-sms.git
git push -u origin main
```

### Step 3: Deploy on Render

1. **Go to Render Dashboard**: https://dashboard.render.com/

2. **Create New PostgreSQL Database**:
   - Click "New +" → "PostgreSQL"
   - Name: `school-sms-db`
   - Region: Choose closest to your users
   - Plan: Free
   - Click "Create Database"
   - **Save the Internal Database URL** (you'll need this)

3. **Create Web Service**:
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Configure:
     * **Name**: `school-sms-backend`
     * **Region**: Same as database
     * **Branch**: `main`
     * **Root Directory**: `backend`
     * **Runtime**: `Python 3`
     * **Build Command**: `chmod +x build.sh && ./build.sh`
     * **Start Command**: `gunicorn config.wsgi:application`
     * **Plan**: Free

4. **Add Environment Variables**:
   Click "Environment" and add:
   ```
   DEBUG=False
   SECRET_KEY=your-super-secret-key-change-this-in-production
   DATABASE_URL=<paste-your-database-internal-url>
   ALLOWED_HOSTS=your-app.onrender.com,localhost
   DJANGO_SUPERUSER_USERNAME=admin
   DJANGO_SUPERUSER_EMAIL=admin@school.com
   DJANGO_SUPERUSER_PASSWORD=admin123
   ```

5. **Deploy**:
   - Click "Create Web Service"
   - Wait for deployment (5-10 minutes)
   - Your backend will be at: `https://your-app.onrender.com`

6. **Test Backend**:
   - Visit: `https://your-app.onrender.com/api/`
   - You should see the API root

### Step 4: Update Backend URL in Frontend

Update `frontend/src/services/api.js`:
```javascript
const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://your-app.onrender.com/api';
```

---

## Part 2: Deploy Frontend on Hostinger

### Step 1: Build Frontend for Production

1. **Create `.env.production` in frontend folder**:
```env
REACT_APP_API_URL=https://your-app.onrender.com/api
```

2. **Build the frontend**:
```bash
cd frontend
npm run build
```

This creates a `build` folder with optimized production files.

### Step 2: Prepare for Hostinger

Hostinger supports static sites. You'll upload the `build` folder contents.

### Step 3: Deploy to Hostinger

#### Option A: Using File Manager (Recommended for beginners)

1. **Login to Hostinger**:
   - Go to hPanel
   - Find your domain/website

2. **Access File Manager**:
   - Navigate to: `public_html` (or your domain folder)

3. **Upload Build Files**:
   - Delete default `index.html` if exists
   - Upload ALL contents from `frontend/build/` folder
   - Make sure these files are in root:
     * `index.html`
     * `static/` folder
     * `manifest.json`
     * etc.

4. **Configure `.htaccess`** (Important for React Router):
   Create `.htaccess` in `public_html`:
   ```apache
   <IfModule mod_rewrite.c>
     RewriteEngine On
     RewriteBase /
     RewriteRule ^index\.html$ - [L]
     RewriteCond %{REQUEST_FILENAME} !-f
     RewriteCond %{REQUEST_FILENAME} !-d
     RewriteCond %{REQUEST_FILENAME} !-l
     RewriteRule . /index.html [L]
   </IfModule>
   ```

#### Option B: Using FTP

1. **Get FTP Credentials**:
   - Hostinger hPanel → Files → FTP Accounts
   - Create or use existing FTP account

2. **Connect using FileZilla**:
   - Host: Your FTP hostname
   - Username: FTP username
   - Password: FTP password
   - Port: 21

3. **Upload Files**:
   - Navigate to `public_html`
   - Upload all contents from `frontend/build/`

4. **Create `.htaccess`** (same as above)

### Step 4: Update Backend CORS

Update your Render backend environment variables:
```
ALLOWED_HOSTS=your-app.onrender.com,yourdomain.com,www.yourdomain.com
```

Update CORS in `backend/config/settings.py`:
```python
CORS_ALLOWED_ORIGINS = [
    "https://yourdomain.com",
    "https://www.yourdomain.com",
]
```

Redeploy backend on Render.

---

## Part 3: Post-Deployment Steps

### 1. Test Everything

**Test Backend**:
```bash
curl https://your-app.onrender.com/api/
```

**Test Frontend**:
- Visit your Hostinger domain
- Try login: admin@school.com / admin123
- Check if it connects to backend

### 2. Create Admin User (if needed)

Connect to Render shell:
```bash
# In Render dashboard, go to Shell tab
python manage.py createsuperuser
```

### 3. Common Issues & Solutions

**Issue: Frontend can't connect to backend**
- Check CORS settings
- Verify API URL in frontend `.env.production`
- Check browser console for errors

**Issue: Static files not loading**
- Run: `python manage.py collectstatic`
- Check `STATIC_ROOT` in settings.py

**Issue: Database errors**
- Verify `DATABASE_URL` in Render
- Check database connection string

**Issue: React Router not working**
- Ensure `.htaccess` is properly configured
- Check mod_rewrite is enabled in Hostinger

---

## Quick Deployment Checklist

### Backend (Render)
- [ ] Update `requirements.txt`
- [ ] Create `build.sh`
- [ ] Update `settings.py` for production
- [ ] Push to GitHub
- [ ] Create PostgreSQL database on Render
- [ ] Create Web Service on Render
- [ ] Add environment variables
- [ ] Wait for deployment
- [ ] Test API endpoints

### Frontend (Hostinger)
- [ ] Create `.env.production` with backend URL
- [ ] Run `npm run build`
- [ ] Upload build files to Hostinger
- [ ] Create `.htaccess` for React Router
- [ ] Update backend CORS settings
- [ ] Test website functionality

---

## Maintenance

### Update Backend
```bash
# Make changes locally
git add .
git commit -m "Update backend"
git push
# Render will auto-deploy
```

### Update Frontend
```bash
cd frontend
npm run build
# Upload new build files to Hostinger
```

---

## Cost Estimate

**Render (Backend)**:
- Free tier: $0/month (with limitations)
- Paid: $7/month (recommended for production)

**Hostinger (Frontend)**:
- Single Shared Hosting: ~$2-3/month
- Premium Shared Hosting: ~$3-5/month

**Total**: ~$10-12/month for full deployment

---

## Support & Resources

- **Render Docs**: https://render.com/docs
- **Hostinger Support**: https://www.hostinger.com/tutorials
- **Django Deployment**: https://docs.djangoproject.com/en/4.2/howto/deployment/

Good luck with your deployment! 🚀
