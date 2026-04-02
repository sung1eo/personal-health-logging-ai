#!/bin/bash
# VM 환경 초기화 스크립트 (최초 1회만 실행)
# 로컬에서 실행: ./deploy/01_setup_vm.sh

set -e

INSTANCE_NAME="crypto-bot"
ZONE="us-central1-a"

echo "🔧 VM 환경 설정 시작..."

SETUP_SCRIPT=$(cat << 'REMOTE_SCRIPT'
#!/bin/bash
set -e

echo "📦 시스템 패키지 업데이트..."
sudo apt-get update -q
sudo apt-get install -y software-properties-common curl git

echo "🐍 Python 3.11 설치 확인..."
if ! command -v python3.11 &> /dev/null; then
  sudo add-apt-repository -y ppa:deadsnakes/ppa
  sudo apt-get update -q
  sudo apt-get install -y python3.11 python3.11-venv python3.11-dev
fi

echo "📦 pip 확인..."
if ! command -v pip3 &> /dev/null; then
  curl -sS https://bootstrap.pypa.io/get-pip.py | sudo python3.11
fi

echo "📁 프로젝트 디렉토리 생성..."
mkdir -p ~/health-logging/logs

echo "✅ VM 환경 설정 완료!"
REMOTE_SCRIPT
)

gcloud compute ssh "$INSTANCE_NAME" \
  --zone="$ZONE" --tunnel-through-iap \
  --command="$SETUP_SCRIPT"

echo ""
echo "✅ 환경 설정 완료! 다음: ./deploy/02_deploy.sh"
