#!/bin/bash
set -e

cd "$(dirname "$0")/.."

echo "======================================="
echo "  山区远程会诊转诊系统 - 完整启动"
echo "======================================="
echo ""

if command -v docker &> /dev/null; then
    echo "[1/3] 启动 SQL Server..."
    bash scripts/start-sqlserver.sh &
    SQLSERVER_PID=$!
    sleep 5
else
    echo "[1/3] 跳过 SQL Server (Docker 不可用)"
    echo "请确保本地 SQL Server 已运行在 localhost:1433"
    echo ""
fi

echo "[2/3] 启动后端 API..."
bash scripts/start-backend.sh &
BACKEND_PID=$!

echo "[3/3] 等待后端就绪..."
sleep 10

echo "启动前端..."
bash scripts/start-frontend.sh &
FRONTEND_PID=$!

echo ""
echo "======================================="
echo "  系统已启动！"
echo "======================================="
echo "前端: http://localhost:5173"
echo "后端: http://localhost:5062"
echo "Swagger: http://localhost:5062/swagger"
echo ""
echo "演示账号 (密码: 123456):"
echo "  doctor1  - 乡镇医生"
echo "  expert1  - 县医院专家"
echo "  coord1   - 转运协调员"
echo "  admin1   - 管理员"
echo ""
echo "按 Ctrl+C 停止所有服务"
echo "======================================="

trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" INT TERM
wait
