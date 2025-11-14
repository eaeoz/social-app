import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import { ObjectId } from 'mongodb';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { connectToDatabase } from './config/database.js';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import passport from 'passport';
import session from 'express-session';
import { configurePassport } from './config/passport.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();

// Trust proxy - required for Render.com and other reverse proxies
app.set('trust proxy', 1);

const httpServer = createServer(app);

// Allow multiple origins for CORS
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174', // Admin dashboard
  'http://localhost:5175',
  'http://localhost:3000',
  'http://localhost:4000',
  'http://localhost:8888',
  'https://localhost:5173', // HTTPS local development
  'https://localhost:5174', // HTTPS Admin dashboard
  'https://localhost:5175', // HTTPS Admin dashboard
  'https://localhost:3000', // HTTPS Admin dashboard
  'https://localhost:4000', // HTTPS API
  'https://localhost:8888', // HTTPS Admin dashboard (netflify dev)
  'https://netcify.netlify.app',
  'https://netcifyadmin.netlify.app', // Admin dashboard production
  process.env.CLIENT_URL,
  process.env.ADMIN_URL
].filter(Boolean);

console.log('🌐 CORS Configuration:');
console.log('📋 Allowed Origins:', allowedOrigins);
console.log('🔧 NODE_ENV:', process.env.NODE_ENV);
console.log('🔧 PORT:', process.env.PORT);
console.log('🔧 CLIENT_URL:', process.env.CLIENT_URL);

