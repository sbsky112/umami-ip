# 数据库结构自动更新

## 问题描述

项目在构建时没有自动更新数据库结构，导致 `/api/public/settings/turnstile` 和 `/api/auth/login` 等接口异常。原因是 `setting` 表没有正确创建，而 Prisma 迁移文件位置不正确。

## 解决方案

### 1. 修复迁移文件位置

将 `20240824_add_settings_table.sql` 文件从 `prisma/migrations/` 目录移动到正确的迁移目录结构中：
```
prisma/migrations/20240824120000_add_settings_table/migration.sql
```

### 2. 创建数据库初始化脚本

创建了 `scripts/init-database.js` 脚本，用于：
- 检查并创建 `setting` 表（如果不存在）
- 运行所有待执行的数据库迁移

### 3. 更新构建脚本

在 `package.json` 中添加了新的脚本：
- `init-db`: 运行数据库初始化脚本
- 更新了 `build` 和 `build-docker` 脚本，在构建过程中包含数据库初始化

## 构建流程

现在的构建流程包含以下步骤：
1. `check-env` - 检查环境变量
2. `init-db` - 初始化数据库结构
3. `build-db` - 构建数据库相关文件
4. `check-db` - 检查数据库连接和运行迁移
5. `build-tracker` - 构建追踪器
6. `build-geo` - 构建地理位置数据
7. `build-app` - 构建应用程序

## 使用方法

### 开发环境
```bash
npm run build
```

### Docker 部署
```bash
docker-compose up -d
```

### 单独初始化数据库
```bash
npm run init-db
```

## 注意事项

- 确保数据库连接信息正确配置在 `.env` 文件中
- 数据库用户需要有创建表和索引的权限
- 迁移是幂等的，可以安全地多次运行
- Docker 部署时会自动执行数据库初始化