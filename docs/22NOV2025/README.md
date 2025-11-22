# 🌐 Netcify - Connect, Chat & Share with the World

**Netcify** is a modern, full-featured real-time chat and social platform that brings people together through instant messaging, voice calls, video calls, and seamless global communication. Built with cutting-edge technologies, Netcify offers a secure, fast, and intuitive experience for connecting with friends, making new connections, and engaging in meaningful conversations.

> 🎯 **Experience the future of social communication** - Join thousands of users worldwide on Netcify and discover a new way to connect!

## ✨ Core Features

### 🔐 Authentication & Security
- **JWT-based Authentication** - Secure token-based authentication system
- **Email Verification** - Verify user accounts via email with resend limit protection
- **Google OAuth** - Sign in with Google for seamless authentication
- **Password Management** - Secure password hashing with bcrypt and password change functionality
- **Session Management** - Smart caching with node-cache for optimal performance
- **Account Suspension** - Admin controls for user account management
- **Rate Limiting** - Protection against spam and abuse

### 💬 Messaging & Communication
- **Public Chat Rooms** - Multiple themed public rooms (General, Gaming, Tech)
- **Private Messaging** - Secure 1-on-1 private chats with real-time delivery
- **Message History** - Persistent message storage with pagination
- **Typing Indicators** - See when users are typing in real-time
- **Read Receipts** - Mark messages as read with automatic notifications
- **Unread Message Badges** - Visual indicators for unread messages in rooms and private chats
- **Message Notifications** - In-app notification system for new messages
- **Smart Message Filtering** - Backend-controlled message display and chat management

### 📞 Voice & Video Calls
- **WebRTC Voice Calls** - High-quality peer-to-peer voice communication with enhanced mobile support
- **WebRTC Video Calls** - HD video calling with real-time streaming
- **Call Management** - Initiate, accept, reject, and end calls
- **Incoming Call Notifications** - Beautiful call notification UI with pleasant ringtone
- **Call Status Indicators** - Real-time call status updates
- **Mobile-Optimized Audio** - Dedicated audio element for voice calls on mobile/tablet devices
- **Auto-Play Support** - Proper audio playback with mobile browser compatibility

### 👤 User Profiles & Management
- **Profile Pictures** - Upload and crop profile pictures with Appwrite storage
- **Image Cropper** - Built-in image cropping tool for profile pictures
- **Display Names (Nicknames)** - Customizable display names with validation
- **Age & Gender** - Optional demographic information
- **User Status** - Real-time online/offline presence tracking
- **Last Seen** - Track when users were last active
- **User Search** - Smart search with 3-character minimum and result limiting
- **User Filtering** - Filter users by age range, gender, and online status

### 🎨 User Interface & Experience
- **Dark/Light Theme** - Beautiful theme toggle with persistent preference
- **Responsive Design** - Fully optimized for desktop, tablet, and mobile
- **Mobile-Optimized** - Touch-friendly interface with proper viewport handling
- **Keyboard Shortcuts** - Quick access with Alt+M (new chat), Escape (close modals), Alt+X (filters)
- **Keyboard Navigation** - Arrow keys to navigate user list, Enter to select
- **Emoji Picker** - Integrated emoji support with emoji-picker-react
- **Location Sharing** - Share real-time location via Google Maps integration
- **Animated UI Elements** - Smooth animations and transitions throughout
- **Wind Effect Header** - Elegant animated header with flowing gradients
- **Scroll to Bottom** - Auto-scroll and manual scroll button for messages

### 🔔 Notifications & Alerts
- **Smart Sound Notifications** - Instant audio alerts for new messages, even when app is in focus
- **Visual Favicon Badge** - Unread message counter displayed on browser tab/taskbar icon
- **Browser Title Notifications** - Tab title blinks with notification when viewing other tabs
- **Do Not Disturb Mode** - One-click toggle to mute all notifications for focused work
- **Real-time Notifications** - Instant notifications for new messages
- **Unread Counters** - Badge indicators for unread messages in rooms and chats
- **Activity Tracking** - Automatic activity updates to maintain online status
- **Force Logout** - Server-side forced logout capability for security
- **Auto-Reset Notifications** - Notifications automatically clear when returning to the app

### 🛡️ Moderation & Safety
- **User Reporting System** - Report users for inappropriate behavior
- **Report Categories** - Spam, harassment, inappropriate content, impersonation, other
- **Report Management** - Admin dashboard for reviewing and acting on reports
- **Account Suspension** - Temporary or permanent account suspension
- **User Deletion** - Secure user account deletion with data cleanup

