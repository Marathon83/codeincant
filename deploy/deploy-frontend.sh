#!/bin/bash
# Deploy frontend to Oracle Cloud server.
# Run from the repo root on your local machine.
#
# Usage:
#   bash deploy/deploy-frontend.sh
#
# Requires: SSH key at ~/Downloads/ssh-key-2026-05-31.key

set -euo pipefail

SSH_KEY="$HOME/Downloads/ssh-key-2026-05-31.key"
SSH_USER="ubuntu"
SERVER="141.148.33.110"
REMOTE_DIST="/opt/scriptforge/frontend/dist"
FRONTEND_DIR="$(dirname "$0")/../frontend"

echo "==> Building frontend..."
cd "$FRONTEND_DIR"
VITE_API_URL=https://codeincant.dev npm run build

echo "==> Syncing dist to server..."
# Trailing slash on source copies contents, not the directory itself —
# avoids nesting if the destination already exists.
rsync -av --delete dist/ "${SSH_USER}@${SERVER}:${REMOTE_DIST}/" \
  -e "ssh -i ${SSH_KEY}"

echo "==> Reloading nginx..."
ssh -i "$SSH_KEY" "${SSH_USER}@${SERVER}" "sudo systemctl reload nginx"

echo "==> Done. Live at https://codeincant.dev"
