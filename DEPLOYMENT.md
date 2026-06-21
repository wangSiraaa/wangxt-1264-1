# 山区远程会诊转诊系统 - 部署说明

## 系统架构

- **前端**: React 18 + TypeScript + Ant Design + Vite
- **后端**: ASP.NET Core 8 + Entity Framework Core
- **数据库**: SQL Server 2022
- **认证**: JWT Bearer Token

## 核心业务规则

1. **影像资料缺失不能发起专家会诊** - [ConsultationService.cs](file:///Users/mingyuan/workspace/sihuo/wangxtw3/1264/backend/TeleConsult.Api/Services/ConsultationService.cs#L28-L30)
2. **危急值病例自动进入绿色通道** - [ConsultationService.cs](file:///Users/mingyuan/workspace/sihuo/wangxtw3/1264/backend/TeleConsult.Api/Services/ConsultationService.cs#L79-L85)
3. **转诊完成后回填接诊结果** - [AdmissionService.cs](file:///Users/mingyuan/workspace/sihuo/wangxtw3/1264/backend/TeleConsult.Api/Services/AdmissionService.cs#L29-L67)

## 默认配置（生产模式）

系统默认使用真实 API + SQL Server 数据库，不再使用前端内存 Mock 数据。

### 环境变量配置

已创建以下配置文件：

- [`.env`](file:///Users/mingyuan/workspace/sihuo/wangxtw3/1264/.env) - 默认配置，`VITE_USE_MOCK=false`
- [`.env.production`](file:///Users/mingyuan/workspace/sihuo/wangxtw3/1264/.env.production) - 生产构建配置
- [`.env.mock`](file:///Users/mingyuan/workspace/sihuo/wangxtw3/1264/.env.mock) - 可选 Mock 模式

### 数据库连接字符串

[`appsettings.json`](file:///Users/mingyuan/workspace/sihuo/wangxtw3/1264/backend/TeleConsult.Api/appsettings.json)

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=localhost,1433;Database=TeleConsultDb;User Id=sa;Password=YourStrong!Passw0rd;TrustServerCertificate=True;"
  }
}
```

## 快速启动

### 方式一：一键启动（推荐）

```bash
bash scripts/start-all.sh
```

### 方式二：分步启动

#### 1. 启动 SQL Server（Docker）

```bash
bash scripts/start-sqlserver.sh
```

或手动启动：

```bash
docker run -d \
  --name teleconsult-sqlserver \
  -e "ACCEPT_EULA=Y" \
  -e "SA_PASSWORD=YourStrong!Passw0rd" \
  -p 1433:1433 \
  --restart unless-stopped \
  mcr.microsoft.com/mssql/server:2022-latest
```

#### 2. 启动后端 API

```bash
bash scripts/start-backend.sh
```

或手动启动：

```bash
cd backend/TeleConsult.Api
dotnet run --urls http://localhost:5062
```

后端服务地址: http://localhost:5062
Swagger 文档: http://localhost:5062/swagger

#### 3. 启动前端

```bash
bash scripts/start-frontend.sh
```

或手动启动：

```bash
pnpm install
VITE_USE_MOCK=false pnpm dev --port 5173
```

前端地址: http://localhost:5173

## 启动脚本说明

| 脚本 | 说明 |
|------|------|
| [`scripts/start-all.sh`](file:///Users/mingyuan/workspace/sihuo/wangxtw3/1264/scripts/start-all.sh) | 一键启动所有服务（SQL Server + 后端 + 前端） |
| [`scripts/start-sqlserver.sh`](file:///Users/mingyuan/workspace/sihuo/wangxtw3/1264/scripts/start-sqlserver.sh) | 启动 SQL Server Docker 容器 |
| [`scripts/start-backend.sh`](file:///Users/mingyuan/workspace/sihuo/wangxtw3/1264/scripts/start-backend.sh) | 启动后端 API 服务 |
| [`scripts/start-frontend.sh`](file:///Users/mingyuan/workspace/sihuo/wangxtw3/1264/scripts/start-frontend.sh) | 启动前端开发服务器（真实API模式） |
| [`scripts/verify-sqlserver.sh`](file:///Users/mingyuan/workspace/sihuo/wangxtw3/1264/scripts/verify-sqlserver.sh) | SQL Server 连接和数据验证 |
| [`scripts/e2e-persistence-test.sh`](file:///Users/mingyuan/workspace/sihuo/wangxtw3/1264/scripts/e2e-persistence-test.sh) | 端到端数据持久化测试 |

## 数据库自动初始化

后端启动时会自动执行：
1. 检查数据库连接
2. 自动创建数据库（如果不存在）
3. 自动创建所有数据表（通过 EF Core）
4. 自动初始化种子数据（演示账号、机构、救护车、床位等）

种子数据配置在 [`DbSeeder.cs`](file:///Users/mingyuan/workspace/sihuo/wangxtw3/1264/backend/TeleConsult.Api/Services/DbSeeder.cs)

## 演示账号

所有账号密码均为：`123456`

| 用户名 | 角色 | 权限 |
|--------|------|------|
| `doctor1` | 乡镇医生 | 提交病历与影像、发起会诊 |
| `expert1` | 县医院专家 | 查看病历影像、出具会诊意见 |
| `coord1` | 转运协调员 | 调度救护车、分配床位、跟踪转运 |
| `admin1` | 管理员 | 全功能管理 |

## 回归验证流程

### 1. SQL Server 可用性验证

```bash
bash scripts/verify-sqlserver.sh
```

验证内容：
- ✅ SQL Server 连接状态
- ✅ 数据库 `TeleConsultDb` 是否存在
- ✅ 核心数据表是否创建
- ✅ 种子数据是否初始化
- ✅ 后端 API 健康状态

### 2. 端到端数据持久化测试

```bash
bash scripts/e2e-persistence-test.sh
```

测试流程：
1. ✅ 乡镇医生登录
2. ✅ 新建病历（持久化到 SQL Server）
3. ✅ 上传影像资料
4. ✅ 刷新查询验证数据持久化
5. ✅ 发起专家会诊
6. ✅ 专家登录并完成会诊（标记危急值）
7. ✅ 验证自动进入绿色通道
8. ✅ 协调员安排转运
9. ✅ 推进转运状态至"已接收"
10. ✅ 回填接诊结果，完成闭环

### 3. 手动验证数据持久化

1. 创建一条病历记录
2. 上传影像资料
3. 刷新页面，验证数据仍然存在
4. 发起专家会诊，刷新后验证会诊状态
5. 标记危急值，验证绿色通道自动激活
6. 安排转运，刷新后验证转运记录
7. 回填接诊结果，刷新后验证闭环完成

## NPM Scripts

```bash
pnpm dev              # 开发模式（默认真实API）
pnpm dev:mock         # Mock 模式（前端内存数据）
pnpm dev:real         # 真实API模式
pnpm build            # 生产构建（真实API模式）
pnpm build:mock       # 生产构建（Mock模式）
pnpm build:real       # 生产构建（真实API模式）
pnpm start:backend    # 启动后端API
pnpm start:all        # 一键启动所有服务
pnpm verify:sql       # SQL Server 验证
pnpm test:e2e         # 端到端持久化测试
```

## 数据持久化保证

### 后端层面

1. **EF Core 数据库上下文** - [`AppDbContext.cs`](file:///Users/mingyuan/workspace/sihuo/wangxtw3/1264/backend/TeleConsult.Api/Data/AppDbContext.cs)
   - 所有实体配置了正确的关系映射
   - 关键字段配置了索引优化查询性能

2. **业务服务层事务保证**
   - 所有写操作使用 EF Core 事务
   - 异常时自动回滚
   - 状态变更原子性保证

3. **自动迁移和种子数据** - [`DbSeeder.cs`](file:///Users/mingyuan/workspace/sihuo/wangxtw3/1264/backend/TeleConsult.Api/Services/DbSeeder.cs)
   - 程序启动时自动检查并应用初始化
   - 幂等操作，重复启动不重复插入

### 前端层面

1. **默认禁用 Mock** - [`.env`](file:///Users/mingyuan/workspace/sihuo/wangxtw3/1264/.env)
   - `VITE_USE_MOCK=false` 为默认配置
   - 所有 API 请求走 `/api` 代理到后端

2. **JWT 认证自动附加** - [`src/api/index.ts`](file:///Users/mingyuan/workspace/sihuo/wangxtw3/1264/src/api/index.ts#L21-L25)
   - 所有请求自动附加 `Authorization: Bearer <token>`
   - Token 持久化在 LocalStorage 中（通过 Zustand persist）

3. **字段映射适配** - [`src/api/index.ts`](file:///Users/mingyuan/workspace/sihuo/wangxtw3/1264/src/api/index.ts#L56-L74)
   - 后端 `fullName` → 前端 `name`
   - 后端 `systolicBP/diastolicBP` → 前端正确展示

## 故障排查

### 1. SQL Server 连接失败

**症状**: 后端启动报错 "数据库初始化失败"

**解决**:
- 确认 SQL Server 容器正在运行: `docker ps`
- 确认端口 1433 未被占用: `lsof -i :1433`
- 检查连接字符串密码是否匹配 SA 密码

### 2. 前端请求 401 Unauthorized

**症状**: API 请求返回 401

**解决**:
- 确认已登录并获取有效 Token
- 检查浏览器 DevTools → Application → LocalStorage → `teleconsult-auth`
- 重新登录获取新 Token

### 3. 前端请求 500 错误

**症状**: API 请求返回 500

**解决**:
- 查看后端控制台日志
- 检查数据库连接是否正常
- 确认数据库表已创建

### 4. 切换到 Mock 模式调试

如需临时使用前端内存数据调试：

```bash
cp .env.mock .env
pnpm dev
```

或直接运行：

```bash
pnpm dev:mock
```

## 核心数据表

| 表名 | 说明 |
|------|------|
| `Organizations` | 机构（乡镇卫生院/县医院） |
| `Users` | 用户账号（含角色权限） |
| `MedicalRecords` | 病历主表 |
| `ImagingIndexes` | 影像索引表 |
| `Consultations` | 会诊记录表 |
| `Ambulances` | 救护车资源表 |
| `Beds` | 床位资源表 |
| `Transfers` | 转运记录表 |
| `AdmissionResults` | 接诊结果表（闭环） |

## 业务流转状态机

### 病历状态
`draft` → `pending_consult` → `consulting` → `transferring` → `received` → `closed`

### 会诊状态
`pending` → `completed`

### 转运状态
`dispatched` → `in_transit` → `arrived` → `received` → `closed`

## 生产部署建议

1. **HTTPS**: 配置 Nginx 反向代理，启用 HTTPS
2. **连接池**: 调整 SQL Server 连接池大小
3. **Redis**: 考虑增加 Redis 缓存热点数据
4. **日志**: 配置结构化日志到 ELK
5. **监控**: 接入 Prometheus + Grafana
6. **备份**: 配置 SQL Server 定期备份
7. **密码**: 修改默认 SA 密码和 JWT SecretKey
