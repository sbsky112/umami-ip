# Docker 部署指南

## 概述

本指南提供了使用 Docker 部署 Umami IP 地址功能版本的详细说明。我们提供了 PostgreSQL 和 MySQL 两个版本的预构建镜像。

## 可用镜像

### PostgreSQL 版本
- **镜像名**: `sbsky112/umami-ip-feature:v2.19.0-postgres`
- **标签**: `v2.19.0-postgres`
- **大小**: ~200MB
- **支持**: PostgreSQL 15+

### MySQL 版本
- **镜像名**: `sbsky112/umami-ip-feature:v2.19.0-mysql`
- **标签**: `v2.19.0-mysql`
- **大小**: ~200MB
- **支持**: MySQL 8.0+

## 快速部署

### 1. 使用 Docker Compose（推荐）

#### PostgreSQL 部署

创建 `docker-compose.yml` 文件：

```yaml
version: '3.8'

services:
  umami:
    image: sbsky112/umami-ip-feature:v2.19.0-postgres
    container_name: umami
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: postgresql://umami:umami@db:5432/umami
      DATABASE_TYPE: postgresql
      APP_SECRET: your-secret-key-here
      # 可选配置
      # CLIENT_IP_HEADER: x-real-ip
      # IGNORE_IP: 192.168.1.1,10.0.0.0/8
      # DISABLE_IP_COLLECTION: false
    depends_on:
      db:
        condition: service_healthy
    restart: unless-stopped
    healthcheck:
      test: ["CMD-SHELL", "curl -f http://localhost:3000/api/heartbeat || exit 1"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

  db:
    image: postgres:15-alpine
    container_name: umami-db
    environment:
      POSTGRES_DB: umami
      POSTGRES_USER: umami
      POSTGRES_PASSWORD: umami
    volumes:
      - umami-db-data:/var/lib/postgresql/data
      - ./db/init:/docker-entrypoint-initdb.d  # 初始化脚本
    restart: unless-stopped
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U $$POSTGRES_USER -d $$POSTGRES_DB"]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  umami-db-data:
    driver: local
```

#### MySQL 部署

创建 `docker-compose.yml` 文件：

```yaml
version: '3.8'

services:
  umami:
    image: sbsky112/umami-ip-feature:v2.19.0-mysql
    container_name: umami
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: mysql://umami:umami@db:3306/umami
      DATABASE_TYPE: mysql
      APP_SECRET: your-secret-key-here
      # 可选配置
      # CLIENT_IP_HEADER: x-real-ip
      # IGNORE_IP: 192.168.1.1,10.0.0.0/8
    depends_on:
      - db
    restart: unless-stopped

  db:
    image: mysql:8.0
    container_name: umami-db
    environment:
      MYSQL_DATABASE: umami
      MYSQL_USER: umami
      MYSQL_PASSWORD: umami
      MYSQL_ROOT_PASSWORD: rootpassword
    volumes:
      - umami-db-data:/var/lib/mysql
      - ./db/init:/docker-entrypoint-initdb.d
    command: --default-authentication-plugin=mysql_native_password
    restart: unless-stopped

volumes:
  umami-db-data:
    driver: local
```

### 2. 启动服务

```bash
# 生成随机密钥
export APP_SECRET=$(openssl rand -base64 32)

# 替换 docker-compose.yml 中的密钥
sed -i "s/your-secret-key-here/$APP_SECRET/" docker-compose.yml

# 启动服务
docker-compose up -d

# 查看日志
docker-compose logs -f
```

### 3. 访问应用

打开浏览器访问：http://localhost:3000

默认登录凭据：
- 用户名：`admin`
- 密码：`umami`

## 高级配置

### 1. 环境变量详解

| 环境变量 | 说明 | 示例 |
|---------|------|------|
| `DATABASE_URL` | 数据库连接字符串 | `postgresql://user:pass@host:port/db` |
| `DATABASE_TYPE` | 数据库类型 | `postgresql` 或 `mysql` |
| `APP_SECRET` | 应用加密密钥 | `$(openssl rand -base64 32)` |
| `CLIENT_IP_HEADER` | 自定义IP头 | `x-real-ip` |
| `IGNORE_IP` | 忽略的IP列表 | `192.168.1.1,10.0.0.0/8` |
| `DISABLE_IP_COLLECTION` | 禁用IP收集 | `true` 或 `false` |
| `REDIS_URL` | Redis连接（可选） | `redis://localhost:6379` |
| `TRACKER_SCRIPT_NAME` | 追踪脚本路径 | `/script.js` |

### 2. 使用外部数据库

如果您想使用外部数据库服务：

```yaml
services:
  umami:
    image: sbsky112/umami-ip-feature:v2.19.0-postgres
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: postgresql://user:password@your-db-host:5432/umami
      DATABASE_TYPE: postgresql
      APP_SECRET: your-secret-key
    restart: unless-stopped
```

