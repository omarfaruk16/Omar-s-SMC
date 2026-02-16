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
    if [ -f ".env.example.prod" ]; then
        echo "⚠️ .env not found. Copying .env.example.prod to .env"
        cp .env.example.prod .env
        echo "⚠️ PLEASE UPDATE .env WITH YOUR ACTUAL SECRETS!"
    else
        echo "❌ Error: No .env file and no .env.example.prod found!"
        exit 1
    fi
fi

echo "Running migrations..."
python manage.py migrate

echo "Collecting static files..."
python manage.py collectstatic --no-input

echo "Creating/Updating admin user (securely)..."
python create_admin.py

echo "Restarting Gunicorn..."
sudo systemctl restart gunicorn

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

echo "Setting permissions..."
sudo chown -R www-data:www-data /var/www/omar-smc
# Also fix backend static/media permissions if needed
sudo chmod -R o+rx "$BACKEND_DIR/staticfiles/"
sudo chmod -R o+rx "$BACKEND_DIR/media/"

# 4. Final Restart
echo "🔄 Restarting Nginx..."
sudo systemctl restart nginx

echo "✅ Deployment completed successfully!"
echo "   Backend Service: $(systemctl is-active gunicorn)"
echo "   Nginx Service:   $(systemctl is-active nginx)"
