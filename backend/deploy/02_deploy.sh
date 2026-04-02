#!/bin/bash
# 코드 배포 스크립트 (업데이트할 때마다 실행)
# 로컬에서 실행: ./deploy/02_deploy.sh

set -e

INSTANCE_NAME="crypto-bot"
ZONE="us-central1-a"
LOCAL_DIR="$(cd "$(dirname "$0")/.." && pwd)"

echo "🚀 헬스로그 백엔드 배포 시작..."
echo "   로컬: $LOCAL_DIR"

echo "🔍 원격 사용자 확인 중..."
REMOTE_USER=$(gcloud compute ssh "$INSTANCE_NAME" --zone="$ZONE" --tunnel-through-iap --command="whoami" 2>/dev/null | tr -d '\r\n')
REMOTE_DIR="/home/$REMOTE_USER/health-logging"
echo "   원격: $INSTANCE_NAME:$REMOTE_DIR"

echo ""
echo "📤 코드 업로드 중..."
# macOS extended attributes 제외하고 tar 생성
COPYFILE_DISABLE=1 tar czf - \
  --exclude='__pycache__' \
  --exclude='*.pyc' \
  --exclude='.pytest_cache' \
  --exclude='.venv' \
  --exclude='*.db' \
  --exclude='*.log' \
  --exclude='deploy' \
  --no-xattrs \
  -C "$LOCAL_DIR" \
  app migrations requirements.txt alembic.ini \
| gcloud compute ssh "$INSTANCE_NAME" --zone="$ZONE" --tunnel-through-iap \
  --command="mkdir -p $REMOTE_DIR && tar xzf - -C $REMOTE_DIR"

echo "🔑 .env 파일 업로드 중..."
if [ -f "$LOCAL_DIR/.env" ]; then
  gcloud compute scp \
    --zone="$ZONE" --tunnel-through-iap \
    "$LOCAL_DIR/.env" \
    "$INSTANCE_NAME:$REMOTE_DIR/.env"
  gcloud compute ssh "$INSTANCE_NAME" --zone="$ZONE" --tunnel-through-iap \
    --command="chmod 600 $REMOTE_DIR/.env"
  echo "   .env 업로드 완료"
else
  echo "⚠️  .env 파일이 없습니다."
  exit 1
fi

echo "📦 Python 패키지 설치 중..."
gcloud compute ssh "$INSTANCE_NAME" --zone="$ZONE" --tunnel-through-iap --command="
  cd $REMOTE_DIR
  python3.11 -m venv venv
  source venv/bin/activate
  pip install -q --upgrade pip
  pip install -q -r requirements.txt
"

echo "🗄️  DB 마이그레이션 실행 중..."
gcloud compute ssh "$INSTANCE_NAME" --zone="$ZONE" --tunnel-through-iap --command="
  cd $REMOTE_DIR
  source venv/bin/activate
  alembic upgrade head
"

echo "⚙️  systemd 서비스 등록 중..."
SERVICE_CONTENT="[Unit]
Description=Health Logging AI Backend
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
User=$REMOTE_USER
WorkingDirectory=$REMOTE_DIR
EnvironmentFile=$REMOTE_DIR/.env
ExecStart=$REMOTE_DIR/venv/bin/uvicorn app.main:app --host 127.0.0.1 --port 8000
Restart=always
RestartSec=10
StandardOutput=append:$REMOTE_DIR/logs/service.log
StandardError=append:$REMOTE_DIR/logs/service_error.log

[Install]
WantedBy=multi-user.target"

echo "$SERVICE_CONTENT" | gcloud compute ssh "$INSTANCE_NAME" --zone="$ZONE" --tunnel-through-iap \
  --command="cat > /tmp/health-logging.service && sudo mv /tmp/health-logging.service /etc/systemd/system/health-logging.service"

gcloud compute ssh "$INSTANCE_NAME" --zone="$ZONE" --tunnel-through-iap --command="
  sudo systemctl daemon-reload
  sudo systemctl enable health-logging
  sudo systemctl restart health-logging
  sleep 3
  sudo systemctl status health-logging --no-pager
"

echo ""
echo "✅ 배포 완료!"
echo ""
echo "📋 유용한 명령어:"
echo "   로그 보기:   ./deploy/logs.sh"
echo "   상태 확인:   ./deploy/status.sh"
echo "   재시작:      gcloud compute ssh $INSTANCE_NAME --zone=$ZONE --tunnel-through-iap --command='sudo systemctl restart health-logging'"
