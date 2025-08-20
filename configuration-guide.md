# Umami IP 功能配置指南

## 环境变量配置

### 必需配置

| 变量名 | 说明 | 示例值 |
|--------|------|--------|
| `DATABASE_URL` | 数据库连接字符串 | `postgresql://umami:umami@localhost:5432/umami` |
| `DATABASE_TYPE` | 数据库类型 | `postgresql`, `mysql`, `clickhouse` |
| `APP_SECRET` | 应用加密密钥 | `$(openssl rand -base64 32)` |

### IP 收集相关配置

| 变量名 | 说明 | 默认值 | 示例 |
|--------|------|--------|------|
| `CLIENT_IP_HEADER` | 自定义IP头名称 | 自动检测 | `x-real-ip` |
| `IGNORE_IP` | 忽略的IP地址列表 | 无 | `192.168.1.1,10.0.0.0/8` |
| `DISABLE_IP_COLLECTION` | 是否禁用IP收集 | `false` | `true` |
| `ANONYMIZE_IP` | 是否匿名化IP地址 | `false` | `true` |

### 其他可选配置

| 变量名 | 说明 | 默认值 |
|--------|------|--------|
| `FORCE_HTTPS` | 强制使用HTTPS | `false` |
| `REDIS_URL` | Redis连接地址 | 无 |
| `TRACKER_SCRIPT_NAME` | 追踪脚本路径 | `/script.js` |
| `DISABLE_LOGIN` | 禁用登录功能 | `false` |
| `ALLOWED_HOSTS` | 允许的主机名列表 | 无 |

## IP 头配置详解

### 支持的默认 IP 头

系统会按以下优先级自动检测 IP 地址：

```typescript
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
  'x-appengine-user-ip',  // Google Cloud
];
```

### 自定义 IP 头

如果您的环境使用特殊的 IP 头名称：

```bash
# 设置自定义 IP 头
CLIENT_IP_HEADER=x-custom-ip-header
```

### 反向代理配置示例

#### Nginx

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://umami:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

#### Apache

```apache
<VirtualHost *:80>
    ServerName your-domain.com
    
    ProxyPass / http://localhost:3000/
    ProxyPassReverse / http://localhost:3000/
    
    # 传递真实 IP
    RequestHeader set X-Forwarded-Proto "http"
    ProxyPreserveHost On
</VirtualHost>
```

#### Cloudflare

Cloudflare 会自动设置 `cf-connecting-ip` 头，无需额外配置。

## IP 地址过滤配置

### 忽略特定 IP

```bash
# 忽略单个 IP
IGNORE_IP=192.168.1.100

# 忽略多个 IP（逗号分隔）
IGNORE_IP=192.168.1.100,10.0.0.50,172.16.0.10

# 忽略 IP 段（CIDR 表示法）
IGNORE_IP=192.168.1.0/24,10.0.0.0/8,172.16.0.0/12

# 混合配置
IGNORE_IP=192.168.1.100,10.0.0.0/8,172.16.0.10
```

### IP 地址匿名化

启用 IP 地址匿名化：

```bash
# 启用匿名化
ANONYMIZE_IP=true

# 匿名化级别（可选）
IP_ANONYMIZATION_LEVEL=partial  # partial 或 full
```

匿名化效果：
- IPv4: `192.168.1.100` → `192.168.1.0`
- IPv6: `2001:db8::1` → `2001:db8::`

## 数据库配置

### PostgreSQL

```bash
# 基本配置
DATABASE_URL=postgresql://username:password@localhost:5432/database_name
DATABASE_TYPE=postgresql

# 连接池配置（可选）
DATABASE_POOL_MIN=2
DATABASE_POOL_MAX=10
```

### MySQL

```bash
# 基本配置
DATABASE_URL=mysql://username:password@localhost:3306/database_name
DATABASE_TYPE=mysql

# SSL 配置（可选）
DATABASE_SSL=true
```

### ClickHouse

```bash
# 基本配置
DATABASE_URL=clickhouse://username:password@localhost:8123/database_name
DATABASE_TYPE=clickhouse
```

## 性能优化配置

### 缓存配置

```bash
# Redis 缓存
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=your-password
REDIS_DB=0

# 缓存过期时间（秒）
CACHE_TTL=3600
```

### 数据库连接池

```bash
# PostgreSQL 连接池
DATABASE_POOL_MIN=2
DATABASE_POOL_MAX=20
DATABASE_POOL_IDLE_TIMEOUT=30000

# MySQL 连接池
DATABASE_CONNECTION_LIMIT=20
DATABASE_QUEUE_LIMIT=100
```

### 追踪器配置

```bash
# 追踪脚本设置
TRACKER_SCRIPT_NAME=/custom-script.js
TRACKER_DOMAIN=your-tracking-domain.com

# 禁用追踪器缓存（开发环境）
DISABLE_TRACKER_CACHE=true
```

## 安全配置

### 基础安全

