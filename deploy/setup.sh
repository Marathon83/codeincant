#!/bin/bash
# ScriptForge AI — Server Setup Script
# Tested on Ubuntu 22.04 LTS. Run as root on a fresh VPS.
#
# Usage:
#   curl -fsSL https://raw.githubusercontent.com/Marathon83/scriptforge-ai/main/deploy/setup.sh | bash
#
# After this script:
#   1. Point your domain's A record to this server's IP
#   2. certbot --nginx -d yourdomain.com
#   3. Edit /opt/scriptforge/deploy/nginx.conf — replace yourdomain.com
#   4. Copy frontend build: rsync -av frontend/dist/ root@server:/opt/scriptforge/frontend/
#   5. systemctl start scriptforge && systemctl status scriptforge

set -euo pipefail

APP_DIR="/opt/scriptforge"
REPO="https://github.com/Marathon83/scriptforge-ai.git"

echo "=== [1/7] System update ==="
apt-get update -q && apt-get upgrade -y -q

echo "=== [2/7] Install system packages ==="
apt-get install -y -q git nginx certbot python3-certbot-nginx python3.11 python3.11-venv python3-pip

echo "=== [3/7] Install Docker ==="
if ! command -v docker &>/dev/null; then
    curl -fsSL https://get.docker.com | sh
fi

echo "=== [4/7] Create app user and directories ==="
id -u scriptforge &>/dev/null || useradd -r -s /usr/sbin/nologin scriptforge
usermod -aG docker scriptforge
mkdir -p "${APP_DIR}"/{backend,frontend,deploy}
chown -R scriptforge:scriptforge "${APP_DIR}"

echo "=== [5/7] Clone repo and install Python deps ==="
if [ ! -d "${APP_DIR}/.git" ]; then
    git clone "${REPO}" "${APP_DIR}" --depth 1
fi
python3.11 -m venv "${APP_DIR}/venv"
"${APP_DIR}/venv/bin/pip" install -q -r "${APP_DIR}/backend/requirements.txt"
chown -R scriptforge:scriptforge "${APP_DIR}/venv"

echo "=== [6/7] Pre-pull sandbox Docker images ==="
docker pull alpine:latest
docker pull python:3.12-alpine
docker pull node:20-alpine
docker pull ruby:3-alpine
echo "Images pulled."

echo "=== [7/7] Install systemd service and nginx config ==="
cp "${APP_DIR}/deploy/scriptforge.service" /etc/systemd/system/
systemctl daemon-reload
systemctl enable scriptforge

# Disable default nginx site
rm -f /etc/nginx/sites-enabled/default
cp "${APP_DIR}/deploy/nginx.conf" /etc/nginx/sites-available/scriptforge
ln -sf /etc/nginx/sites-available/scriptforge /etc/nginx/sites-enabled/scriptforge

echo ""
echo "======================================================"
echo " Setup complete. Next steps:"
echo ""
echo " 1. Set your domain's A record → $(curl -s ifconfig.me 2>/dev/null || echo '<this server IP>')"
echo " 2. Edit /etc/nginx/sites-available/scriptforge"
echo "    Replace 'yourdomain.com' with your actual domain"
echo " 3. nginx -t && systemctl reload nginx"
echo " 4. certbot --nginx -d yourdomain.com"
echo " 5. Build frontend on your dev machine:"
echo "    cd frontend && VITE_API_URL=https://yourdomain.com npm run build"
echo "    rsync -av dist/ root@<server-ip>:${APP_DIR}/frontend/"
echo " 6. systemctl start scriptforge"
echo " 7. curl https://yourdomain.com/health  # should return {\"status\":\"ok\"}"
echo "======================================================"
