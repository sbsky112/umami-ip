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
NEXT_PUBLIC_TURNSTILE_SITE_KEY=your-site-key-here
TURNSTILE_SECRET_KEY=your-secret-key-here
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

### 语言设置

Umami 支持 46 种语言，包括：

- 中文（简体、繁体）
- 英语（美国、英国）
- 日语、韩语
- 阿拉伯语、希伯来语（支持从右到左显示）
- 西班牙语、法语、德语、意大利语
- 俄语、乌克兰语
- 以及更多语言...

#### 如何切换语言

1. **个人设置中切换**：
   - 点击右上角的个人资料头像
   - 选择"设置"（Settings）
   - 在"语言"（Language）下拉菜单中选择您偏好的语言
   - 点击"保存"（Save）

2. **使用语言按钮**：
   - 在界面中找到地球图标 🌐
   - 点击图标打开语言选择菜单
   - 从列表中选择您的语言

#### 自动语言检测

- Umami 会根据您的浏览器语言设置自动选择合适的语言
- 如果浏览器语言不在支持列表中，将默认使用英语（en-US）

#### 添加新语言

要添加新的语言支持：

1. 在 `src/lang/` 目录下创建新的语言文件
2. 翻译所有文本内容
3. 在 `src/lib/lang.ts` 中注册新语言
4. 提交拉取请求

### 日期和时间格式

Umami 会根据所选语言自动调整：
- 日期格式（如 YYYY-MM-DD 或 DD/MM/YYYY）
- 时间格式（12小时制或24小时制）
- 数字格式（千位分隔符等）

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

### 故障排除

#### Docker 构建问题

如果遇到 `frozen-lockfile` 错误：

```bash
# 更新 pnpm-lock.yaml
pnpm install

# 然后重新构建
docker build .
```

#### 语言显示问题

如果遇到语言切换问题或空白下拉菜单：

1. 确保浏览器控制台没有错误
2. 检查网络连接，语言文件需要从服务器加载
3. 尝试清除浏览器缓存和 Cookie
4. 如果问题持续，请提交 issue

## 贡献

1. fork 代码库
2. 创建功能分支
3. 进行更改
4. 提交拉取请求

## 许可证

MIT 许可证 - 详情请参阅 [LICENSE](LICENSE) 文件。