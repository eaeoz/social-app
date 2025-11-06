# 🚀 Real-Time Chat Application

A full-stack real-time chat application with public rooms and private messaging, built with Node.js, Socket.IO, MongoDB, and React.

## ✨ Features

- 🔐 **User Authentication** - JWT-based authentication system
- 💬 **Public Chat Rooms** - Create and join public chat rooms
- 📱 **Private Messaging** - 1-on-1 private chats with user selection
- 🔴 **Real-time Status** - Online/offline user presence tracking
- ⚡ **WebSocket Communication** - Real-time message delivery via Socket.IO
- 📁 **File Storage** - Profile pictures stored in Appwrite
- 🧠 **Smart Caching** - node-cache for Netlify serverless compatibility
- 🗄️ **MongoDB Database** - Persistent data storage
- ⌨️ **Typing Indicators** - See when users are typing
- 🔔 **Notifications** - In-app notification system

## 🛠️ Tech Stack

### Backend
- **Node.js** + **Express** - Server framework
- **Socket.IO** - WebSocket real-time communication
- **MongoDB** - Database
- **JWT** - Authentication
- **bcrypt** - Password hashing
- **node-cache** - Session management
- **Appwrite** - File storage for profile pictures

### Frontend
- **React** + **Vite** - UI framework
- **Socket.IO Client** - WebSocket client
- **Axios** - HTTP client
- **TypeScript** - Type safety

## 📋 Prerequisites

- Node.js 18+ installed
- MongoDB Atlas account (or local MongoDB)
- Appwrite account for file storage
- npm or yarn package manager

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

Update the `.env` file in the root directory with your credentials:

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

# Node-Cache Configuration
CACHE_TTL=3600
CACHE_CHECK_PERIOD=600

# WebSocket Configuration
SOCKET_CORS_ORIGIN=http://localhost:5173
MAX_SOCKET_CONNECTIONS=1000
```

Update `client/.env`:

```env
VITE_API_URL=http://localhost:3000/api
VITE_SOCKET_URL=http://localhost:3000
VITE_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
VITE_APPWRITE_PROJECT_ID=your_project_id
VITE_APP_NAME=ChatApp
```

### 4. Setup MongoDB Collections

You have 3 options to create the MongoDB collections:

#### Option A: Using MongoDB Compass (Recommended)
1. Open MongoDB Compass
2. Connect to your database
3. Open MongoSH tab
4. Copy and paste the content of `setup-mongodb.js`
5. Press Enter

#### Option B: Using VS Code MongoDB Extension
1. Open `create-collections.mongodb`
2. Click the Play button to run

#### Option C: Using MongoDB Atlas Website
Follow the steps in `EASIEST-METHOD.md`

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
│   │   └── appwrite.js      # Appwrite storage
│   ├── controllers/         # Route controllers (to be added)
│   ├── middleware/          # Custom middleware (to be added)
│   ├── models/             # Database models (to be added)
│   ├── routes/             # API routes (to be added)
│   ├── socket/             # Socket.IO handlers (to be added)
│   └── server.js           # Main server file
│
├── client/                  # Frontend
│   ├── public/             # Static files
│   ├── src/
│   │   ├── components/     # React components (to be added)
│   │   ├── services/       # API services (to be added)
│   │   ├── App.jsx         # Main App component
│   │   └── App.css         # Styles
│   └── package.json
│
├── .env                    # Environment variables
├── .env.example           # Environment template
├── package.json           # Backend dependencies
├── setup-mongodb.js       # MongoDB setup script
└── README.md             # This file
```

## 🗄️ Database Collections

The application uses 10 MongoDB collections:

1. **users** - User accounts and profiles
2. **userpresence** - Real-time online/offline status
3. **publicrooms** - Public chat rooms
4. **messages** - All chat messages (public & private)
5. **privatechats** - Private chat metadata
6. **banners** - App announcements
7. **passwordresets** - Password reset tokens
8. **settings** - User preferences
9. **typing** - Typing indicators (auto-expires)
10. **notifications** - In-app notifications

## 🔧 Available Scripts

### Backend
- `npm run server` - Start backend development server
- `npm start` - Start production server

### Frontend
- `npm run client` - Start frontend development server
- `npm run build` - Build frontend for production

### Both
- `npm run dev` - Run both servers concurrently

## 📡 API Endpoints (To Be Implemented)

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/me` - Get current user

### Users
- `GET /api/users` - Get all users
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/profile` - Update profile
- `POST /api/users/profile-picture` - Upload profile picture

### Rooms
- `GET /api/rooms` - Get all public rooms
- `POST /api/rooms` - Create new room
- `GET /api/rooms/:id/messages` - Get room messages

### Chats
- `GET /api/chats` - Get user's private chats
- `POST /api/chats` - Start new private chat
- `GET /api/chats/:id/messages` - Get chat messages

## 🔌 Socket.IO Events

### Client → Server
- `authenticate` - Authenticate socket connection
- `join_public_room` - Join a public room
- `send_public_message` - Send message to room
- `start_private_chat` - Start private chat
- `send_private_message` - Send private message
- `typing_start` - User started typing
- `typing_stop` - User stopped typing

### Server → Client
- `connected` - Connection established
- `public_message` - New public message
- `private_message` - New private message
- `user_online` - User came online
- `user_offline` - User went offline
- `user_typing` - User is typing
- `error` - Error occurred

## 🚢 Deployment

### Netlify
The application is configured for Netlify deployment with serverless functions.

1. Build the frontend:
   ```bash
   npm run build
   ```

2. Deploy to Netlify:
   - Connect your GitHub repository
   - Set build command: `npm run build`
   - Set publish directory: `client/dist`
   - Add environment variables in Netlify dashboard

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📝 License

This project is licensed under the ISC License - see the LICENSE file for details.

## 👥 Author

Created as part of a chat application project.

## 🙏 Acknowledgments

- Socket.IO for real-time communication
- MongoDB for database
- Appwrite for file storage
- React and Vite for frontend framework

---

**Status**: ✅ Backend and frontend foundation complete, ready for feature implementation!
