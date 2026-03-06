#!/bin/bash
set -e

SERVICE_NAME="${1:-id-nav-chatbot}"
SOURCE_DIR="$(cd "$(dirname "$0")/.." && pwd)"
REMOTE_USER="ubuntu"
REMOTE_HOST="192.168.0.88"
REMOTE_DEST="/home/ubuntu/app/${SERVICE_NAME}"

ssh "${REMOTE_USER}@${REMOTE_HOST}" "mkdir -p ${REMOTE_DEST}"
rsync -avz --progress \
  --exclude='node_modules/' \
  --exclude='.git/' \
  --exclude='.env' \
  "${SOURCE_DIR}/" "${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_DEST}/"

echo "Deployed to ${REMOTE_HOST}:${REMOTE_DEST}"