### 📱 Social Features
- **User Discovery** - Find and connect with other users
- **Private Chat History** - Persistent chat history with automatic cleanup
- **User Demographics** - View age and gender information (optional)
- **Presence Indicators** - Visual online/offline status dots
- **Smart User Sorting** - Prioritize users with unread messages, online status, and recent activity

### 🌐 Legal & Compliance
- **Privacy Policy** - Comprehensive privacy policy page
- **Terms & Conditions** - Detailed terms of service
- **About Page** - Information about the platform
- **Contact Form** - Netlify-powered contact form with email notifications

### ⚙️ Admin & Management
- **Site Settings** - Configurable site-wide settings
- **User Management** - Admin tools for user control
- **Test Users** - Pre-populated test accounts for development
- **Reporting Dashboard** - View and manage user reports
- **Analytics** - User activity and engagement tracking

### 🔧 Developer Features
- **MongoDB Schema** - Well-structured database collections
- **API Documentation** - RESTful API endpoints
- **WebSocket Events** - Real-time Socket.IO event system
- **Environment Configuration** - Flexible .env setup
- **Deployment Ready** - Configured for Netlify and Railway deployment
- **TypeScript Support** - Type-safe frontend development
- **Code Organization** - Clean, modular code structure

## 🛠️ Tech Stack

### Backend
- **Node.js** + **Express** - Server framework
- **Socket.IO** - WebSocket real-time communication
- **MongoDB** - Database with Atlas cloud hosting
- **JWT** - Authentication and refresh tokens
- **bcrypt** - Password hashing
- **node-cache** - Session and data caching
- **Appwrite** - Cloud file storage for profile pictures
- **Passport.js** - Google OAuth authentication
- **Nodemailer** - Email verification system

### Frontend
- **React 18** - UI framework
- **TypeScript** - Type safety and better DX
- **Vite** - Fast build tool and dev server
- **Socket.IO Client** - WebSocket client
- **WebRTC** - Peer-to-peer voice/video calls
- **emoji-picker-react** - Emoji selector component
- **CSS Variables** - Dynamic theming system

### Infrastructure
- **Netlify** - Frontend hosting and serverless functions
- **Railway** - Backend hosting alternative
- **MongoDB Atlas** - Cloud database
- **Appwrite Cloud** - File storage service

## 📋 Prerequisites

- Node.js 18+ installed
- MongoDB Atlas account (or local MongoDB)
- Appwrite account for file storage
- npm or yarn package manager
- Google OAuth credentials (optional)
- SMTP email service (for email verification)

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/eaeoz/social-app.git
cd social-app
```

### 2. Install Dependencies

```bash
# Install backend dependencies
npm install

# Install frontend dependencies
cd client
npm install
cd ..
```

### 3. Environment Configuration

Create a `.env` file in the root directory:

```env
# MongoDB Configuration
MONGODB_URI=your_mongodb_connection_string
MONGODB_DB_NAME=social-app

# Server Configuration
PORT=3000
NODE_ENV=development
CLIENT_URL=http://localhost:5173

# JWT Authentication
JWT_SECRET=your_super_secret_jwt_key
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=your_refresh_token_secret
JWT_REFRESH_EXPIRES_IN=30d

# Appwrite Configuration
APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
APPWRITE_PROJECT_ID=your_project_id
APPWRITE_API_KEY=your_api_key
APPWRITE_BUCKET_ID=your_bucket_id

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:3000/api/google/callback

# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
SITE_EMAIL=noreply@yoursite.com
SITE_NAME=Netcify

# Node-Cache Configuration
CACHE_TTL=3600
CACHE_CHECK_PERIOD=600

# WebSocket Configuration
SOCKET_CORS_ORIGIN=http://localhost:5173
MAX_SOCKET_CONNECTIONS=1000
```

Create `client/.env`:

```env
VITE_API_URL=http://localhost:3000/api
VITE_SOCKET_URL=http://localhost:3000
VITE_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
VITE_APPWRITE_PROJECT_ID=your_project_id
VITE_APP_NAME=Netcify
```

### 4. Setup MongoDB Collections

Run the setup script to create required collections:

```bash
node setup-mongodb.js
```

Or use MongoDB Compass/Atlas to run the `create-collections.mongodb` script.

### 5. Run the Application

#### Development Mode (Both servers simultaneously)

```bash
npm run dev
```

This will start:
- Backend server on http://localhost:3000
- Frontend dev server on http://localhost:5173

#### Or run separately:

```bash
# Terminal 1 - Backend
npm run server

