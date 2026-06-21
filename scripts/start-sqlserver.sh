#!/bin/bash
set -e

echo "=== 启动 SQL Server 容器 ==="
CONTAINER_NAME="teleconsult-sqlserver"

if docker ps -a --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
    if docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
        echo "SQL Server 容器已在运行"
    else
        echo "启动已存在的 SQL Server 容器..."
        docker start ${CONTAINER_NAME}
    fi
else
    echo "创建并启动新的 SQL Server 容器..."
    docker run -d \
        --name ${CONTAINER_NAME} \
        -e "ACCEPT_EULA=Y" \
        -e "SA_PASSWORD=YourStrong!Passw0rd" \
        -p 1433:1433 \
        --restart unless-stopped \
        mcr.microsoft.com/mssql/server:2022-latest
fi

echo "等待 SQL Server 启动..."
for i in {1..30}; do
    if docker exec ${CONTAINER_NAME} /opt/mssql-tools/bin/sqlcmd \
        -S localhost -U sa -P "YourStrong!Passw0rd" \
        -Q "SELECT 1" > /dev/null 2>&1; then
        echo "SQL Server 已就绪"
        break
    fi
    echo "等待... ($i/30)"
    sleep 2
done

echo ""
echo "=== SQL Server 连接信息 ==="
echo "主机: localhost"
echo "端口: 1433"
echo "用户名: sa"
echo "密码: YourStrong!Passw0rd"
echo "数据库: TeleConsultDb"
echo ""
