#!/usr/bin/env bash
# 샛강역 id-nav MVP 배포 스크립트 (77 → 88 서버)
set -euo pipefail

REMOTE="databuilder@192.168.0.88"
REMOTE_DIR="/home/databuilder/app/id-nav-chatbot"
LOCAL_DIR="$(cd "$(dirname "$0")/../.." && pwd)"

echo "=== id-nav MVP 배포 시작 ==="

# 1. 원격 디렉토리 생성
ssh -i ~/.ssh/id_ed25519 "$REMOTE" "mkdir -p $REMOTE_DIR"

# 2. 소스 동기화 (node_modules 제외)
rsync -avz --exclude='node_modules' --exclude='.git' --exclude='*.log' \
  -e "ssh -i ~/.ssh/id_ed25519" \
  "$LOCAL_DIR/" "$REMOTE:$REMOTE_DIR/"

# 3. 원격에서 빌드 및 재시작
ssh -i ~/.ssh/id_ed25519 "$REMOTE" << 'REMOTE_SCRIPT'
  cd /home/databuilder/app/id-nav-chatbot
  docker compose pull db 2>/dev/null || true
  docker compose build api
  docker compose up -d
  docker compose ps
REMOTE_SCRIPT

echo "=== 배포 완료 ==="
