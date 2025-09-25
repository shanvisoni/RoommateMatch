import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
});

// Test the connection
prisma.$connect()
  .then(() => {
    console.log('✅ Connected to PostgreSQL database via Prisma');
  })
  .catch((err) => {
    console.error('❌ Database connection error:', err);
    console.error('Database URL:', process.env.DATABASE_URL ? 'Set' : 'Not set');
  });

export default prisma;