### 3. 使用反向代理

#### Nginx 配置示例

```nginx
server {
    listen 80;
    server_name analytics.example.com;
    
    location / {
        proxy_pass http://umami:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

#### 使用 Docker 网络

```yaml
version: '3.8'

services:
  umami:
    image: sbsky112/umami-ip-feature:v2.19.0-postgres
    environment:
      DATABASE_URL: postgresql://umami:umami@db:5432/umami
      DATABASE_TYPE: postgresql
      APP_SECRET: your-secret-key
    networks:
      - umami-network
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - umami
    networks:
      - umami-network
    restart: unless-stopped

networks:
  umami-network:
    driver: bridge
```

### 4. 数据持久化

数据默认存储在 Docker 卷中。您也可以挂载到主机目录：

```yaml
volumes:
  - ./data/postgres:/var/lib/postgresql/data
```

## 生产环境建议

### 1. 安全配置

```yaml
services:
  umami:
    environment:
      # 使用强密码
      APP_SECRET: ${APP_SECRET}
      # 启用 HTTPS
      FORCE_HTTPS: true
      # 限制访问
      ALLOWED_HOSTS: analytics.example.com
```

### 2. 资源限制

```yaml
services:
  umami:
    deploy:
      resources:
        limits:
          cpus: '1.0'
          memory: 512M
        reservations:
          cpus: '0.5'
          memory: 256M
```

### 3. 日志管理

```yaml
services:
  umami:
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
```

### 4. 健康检查

```yaml
healthcheck:
  test: ["CMD-SHELL", "curl -f http://localhost:3000/api/health || exit 1"]
  interval: 30s
  timeout: 10s
  retries: 3
  start_period: 40s
```

## 维护操作

### 1. 更新镜像

```bash
# 拉取最新镜像
docker-compose pull

# 重新构建并启动
docker-compose up -d --force-recreate

# 清理旧镜像
docker image prune -f
```

### 2. 备份数据

```bash
# 备份 PostgreSQL
docker exec umami-db pg_dump -U umami umami > backup.sql

# 备份 MySQL
docker exec umami-db mysqldump -u umami -pumami umami > backup.sql
```

### 3. 恢复数据

```bash
# 恢复 PostgreSQL
docker exec -i umami-db psql -U umami umami < backup.sql

# 恢复 MySQL
docker exec -i umami-db mysql -u umami -pumami umami < backup.sql
```

### 4. 查看日志

```bash
# 实时日志
docker-compose logs -f umami

# 最近 100 行
docker-compose logs --tail=100 umami

# 特定时间
docker-compose logs --since 1h umami
```

## 故障排除

### 1. 常见问题

#### 容器启动失败

```bash
# 检查容器状态
docker-compose ps

# 查看错误日志
docker-compose logs umami

# 检查资源使用
docker stats
```

#### 数据库连接问题

```bash
# 测试数据库连接
docker exec umami-db pg_isready -U umami

# 检查环境变量
docker-compose exec umami env | grep DATABASE
```

#### IP 地址获取问题

如果 IP 地址显示不正确：

1. 检查反向代理配置
2. 确认 `CLIENT_IP_HEADER` 设置
3. 验证 CDN 配置

### 2. 性能优化

```bash
# 清理未使用的 Docker 对象
docker system prune -a

# 监控资源使用
docker stats --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}"
```

## 多环境部署

### 开发环境

```yaml
# docker-compose.dev.yml
services:
  umami:
    image: sbsky112/umami-ip-feature:v2.19.0-postgres
    environment:
      DATABASE_URL: postgresql://umami:umami@db:5432/umami_dev
      NODE_ENV: development
    volumes:
      - ./src:/app/src
    command: npm run dev
```

### 生产环境

```yaml
# docker-compose.prod.yml
services:
  umami:
    image: sbsky112/umami-ip-feature:v2.19.0-postgres
    environment:
      DATABASE_URL: ${DATABASE_URL}
      APP_SECRET: ${APP_SECRET}
      FORCE_HTTPS: true
    restart: unless-stopped
```

使用环境文件：

```bash
# .env.prod
DATABASE_URL=postgresql://user:pass@host:port/db
APP_SECRET=your-production-secret
FORCE_HTTPS=true

# 启动
docker-compose -f docker-compose.yml -f docker-compose.prod.yml --env-file .env.prod up -d
```

## 总结

使用 Docker 部署 Umami IP 功能版本是最简单快捷的方式。预构建的镜像已经包含了所有必要的依赖和配置，您只需要提供数据库连接信息即可开始使用。

记得在生产环境中：
1. 使用强密码和安全的 APP_SECRET
2. 配置 HTTPS
3. 定期备份数据
4. 监控系统资源使用情况