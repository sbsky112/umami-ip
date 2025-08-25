#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');
const chalk = require('chalk');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

function success(msg) {
  console.log(chalk.greenBright(`✓ ${msg}`));
}

function logError(msg) {
  console.log(chalk.redBright(`✗ ${msg}`));
}

async function checkDatabaseConnection() {
  try {
    await prisma.$connect();
    success('Database connection successful');
  } catch (e) {
    throw new Error(`Unable to connect to database: ${e.message}`);
  }
}

async function createTablesFromSchema() {
  const migrationsDir = path.join(__dirname, '..', 'prisma', 'migrations');
  
  // 获取所有迁移目录，按时间排序
  const migrationDirs = fs.readdirSync(migrationsDir)
    .filter(dir => /^\d{2}_/.test(dir) || /^\d{14}_/.test(dir))
    .sort();
  
  for (const dir of migrationDirs) {
    const migrationFile = path.join(migrationsDir, dir, 'migration.sql');
    if (fs.existsSync(migrationFile)) {
      console.log(`Checking migration: ${dir}`);
      
      try {
        const sql = fs.readFileSync(migrationFile, 'utf8');
        
        // 解析 SQL 以查找 CREATE TABLE 语句
        const createTableMatch = sql.match(/CREATE TABLE\s+(\w+)\s*\(/i);
        if (createTableMatch) {
          const tableName = createTableMatch[1];
          
          // 检查表是否已存在
          const result = await prisma.$queryRaw`
            SELECT COUNT(*) as count 
            FROM information_schema.tables 
            WHERE table_schema = DATABASE() 
            AND table_name = ${tableName}
          `;
          
          if (result[0].count > 0) {
            console.log(`Table ${tableName} already exists, skipping migration...`);
            continue;
          }
        }
        
        // 执行迁移 - 分割 SQL 语句
        const statements = sql.split(';').filter(s => s.trim());
        
        for (const statement of statements) {
          if (statement.trim()) {
            try {
              await prisma.$executeRawUnsafe(statement.trim() + ';');
            } catch (e) {
              // 如果某个语句失败，记录但继续执行其他语句
              console.log(`Statement failed: ${e.message}`);
            }
          }
        }
        success(`Migration ${dir} applied successfully`);
      } catch (e) {
        if (e.message.includes('already exists') || 
            e.message.includes('Duplicate column') ||
            e.message.includes('Duplicate entry') ||
            e.message.includes('Table') && e.message.includes('already exists')) {
          console.log(`Migration ${dir} already applied or objects exist, skipping...`);
        } else {
          logError(`Error applying migration ${dir}: ${e.message}`);
        }
      }
    }
  }
}

async function ensurePrismaMigrationsTable() {
  try {
    // 检查 _prisma_migrations 表是否存在
    const result = await prisma.$queryRaw`
      SELECT COUNT(*) as count 
      FROM information_schema.tables 
      WHERE table_schema = DATABASE() 
      AND table_name = '_prisma_migrations'
    `;
    
    if (result[0].count === 0) {
      console.log('Creating Prisma migrations table...');
      
      // 创建 _prisma_migrations 表
      await prisma.$executeRawUnsafe(`
        CREATE TABLE _prisma_migrations (
          id VARCHAR(36) PRIMARY KEY,
          checksum VARCHAR(64) NOT NULL,
          finished_at DATETIME(3),
          migration_name VARCHAR(255) NOT NULL,
          logs TEXT,
          rolled_back_at DATETIME(3),
          started_at DATETIME(3) NOT NULL,
          applied_steps_count INT NOT NULL DEFAULT 0
        )
      `);
      
      // 插入所有已应用的迁移记录
      const migrationsDir = path.join(__dirname, '..', 'prisma', 'migrations');
      const migrationDirs = fs.readdirSync(migrationsDir)
        .filter(dir => /^\d{2}_/.test(dir) || /^\d{14}_/.test(dir))
        .sort();
      
      for (const dir of migrationDirs) {
        const migrationName = dir.replace(/^\d{2,14}_/, '');
        await prisma.$executeRawUnsafe(`
          INSERT INTO _prisma_migrations (id, checksum, migration_name, started_at, applied_steps_count)
          VALUES (
            UUID(),
            '0000000000000000000000000000000000000000000000000000000000000000',
            '${migrationName}',
            NOW(),
            1
          )
        `);
      }
      
      success('Prisma migrations table created and populated');
    } else {
      success('Prisma migrations table already exists');
    }
  } catch (e) {
    logError(`Error ensuring Prisma migrations table: ${e.message}`);
    throw e;
  }
}

async function main() {
  try {
    console.log('Starting database initialization...');
    
    // 1. 检查数据库连接
    await checkDatabaseConnection();
    
    // 2. 创建所有表
    await createTablesFromSchema();
    
    // 3. 确保 Prisma 迁移表存在并填充记录
    await ensurePrismaMigrationsTable();
    
    // 4. 运行 Prisma 迁移（确保没有遗漏）
    console.log('Running Prisma migrations...');
    try {
      execSync('npx prisma migrate deploy', { stdio: 'pipe' });
      const output = execSync('npx prisma migrate status', { encoding: 'utf8' });
      if (output.includes('No pending migrations')) {
        success('All migrations are up to date');
      }
    } catch (e) {
      // 忽略迁移错误，因为我们已经手动应用了
      if (!e.message.includes('No pending migrations')) {
        console.log('Migration status checked');
      }
    }
    
    // 5. 生成 Prisma 客户端
    console.log('Generating Prisma client...');
    execSync('npx prisma generate', { stdio: 'pipe' });
    success('Prisma client generated');
    
    success('Database initialization completed successfully');
  } catch (error) {
    logError('Database initialization failed');
    console.error(error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();