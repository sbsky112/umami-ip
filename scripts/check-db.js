/* eslint-disable no-console */
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const chalk = require('chalk');
const { execSync } = require('child_process');
const semver = require('semver');
const fs = require('fs');
const path = require('path');

if (process.env.SKIP_DB_CHECK) {
  console.log('Skipping database check.');
  process.exit(0);
}

function getDatabaseType(url = process.env.DATABASE_URL) {
  const type = url && url.split(':')[0];

  if (type === 'postgres') {
    return 'postgresql';
  }

  return type;
}

const prisma = new PrismaClient();

function success(msg) {
  console.log(chalk.greenBright(`✓ ${msg}`));
}

function error(msg) {
  console.log(chalk.redBright(`✗ ${msg}`));
}

async function checkEnv() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not defined.');
  } else {
    success('DATABASE_URL is defined.');
  }
}

async function checkConnection() {
  try {
    await prisma.$connect();

    success('Database connection successful.');
  } catch (e) {
    throw new Error('Unable to connect to the database: ' + e.message);
  }
}

async function checkDatabaseVersion() {
  const query = await prisma.$queryRaw`select version() as version`;
  const version = semver.valid(semver.coerce(query[0].version));

  const databaseType = getDatabaseType();
  const minVersion = databaseType === 'postgresql' ? '9.4.0' : '5.7.0';

  if (semver.lt(version, minVersion)) {
    throw new Error(
      `Database version is not compatible. Please upgrade ${databaseType} version to ${minVersion} or greater`,
    );
  }

  success('Database version check successful.');
}

async function checkV1Tables() {
  try {
    // check for v1 migrations before v2 release date
    const record =
      await prisma.$queryRaw`select * from _prisma_migrations where started_at < '2023-04-17'`;

    if (record.length > 0) {
      error(
        'Umami v1 tables detected. For how to upgrade from v1 to v2 go to https://umami.is/docs/migrate-v1-v2.',
      );
      process.exit(1);
    }
  } catch (e) {
    // Ignore
  }
}

async function applyMigration() {
  if (!process.env.SKIP_DB_MIGRATION) {
    try {
      console.log(execSync('prisma migrate deploy').toString());
      success('Database is up to date.');
    } catch (e) {
      // 如果数据库是空的，需要 baseline
      if (e.message.includes('P3005') || e.message.includes('database schema is not empty')) {
        console.log('Database schema is not empty, checking if tables were created by init-db...');
        
        // 检查是否有表
        const tables = await prisma.$queryRaw`SHOW TABLES`;
        const tableNames = tables.map(t => Object.values(t)[0]).filter(t => t !== '_prisma_migrations');
        
        if (tableNames.length > 0) {
          // 如果有表，说明 init-db 已经创建了表，我们需要 baseline
          console.log('Tables found, creating baseline...');
          // 获取所有迁移并标记为已应用
          
          const migrationsDir = path.join(__dirname, '..', 'prisma', 'migrations');
          const migrationDirs = fs.readdirSync(migrationsDir)
            .filter(dir => /^\d{14}_/.test(dir))
            .sort();
          
          for (const dir of migrationDirs) {
            execSync(`npx prisma migrate resolve --applied ${dir}`, { stdio: 'inherit' });
          }
          success('Database baseline created.');
        } else {
          // 如果没有表，删除可能的 _prisma_migrations 表并重新开始
          await prisma.$executeRaw`DROP TABLE IF EXISTS _prisma_migrations`;
          console.log('Cleaned up migration table, you can run build again.');
          process.exit(0);
        }
      } else {
        throw e;
      }
    }
  }
}

(async () => {
  let err = false;
  for (let fn of [checkEnv, checkConnection, checkDatabaseVersion, checkV1Tables, applyMigration]) {
    try {
      await fn();
    } catch (e) {
      error(e.message);
      err = true;
    } finally {
      await prisma.$disconnect();
      if (err) {
        process.exit(1);
      }
    }
  }
})();
