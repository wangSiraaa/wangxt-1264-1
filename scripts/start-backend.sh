#!/bin/bash
set -e

cd "$(dirname "$0")/.."

echo "=== 启动后端 API 服务 ==="
cd backend/TeleConsult.Api

echo "还原 NuGet 包..."
dotnet restore

echo "编译项目..."
dotnet build --no-restore -c Debug

echo "启动后端服务 (http://localhost:5062)..."
echo "Swagger UI: http://localhost:5062/swagger"
dotnet run --no-build -c Debug
