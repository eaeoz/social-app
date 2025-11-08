import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import { ObjectId } from 'mongodb';
import path from 'path';
import { fileURLToPath } from 'url';
import { connectToDatabase } from './config/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
import settingsRoutes from './routes/settingsRoutes.js';
import { setupMessageHandlers } from './socket/messageHandlers.js';
import { seedDefaultRooms } from './utils/seedRooms.js';
import { initializeSiteSettings } from './utils/initializeSiteSettings.js';

// Use routes
app.use('/api/auth', authRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/settings', settingsRoutes);

// Serve static files from React build (for production)
if (process.env.NODE_ENV === 'production') {
  const clientBuildPath = path.join(__dirname, '../client/dist');
  app.use(express.static(clientBuildPath));
  
  // Handle client-side routing - serve index.html for all non-API routes
  app.get('*', (req, res) => {
    // Don't serve index.html for API routes
    if (req.path.startsWith('/api') || req.path.startsWith('/health')) {
      return res.status(404).json({ error: 'Not found' });
    }
    res.sendFile(path.join(clientBuildPath, 'index.html'));
  });
}

// Store user socket connections and activity timestamps
const userSockets = new Map(); // userId -> socketId
const userActivity = new Map(); // userId -> { lastActivity: Date, timeoutId: NodeJS.Timeout }

// Function to update user status in database
async function updateUserStatus(userId, status) {
  try {
    const { getDatabase } = await import('./config/database.js');
    const db = getDatabase();
    await db.collection('users').updateOne(
      { _id: new ObjectId(userId) },
      { 
        $set: { 
          status: status,
          lastActiveAt: new Date()
        }
      }
    );
    console.log(`🔄 User ${userId} status updated to: ${status}`);
  } catch (error) {
    console.error('Error updating user status:', error);
  }
}

// Function to handle user activity
function handleUserActivity(userId) {
  const activity = userActivity.get(userId);
  
  // Clear existing timeout if any
  if (activity?.timeoutId) {
    clearTimeout(activity.timeoutId);
  }
  
  // Set user as online
  updateUserStatus(userId, 'online');
  
  // Set new timeout for 5 minutes (300000ms)
  const timeoutId = setTimeout(() => {
    // Mark user as offline after 5 minutes of inactivity
    updateUserStatus(userId, 'offline');
    userActivity.delete(userId);
    console.log(`⏰ User ${userId} marked as offline due to inactivity`);
  }, 300000); // 5 minutes
  
  // Update activity record
  userActivity.set(userId, {
    lastActivity: new Date(),
    timeoutId: timeoutId
  });
}

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log(`✅ Client connected: ${socket.id}`);

  // Set up message handlers
  setupMessageHandlers(io, socket, userSockets);

  socket.on('disconnect', () => {
    console.log(`❌ Client disconnected: ${socket.id}`);
    // Remove user from userSockets map
    if (socket.userId) {
      // Clear activity timeout
      const activity = userActivity.get(socket.userId);
      if (activity?.timeoutId) {
        clearTimeout(activity.timeoutId);
      }
      
      // Mark as offline immediately on disconnect
      updateUserStatus(socket.userId, 'offline');
      
      userSockets.delete(socket.userId);
      userActivity.delete(socket.userId);
      console.log(`🗑️ Removed user ${socket.userId} from active connections`);
    }
  });

  // Authentication
  socket.on('authenticate', async (data) => {
    console.log('🔐 User authenticated:', data.username);
    
    // Validate user still exists in database
    try {
      const { getDatabase } = await import('./config/database.js');
      const db = getDatabase();
      const user = await db.collection('users').findOne({ _id: new ObjectId(data.userId) });
      
      if (!user) {
        console.log(`⚠️ User ${data.userId} no longer exists, rejecting authentication`);
        socket.emit('force_logout', { reason: 'User account deleted' });
        socket.disconnect(true);
        return;
      }
    } catch (error) {
      console.error('Error validating user during authentication:', error);
    }
    
    socket.userId = data.userId;
    socket.username = data.username;
    
    // Store user socket mapping
    userSockets.set(data.userId, socket.id);
    
    // Mark user as online and start activity tracking
    handleUserActivity(data.userId);
    
    console.log(`📍 User ${data.username} mapped to socket ${socket.id}`);
  });

  // Activity heartbeat - client sends this periodically to indicate user is active
  socket.on('activity', (data) => {
    if (socket.userId) {
      handleUserActivity(socket.userId);
    }
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
    
    // Initialize site settings
    await initializeSiteSettings();
    
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
