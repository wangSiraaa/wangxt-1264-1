#!/bin/bash
set -e

cd "$(dirname "$0")/.."

echo "=== 启动前端 (真实 API 模式) ==="
echo "VITE_USE_MOCK=false"
echo "后端代理: http://localhost:5062"

export VITE_USE_MOCK=false
pnpm install
pnpm dev --port 5173
