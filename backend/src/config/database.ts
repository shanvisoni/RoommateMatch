import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
});

// Enhanced connection testing with retry logic
async function connectWithRetry(maxRetries = 5, delay = 2000): Promise<boolean> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      await prisma.$connect();
      console.log('✅ Connected to PostgreSQL database via Prisma');
      return true;
    } catch (err) {
      console.error(`❌ Database connection attempt ${i + 1} failed:`, err);
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