# Terminal 2 - Frontend
npm run client
```

### 6. Access the Application

Open your browser and navigate to:
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3000/api
- **Health Check**: http://localhost:3000/health

## 📁 Project Structure

```
social-app/
├── server/                   # Backend
│   ├── config/              # Configuration files
│   │   ├── database.js      # MongoDB connection
│   │   ├── cache.js         # node-cache setup
│   │   ├── appwrite.js      # Appwrite storage
│   │   └── passport.js      # Google OAuth
│   ├── controllers/         # Route controllers
│   │   └── authController.js
│   ├── middleware/          # Custom middleware
│   │   └── auth.js          # JWT verification
│   ├── routes/             # API routes
│   │   ├── authRoutes.js
│   │   ├── roomRoutes.js
│   │   ├── contactRoutes.js
│   │   ├── reportRoutes.js
│   │   ├── settingsRoutes.js
│   │   └── googleAuthRoutes.js
│   ├── socket/             # Socket.IO handlers
│   │   └── messageHandlers.js
│   ├── utils/              # Utility functions
│   │   ├── jwt.js
│   │   ├── sendVerificationEmail.js
│   │   └── [many other utilities]
│   └── server.js           # Main server file
│
├── client/                  # Frontend
│   ├── public/             # Static files
│   ├── src/
│   │   ├── components/     # React components
│   │   │   ├── Auth/       # Login, Register, etc.
│   │   │   ├── Home/       # Main chat interface
│   │   │   ├── Call/       # Voice/Video call UI
│   │   │   └── Legal/      # Privacy, Terms, etc.
│   │   ├── App.tsx         # Main App component
│   │   ├── App.css         # Global styles
│   │   └── main.tsx        # Entry point
│   ├── netlify/            # Netlify serverless functions
│   │   └── functions/
│   │       ├── contact.js
│   │       └── verify-email.js
│   └── package.json
│
├── .env                    # Environment variables
├── .env.example           # Environment template
├── package.json           # Backend dependencies
├── setup-mongodb.js       # MongoDB setup script
└── README.md             # This file
```

## 🗄️ Database Collections

The application uses the following MongoDB collections:

1. **users** - User accounts with profile information, authentication data, and settings
2. **userpresence** - Real-time online/offline status tracking
3. **publicrooms** - Public chat room definitions
4. **messages** - All chat messages (public & private) with read status
5. **privatechats** - Private chat metadata and last message info
6. **reports** - User report submissions for moderation
7. **sitesettings** - Site-wide configuration and feature toggles
8. **emailverifications** - Email verification tokens and status
9. **typing** - Temporary typing indicators (TTL indexed)
10. **notifications** - In-app notification system

## 🔧 Available Scripts

### Backend
- `npm run server` - Start backend development server with nodemon
- `npm start` - Start production server

### Frontend
- `npm run client` - Start frontend development server
- `npm run build` - Build frontend for production
- `npm run preview` - Preview production build

### Both
- `npm run dev` - Run both servers concurrently

## 📡 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user
- `POST /api/auth/refresh` - Refresh access token
- `GET /api/auth/verify-token` - Verify JWT token
- `POST /api/auth/verify-email` - Verify email address
- `POST /api/auth/resend-verification` - Resend verification email
- `PUT /api/auth/update-profile` - Update user profile
- `PUT /api/auth/change-password` - Change user password

### Google OAuth
- `GET /api/google` - Initiate Google OAuth flow
- `GET /api/google/callback` - Google OAuth callback
- `GET /api/google/success` - OAuth success handler

### Rooms & Messaging
- `GET /api/rooms/public` - Get all public rooms with unread counts
- `GET /api/rooms/users` - Get all users with filtering and search
- `GET /api/rooms/user-profile/:userId` - Get specific user profile
- `GET /api/rooms/private-chats` - Get user's private chats
- `POST /api/rooms/mark-room-read` - Mark room messages as read
- `POST /api/rooms/close-private-chat` - Close a private chat

### Reports & Moderation
- `POST /api/reports` - Submit user report
- `GET /api/reports` - Get all reports (admin)
- `PUT /api/reports/:id` - Update report status (admin)

### Site Settings
- `GET /api/settings` - Get site settings
- `PUT /api/settings` - Update site settings (admin)

### Contact
- `POST /api/contact` - Send contact form message

## 🔌 Socket.IO Events

### Client → Server
- `authenticate` - Authenticate socket connection with JWT
- `join_room` - Join a public room
- `leave_room` - Leave a public room
- `send_room_message` - Send message to public room
- `get_room_messages` - Request room message history
- `send_private_message` - Send private message
- `get_private_messages` - Request private message history
- `mark_as_read` - Mark message as read
- `mark_chat_as_read` - Mark entire chat as read
- `subscribe_private_chat` - Subscribe to private chat updates
- `typing` - User started typing
- `stop_typing` - User stopped typing
- `activity` - User activity heartbeat
- `initiate-call` - Initiate voice/video call
- `call-accepted` - Accept incoming call
- `call-rejected` - Reject incoming call
- `call-cancelled` - Cancel outgoing call
- `call-ended` - End active call
- `webrtc-offer` - WebRTC offer for call setup
- `webrtc-answer` - WebRTC answer for call setup
- `webrtc-ice-candidate` - ICE candidate exchange

### Server → Client
- `authenticated` - Authentication successful
- `room_message` - New message in public room
- `room_messages` - Room message history
- `room_message_notification` - New message notification
- `private_message` - New private message
- `private_messages` - Private message history
- `user_joined` - User joined room
- `user_left` - User left room
- `user_typing` - User is typing
- `user_stop_typing` - User stopped typing
- `user_status_changed` - User online/offline status changed
- `incoming-call` - Incoming call notification
- `call-accepted` - Call was accepted
- `call-rejected` - Call was rejected
- `call-cancelled` - Call was cancelled
- `call-ended` - Call ended
- `webrtc-offer` - Received WebRTC offer
- `webrtc-answer` - Received WebRTC answer
- `webrtc-ice-candidate` - Received ICE candidate
- `force_logout` - Force user logout
- `error` - Error occurred

## 🚢 Deployment

### Netlify (Frontend)
1. Build the frontend:
   ```bash
   cd client
   npm run build
   ```

2. Deploy to Netlify:
   - Connect your GitHub repository
   - Set build command: `npm run build`
   - Set publish directory: `client/dist`
   - Add all environment variables from `client/.env`

### Railway/Render (Backend)
1. Connect your GitHub repository
2. Set root directory to `/` (project root)
3. Set start command: `npm start`
4. Add all environment variables from `.env`

For detailed deployment guides, see:
- `NETLIFY-FRONTEND-GUIDE.md`
- `RAILWAY-DEPLOYMENT.md`
- `RENDER-DEPLOYMENT.md`

## 🎮 Test Users

The application includes pre-populated test users for development:

- Username: `testuser1` to `testuser100`
- Password: `Test123!`

These users have varied profiles, online statuses, and last activity times.

## 📚 Additional Documentation

- `GOOGLE-OAUTH-SETUP.md` - Google OAuth configuration guide
- `EMAIL-VERIFICATION-GUIDE.md` - Email verification system setup
- `MONGODB-SETUP.md` - MongoDB database setup instructions
- `SECURITY-IMPLEMENTATION.md` - Security features and best practices
- `ARCHITECTURE.md` - System architecture documentation
- `CALL-FEATURE-IMPLEMENTATION.md` - Voice/video call setup guide

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the ISC License - see the LICENSE file for details.

## 👥 Author

**Sedat ERGÖZ** - Creator and Developer

## 🙏 Acknowledgments

- Socket.IO for real-time communication
- MongoDB for robust database solutions
- Appwrite for file storage services
- React and Vite for modern frontend development
- WebRTC for peer-to-peer communication
- The open-source community for amazing tools and libraries

## 🎉 Recent Updates (v1.1.0 - January 11, 2025)

### Enhanced Communication Features
- ✅ **Voice Call Audio Fixed** - Resolved audio issues on mobile/tablet devices with dedicated audio element
- ✅ **Smart Notifications** - Added instant sound alerts that play even when app is active
- ✅ **Favicon Badge System** - Visual notification counter on browser tab and Windows taskbar icon
- ✅ **Browser Title Alerts** - Tab title blinks when new messages arrive while viewing other tabs
- ✅ **Do Not Disturb Mode** - New feature to temporarily mute all notifications

### Technical Improvements
- Improved WebRTC audio routing for voice calls
- Enhanced notification system with multiple alert methods
- Added favicon badge with counter (1-99+)
- Better mobile browser compatibility for audio playback
- Automatic notification reset when returning to the app

## 🐛 Known Issues & Solutions

- **Mobile Viewport Zoom**: Fixed with proper viewport meta tag configuration
- **Email Verification Rate Limit**: Automatic protection against spam
- **WebRTC Connection**: STUN/TURN servers configured for NAT traversal
- **Session Management**: Redis alternative using node-cache for serverless compatibility
- **Voice Call Audio on Mobile**: Fixed with dedicated audio element and proper WebRTC routing

## 🔮 Roadmap

- [ ] Screen sharing during video calls
- [ ] Group video calls and conferences
- [ ] File sharing and media galleries
- [ ] Voice messages
- [ ] Message reactions and threading
- [ ] User blocking system
- [ ] Advanced search filters
- [ ] End-to-end chat encryption
- [ ] Mobile apps (React Native)
- [ ] Push notifications for mobile

---

**Status**: ✅ **Fully Featured and Production Ready!**

Built with ❤️ using modern web technologies. Experience real-time communication like never before!
