const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  // Check if setting table exists
  try {
    const tableExists = await prisma.$queryRaw`
      SELECT COUNT(*) as count 
      FROM information_schema.tables 
      WHERE table_schema = DATABASE() 
      AND table_name = 'setting'
    `;
    
    if (tableExists[0].count === 0) {
      await prisma.$executeRawUnsafe(`
        CREATE TABLE setting (
          setting_id VARCHAR(36) PRIMARY KEY,
          key VARCHAR(100) UNIQUE NOT NULL,
          value JSON,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
      `);
      
      await prisma.$executeRawUnsafe(`
        CREATE INDEX idx_setting_key ON setting(key)
      `);
      
      console.log('Setting table created successfully');
    } else {
      console.log('Setting table already exists');
    }
  } catch (error) {
    console.error('Error creating setting table:', error);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });