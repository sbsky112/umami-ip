# Umami IP Docker 部署指南

这个项目是 Umami Analytics 的增强版本，支持 IP 地址记录功能。

## 功能特性

- 🌐 **IP 地址记录**: 记录访问者的真实 IP 地址
- 🐳 **Docker 容器化**: 提供 Docker 部署方案
- 📊 **完整分析**: 包含页面浏览、访问者、会话等完整分析功能
- 🌍 **地理位置**: 基于 IP 地址的地理位置识别
- 🔒 **隐私保护**: 符合 GDPR 等隐私法规

## 快速开始

### 使用 Docker Compose (推荐)

```bash
docker-compose up -d
```

### 直接使用 Docker

```bash
docker run -d \
  --name umami \
  -p 3000:3000 \
  -e DATABASE_URL="mysql://username:password@host:3306/database" \
  -e DATABASE_TYPE=mysql \
  -e APP_SECRET="your-secret-key" \
  sbsky112/umami-ip-feature:v2.19.3-mysql
```

## 环境变量

| 变量名 | 描述 | 默认值 |
|--------|------|--------|
| `DATABASE_URL` | 数据库连接字符串 | - |
| `DATABASE_TYPE` | 数据库类型 (mysql) | - |
| `APP_SECRET` | 应用密钥 | - |
| `BASE_PATH` | 应用基础路径 | / |
| `DISABLE_TRACKING` | 禁用追踪 | false |
| `FORCE_SSL` | 强制 HTTPS | false |
| `IGNORE_IP` | 忽略的 IP 地址 | - |

## 数据库配置

### MySQL
```sql
CREATE DATABASE umami;
CREATE USER 'umami'@'%' IDENTIFIED BY 'umami';
GRANT ALL PRIVILEGES ON umami.* TO 'umami'@'%';
FLUSH PRIVILEGES;
```

## 构建自定义镜像

### 手动构建
```bash
# MySQL 版本
docker build \
  --build-arg DATABASE_TYPE=mysql \
  -t umami-mysql:latest .
```

## 初始化设置

1. 访问 `http://localhost:3000`
2. 使用默认账户登录：
   - 用户名: `admin`
   - 密码: `umami`
3. 创建网站并获取跟踪代码
4. 将跟踪代码添加到您的网站

## 功能增强

### IP 地址记录
- 记录访问者的真实 IP 地址
- 支持代理服务器环境
- IP 地址存储在 `session` 表的 `ip_address` 字段

### Cloudflare Turnstile 支持
- 在 Global Settings 中配置 Cloudflare Turnstile
- 支持启用/禁用 Turnstile 验证
- 提供保存成功的反馈

### 数据库优化
- 添加了 IP 地址字段的索引
- 优化了查询性能
- 支持大量数据的高效处理

## 故障排除

### 常见问题

1. **数据库连接失败**
   - 检查数据库连接字符串
   - 确认数据库服务正在运行
   - 验证用户权限

2. **初始化失败**
   - 确保数据库为空
   - 检查磁盘空间
   - 查看日志文件

3. **IP 地址未记录**
   - 检查是否在代理服务器后
   - 确认 `HTTP_X_FORWARDED_FOR` 头设置
   - 验证数据库表结构

### 日志查看
```bash
# 查看容器日志
docker logs umami

# 实时查看日志
docker logs -f umami
```

## 更新指南

### 更新 Docker 镜像
```bash
# 拉取新镜像
docker pull sbsky112/umami-ip-feature:v2.19.0-mysql

# 停止并删除旧容器
docker stop umami
docker rm umami

# 启动新容器
docker run -d ... (使用之前的运行参数)
```

### 数据库迁移
- 新版本会自动处理数据库迁移
- 建议在更新前备份数据库
- 如果遇到问题，可以手动运行迁移

## 开发指南

### 本地开发
```bash
# 安装依赖
pnpm install

# 配置环境变量
cp .env.example .env

# 运行开发服务器
pnpm dev
```

### 构建生产版本
```bash
# 构建应用
pnpm build

# 运行生产服务器
pnpm start
```

## 贡献指南

1. Fork 项目
2. 创建功能分支
3. 提交更改
4. 推送到分支
5. 创建 Pull Request

## 许可证

MIT License

## 支持

- 问题反馈：[GitHub Issues](https://github.com/your-repo/issues)
- 文档：[项目 Wiki](https://github.com/your-repo/wiki)
- 讨论：[GitHub Discussions](https://github.com/your-repo/discussions)

## 更新日志

### v2.19.3
- 移除 PostgreSQL 数据库支持，仅支持 MySQL
- 优化 Docker 构建流程
- 修复 Prisma 客户端生成问题
- 更新文档和构建脚本

### v2.19.0
- 添加 IP 地址记录功能
- 支持 MySQL 数据库
- 优化数据库性能
- 修复 Cloudflare Turnstile 保存问题
- 改进 Docker 部署流程