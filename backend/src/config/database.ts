import { PrismaClient } from '@prisma/client';

// Enhanced Prisma configuration for production with proper connection pooling
const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'production' ? ['error'] : ['query', 'info', 'warn', 'error'],
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

// Enhanced connection testing with retry logic and Supabase-specific handling
async function connectWithRetry(maxRetries = 5, delay = 2000): Promise<boolean> {
  // First validate the database URL
  try {
    validateDatabaseUrl();
  } catch (err) {
    console.error('❌ Database URL validation failed:', err);
    throw err;
  }

  // Check if we're using Supabase and provide specific guidance
  const dbUrl = process.env.DATABASE_URL || '';
  if (dbUrl.includes('supabase.co')) {
    console.log('🔍 Detected Supabase database connection');
    console.log('💡 Using optimized connection settings for Supabase');
  }

  for (let i = 0; i < maxRetries; i++) {
    try {
      console.log(`🔄 Database connection attempt ${i + 1}/${maxRetries}`);
      
      // For production, add a small delay before connection
      if (process.env.NODE_ENV === 'production' && i > 0) {
        console.log('⏳ Production delay before retry...');
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
      
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
      
      // Enhanced error handling for Supabase-specific issues
      if (err?.code === 'P1001') {
        console.log('🔍 P1001 error detected - connection refused');
        console.log('💡 This is likely a Supabase connection issue. Possible causes:');
        console.log('   1. Supabase project is paused (check Supabase dashboard)');
        console.log('   2. Database URL has incorrect PgBouncer settings');
        console.log('   3. Network connectivity issues from Render to Supabase');
        console.log('   4. Connection pooler is not accessible');
        
        // For Supabase, try longer delays
        delay = Math.min(delay * 1.5, 15000); // Increase delay up to 15 seconds
      }
      
      if (i === maxRetries - 1) {
        console.error('❌ All database connection attempts failed');
        console.error('💡 Supabase Connection Troubleshooting:');
        console.error('   1. Check if your Supabase project is active (not paused)');
        console.error('   2. Verify DATABASE_URL format in Render environment variables');
        console.error('   3. Try using direct connection URL (without pgbouncer)');
        console.error('   4. Check Supabase project settings for connection limits');
        throw err;
      }
      
      console.log(`⏳ Retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  return false; // This should never be reached due to throw above
}

// Connection will be established lazily when first query is made
// This prevents blocking server startup if database is temporarily unavailable
// You can still test connection using connectWithRetry() when needed

// Export the connect function for manual testing if needed
export { connectWithRetry };

export default prisma;