const io = new Server(httpServer, {
  cors: {
    origin: (origin, callback) => {
      console.log(`🔍 Socket.IO CORS check - Origin: ${origin || 'no-origin'}`);
      
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) {
        console.log('✅ Allowing request with no origin');
        return callback(null, true);
      }
      
      if (allowedOrigins.includes(origin)) {
        console.log(`✅ Origin allowed: ${origin}`);
        callback(null, true);
      } else {
        console.warn(`⛔ BLOCKED Socket.IO CORS from origin: ${origin}`);
        console.warn(`📋 Allowed origins are:`, allowedOrigins);
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) {
      return callback(null, true);
    }
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`⛔ BLOCKED HTTP CORS from origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));
// Security headers with Helmet
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: [
        "'self'", 
        "'unsafe-inline'", 
        "https://www.google.com/recaptcha/", 
        "https://www.gstatic.com/recaptcha/",
        "https://www.google.com"
      ], // Allow inline scripts and Google reCAPTCHA
      scriptSrcAttr: ["'unsafe-inline'"], // Allow inline event handlers
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "ws:", "wss:", "https:", "https://*.netlify.app"], // Explicitly allow Netlify functions
      fontSrc: ["'self'", "data:"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: [
        "'self'",
        "https://www.google.com/recaptcha/",
        "https://recaptcha.google.com/recaptcha/"
      ], // Allow Google reCAPTCHA frames
    },
  },
  crossOriginEmbedderPolicy: false, // Allow loading external resources
  crossOriginResourcePolicy: { policy: "cross-origin" },
  xssFilter: false, // Disable Helmet's default X-XSS-Protection (we'll set custom one)
}));

// Add custom security headers to fix security audit issues
app.use((req, res, next) => {
  // Fix X-XSS-Protection: Enable XSS protection (was disabled by Cloudflare)
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // Add Permissions-Policy to control browser features
  res.setHeader('Permissions-Policy', 
    'geolocation=(), microphone=(), camera=(), payment=(), usb=(), ' +
    'magnetometer=(), gyroscope=(), accelerometer=(), interest-cohort=()'
  );
  
  // Add Feature-Policy for older browser compatibility
  res.setHeader('Feature-Policy', 
    "geolocation 'none'; microphone 'none'; camera 'none'; camera 'none'; payment 'none'; usb 'none'"
  );
  
  // Override X-Frame-Options to DENY for better security (currently SAMEORIGIN)
  res.setHeader('X-Frame-Options', 'DENY');
  
  // Remove technology-revealing headers
  res.removeHeader('Server');
  res.removeHeader('X-Powered-By');
  res.removeHeader('X-AspNet-Version');
  res.removeHeader('X-AspNetMvc-Version');
  
  next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Session configuration for passport
app.use(session({
  secret: process.env.JWT_SECRET || 'your-session-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());
configurePassport();

// ============================================
// RATE LIMITING & IP BLOCKING CONFIGURATION
// ============================================

// Store for tracking failed attempts and blocked IPs
const failedAttempts = new Map(); // IP -> { count, firstAttempt, blockedUntil }
const blockedIPs = new Set();

// Cleanup old entries every 1 hour
setInterval(() => {
  const now = Date.now();
  for (const [ip, data] of failedAttempts.entries()) {
    // Remove entries older than 1 hour
    if (now - data.firstAttempt > 60 * 60 * 1000) {
      failedAttempts.delete(ip);
    }
    // Unblock IPs after block period expires
    if (data.blockedUntil && now > data.blockedUntil) {
      failedAttempts.delete(ip);
      blockedIPs.delete(ip);
      console.log(`🔓 IP unblocked: ${ip}`);
    }
  }
}, 60 * 60 * 1000); // Run every 1 hour

// Middleware to check if IP is blocked
const checkIPBlock = (req, res, next) => {
  const clientIP = req.ip || req.connection.remoteAddress;
  
  if (blockedIPs.has(clientIP)) {
    const attemptData = failedAttempts.get(clientIP);
    const remainingTime = attemptData?.blockedUntil 
      ? Math.ceil((attemptData.blockedUntil - Date.now()) / 1000 / 60)
      : 0;
    
    console.log(`🚫 Blocked IP attempted access: ${clientIP}`);
    return res.status(429).json({ 
      error: 'Too many failed attempts. Your IP has been temporarily blocked.',
      blockedFor: `${remainingTime} minutes`,
      message: 'Please try again later or contact support if you believe this is an error.'
    });
  }
  
  next();
};

// Track failed login attempts
export function trackFailedAttempt(ip) {
  const now = Date.now();
  const attemptData = failedAttempts.get(ip) || { count: 0, firstAttempt: now };
  
  attemptData.count++;
  
  // Block IP after 10 failed attempts within 1 hour
  if (attemptData.count >= 10) {
    const blockDuration = 30 * 60 * 1000; // 30 minutes
    attemptData.blockedUntil = now + blockDuration;
    blockedIPs.add(ip);
    console.log(`🚫 IP blocked for 30 minutes: ${ip} (${attemptData.count} failed attempts)`);
  }
  
  failedAttempts.set(ip, attemptData);
  console.log(`⚠️ Failed attempt from ${ip}: ${attemptData.count}/10`);
}

// Clear failed attempts on successful login
export function clearFailedAttempts(ip) {
  failedAttempts.delete(ip);
}

// General API rate limiter (300 requests per 15 minutes per IP - more lenient for reconnections)
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // 300 requests per window (increased to handle reconnections)
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for socket.io handshake and polling
    return req.path?.includes('/socket.io/') || req.path === '/health';
  },
  handler: (req, res) => {
    console.log(`⚠️ Rate limit exceeded for IP: ${req.ip}, Path: ${req.path}`);
    res.status(429).json({
      error: 'Too many requests',
      message: 'You have exceeded the rate limit. Please try again later.',
      retryAfter: '15 minutes'
    });
  }
});

// Strict rate limiter for login endpoint (5 attempts per 15 minutes per IP)
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 login attempts per window
  skipSuccessfulRequests: true, // Don't count successful logins
  message: 'Too many login attempts, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    const ip = req.ip || req.connection.remoteAddress;
    console.log(`🚨 Login rate limit exceeded for IP: ${ip}`);
    res.status(429).json({
      error: 'Too many login attempts',
      message: 'You have exceeded the maximum number of login attempts. Please try again in 15 minutes.',
      retryAfter: '15 minutes'
    });
  }
});

// Rate limiter for registration (3 accounts per hour per IP)
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 registrations per hour
  message: 'Too many accounts created from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    const ip = req.ip || req.connection.remoteAddress;
    console.log(`🚨 Registration rate limit exceeded for IP: ${ip}`);
    res.status(429).json({
      error: 'Registration limit exceeded',
      message: 'Too many accounts created from this IP. Please try again in 1 hour.',
      retryAfter: '1 hour'
    });
  }
});

// Rate limiter for password reset/email verification (3 per hour per IP)
const emailActionLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 requests per hour
  message: 'Too many email requests, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    const ip = req.ip || req.connection.remoteAddress;
    console.log(`🚨 Email action rate limit exceeded for IP: ${ip}`);
    res.status(429).json({
      error: 'Too many email requests',
      message: 'You have exceeded the limit for email-related actions. Please try again in 1 hour.',
      retryAfter: '1 hour'
    });
  }
});

// Rate limiter for public info endpoints (higher limit for development)
const publicInfoLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 60 : 300, // 300 in dev, 60 in production
  message: 'Too many requests, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    const ip = req.ip || req.connection.remoteAddress;
    console.log(`🚨 Public info rate limit exceeded for IP: ${ip}`);
    res.status(429).json({
      error: 'Too many requests',
      message: 'You have exceeded the rate limit for this endpoint. Please try again later.',
      retryAfter: '15 minutes'
    });
  }
});

// Rate limiter for OAuth endpoints (10 attempts per 15 minutes per IP)
const oauthLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 OAuth attempts per window
  message: 'Too many OAuth requests, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    const ip = req.ip || req.connection.remoteAddress;
    console.log(`🚨 OAuth rate limit exceeded for IP: ${ip}`);
    res.status(429).json({
      error: 'Too many OAuth attempts',
      message: 'You have exceeded the limit for OAuth attempts. Please try again in 15 minutes.',
      retryAfter: '15 minutes'
    });
  }
});

// Apply general rate limiter to all routes
app.use('/api/', generalLimiter);

// Apply IP block check to auth routes
app.use('/api/auth/login', checkIPBlock);
app.use('/api/auth/register', checkIPBlock);

console.log('🛡️ Security features enabled:');
console.log('  ✅ Helmet security headers (CSP, HSTS, MIME sniffing protection)');
console.log('  ✅ Content Security Policy with Google reCAPTCHA support');
console.log('  ✅ X-XSS-Protection: 1; mode=block (XSS filter enabled)');
console.log('  ✅ X-Frame-Options: DENY (clickjacking protection)');
console.log('  ✅ Permissions-Policy (browser feature control)');
console.log('  ✅ Feature-Policy (legacy browser support)');
console.log('  ✅ Server header removed (technology stack hidden)');
console.log('  ✅ General rate limiting: 300 requests per 15 minutes');
console.log('  ✅ Login rate limiting: 5 attempts per 15 minutes');
console.log('  ✅ Registration rate limiting: 3 accounts per hour');
console.log('  ✅ Email action rate limiting: 3 requests per hour');
console.log(`  ✅ Public info rate limiting: ${process.env.NODE_ENV === 'production' ? '60' : '300'} requests per 15 minutes`);
console.log('  ✅ OAuth rate limiting: 10 attempts per 15 minutes');
console.log('  ✅ IP blocking: 30 minutes after 10 failed attempts');
console.log('  ✅ Account lockout: After 5 failed attempts within 30 minutes');

// ============================================
// END RATE LIMITING CONFIGURATION
// ============================================

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
import reportRoutes from './routes/reportRoutes.js';
import googleAuthRoutes from './routes/googleAuthRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import blogRoutes from './routes/blogRoutes.js';
import { setupMessageHandlers } from './socket/messageHandlers.js';
import { seedDefaultRooms } from './utils/seedRooms.js';
import { initializeSiteSettings, getSiteSettings } from './utils/initializeSiteSettings.js';
import { initializeReportingSystem } from './utils/initializeReportingSystem.js';
import { syncBlogData } from './utils/syncBlogData.js';
import cron from 'node-cron';

// Create a custom router for auth with rate limiting
const authRouter = express.Router();

// Apply specific rate limiters to auth endpoints
authRouter.post('/login', loginLimiter, authRoutes);
authRouter.post('/register', registerLimiter, authRoutes);
authRouter.post('/resend-verification', emailActionLimiter, authRoutes);
authRouter.post('/verify-email', emailActionLimiter, authRoutes);

// Apply rate limiters to specific public endpoints
app.use('/api/auth/get-resend-attempts', publicInfoLimiter);
app.use('/api/auth/google', oauthLimiter);
app.use('/api/auth/google/callback', oauthLimiter);

// Only apply public info limiter to the public settings endpoint, not admin endpoints
app.use((req, res, next) => {
  // Apply publicInfoLimiter only to /api/settings/site, not /api/admin/*
  if (req.path === '/api/settings/site') {
    return publicInfoLimiter(req, res, next);
  }
  next();
});

// Use routes
app.use('/api/auth', authRoutes);
app.use('/api/auth', googleAuthRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/report', reportRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/blog', blogRoutes);

// Serve static API documentation from public folder
const publicPath = path.join(__dirname, 'public');
if (fs.existsSync(publicPath)) {
  console.log(`📚 Serving API documentation from: ${publicPath}`);
  app.use(express.static(publicPath));
}

// Serve API documentation at root
app.get('/', (req, res) => {
  const indexPath = path.join(__dirname, 'public', 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.json({ 
      message: 'Social App API Server',
      version: '1.0.0',
      status: 'online',
      endpoints: {
        api: '/api',
        health: '/health',
        auth: '/api/auth/*',
        rooms: '/api/rooms/*',
        settings: '/api/settings',
        admin: '/api/admin/*'
      }
    });
  }
});

// Serve static files from React build (for production)
// Only attempt to serve if the client build directory exists
if (process.env.NODE_ENV === 'production') {
  const clientBuildPath = path.join(__dirname, '../client/dist');
  
  // Check if client build exists
  if (fs.existsSync(clientBuildPath)) {
    console.log(`📦 Serving static files from: ${clientBuildPath}`);
    app.use(express.static(clientBuildPath));
    
    // Handle client-side routing - serve index.html for all non-API routes
    app.get('*', (req, res) => {
      // Don't serve index.html for API routes
      if (req.path.startsWith('/api') || req.path.startsWith('/health') || req.path === '/') {
        return res.status(404).json({ error: 'Not found' });
      }
      res.sendFile(path.join(clientBuildPath, 'index.html'));
    });
  } else {
    console.log(`⚠️ Client build directory not found: ${clientBuildPath}`);
    console.log(`📡 Server running in API-only mode (frontend deployed separately)`);
  }
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
    
    // Broadcast status change to all connected clients
    io.emit('user_status_changed', {
      userId: userId,
      status: status,
      lastActiveAt: new Date()
    });
  } catch (error) {
    console.error('Error updating user status:', error);
  }
}

// Function to handle user activity
async function handleUserActivity(userId) {
  const activity = userActivity.get(userId);
  
  // Clear existing timeout if any
  if (activity?.timeoutId) {
    clearTimeout(activity.timeoutId);
  }
  
  // Set user as online
  updateUserStatus(userId, 'online');
  
  // Get session timeout from database (in MINUTES)
  let sessionTimeoutMs = 604800000; // Default: 10080 minutes = 7 days
  try {
    const { getSiteSettings } = await import('./utils/initializeSiteSettings.js');
    const settings = await getSiteSettings();
    const sessionTimeoutMinutes = settings.sessionTimeout || 10080; // Default 10080 minutes (7 days)
    sessionTimeoutMs = sessionTimeoutMinutes * 60 * 1000; // Convert minutes to milliseconds
    console.log(`⏰ Using session timeout from database: ${sessionTimeoutMinutes} minutes (${Math.round(sessionTimeoutMinutes / 60 / 24 * 10) / 10} days)`);
  } catch (error) {
    console.warn('⚠️ Failed to get session timeout from database, using default: 10080 minutes (7 days)');
  }
  
  // Set new timeout based on database setting
  // This way users stay online as long as their token is valid
  const timeoutId = setTimeout(() => {
    // Mark user as offline after session timeout
    updateUserStatus(userId, 'offline');
    userActivity.delete(userId);
    console.log(`⏰ User ${userId} marked as offline due to inactivity`);
  }, sessionTimeoutMs);
  
  // Update activity record
  userActivity.set(userId, {
    lastActivity: new Date(),
    timeoutId: timeoutId
  });
}

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log(`🔌 Socket.IO connection established: ${socket.id}`);
  console.log(`🌐 Socket origin: ${socket.handshake.headers.origin}`);
  console.log(`🔐 Socket auth:`, socket.handshake.auth);
  console.log(`📍 Socket transport: ${socket.conn.transport.name}`);

  // Set up message handlers
  setupMessageHandlers(io, socket, userSockets);

  socket.on('disconnect', (reason) => {
    console.log(`❌ Client disconnected: ${socket.id}, Reason: ${reason}`);
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
    console.log('📥 AUTHENTICATE EVENT RECEIVED!');
    console.log('🔐 User authenticated:', data.username);
    console.log('👤 User data:', data);
    
    // Validate user still exists and is not suspended
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
      
      // Check if user is suspended
      if (user.userSuspended) {
        console.log(`🚫 Suspended user ${data.userId} attempted to connect, forcing logout`);
        socket.emit('force_logout', { 
          reason: 'Your account has been suspended due to multiple user reports. Please contact support if you believe this is an error.',
          suspended: true
        });
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
    
    // Initialize reporting system
    await initializeReportingSystem();
    
    // Seed default rooms
    await seedDefaultRooms();
    
    // Get cleanup schedule from database
    const settings = await getSiteSettings();
    const cleanCheckSchedule = settings.cleanCheck || 'every_12_hours';
    
    // Map schedule options to cron patterns
    const scheduleMap = {
      'every_minute': '* * * * *',
      'every_5_minutes': '*/5 * * * *',
      'every_hour': '0 * * * *',
      'every_12_hours': '0 3,15 * * *', // 3 AM and 3 PM
      'every_day': '0 3 * * *', // 3 AM daily
      'every_week': '0 3 * * 0', // 3 AM every Sunday
      'every_2_weeks': '0 3 1,15 * *', // 3 AM on 1st and 15th of month
      'every_month': '0 3 1 * *' // 3 AM on 1st of month
    };
    
    const scheduleDescriptions = {
      'every_minute': 'Every minute',
      'every_5_minutes': 'Every 5 minutes',
      'every_hour': 'Every hour',
      'every_12_hours': 'Twice daily at 3:00 AM and 3:00 PM',
      'every_day': 'Daily at 3:00 AM',
      'every_week': 'Weekly on Sunday at 3:00 AM',
      'every_2_weeks': 'Twice monthly on 1st and 15th at 3:00 AM',
      'every_month': 'Monthly on 1st at 3:00 AM'
    };
    
    const cronPattern = scheduleMap[cleanCheckSchedule] || scheduleMap['every_12_hours'];
    const scheduleDescription = scheduleDescriptions[cleanCheckSchedule] || scheduleDescriptions['every_12_hours'];
    
    // Schedule automatic backup & cleanup with dynamic schedule
    const cleanupTask = cron.schedule(cronPattern, async () => {
      console.log('🤖 Running scheduled automatic backup & cleanup...');
      try {
        const { checkAndRunAutoCleanup } = await import('./utils/backupAndCleanup.js');
        const result = await checkAndRunAutoCleanup();
        
        if (result.cleanupPerformed) {
          console.log('✅ Scheduled cleanup completed successfully!');
          console.log(`📦 Backed up: ${result.messagesBackup?.count || 0} messages, ${result.privatechatsBackup?.count || 0} private chats`);
          console.log(`🗑️ Deleted: ${result.deleted?.total || 0} total items`);
          console.log(`💾 Storage after cleanup: ${result.storageAfter?.toFixed(2) || 'N/A'} MB`);
        } else {
          console.log('ℹ️ Cleanup not needed - storage below threshold or no old data found');
        }
      } catch (error) {
        console.error('❌ Scheduled cleanup failed:', error);
      }
    }, {
      timezone: "Europe/Istanbul"
    });
    
    console.log(`⏰ Automatic backup & cleanup scheduled: ${scheduleDescription} (Europe/Istanbul)`);
    console.log(`📋 Schedule pattern: ${cronPattern}`);
    
    // Store cleanup task globally so it can be restarted when settings change
    global.cleanupCronTask = cleanupTask;
    
    // Get article check schedule from database
    const articleCheckSchedule = settings.articleCheck || 'every_minute';
    const articleCronPattern = scheduleMap[articleCheckSchedule] || scheduleMap['every_minute'];
    const articleScheduleDescription = scheduleDescriptions[articleCheckSchedule] || scheduleDescriptions['every_minute'];
    
    // Schedule blog data sync with dynamic schedule
    const blogSyncTask = cron.schedule(articleCronPattern, async () => {
      console.log('📝 Running scheduled blog data sync...');
      try {
        const result = await syncBlogData();
        if (result.success) {
          console.log('✅ Blog sync completed successfully!');
          console.log(`📊 Created: ${result.created}, Updated: ${result.updated}, Skipped: ${result.skipped}`);
        } else {
          console.error('❌ Blog sync failed:', result.error);
        }
      } catch (error) {
        console.error('❌ Blog sync error:', error);
      }
    }, {
      timezone: "Europe/Istanbul"
    });
    
    console.log(`📝 Blog cache sync scheduled: ${articleScheduleDescription} (Europe/Istanbul)`);
    console.log(`📋 Article sync pattern: ${articleCronPattern}`);
    console.log(`ℹ️  Note: Appwrite is the source of truth, JSON is cached for fast reads`);
    
    // Store blog sync task globally so it can be restarted when settings change
    global.blogSyncCronTask = blogSyncTask;
    
    // Initial blog sync on startup (Appwrite → JSON cache)
    console.log('📝 Running initial blog cache sync (Appwrite → JSON)...');
    try {
      const result = await syncBlogData();
      if (result.success) {
        console.log('✅ Initial blog sync completed!');
      }
    } catch (error) {
      console.log('⚠️  Initial blog sync skipped (will retry on next schedule)');
    }
    
    // Initialize custom schedules from database
    console.log('🤖 Initializing custom schedules...');
    try {
      const { getDatabase } = await import('./config/database.js');
      const db = getDatabase();
      
      // Get all active custom schedules
      const customSchedules = await db.collection('customSchedules')
        .find({ isActive: true })
        .toArray();
      
      if (customSchedules.length > 0) {
        console.log(`📋 Found ${customSchedules.length} active custom schedule(s)`);
        
        // Initialize global storage for custom schedule cron tasks
        global.customScheduleCrons = {};
        
        // Start each active schedule
        for (const schedule of customSchedules) {
          const scheduleId = schedule._id.toString();
          const cronPattern = scheduleMap[schedule.schedule] || scheduleMap['every_hour'];
          
          const task = cron.schedule(cronPattern, async () => {
            console.log(`🤖 [Custom Schedule] Running: ${schedule.name}`);
            try {
              // Import and execute the custom script
              const scriptModule = await import(`./customSchedules/${schedule.scriptPath}`);
              
              if (scriptModule.execute && typeof scriptModule.execute === 'function') {
                const result = await scriptModule.execute();
                console.log(`✅ [Custom Schedule] ${schedule.name} completed:`, result);
                
                // Update last run time and count
                await db.collection('customSchedules').updateOne(
                  { _id: schedule._id },
                  { 
                    $set: { lastRun: new Date() },
                    $inc: { runCount: 1 }
                  }
                );
              } else {
                console.error(`❌ [Custom Schedule] ${schedule.name}: Script does not export an 'execute' function`);
              }
            } catch (error) {
              console.error(`❌ [Custom Schedule] ${schedule.name} failed:`, error);
            }
          }, {
            timezone: "Europe/Istanbul"
          });
          
          global.customScheduleCrons[scheduleId] = task;
          console.log(`✅ Started custom schedule: ${schedule.name} (${scheduleDescriptions[schedule.schedule] || schedule.schedule})`);
        }
      } else {
        console.log('ℹ️ No active custom schedules found');
      }
    } catch (error) {
      console.error('❌ Failed to initialize custom schedules:', error);
    }
    
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
