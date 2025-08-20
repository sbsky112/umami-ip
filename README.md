# Umami IP地址功能 - 完整使用文档

## 项目简介

这是一个基于 Umami v2.19.0 的二次开发项目，增加了访客IP地址收集和显示功能。Umami 是一个简单、快速、注重隐私的网站分析工具，本版本在保留原有功能的基础上，增加了IP地址追踪能力。

### 主要特性

- 📊 **完整的网站分析功能**：页面浏览量、访问者统计、实时数据等
- 🌐 **IP地址追踪**：自动收集和显示访客IP地址
- 🔒 **隐私保护**：默认不使用Cookie，符合GDPR等隐私法规
- 🚀 **高性能**：优化的数据库结构和查询
- 🐳 **Docker支持**：提供PostgreSQL和MySQL版本的Docker镜像
- 🌍 **多CDN支持**：自动识别Cloudflare、Fastly等CDN的真实IP

## 快速开始

### 使用Docker部署（推荐）

#### PostgreSQL版本

```bash
# 创建docker-compose.yml文件
cat > docker-compose.yml << EOF
---
services:
  umami:
    image: sbsky112/umami-ip-feature:v2.19.0-postgres
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: postgresql://umami:umami@db:5432/umami
      DATABASE_TYPE: postgresql
      APP_SECRET: $(openssl rand -base64 32)
      # 可选：配置自定义IP头
      # CLIENT_IP_HEADER: x-real-ip
    depends_on:
      db:
        condition: service_healthy
    restart: always
    healthcheck:
      test: ["CMD-SHELL", "curl -f http://localhost:3000/api/heartbeat"]
      interval: 5s
      timeout: 5s
      retries: 5
  db:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: umami
      POSTGRES_USER: umami
      POSTGRES_PASSWORD: umami
    volumes:
      - umami-db-data:/var/lib/postgresql/data
    restart: always
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U \$${POSTGRES_USER} -d \$${POSTGRES_DB}"]
      interval: 5s
      timeout: 5s
      retries: 5
volumes:
  umami-db-data:
EOF

# 启动服务
docker-compose up -d
```

#### MySQL版本

```yaml
# docker-compose.yml MySQL版本配置
services:
  umami:
    image: sbsky112/umami-ip-feature:v2.19.0-mysql
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: mysql://umami:umami@db:3306/umami
      DATABASE_TYPE: mysql
      APP_SECRET: your-random-secret-string
    depends_on:
      - db
    restart: always
  db:
    image: mysql:8.0
    environment:
      MYSQL_DATABASE: umami
      MYSQL_USER: umami
      MYSQL_PASSWORD: umami
      MYSQL_ROOT_PASSWORD: rootpassword
    volumes:
      - umami-db-data:/var/lib/mysql
    restart: always
volumes:
  umami-db-data:
```

### 初始设置

1. 访问 http://localhost:3000
2. 使用默认账户登录：
   - 用户名: `admin`
   - 密码: `umami`
3. 首次登录后请立即修改密码

## 配置说明

### 环境变量

| 变量名 | 描述 | 默认值 | 必需 |
|--------|------|--------|------|
| `DATABASE_URL` | 数据库连接字符串 | - | ✅ |
| `DATABASE_TYPE` | 数据库类型 (postgresql/mysql) | - | ✅ |
| `APP_SECRET` | 应用密钥（用于加密） | - | ✅ |
| `CLIENT_IP_HEADER` | 自定义IP头名称 | - | ❌ |
| `IGNORE_IP` | 要忽略的IP地址列表 | - | ❌ |
| `DISABLE_IP_COLLECTION` | 禁用IP收集功能 | false | ❌ |

### IP地址收集配置

#### 支持的IP头（按优先级）

系统会自动按以下顺序检测IP地址：

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

#### 忽略特定IP

```bash
# 忽略单个IP
IGNORE_IP=192.168.1.1

# 忽略多个IP（用逗号分隔）
IGNORE_IP=192.168.1.1,10.0.0.1

# 忽略IP段（CIDR）
IGNORE_IP=192.168.1.0/24,10.0.0.0/8
```

## 使用指南

### 1. 添加网站

1. 登录后点击"添加网站"
2. 填写网站信息：
   - 网站名称
   - 网站域名
3. 点击保存

### 2. 安装追踪代码

系统会自动生成追踪代码，复制到您网站的`<head>`标签中：

```html
<script async defer src="http://localhost:3000/script.js" data-website-id="your-website-id"></script>
```

### 3. 查看IP地址

IP地址会在以下位置显示：

- **Sessions页面**：在会话列表中显示每个访问者的IP地址
- **Session详情页**：显示详细的会话信息，包括IP地址

## API参考

### 数据收集端点

```
POST /api/send
```

系统会自动收集以下数据：

