# 安全配置提醒

在部署之前，请务必：

## 1. 环境变量配置

复制 `.env.example` 为 `.env` 并填入你的实际配置：

```bash
cp .env.example .env
```

**重要：请务必修改以下默认值：**

- `DATABASE_URL`: 使用你的实际数据库连接字符串
- `APP_SECRET`: 生成一个新的密钥（使用：`openssl rand -base64 32`）

## 2. 数据库安全

- 确保数据库不暴露在公网
- 使用强密码
- 考虑使用SSL连接数据库

## 3. 会话ID长度问题

如果遇到会话ID过长的错误，需要修改数据库：

```sql
ALTER TABLE session MODIFY session_id VARCHAR(255);
ALTER TABLE website_event MODIFY session_id VARCHAR(255);
```

## 4. 其他安全建议

- 定期更新依赖
- 启用HTTPS
- 配置防火墙规则
- 定期备份数据

## 5. 删除本文件

配置完成后，请删除此文件。