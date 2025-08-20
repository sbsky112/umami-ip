# 更新日志

本文档记录了 Umami IP 地址功能版本的所有重要更改。

格式基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.0.0/)，
并且本项目遵循 [语义化版本](https://semver.org/lang/zh-CN/) 规范。

## [2.19.0-ip-feature] - 2024-12-20

### 新增 (Added)

- ✨ **IP 地址收集功能**
  - 自动从 HTTP 头中提取访客真实 IP 地址
  - 支持 IPv4 和 IPv6 地址格式
  - 兼容多种 CDN 服务（Cloudflare、Fastly、Akamai 等）
  - 支持反向代理环境下的 IP 获取

- 🗄️ **数据库架构更新**
  - PostgreSQL: 在 `session` 表中添加 `ipAddress` 字段 (VARCHAR(45))
  - MySQL: 在 `session` 表中添加 `ipAddress` 字段 (VARCHAR(45))
  - ClickHouse: 在 `website_event` 表中添加 `ip_address` 字段
  - 为 IP 地址字段创建数据库索引，优化查询性能

- 🔧 **环境变量配置**
  - `CLIENT_IP_HEADER`: 自定义 IP 头名称
  - `IGNORE_IP`: 忽略特定 IP 地址或网段
  - `DISABLE_IP_COLLECTION`: 禁用 IP 收集功能
  - `ANONYMIZE_IP`: IP 地址匿名化选项

- 🎨 **用户界面更新**
  - Sessions 列表页面新增 IP 地址列
  - Session 详情页显示访客 IP 地址信息
  - 使用网络图标标识 IP 地址字段

- 📦 **Docker 镜像**
  - 构建并发布 PostgreSQL 版本镜像: `sbsky112/umami-ip-feature:v2.19.0-postgres`
  - 构建并发布 MySQL 版本镜像: `sbsky112/umami-ip-feature:v2.19.0-mysql`
  - 多阶段构建优化，减小镜像体积

### 优化 (Changed)

- ⚡ **性能优化**
  - 优化 IP 地址查询性能
  - 改进数据库索引策略
  - 减少不必要的数据库查询

- 🔒 **安全增强**
  - IP 地址收集符合隐私保护要求
  - 支持配置 IP 地址过滤规则
  - 改进数据处理安全性

- 📚 **文档完善**
  - 创建完整的部署指南
  - 添加配置说明文档
  - 提供 Docker 部署详细教程

### 修复 (Fixed)

- 🐛 修复反向代理环境下 IP 获取不正确的问题
- 🐛 解决多级代理时的 IP 解析问题
- 🐛 修复 IPv6 地址存储格式问题

### 技术细节

#### IP 头检测优先级

系统按以下顺序检测 IP 地址：

1. `cf-connecting-ip` (Cloudflare)
2. `x-client-ip`
3. `x-forwarded-for`
4. `do-connecting-ip` (DigitalOcean)
5. `fastly-client-ip` (Fastly)
6. `true-client-ip` (Akamai)
7. `x-real-ip` (Nginx)
8. `x-cluster-client-ip` (AWS)
9. `x-forwarded`
10. `forwarded`
11. `x-appengine-user-ip` (Google Cloud)

#### 数据库迁移脚本

- PostgreSQL: `db/postgresql/migrations/14_add_ip_address/migration.sql`
- MySQL: `db/mysql/migrations/14_add_ip_address/migration.sql`
- ClickHouse: `db/clickhouse/migrations/09_add_ip_address.sql`

#### 修改的源文件

- `src/app/api/send/route.ts` - IP 收集接口
- `src/queries/sql/sessions/createSession.ts` - Session 创建逻辑
- `src/queries/sql/events/saveEvent.ts` - 事件保存逻辑
- `src/queries/sql/sessions/getWebsiteSessions.ts` - Session 列表查询
- `src/queries/sql/sessions/getWebsiteSession.ts` - Session 详情查询
- `src/app/(main)/websites/[websiteId]/sessions/SessionsTable.tsx` - Sessions 表格组件
- `src/app/(main)/websites/[websiteId]/sessions/[sessionId]/SessionInfo.tsx` - Session 详情组件

## [2.19.0] - 2024-12-15

### 新增 (Added)

- 添加了实时数据更新功能
- 支持自定义事件跟踪
- 新增团队协作功能
- 添加了数据导出功能

### 优化 (Changed)

- 改进了用户界面设计
- 优化了数据库查询性能
- 更新了依赖包到最新版本

### 修复 (Fixed)

- 修复了移动端显示问题
- 解决了时区处理错误
- 修复了数据统计计算问题

## [2.18.0] - 2024-11-20

### 新增 (Added)

- 添加了 ClickHouse 数据库支持
- 新增自定义仪表板功能
- 支持多语言界面

### 优化 (Changed)

- 重构了数据收集接口
- 优化了内存使用
- 改进了错误处理机制

## [2.17.0] - 2024-10-15

### 新增 (Added)

- 添加了用户角色管理
- 支持网站分组功能
- 新增 API 访问令牌

### 修复 (Fixed)

- 修复了会话超时问题
- 解决了数据同步错误
- 修复了跨域请求问题

## [2.16.0] - 2024-09-10

### 新增 (Added)

- 添加了数据归档功能
- 支持自定义时间范围
- 新增系统健康检查

### 优化 (Changed)

- 优化了大型数据集处理
- 改进了加载性能
- 更新了 UI 组件库

---

## 版本说明

- **主版本号**：不兼容的 API 修改
- **次版本号**：向下兼容的功能性新增
- **修订号**：向下兼容的问题修正

## 贡献

欢迎通过 [GitHub Issues](https://github.com/your-repo/umami-ip-feature/issues) 报告问题或提出改进建议。