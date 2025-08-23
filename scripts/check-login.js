#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

async function checkDatabase() {
  console.log('Checking database connectivity...\n');

  // Check environment variables
  const requiredEnvVars = ['DATABASE_URL', 'APP_SECRET'];
  const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

  if (missingEnvVars.length > 0) {
    console.error('❌ Missing required environment variables:');
    missingEnvVars.forEach(varName => {
      console.error(`   - ${varName}`);
    });
    console.error('\nPlease set these variables in your .env file');
    process.exit(1);
  }

  console.log('✅ Environment variables are set');

  // Check database connection
  const prisma = new PrismaClient({
    errorFormat: 'pretty',
  });

  try {
    await prisma.$connect();
    console.log('✅ Database connection successful');

    // Check if users table exists and has data
    const userCount = await prisma.user.count();
    console.log(`✅ Found ${userCount} user(s) in the database`);

    if (userCount === 0) {
      console.log('\n⚠️  No users found. You may need to create an admin user.');
      console.log('   Default credentials: admin / umami');
    }

    await prisma.$disconnect();
    console.log('\n✅ All checks passed! The login should work now.');
    
  } catch (error) {
    console.error('\n❌ Database connection failed:');
    console.error(error.message);
    
    if (error.message.includes('Connection refused')) {
      console.error('\nMake sure your database server is running.');
    } else if (error.message.includes('does not exist')) {
      console.error('\nMake sure the database exists.');
      console.error('Run: npm run update-db');
    }
    
    process.exit(1);
  }
}

checkDatabase().catch(console.error);