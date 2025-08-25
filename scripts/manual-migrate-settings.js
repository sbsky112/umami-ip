#!/usr/bin/env node

/**
 * 手动执行数据库迁移脚本
 * 用于在生产环境中手动创建 settings 表
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function runMigration() {
  try {
    // 检查是否已存在 settings 表
    try {
      await prisma.$queryRaw`SELECT 1 FROM setting LIMIT 1`;
      console.log('Settings table already exists.');
      return;
    } catch (e) {
      // 表不存在，继续创建
      console.log('Settings table does not exist, creating...');
    }

    // 获取数据库类型
    const databaseType = process.env.DATABASE_TYPE || 
      (process.env.DATABASE_URL?.startsWith('postgres') ? 'postgresql' : 'mysql');

    // 读取迁移文件
    const migrationFile = path.join(__dirname, '..', 'db', databaseType, 'migrations', '20240824_add_settings_table.sql');
    
    if (!fs.existsSync(migrationFile)) {
      throw new Error(`Migration file not found: ${migrationFile}`);
    }

    const sql = fs.readFileSync(migrationFile, 'utf8');
    
    // 执行迁移
    await prisma.$executeRawUnsafe(sql);
    
    console.log('Settings table created successfully.');
    
    // 插入默认的 Turnstile 设置
    if (databaseType === 'postgresql') {
      await prisma.$executeRaw`
        INSERT INTO setting (setting_id, key, value, created_at, updated_at)
        VALUES (
          gen_random_uuid(),
          'turnstile',
          '{"enabled": false, "siteKey": ""}',
          NOW(),
          NOW()
        )
        ON CONFLICT (key) DO NOTHING;
      `;
    } else {
      // MySQL
      const uuid = require('crypto').randomUUID();
      await prisma.$executeRaw`
        INSERT INTO setting (setting_id, key, value, created_at, updated_at)
        VALUES (
          ${uuid},
          'turnstile',
          '{"enabled": false, "siteKey": ""}',
          NOW(),
          NOW()
        )
        ON DUPLICATE KEY UPDATE key = key;
      `;
    }
    
    console.log('Default Turnstile settings inserted.');
    
  } catch (error) {
    console.error('Migration failed:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runMigration();