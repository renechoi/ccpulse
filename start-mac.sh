#!/bin/bash
# Mac/Linux 실행 스크립트

echo "🚀 Starting CCPulse..."

# Node.js 확인
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed!"
    echo "Please install Node.js from https://nodejs.org"
    exit 1
fi

# npm 패키지 확인 및 설치
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# 실행
echo "✅ Launching application..."
npm start