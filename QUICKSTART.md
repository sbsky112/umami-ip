# Umami IP 功能快速上手指南

## 5分钟快速部署

### 1. 使用 Docker（最简单）

```bash
# 创建并启动
docker run -d \
  --name umami \
  -p 3000:3000 \
  -e DATABASE_URL=postgresql://umami:umami@host.docker.internal:5432/umami \
  -e DATABASE_TYPE=postgresql \
  -e APP_SECRET=$(openssl rand -base64 32) \
  sbsky112/umami-ip-feature:v2.19.0-postgres
```

### 2. 使用 Docker Compose（推荐）

```bash
# 保存以下内容为 docker-compose.yml
cat > docker-compose.yml << 'EOF'
version: '3.8'
services:
  umami:
    image: sbsky112/umami-ip-feature:v2.19.0-postgres
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: postgresql://umami:umami@db:5432/umami
      DATABASE_TYPE: postgresql
      APP_SECRET: change-me-to-a-random-string
    depends_on:
      - db
    restart: unless-stopped
  db:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: umami
      POSTGRES_USER: umami
      POSTGRES_PASSWORD: umami
    volumes:
      - umami-db-data:/var/lib/postgresql/data
    restart: unless-stopped
volumes:
  umami-db-data:
EOF

# 启动服务
docker-compose up -d
```

## 首次使用

1. **访问系统**
   ```
   http://localhost:3000
   ```

2. **登录账户**
   ```
   用户名: admin
   密码: umami
   ```

3. **添加网站**
   - 点击"添加网站"
   - 输入网站名称和域名
   - 保存

4. **获取追踪代码**
   ```html
   <script async defer src="http://localhost:3000/script.js" data-website-id="your-website-id"></script>
   ```

5. **查看IP地址**
   - 进入"Sessions"页面
   - 查看每个访客的IP地址
   - 点击会话查看详细信息

## 常用配置

### 忽略内部IP

```bash
# docker-compose.yml 中添加
environment:
  IGNORE_IP: 192.168.1.0/24,10.0.0.0/8
```

### 使用自定义IP头

```bash
environment:
  CLIENT_IP_HEADER: x-real-ip
```

### 禁用IP收集

```bash
environment:
  DISABLE_IP_COLLECTION: true
```

## 升级现有安装

### 1. 备份数据

```bash
# 备份数据库
docker exec umami-db pg_dump -U umami umami > backup.sql
```

### 2. 更新镜像

```bash
# 拉取新镜像
docker pull sbsky112/umami-ip-feature:v2.19.0-postgres

# 停止并删除旧容器
docker stop umami && docker rm umami

# 使用新镜像启动
docker run -d ... （使用之前的配置）
```

### 3. 验证功能

- 检查Sessions页面是否有IP列
- 确认数据正常收集
- 测试IP地址显示

## 故障速查

### 问题：IP显示为127.0.0.1
**解决方案**：
- 检查反向代理配置
- 设置正确的CLIENT_IP_HEADER

### 问题：页面无法访问
**解决方案**：
- 确认端口3000未被占用
- 检查防火墙设置
- 查看容器日志：`docker logs umami`

### 问题：数据库连接失败
**解决方案**：
- 确认数据库服务运行正常
- 检查DATABASE_URL格式
- 验证数据库凭据

## 生产环境建议

1. **安全设置**
   - 修改默认密码
   - 使用强APP_SECRET
   - 启用HTTPS

2. **性能优化**
   - 使用外部数据库
   - 配置Redis缓存
   - 定期清理旧数据

3. **监控备份**
   - 设置定期备份
   - 监控系统资源
   - 配置日志轮转

## 获取帮助

- 📖 **完整文档**：见 README.md
- 🐳 **部署指南**：见 docker-deployment.md
- ⚙️ **配置说明**：见 configuration-guide.md
- 🔧 **技术细节**：见 IP_ADDRESS_FEATURE.md