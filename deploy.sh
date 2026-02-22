#!/bin/bash

# Exit on any error
set -e

# Define project root
PROJECT_ROOT="$HOME/Omar-s-SMC"
BACKEND_DIR="$PROJECT_ROOT/backend"
FRONTEND_DIR="$PROJECT_ROOT/frontend"

echo "🚀 Starting deployment..."

# 1. Install System Dependencies (Required for WeasyPrint)
echo "📦 Installing system dependencies..."
sudo apt-get update
sudo apt-get install -y libpango-1.0-0 libpangoft2-1.0-0 libharfbuzz-subset0 libjpeg-dev libopenjp2-7-dev libxcb1

# 2. Backend Deployment
echo "🐍 Deploying Backend..."
cd "$BACKEND_DIR"

if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi

echo "Activating virtual environment..."
source venv/bin/activate

echo "Installing Python dependencies..."
pip install -r requirements.txt

# Ensure we have a .env file
if [ ! -f ".env" ]; then
    if [ -f ".env.example.production" ]; then
        echo "⚠️ .env not found. Copying .env.example.production to .env"
        cp .env.example.production .env
        echo "⚠️ PLEASE UPDATE .env WITH YOUR ACTUAL SECRETS!"
        echo "   Required variables:"
        echo "   - SECRET_KEY (generate with: python -c 'from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())')"
        echo "   - DEBUG=False"
        echo "   - SERVE_MEDIA=False (production uses Nginx for media)"
        echo "   - MODE=production"
        echo "   - CORS_ALLOWED_ORIGINS (your domain)"
        echo "   - CSRF_TRUSTED_ORIGINS (your domain)"
    else
        echo "❌ Error: No .env file and no .env.example.production found!"
        exit 1
    fi
fi

echo "Running migrations..."
python manage.py migrate

echo "Collecting static files..."
python manage.py collectstatic --no-input

echo "Creating/Updating admin user (securely)..."
python create_admin.py

echo "🔒 Fixing backend permissions for Nginx media serving..."
# Ensure media and static files are readable by Nginx (www-data)
sudo chmod -R 755 "$BACKEND_DIR/media/"
sudo chmod -R 755 "$BACKEND_DIR/staticfiles/"
sudo chown -R :www-data "$BACKEND_DIR/media/"
sudo chown -R :www-data "$BACKEND_DIR/staticfiles/"

echo "Restarting Gunicorn..."
sudo systemctl restart gunicorn

# Wait for Gunicorn to be ready
sleep 2

# 3. Frontend Deployment
echo "⚛️  Deploying Frontend..."
cd "$FRONTEND_DIR"

echo "Installing Node dependencies..."
npm install

echo "Building React app..."
npm run build

echo "Deploying build artifacts..."
# Clear old files and copy new build
sudo rm -rf /var/www/omar-smc/*
sudo cp -r build/* /var/www/omar-smc/

echo "Setting frontend permissions..."
sudo chown -R www-data:www-data /var/www/omar-smc/

# 4. Final Restart
echo "🔄 Restarting Nginx..."
sudo systemctl restart nginx

# 5. Health Check
echo ""
echo "⏳ Waiting for services to start..."
sleep 3

echo "✅ Deployment completed successfully!"
echo ""
echo "Service Status:"
echo "  Backend Service:  $(systemctl is-active gunicorn)"
echo "  Nginx Service:    $(systemctl is-active nginx)"
echo ""
echo "📋 Verification Steps:"
echo "  - Check backend logs: journalctl -u gunicorn -n 50"
echo "  - Check Nginx logs: tail -f /var/log/nginx/error.log"
echo "  - Test API: curl https://rmmdc.edu.bd/api/notices/"
echo "  - Test media serving: curl https://rmmdc.edu.bd/health/"
