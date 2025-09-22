import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

// Test the connection
prisma.$connect()
  .then(() => {
    console.log('✅ Connected to PostgreSQL database via Prisma');
  })
  .catch((err) => {
    console.error('❌ Database connection error:', err);
  });

export default prisma;