```bash
# 强制 HTTPS
FORCE_HTTPS=true

# 限制允许的主机
ALLOWED_HOSTS=your-domain.com,analytics.your-domain.com

# 禁用注册（仅允许登录）
DISABLE_REGISTRATION=true

# 禁用密码重置
DISABLE_PASSWORD_RESET=true
```

### 会话安全

```bash
# 会话超时（小时）
SESSION_TIMEOUT=24

# Cookie 安全设置
COOKIE_SECURE=true
COOKIE_SAMESITE=strict
COOKIE_DOMAIN=.your-domain.com
```

### 速率限制

```bash
# API 速率限制
RATE_LIMIT_ENABLED=true
RATE_LIMIT_WINDOW=900000  # 15分钟（毫秒）
RATE_LIMIT_MAX=100        # 每窗口最大请求数
```

## 邮件配置（可选）

用于发送通知和密码重置邮件：

```bash
# SMTP 配置
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USER=your-email@gmail.com
MAIL_PASS=your-app-password
MAIL_FROM=noreply@your-domain.com

# 邮件加密
MAIL_SECURE=false  # TLS
MAIL_TLS=true
```

## 社交登录配置（可选）

### GitHub OAuth

```bash
# GitHub OAuth
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
GITHUB_CALLBACK_URL=https://your-domain.com/api/auth/github/callback
```

### Google OAuth

```bash
# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=https://your-domain.com/api/auth/google/callback
```

## 日志配置

```bash
# 日志级别
LOG_LEVEL=info  # debug, info, warn, error

# 日志文件（生产环境）
LOG_FILE=/var/log/umami/app.log

# 禁用控制台日志（生产）
DISABLE_CONSOLE_LOG=true
```

## 地理位置配置

```bash
# GeoIP 数据库路径
GEOLITE2_CITY_DB=/usr/share/GeoIP/GeoLite2-City.mmdb
GEOLITE2_ASN_DB=/usr/share/GeoIP/GeoLite2-ASN.mmdb

# 自动下载 GeoIP 数据
AUTO_UPDATE_GEOLITE=true
```

## 配置文件示例

### 开发环境 (.env.development)

```bash
# 数据库
DATABASE_URL=postgresql://umami:umami@localhost:5432/umami_dev
DATABASE_TYPE=postgresql

# 应用配置
APP_SECRET=dev-secret-key-not-for-production
NODE_ENV=development
DISABLE_IP_COLLECTION=false

# 调试
LOG_LEVEL=debug
DISABLE_TRACKER_CACHE=true
```

### 生产环境 (.env.production)

```bash
# 数据库
DATABASE_URL=postgresql://umami:${DB_PASSWORD}@db:5432/umami
DATABASE_TYPE=postgresql
DATABASE_POOL_MAX=20

# 应用配置
APP_SECRET=${APP_SECRET}
FORCE_HTTPS=true
ALLOWED_HOSTS=analytics.your-domain.com

# 缓存
REDIS_URL=redis://redis:6379
CACHE_TTL=3600

# 安全
DISABLE_REGISTRATION=true
SESSION_TIMEOUT=24
COOKIE_SECURE=true

# 性能
RATE_LIMIT_ENABLED=true
LOG_LEVEL=warn
```

### Docker Compose 环境变量

```yaml
services:
  umami:
    environment:
      - DATABASE_URL=postgresql://umami:${DB_PASSWORD}@db:5432/umami
      - DATABASE_TYPE=postgresql
      - APP_SECRET=${APP_SECRET}
      - FORCE_HTTPS=true
      - REDIS_URL=redis://redis:6379
      - IGNORE_IP=192.168.1.0/24
    env_file:
      - .env
```

## 配置验证

启动应用后，可以通过以下端点验证配置：

```bash
# 检查应用状态
curl http://localhost:3000/api/heartbeat

# 检查配置（开发环境）
curl http://localhost:3000/api/config

# 查看环境变量（谨慎使用）
docker exec umami env
```

## 常见问题

### 1. IP 地址显示为 127.0.0.1

原因：反向代理未正确配置
解决方案：
- 检查反向代理的 IP 头设置
- 确认 `CLIENT_IP_HEADER` 配置

### 2. 数据库连接失败

原因：连接字符串错误或数据库未启动
解决方案：
- 验证 `DATABASE_URL` 格式
- 检查数据库服务状态
- 确认网络连通性

### 3. 配置不生效

原因：环境变量未正确加载
解决方案：
- 重启应用服务
- 检查环境变量语法
- 确认配置文件位置

## 最佳实践

1. **生产环境安全**
   - 使用强密码和随机密钥
   - 启用 HTTPS
   - 定期更新依赖

2. **性能优化**
   - 配置适当的连接池大小
   - 使用 Redis 缓存
   - 启用速率限制

3. **隐私保护**
   - 考虑启用 IP 匿名化
   - 遵守 GDPR 等隐私法规
   - 定期清理旧数据

4. **监控和维护**
   - 配置日志记录
   - 设置健康检查
   - 定期备份数据