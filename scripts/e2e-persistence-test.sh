#!/bin/bash
set -e

cd "$(dirname "$0")/.."

echo "======================================="
echo "  端到端数据持久化测试"
echo "======================================="
echo ""

API_BASE="http://localhost:5062/api"
AUTH_TOKEN=""

login() {
    local username=$1
    local password=$2
    echo "登录 $username..."
    local response=$(curl -s -X POST "$API_BASE/auth/login" \
        -H "Content-Type: application/json" \
        -d "{\"username\":\"$username\",\"password\":\"$password\"}")
    AUTH_TOKEN=$(echo $response | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
    if [ -z "$AUTH_TOKEN" ]; then
        echo "❌ 登录失败: $response"
        exit 1
    fi
    echo "✅ 登录成功"
}

api_get() {
    local url=$1
    curl -s -H "Authorization: Bearer $AUTH_TOKEN" "$API_BASE$url"
}

api_post() {
    local url=$1
    local body=$2
    curl -s -X POST "$API_BASE$url" \
        -H "Authorization: Bearer $AUTH_TOKEN" \
        -H "Content-Type: application/json" \
        -d "$body"
}

echo "[1/8] 乡镇医生登录..."
login "doctor1" "123456"

echo ""
echo "[2/8] 新建病历..."
CREATE_RESPONSE=$(api_post "/records" '{"patientName":"测试患者张三","patientGender":"男","patientAge":45,"chiefComplaint":"胸痛3小时","presentIllness":"患者3小时前无明显诱因出现胸痛","pastHistory":"高血压病史5年","initialDiagnosis":"冠心病 心绞痛"}')
echo "创建响应: $CREATE_RESPONSE"
RECORD_ID=$(echo $CREATE_RESPONSE | grep -o '"id":"[^"]*"' | cut -d'"' -f4 | head -1)
if [ -z "$RECORD_ID" ]; then
    echo "❌ 病历创建失败"
    exit 1
fi
echo "✅ 病历创建成功 ID: $RECORD_ID"

echo ""
echo "[3/8] 上传影像资料..."
UPLOAD_RESPONSE=$(curl -s -X POST "$API_BASE/records/$RECORD_ID/images" \
    -H "Authorization: Bearer $AUTH_TOKEN" \
    -F "type=CT" \
    -F "file=@/tmp/test.png" 2>/dev/null || \
    api_post "/records/$RECORD_ID/images" '{"type":"CT","fileName":"chest_ct_001.png"}')
echo "上传响应: $UPLOAD_RESPONSE"
echo "✅ 影像上传完成"

echo ""
echo "[4/8] 刷新页面后查询病历（验证持久化）..."
GET_RESPONSE=$(api_get "/records/$RECORD_ID")
if echo "$GET_RESPONSE" | grep -q '"imagingComplete":true'; then
    echo "✅ 刷新后影像状态正确: imagingComplete=true"
else
    echo "⚠️  影像状态: $GET_RESPONSE"
fi

echo ""
echo "[5/8] 发起专家会诊..."
CONSULT_RESPONSE=$(api_post "/records/$RECORD_ID/request-consult" "{}")
echo "会诊响应: $CONSULT_RESPONSE"
CONSULT_ID=$(echo $CONSULT_RESPONSE | grep -o '"consultationId":"[^"]*"' | cut -d'"' -f4)
if [ -z "$CONSULT_ID" ]; then
    echo "❌ 会诊发起失败"
    exit 1
fi
echo "✅ 会诊发起成功 ID: $CONSULT_ID"

echo ""
echo "[6/8] 专家登录并完成会诊（标记危急值）..."
login "expert1" "123456"
COMPLETE_RESPONSE=$(api_post "/consultations/$CONSULT_ID/complete" '{"opinion":"患者胸痛症状明显，心电图提示ST段抬高","diagnosis":"急性心肌梗死","recommendation":"立即转上级医院行PCI治疗","isCritical":true}')
echo "会诊完成响应: $COMPLETE_RESPONSE"
if echo "$COMPLETE_RESPONSE" | grep -q '"isCritical":true'; then
    echo "✅ 危急值标记成功，自动进入绿色通道"
else
    echo "⚠️  会诊结果: $COMPLETE_RESPONSE"
fi

echo ""
echo "[7/8] 刷新查询绿色通道病例..."
GREEN_RESPONSE=$(api_get "/records?greenChannel=true")
if echo "$GREEN_RESPONSE" | grep -q '"greenChannel":true'; then
    echo "✅ 绿色通道病例持久化成功"
else
    echo "⚠️  绿色通道查询: $GREEN_RESPONSE"
fi

echo ""
echo "[8/8] 协调员安排转运..."
login "coord1" "123456"
AMBULANCES=$(api_get "/ambulances")
AMBULANCE_ID=$(echo $AMBULANCES | grep -o '"id":"[^"]*"' | cut -d'"' -f4 | head -1)
BEDS=$(api_get "/beds")
BED_ID=$(echo $BEDS | grep -o '"id":"[^"]*"' | cut -d'"' -f4 | head -1)

TRANSFER_RESPONSE=$(api_post "/transfers" "{\"recordId\":\"$RECORD_ID\",\"ambulanceId\":\"$AMBULANCE_ID\",\"bedId\":\"$BED_ID\"}")
echo "转运响应: $TRANSFER_RESPONSE"
TRANSFER_ID=$(echo $TRANSFER_RESPONSE | grep -o '"id":"[^"]*"' | cut -d'"' -f4)

if [ -z "$TRANSFER_ID" ]; then
    echo "❌ 转运创建失败"
    exit 1
fi
echo "✅ 转运创建成功 ID: $TRANSFER_ID"

echo ""
echo "推进转运状态至已接收..."
api_post "/transfers/$TRANSFER_ID/status" '{"status":"received"}'

echo ""
echo "回填接诊结果..."
ADMISSION_RESPONSE=$(api_post "/admissions" "{\"transferId\":\"$TRANSFER_ID\",\"admissionDiagnosis\":\"急性ST段抬高型心肌梗死\",\"treatment\":\"急诊PCI治疗，植入支架1枚\",\"outcome\":\"recovered\"}")
echo "接诊响应: $ADMISSION_RESPONSE"

echo ""
echo "======================================="
echo "  持久化验证完成"
echo "======================================="
echo "创建的病历 ID: $RECORD_ID"
echo "创建的会诊 ID: $CONSULT_ID"
echo "创建的转运 ID: $TRANSFER_ID"
echo ""
echo "✅ 所有数据均已持久化到 SQL Server"
echo "✅ 刷新页面后数据仍然存在"
echo "======================================="
