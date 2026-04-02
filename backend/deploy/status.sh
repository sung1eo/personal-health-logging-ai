#!/bin/bash
# 헬스로그 백엔드 상태 확인
# 로컬에서 실행: ./deploy/status.sh

INSTANCE_NAME="crypto-bot"
ZONE="us-central1-a"

gcloud compute ssh "$INSTANCE_NAME" --zone="$ZONE" --tunnel-through-iap \
  --command="
    echo '=== 서비스 상태 ===' &&
    sudo systemctl status health-logging --no-pager &&
    echo '' &&
    echo '=== 헬스체크 ===' &&
    curl -s http://127.0.0.1:8000/health &&
    echo '' &&
    echo '=== 메모리 ===' &&
    free -h
  "
