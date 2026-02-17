#!/bin/bash
# Quick deployment commands for server

# Run full automated deployment:
bash deploy-production.sh

# OR manual steps:

# 1. Setup environments
cd /root/Omar-s-SMC
rm -f backend/.env frontend/.env
cp backend/.env.example.production backend/.env
cp frontend/.env.example.production frontend/.env

# 2. Edit production secrets (IMPORTANT!)
nano backend/.env
# Update: SECRET_KEY, DB_USER, DB_PASSWORD, EMAIL_*, SSLCOMMERZ_*, WEBPUSH_*

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

# 6. Restart
systemctl restart gunicorn
systemctl reload nginx

# 7. Verify
systemctl status gunicorn
systemctl status nginx
curl https://rmmdc.edu.bd/api/notices/ | head

# View logs:
journalctl -u gunicorn -n 50 -f
journalctl -u nginx -n 50 -f

# Test CORS:
curl -I -X OPTIONS https://rmmdc.edu.bd/api/notices/ \
  -H "Origin: https://rmmdc.edu.bd" \
  -H "Access-Control-Request-Method: GET"
