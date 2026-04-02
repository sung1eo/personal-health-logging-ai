#!/bin/bash
# 헬스로그 백엔드 로그 확인
# 로컬에서 실행: ./deploy/logs.sh

INSTANCE_NAME="crypto-bot"
ZONE="us-central1-a"

gcloud compute ssh "$INSTANCE_NAME" --zone="$ZONE" --tunnel-through-iap \
  --command="tail -f ~/health-logging/logs/service.log"
