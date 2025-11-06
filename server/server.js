import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import { connectToDatabase } from './config/database.js';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// API Routes
app.get('/api', (req, res) => {
  res.json({ message: 'Chat API Server', version: '1.0.0' });
});

// Import routes
import authRoutes from './routes/authRoutes.js';
import roomRoutes from './routes/roomRoutes.js';
import { setupMessageHandlers } from './socket/messageHandlers.js';
import { seedDefaultRooms } from './utils/seedRooms.js';

// Use routes
app.use('/api/auth', authRoutes);
app.use('/api/rooms', roomRoutes);

// Store user socket connections
const userSockets = new Map(); // userId -> socketId

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log(`✅ Client connected: ${socket.id}`);

  // Set up message handlers
  setupMessageHandlers(io, socket, userSockets);

  socket.on('disconnect', () => {
    console.log(`❌ Client disconnected: ${socket.id}`);
    // Remove user from userSockets map
    if (socket.userId) {
      userSockets.delete(socket.userId);
      console.log(`🗑️ Removed user ${socket.userId} from active connections`);
    }
  });

  // Authentication
  socket.on('authenticate', (data) => {
    console.log('🔐 User authenticated:', data.username);
    socket.userId = data.userId;
    socket.username = data.username;
    
    // Store user socket mapping
    userSockets.set(data.userId, socket.id);
    console.log(`📍 User ${data.username} mapped to socket ${socket.id}`);
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('❌ Error:', err.stack);
  res.status(500).json({
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Start server
const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    // Connect to MongoDB
    await connectToDatabase();
    
    // Seed default rooms
    await seedDefaultRooms();
    
    // Start HTTP server
    httpServer.listen(PORT, () => {
      console.log('🚀 Server started successfully!');
      console.log(`📡 Server running on port ${PORT}`);
      console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔗 API: http://localhost:${PORT}/api`);
      console.log(`⚡ WebSocket: ws://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

export { app, io };
