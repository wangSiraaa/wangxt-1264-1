#!/bin/bash
set -e

cd "$(dirname "$0")/.."

echo "======================================="
echo "  SQL Server 回归验证脚本"
echo "======================================="
echo ""

SQL_SERVER="localhost"
SQL_PORT="1433"
SQL_USER="sa"
SQL_PASSWORD="YourStrong!Passw0rd"
SQL_DATABASE="TeleConsultDb"

echo "[1/5] 检查 SQL Server 连接..."
if command -v sqlcmd &> /dev/null; then
    SQLCMD="sqlcmd"
elif command -v /opt/mssql-tools/bin/sqlcmd &> /dev/null; then
    SQLCMD="/opt/mssql-tools/bin/sqlcmd"
else
    echo "警告: 未找到 sqlcmd 工具，跳过数据库直接验证"
    SQLCMD=""
fi

if [ -n "$SQLCMD" ]; then
    if $SQLCMD -S "$SQL_SERVER,$SQL_PORT" -U "$SQL_USER" -P "$SQL_PASSWORD" -Q "SELECT 1" > /dev/null 2>&1; then
        echo "✅ SQL Server 连接成功"
    else
        echo "❌ SQL Server 连接失败"
        exit 1
    fi

    echo ""
    echo "[2/5] 检查数据库是否存在..."
    if $SQLCMD -S "$SQL_SERVER,$SQL_PORT" -U "$SQL_USER" -P "$SQL_PASSWORD" -Q "SELECT name FROM sys.databases WHERE name = '$SQL_DATABASE'" 2>&1 | grep -q "$SQL_DATABASE"; then
        echo "✅ 数据库 $SQL_DATABASE 存在"
    else
        echo "⚠️  数据库 $SQL_DATABASE 不存在，后端启动时会自动创建"
    fi

    echo ""
    echo "[3/5] 检查核心表是否存在..."
    TABLES=("Organizations" "Users" "MedicalRecords" "ImagingIndexes" "Consultations" "Ambulances" "Beds" "Transfers" "AdmissionResults")
    for TABLE in "${TABLES[@]}"; do
        if $SQLCMD -S "$SQL_SERVER,$SQL_PORT" -U "$SQL_USER" -P "$SQL_PASSWORD" -d "$SQL_DATABASE" -Q "SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = '$TABLE'" 2>&1 | grep -q "1"; then
            echo "✅ 表 $TABLE 存在"
        else
            echo "⚠️  表 $TABLE 不存在，后端启动时会自动创建"
        fi
    done

    echo ""
    echo "[4/5] 检查种子数据..."
    if $SQLCMD -S "$SQL_SERVER,$SQL_PORT" -U "$SQL_USER" -P "$SQL_PASSWORD" -d "$SQL_DATABASE" -Q "SELECT COUNT(*) FROM Users" 2>&1 | grep -q "4"; then
        echo "✅ 种子数据已初始化 (4个用户)"
    else
        echo "⚠️  种子数据未初始化，后端启动时会自动创建"
    fi
fi

echo ""
echo "[5/5] 验证后端 API 健康状态..."
sleep 2

if command -v curl &> /dev/null; then
    if curl -s "http://localhost:5062/health" | grep -q "Healthy"; then
        echo "✅ 后端 API 健康"
    elif curl -s "http://localhost:5062/swagger" > /dev/null 2>&1; then
        echo "✅ 后端 API 运行中 (Swagger 可访问)"
    else
        echo "⚠️  后端 API 尚未启动"
    fi
fi

echo ""
echo "======================================="
echo "  验证完成"
echo "======================================="
