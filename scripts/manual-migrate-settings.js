#!/usr/bin/env node

/**
 * 手动执行数据库迁移脚本
 * 用于在生产环境中手动创建 settings 表
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function runMigration() {
  try {
    console.log('Running Prisma migration for settings table...');
    
    // 使用 Prisma 执行原始 SQL
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "setting" (
        "setting_id" UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        "key" VARCHAR(100) UNIQUE NOT NULL,
        "value" JSONB,
        "created_at" TIMESTAMPTZ(6) DEFAULT NOW(),
        "updated_at" TIMESTAMPTZ(6) DEFAULT NOW()
      )
    `;
    
    console.log('Settings table created successfully.');
    
    // 创建索引
    try {
      await prisma.$executeRaw`
        CREATE UNIQUE INDEX IF NOT EXISTS "setting_key_key" ON "setting"("key")
      `;
      console.log('Index created successfully.');
    } catch (e) {
      console.log('Index might already exist:', e.message);
    }
    
    // 插入默认的 Turnstile 设置
    try {
      await prisma.$executeRaw`
        INSERT INTO "setting" (setting_id, key, value, created_at, updated_at)
        VALUES (
          gen_random_uuid(),
          'turnstile',
          '{"enabled": false, "siteKey": ""}',
          NOW(),
          NOW()
        )
        ON CONFLICT (key) DO NOTHING;
      `;
      
      console.log('Default Turnstile settings inserted.');
    } catch (e) {
      console.log('Default settings might already exist:', e.message);
    }
    
  } catch (error) {
    console.error('Migration failed:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runMigration();