import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { createServer } from 'http';
import { Server } from 'socket.io';

// Import routes
import authRoutes from './routes/auth';
import profileRoutes from './routes/profile';
import matchingRoutes from './routes/matching';
import messagingRoutes from './routes/messaging';
import savedProfilesRoutes from './routes/savedProfiles';
import connectionsRoutes from './routes/connections';
import feedbackRoutes from './routes/feedback';

// Import middleware
import { errorHandler } from './middleware/errorHandler';
import { notFound } from './middleware/notFound';

// Load environment variables
dotenv.config();

const app = express();
const server = createServer(app);

// Define allowed origins
const allowedOrigins = [
  process.env.CORS_ORIGIN || "http://localhost:3000",
  "https://roommate-match.vercel.app",
  "https://roommate-match-fsmmvo1na-shanvis-projects-43b92a07.vercel.app",
  "https://roommate-match-git-main-shanvis-projects-43b92a07.vercel.app",
  "https://roommate-match-kyeigx92q-shanvis-projects-43b92a07.vercel.app"
];

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true
  }
});

// Middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(cors({
  origin: allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files from uploads directory with proper CORS
app.use('/uploads', (req, res, next) => {
  // Set CORS headers for image requests
  res.header('Access-Control-Allow-Origin', process.env.CORS_ORIGIN || '*');
  res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  next();
}, express.static('uploads'));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/matching', matchingRoutes);
app.use('/api/messaging', messagingRoutes);
app.use('/api/saved-profiles', savedProfilesRoutes);
app.use('/api/connections', connectionsRoutes);
app.use('/api/feedback', feedbackRoutes);

// Root route
app.get('/', (req, res) => {
  res.json({
    message: 'RoomieMatch Backend API',
    status: 'Running',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    cors_origin: process.env.CORS_ORIGIN || 'http://localhost:3000'
  });
});

// Database health check
app.get('/api/health/db', async (req, res) => {
  try {
    console.log('🔍 Starting database health check...');
    console.log('🔍 Database URL set:', !!process.env.DATABASE_URL);
    console.log('🔍 Database URL preview:', process.env.DATABASE_URL?.substring(0, 20) + '...');
    
    const prisma = require('./config/database').default;
    
    // Test basic connection
    await prisma.$connect();
    console.log('✅ Prisma connection successful');
    
    // Test with a simple query
    const result = await prisma.$queryRaw`SELECT 1 as test, NOW() as current_time`;
    console.log('✅ Database query successful:', result);
    
    res.json({
      status: 'OK',
      database: 'Connected',
      query_result: result,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('❌ Database health check failed:', {
      message: error?.message,
      code: error?.code,
      meta: error?.meta
    });
    res.status(500).json({
      status: 'ERROR',
      database: 'Disconnected',
      error: error?.message || 'Unknown database error',
      error_code: error?.code,
      timestamp: new Date().toISOString(),
      troubleshooting: {
        message: 'If this is a Supabase database, check:',
        steps: [
          '1. Verify Supabase project is active (not paused)',
          '2. Check DATABASE_URL format and credentials',
          '3. Ensure network connectivity to Supabase',
          '4. Try direct connection URL without pgbouncer'
        ]
      }
    });
  }
});

// CORS test endpoint
app.get('/api/cors-test', (req, res) => {
  res.json({
    message: 'CORS is working!',
    origin: req.headers.origin,
    timestamp: new Date().toISOString()
  });
});

// Specific route for serving images with CORS
app.get('/uploads/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(__dirname, '../uploads', filename);
  
  // Set CORS headers
  res.header('Access-Control-Allow-Origin', process.env.CORS_ORIGIN || '*');
  res.header('Access-Control-Allow-Methods', 'GET');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  
  // Check if file exists
  if (fs.existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    res.status(404).json({ error: 'Image not found' });
  }
});

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  console.log('Connection origin:', socket.handshake.headers.origin);

  socket.on('join_room', (roomId) => {
    socket.join(roomId);
    console.log(`User ${socket.id} joined room ${roomId}`);
  });

  socket.on('send_message', (data) => {
    console.log('Message received via socket:', data);
    socket.to(data.roomId).emit('receive_message', data);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });

  socket.on('error', (error) => {
    console.error('Socket error:', error);
  });
});

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

server.listen(Number(PORT), '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📱 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🌐 CORS Origin: ${process.env.CORS_ORIGIN || 'http://localhost:3000'}`);
});

export { io };
