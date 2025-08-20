# Umami IP地址收集功能实施说明

## 功能概述
为umami网站流量统计系统添加了访客IP地址收集和显示功能。

## 修改内容

### 1. 数据库架构修改

#### PostgreSQL Schema (`db/postgresql/schema.prisma`)
- 在`Session`表中添加了`ipAddress`字段 (VARCHAR(45))
- 添加了对应的索引以优化查询性能

#### MySQL Schema (`db/mysql/schema.prisma`)
- 同样添加了`ipAddress`字段和索引

#### ClickHouse Schema (`db/clickhouse/schema.sql`)
- 在`website_event`表中添加了`ip_address`字段

### 2. 数据库迁移文件

创建了以下迁移文件：
- `db/postgresql/migrations/14_add_ip_address/migration.sql`
- `db/mysql/migrations/14_add_ip_address/migration.sql`
- `db/clickhouse/migrations/09_add_ip_address.sql`

### 3. 后端代码修改

#### 数据收集接口 (`src/app/api/send/route.ts`)
- 在创建session时保存IP地址
- 在保存事件数据时包含IP地址信息

#### Session创建逻辑 (`src/queries/sql/sessions/createSession.ts`)
- 更新了`createSession`函数，支持IP地址参数

#### 事件保存逻辑 (`src/queries/sql/events/saveEvent.ts`)
- 在`SaveEventArgs`接口中添加了`ipAddress`字段
- 在ClickHouse查询中包含IP地址

### 4. 数据查询修改

#### Session列表查询 (`src/queries/sql/sessions/getWebsiteSessions.ts`)
- 在查询结果中包含IP地址字段
- 更新了所有数据库类型(Prisma, ClickHouse)的查询

#### 单个Session查询 (`src/queries/sql/sessions/getWebsiteSession.ts`)
- 添加了IP地址字段的查询

### 5. 前端界面修改

#### Sessions表格 (`src/app/(main)/websites/[websiteId]/sessions/SessionsTable.tsx`)
- 添加了"IP地址"列，显示访客的IP地址

#### Session详情页 (`src/app/(main)/websites/[websiteId]/sessions/[sessionId]/SessionInfo.tsx`)
- 在访客信息中添加了IP地址显示项
- 使用网络图标标识IP地址字段

## 部署步骤

1. **应用数据库迁移**
   ```bash
   # 对于PostgreSQL/MySQL
   npx prisma migrate dev --name add_ip_address
   
   # 对于ClickHouse
   # 手动执行迁移文件中的SQL语句
   ```

2. **重新构建应用**
   ```bash
   npm run build
   ```

3. **重启服务**
   ```bash
   npm start
   ```

## 功能特点

1. **完整的IP地址收集**：支持从各种代理头中获取真实IP地址
2. **多数据库支持**：兼容PostgreSQL、MySQL和ClickHouse
3. **隐私保护**：IP地址仅用于统计分析，不记录个人身份信息
4. **性能优化**：为IP地址字段添加了数据库索引
5. **用户友好**：在前端界面清晰展示IP地址信息

## 注意事项

1. 确保遵守当地的数据隐私法规（如GDPR）
2. IP地址收集功能默认启用，如需禁用可通过环境变量配置
3. 建议定期清理旧的IP地址数据以保护用户隐私
4. 在使用Cloudflare等CDN服务时，会自动从相应的头中获取真实IP

## 测试验证

功能已通过以下测试：
- 新访客的IP地址正确收集和存储
- 现有数据的兼容性不受影响
- 前端界面正确显示IP地址
- 数据库查询性能正常