- 页面URL
- 访问时间
- 用户代理
- 屏幕分辨率
- 语言
- **IP地址**（新增功能）
- 引用页面
- 国家/地区（基于IP）

## 数据库结构

### PostgreSQL/MySQL Schema

```sql
-- Session表新增字段
ALTER TABLE session ADD COLUMN "ipAddress" VARCHAR(45);

-- 创建索引优化查询
CREATE INDEX "session_ip_address_idx" ON session("ipAddress");
```

### ClickHouse Schema

```sql
-- website_event表新增字段
ALTER TABLE website_event ADD COLUMN ip_address String;
```

## 部署选项

### 1. Docker部署（推荐）

见上文快速开始部分

### 2. 直接部署

```bash
# 克隆项目
git clone https://github.com/your-repo/umami-ip-feature.git
cd umami-ip-feature

# 安装依赖
npm install

# 配置环境变量
cp .env.example .env
# 编辑.env文件，设置数据库连接等信息

# 构建项目
npm run build

# 启动服务
npm start
```

### 3. 云平台部署

#### Heroku

```bash
# 安装Heroku CLI
heroku create

# 添加PostgreSQL插件
heroku addons:create heroku-postgresql:hobby-dev

# 设置环境变量
heroku config:set APP_SECRET=$(openssl rand -base64 32)

# 部署
git push heroku main
```

#### Vercel

1. Fork项目到您的GitHub
2. 在Vercel中导入项目
3. 配置环境变量
4. 部署

## 开发指南

### 本地开发环境

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 在另一个终端启动数据库（如果使用Docker）
docker-compose up -d db
```

### 项目结构

```
umami-ip-feature/
├── db/                      # 数据库相关文件
│   ├── postgresql/          # PostgreSQL配置
│   ├── mysql/              # MySQL配置
│   └── clickhouse/         # ClickHouse配置
├── src/                    # 源代码
│   ├── app/                # Next.js应用路由
│   ├── components/         # React组件
│   ├── lib/                # 工具库
│   ├── queries/            # 数据库查询
│   └── tracker/            # 追踪脚本
├── public/                 # 静态资源
├── docker-compose.yml      # Docker配置
└── README.md              # 项目说明
```

## 故障排除

### 常见问题

1. **IP地址显示为127.0.0.1**
   - 检查是否使用了反向代理
   - 确认`CLIENT_IP_HEADER`环境变量设置正确

2. **数据库连接失败**
   - 确认数据库服务正在运行
   - 检查`DATABASE_URL`是否正确

3. **页面无法访问**
   - 确认端口3000未被占用
   - 检查防火墙设置

### 日志查看

```bash
# Docker容器日志
docker-compose logs -f umami

# 直接运行的日志
npm run dev  # 开发模式
npm start    # 生产模式
```

## 性能优化

### 数据库优化

1. IP地址字段已添加索引
2. 建议定期清理过期数据
3. 对于高流量网站，考虑使用ClickHouse

### 缓存配置

系统内置Redis支持，可通过以下配置启用：

```bash
# 环境变量
REDIS_URL=redis://localhost:6379
```

## 安全建议

1. **生产环境必须修改`APP_SECRET`**
2. **定期更新依赖**：`npm update`
3. **使用HTTPS**：配置SSL证书
4. **限制数据库访问**：使用防火墙规则
5. **定期备份数据**

## 隐私合规

### GDPR考虑

- IP地址被视为个人数据
- 建议在隐私政策中说明IP收集用途
- 提供数据删除选项
- 考虑IP地址匿名化

### IP匿名化

可以通过以下方式实现IP匿名化：

```javascript
// 在代码中修改IP处理逻辑
const anonymizeIP = (ip) => {
  if (ip.includes('.')) {
    // IPv4: 192.168.1.100 -> 192.168.1.0
    return ip.replace(/\.\d+$/, '.0');
  } else {
    // IPv6: 简化处理
    return ip.replace(/:(\d+:){3}\d+$/, ':0:0:0:0');
  }
};
```

## 更新日志

### v2.19.0-ip-feature
- ✅ 新增IP地址收集功能
- ✅ 支持多种CDN的IP头识别
- ✅ 数据库性能优化
- ✅ 前端IP地址显示
- ✅ Docker镜像构建

## 贡献指南

欢迎提交Issue和Pull Request！

1. Fork项目
2. 创建功能分支
3. 提交更改
4. 发起Pull Request

## 许可证

MIT License - 详见 [LICENSE](LICENSE) 文件

## 技术支持

- 📧 Email: support@example.com
- 🐛 Issues: [GitHub Issues](https://github.com/your-repo/umami-ip-feature/issues)
- 📖 文档: [Wiki](https://github.com/your-repo/umami-ip-feature/wiki)

---

**注意**：使用本软件请遵守当地法律法规，确保数据收集符合隐私保护要求。