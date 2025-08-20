# Umami IP地址功能技术实现文档

## 功能概述

本文档详细说明了为 umami 添加 IP 地址收集功能的技术实现细节。

## 核心实现

### 1. 数据库架构

#### PostgreSQL/MySQL
```sql
-- Session 表添加 IP 字段
ALTER TABLE session ADD COLUMN "ipAddress" VARCHAR(45);

-- 创建索引优化查询
CREATE INDEX "session_ip_address_idx" ON session("ipAddress");
```

#### ClickHouse
```sql
-- website_event 表添加 IP 字段
ALTER TABLE website_event ADD COLUMN ip_address String;
```

### 2. IP 地址检测机制

系统使用多级检测机制获取真实 IP：

```typescript
// 支持的 IP 头优先级
const IP_ADDRESS_HEADERS = [
  'cf-connecting-ip',     // Cloudflare
  'x-client-ip',          // 通用
  'x-forwarded-for',      // 代理
  'do-connecting-ip',     // DigitalOcean
  'fastly-client-ip',     // Fastly
  'true-client-ip',       // Akamai
  'x-real-ip',           // Nginx
  'x-cluster-client-ip',  // AWS
  'x-forwarded',         // 标准
  'forwarded',           // 标准
  'x-appengine-user-ip', // Google Cloud
];
```

### 3. 数据流程

```
访客请求 → 反向代理/CDN → Umami 应用
    ↓
提取 IP 地址 → 存储到 Session
    ↓
查询显示 → 前端界面
```

## 关键文件修改

### 数据收集层
- `src/app/api/send/route.ts` - IP 提取和存储入口
- `src/lib/detect.ts` - IP 检测工具函数
- `src/lib/constants.ts` - IP 头配置常量

### 数据持久层
- `db/postgresql/schema.prisma` - PostgreSQL 架构
- `db/mysql/schema.prisma` - MySQL 架构
- `db/clickhouse/schema.sql` - ClickHouse 架构
- `src/queries/sql/sessions/createSession.ts` - Session 创建逻辑
- `src/queries/sql/events/saveEvent.ts` - 事件保存逻辑

### 数据查询层
- `src/queries/sql/sessions/getWebsiteSessions.ts` - Session 列表查询
- `src/queries/sql/sessions/getWebsiteSession.ts` - 单个 Session 查询

### 展示层
- `src/app/(main)/websites/[websiteId]/sessions/SessionsTable.tsx` - IP 列表显示
- `src/app/(main)/websites/[websiteId]/sessions/[sessionId]/SessionInfo.tsx` - IP 详情显示

## 环境变量配置

| 变量名 | 类型 | 默认值 | 说明 |
|--------|------|--------|------|
| `CLIENT_IP_HEADER` | String | - | 自定义 IP 头名称 |
| `IGNORE_IP` | String | - | 忽略的 IP 列表 |
| `DISABLE_IP_COLLECTION` | Boolean | false | 禁用 IP 收集 |
| `ANONYMIZE_IP` | Boolean | false | IP 匿名化 |

## 性能优化

1. **数据库索引**：为 IP 字段创建索引
2. **查询优化**：避免 N+1 查询问题
3. **缓存策略**：使用 Redis 缓存频繁查询的数据

## 隐私保护

1. **GDPR 合规**：提供数据删除机制
2. **IP 匿名化**：可选的 IP 地址匿名化
3. **数据保留**：可配置的数据保留策略

## 部署注意事项

1. **数据库迁移**：必须执行迁移脚本
2. **反向代理**：正确配置 IP 头传递
3. **防火墙**：确保数据库端口安全
4. **备份**：部署前备份数据

## 测试用例

### IP 检测测试
- [ ] 直接访问 IP 获取
- [ ] 单级代理 IP 获取
- [ ] 多级代理 IP 获取
- [ ] CDN 环境 IP 获取
- [ ] 自定义 IP 头测试

### 数据存储测试
- [ ] IPv4 地址存储
- [ ] IPv6 地址存储
- [ ] 无效 IP 处理
- [ ] IP 长度限制

### 前端显示测试
- [ ] IP 列表显示
- [ ] IP 详情显示
- [ ] 无 IP 时显示
- [ ] IP 格式化显示

## 故障排除

### 常见问题

1. **IP 显示为 127.0.0.1**
   - 检查反向代理配置
   - 验证 `CLIENT_IP_HEADER` 设置

2. **数据库连接失败**
   - 确认数据库服务状态
   - 验证连接字符串

3. **迁移失败**
   - 检查数据库权限
   - 确认迁移脚本语法

### 调试方法

```bash
# 查看原始请求头
docker exec umami curl -v http://localhost:3000/api/send

# 检查数据库记录
docker exec db psql -U umami -d umami -c "SELECT id, ipAddress FROM session LIMIT 10;"

# 查看应用日志
docker-compose logs -f umami | grep ipAddress
```

## 扩展开发

### 添加新的 IP 头

1. 更新 `src/lib/constants.ts` 中的 `IP_ADDRESS_HEADERS` 数组
2. 在 `src/lib/detect.ts` 中添加处理逻辑
3. 编写相应的测试用例

### IP 地理位置集成

可以使用 MaxMind GeoIP2 数据库添加地理位置功能：

```bash
# 安装依赖
npm install maxmind

# 配置环境变量
GEOLITE2_CITY_DB=/path/to/GeoLite2-City.mmdb
```

### IP 信誉检查

集成第三方 IP 信誉服务：

```typescript
const checkIPReputation = async (ip: string) => {
  // 调用 IP 信誉 API
  // 返回风险等级
};
```