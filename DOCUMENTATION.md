# 文档索引

欢迎阅读 Umami IP 地址功能版本的文档。本文档帮助您快速了解和使用本系统。

## 📖 文档结构

### 入门指南
- **[README.md](README.md)** - 完整使用文档（推荐先阅读）
  - 项目简介和特性
  - 快速开始指南
  - 配置说明
  - 使用指南
  - 部署选项
  - 故障排除

- **[QUICKSTART.md](QUICKSTART.md)** - 5分钟快速上手
  - 最简单的部署方式
  - 首次使用步骤
  - 常见问题快速解决

### 部署指南
- **[docker-deployment.md](docker-deployment.md)** - Docker 部署详细指南
  - 可用镜像说明
  - Docker Compose 配置
  - 生产环境部署
  - 维护和升级

### 配置说明
- **[configuration-guide.md](configuration-guide.md)** - 配置参数详解
  - 环境变量完整列表
  - IP 收集配置
  - 性能优化配置
  - 安全配置

### 技术文档
- **[IP_ADDRESS_FEATURE.md](IP_ADDRESS_FEATURE.md)** - 技术实现文档
  - 功能架构说明
  - 代码实现细节
  - 数据库结构
  - 扩展开发指南

- **[CHANGELOG.md](CHANGELOG.md)** - 版本更新日志
  - 版本历史记录
  - 新功能说明
  - 问题修复记录

### 配置文件
- **[.env.example](.env.example)** - 环境变量示例
  - 所有可配置的环境变量
  - 配置示例和说明

## 🚀 快速开始

1. **选择部署方式**
   - Docker 部署（推荐）：查看 [QUICKSTART.md](QUICKSTART.md)
   - 直接部署：查看 [README.md](README.md)

2. **配置系统**
   - 基础配置：查看 [configuration-guide.md](configuration-guide.md)
   - IP 功能配置：查看 [IP_ADDRESS_FEATURE.md](IP_ADDRESS_FEATURE.md)

3. **生产环境**
   - Docker 部署优化：查看 [docker-deployment.md](docker-deployment.md)
   - 安全配置：查看 [configuration-guide.md](configuration-guide.md#安全配置)

## 🛠️ 常见任务

### 添加网站
1. 登录管理后台
2. 点击"添加网站"
3. 填写网站信息
4. 复制追踪代码到网站

### 查看IP地址
- 进入 Sessions 页面查看所有访客IP
- 点击具体会话查看详细信息

### 配置IP过滤
```bash
# 忽略特定IP
IGNORE_IP=192.168.1.1,10.0.0.0/8
```

### 升级系统
```bash
# Docker 升级
docker pull sbsky112/umami-ip-feature:v2.19.0-postgres
docker-compose up -d --force-recreate
```

## 🔍 问题排查

### IP 地址获取问题
- 检查反向代理配置
- 确认 CLIENT_IP_HEADER 设置
- 查看 [IP_ADDRESS_FEATURE.md](IP_ADDRESS_FEATURE.md#故障排除)

### 数据库连接问题
- 验证数据库服务状态
- 检查 DATABASE_URL 格式
- 查看 [configuration-guide.md](configuration-guide.md#常见问题)

### 性能问题
- 配置数据库连接池
- 启用 Redis 缓存
- 查看 [configuration-guide.md](configuration-guide.md#性能优化)

## 📞 获取帮助

- 🐛 **报告问题**：[GitHub Issues](https://github.com/your-repo/umami-ip-feature/issues)
- 💬 **讨论交流**：[GitHub Discussions](https://github.com/your-repo/umami-ip-feature/discussions)
- 📧 **邮件支持**：support@example.com

## 📝 文档贡献

欢迎帮助改进文档！

1. Fork 项目
2. 创建文档改进分支
3. 提交更改
4. 发起 Pull Request

---

**提示**：如果您是第一次使用，建议从 [README.md](README.md) 开始阅读。