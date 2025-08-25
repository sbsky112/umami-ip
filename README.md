# Umami

一款简单、快速、注重隐私的 Google Analytics 替代方案。

## 功能

- 📊 **网站分析**：页面浏览量、访客、会话和实时数据
- 🔒 **注重隐私**：默认无需 Cookie，符合 GDPR 标准
- 🚀 **高性能**：优化的数据库结构和查询
- 🌍 **多语言支持**：支持 46 种语言
- 📱 **响应式设计**：适用于所有设备
- 🎨 **暗黑模式**：内置暗黑主题支持
- 👥 **团队支持**：与团队成员协作
- 🏷️ **事件追踪**：追踪自定义事件
- 📈 **漏斗分析**：了解转化率
- 🔄 **数据导出**：以多种格式导出数据
- 🛡️ **登录保护**：集成 Cloudflare Turnstile 验证码，防止自动化攻击

## 入门指南

### 先决条件

- Node.js 18+
- 数据库（PostgreSQL 或MySQL)

### 安装

1. **克隆仓库**
```bash
git clone https://github.com/yourusername/umami.git
cd umami
```

2. **安装依赖项**
```bash
npm install
```

3. **配置环境变量**
```bash
cp .env.example .env
```
使用你的数据库配置编辑 `.env` 文件：
```
DATABASE_URL=postgresql://username:password@localhost:5432/umami
DATABASE_TYPE=postgresql
APP_SECRET=your-secret-key
```

4. **设置数据库**
```bash
npm run build-db
```

5. **启动应用程序**
```bash
npm start
```

访问通过 `http://localhost:3000` 访问 Umami。

### Docker 部署

#### PostgreSQL
```bash
docker run -d \
--name umami \
-p 3000:3000 \
-e DATABASE_URL=postgresql://用户名:密码@主机:端口/数据库 \
-e DATABASE_TYPE=postgresql \
-e APP_SECRET=你的密钥 \
umamisoftware/umami:postgresql-latest
```

#### MySQL
```bash
docker run -d \
--name umami \
-p 3000:3000 \
-e DATABASE_URL=mysql://用户名:密码@主机:端口/数据库 \
-e DATABASE_TYPE=mysql \
-e APP_SECRET=你的密钥 \
umamisoftware/umami:mysql-latest
```

##配置

### 环境变量

- `DATABASE_URL`：数据库连接字符串
- `DATABASE_TYPE`：数据库类型（postgresql 或 mysql）
- `APP_SECRET`：用于签名会话的密钥
- `DISABLE_LOGIN`：禁用登录页面（默认值：false）
- `FORCE_SSL`：强制使用 HTTPS（默认值：false）

### Cloudflare Turnstile 配置

Umami 现已集成 Cloudflare Turnstile 验证码功能，用于保护登录页面免受自动化攻击。

#### 启用 Turnstile

1. 登录到 Umami 管理后台
2. 进入 **设置** > **全局设置**
3. 找到 **登录保护** 部分
4. 启用 **Turnstile 验证码** 开关
5. 输入您的 Cloudflare Turnstile 站点密钥
6. 保存设置

#### 获取 Turnstile 站点密钥

1. 访问 [Cloudflare Turnstile 控制台](https://dash.cloudflare.com/?to=/:account/turnstile)
2. 登录您的 Cloudflare 账户
3. 点击 **添加站点**
4. 选择 **Widget 类型** 为 **托管**
5. 输入您的域名
6. 接受服务条款
7. 复制 **站点密钥** 和 **密钥对**

#### 延迟加载功能

Turnstile 验证码采用延迟加载技术：
- 初始访问登录页面时，不会加载验证码相关资源
- 只有在用户点击登录按钮后，才会加载并显示验证码
- 验证成功后，表单会自动提交
- 如果用户修改用户名或密码，验证码会自动隐藏，下次点击登录时重新显示

这种设计提高了页面加载速度，并优化了用户体验。

### 跟踪代码

将此脚本添加到您网站的 `<head>` 部分：
```html
<script async src="https://your-umami-domain.com/script.js" data-website-id="your-website-id"></script>
```

## 开发

### 开发设置

1. 安装依赖项
```bash
npm install
```

2. 启动开发服务器
```bash
npm run dev
```

### 可用脚本

- `npm run dev` - 启动开发服务器
- `npm run build` -生产环境构建
- `npm run start` - 启动生产服务器
- `npm run build-db` - 构建数据库客户端
- `npm run check-db` - 检查数据库连接

## 贡献

1. fork 代码库
2. 创建功能分支
3. 进行更改
4. 提交拉取请求

## 许可证

MIT 许可证 - 详情请参阅 [LICENSE](LICENSE) 文件。