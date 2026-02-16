#!/usr/bin/env bash
# exit on error
set -o errexit

# Note: WeasyPrint requires system libraries:
# apt-get install -y libpango-1.0-0 libpangoft2-1.0-0 libharfbuzz-subset0 libjpeg-dev libopenjp2-7-dev libxcb1

pip install -r requirements.txt

python manage.py collectstatic --no-input
python manage.py migrate
python create_admin.py
