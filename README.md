# Umami IP地址功能 - 快速部署指南

## 文件结构

```
umami-ip-feature/
├── db/
│   ├── postgresql/
│   │   ├── schema.prisma
│   │   └── migrations/14_add_ip_address/migration.sql
│   ├── mysql/
│   │   ├── schema.prisma
│   │   └── migrations/14_add_ip_address/migration.sql
│   └── clickhouse/
│       └── migrations/09_add_ip_address.sql
├── src/
│   ├── queries/
│   │   └── sql/
│   │       ├── sessions/
│   │       │   ├── createSession.ts
│   │       │   ├── getWebsiteSessions.ts
│   │       │   └── getWebsiteSession.ts
│   │       └── events/
│   │           └── saveEvent.ts
│   └── app/
│       └── api/
│           └── send/
│               └── route.ts
└── IP_ADDRESS_FEATURE.md
```

## 部署步骤

1. **备份现有项目**
   ```bash
   cp -r /path/to/umami /path/to/umami-backup
   ```

2. **复制修改文件**
   ```bash
   # 将 umami-ip-feature 文件夹中的文件复制到您的 umami 项目根目录
   cp -r umami-ip-feature/* /path/to/umami/
   ```

3. **应用数据库迁移**
   ```bash
   # PostgreSQL
   cd /path/to/umami
   npx prisma migrate dev --name add_ip_address
   
   # MySQL
   npx prisma migrate dev --name add_ip_address
   
   # ClickHouse
   # 执行 db/clickhouse/migrations/09_add_ip_address.sql 中的SQL语句
   ```

4. **重新构建项目**
   ```bash
   npm install
   npm run build
   ```

5. **重启服务**
   ```bash
   npm start
   ```

## 验证功能

1. 访问网站，生成一些访问数据
2. 在umami后台查看Sessions列表，确认IP地址列显示正常
3. 点击进入Session详情页，确认IP地址信息正确显示

## 注意事项

- 确保遵守当地数据隐私法规
- IP地址收集功能默认启用
- 建议在生产环境部署前先在测试环境验证