import { PrismaClient } from '@prisma/client';

// Enhanced Prisma configuration for production
const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
});

// Validate database URL
function validateDatabaseUrl() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    throw new Error('DATABASE_URL environment variable is not set');
  }
  
  // Check if it's a valid PostgreSQL URL
  if (!dbUrl.startsWith('postgresql://') && !dbUrl.startsWith('postgres://')) {
    throw new Error('DATABASE_URL must be a valid PostgreSQL connection string');
  }
  
  console.log('✅ Database URL validation passed');
  console.log('🔍 Database host:', dbUrl.split('@')[1]?.split(':')[0] || 'Unknown');
  return true;
}

// Enhanced connection testing with retry logic
async function connectWithRetry(maxRetries = 5, delay = 2000): Promise<boolean> {
  // First validate the database URL
  try {
    validateDatabaseUrl();
  } catch (err) {
    console.error('❌ Database URL validation failed:', err);
    throw err;
  }

  for (let i = 0; i < maxRetries; i++) {
    try {
      console.log(`🔄 Database connection attempt ${i + 1}/${maxRetries}`);
      await prisma.$connect();
      console.log('✅ Connected to PostgreSQL database via Prisma');
      
      // Test the connection with a simple query
      await prisma.$queryRaw`SELECT 1 as test`;
      console.log('✅ Database query test successful');
      return true;
    } catch (err: any) {
      console.error(`❌ Database connection attempt ${i + 1} failed:`, {
        message: err?.message,
        code: err?.code,
        meta: err?.meta
      });
      console.error('Database URL:', process.env.DATABASE_URL ? 'Set' : 'Not set');
      console.error('Environment:', process.env.NODE_ENV);
      
      if (i === maxRetries - 1) {
        console.error('❌ All database connection attempts failed');
        throw err;
      }
      
      console.log(`⏳ Retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  return false; // This should never be reached due to throw above
}

// Test the connection with retry logic
connectWithRetry()
  .catch((err) => {
    console.error('❌ Final database connection error:', err);
    process.exit(1);
  });

export default prisma;
