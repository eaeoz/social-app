# Chat Application Architecture Plan

## Overview
A real-time chat application with public rooms and private messaging capabilities, deployed on Netlify with MongoDB backend.

## Technology Stack

### Backend
- **Runtime:** Node.js
- **Framework:** Express.js
- **WebSocket:** Socket.io
- **Database:** MongoDB
- **Caching:** node-cache (Netlify-compatible)
- **File Storage:** Appwrite (profile pictures)
- **Authentication:** JWT (JSON Web Tokens)
- **Password Hashing:** bcrypt
- **Deployment:** Netlify Functions

### Frontend
- **Framework:** React.js (recommended) or vanilla JS
- **WebSocket Client:** Socket.io-client
- **HTTP Client:** Axios
- **UI Components:** Custom components for chat interface

## Database Schema (MongoDB)

### Collections

#### 1. Users Collection
```javascript
{
  _id: ObjectId,
  username: String (unique, required),
  password: String (hashed, required),
  email: String (unique, required),
  profilePictureId: String (Appwrite file ID),
  displayName: String,
  status: String (online/offline/away),
  createdAt: Date,
  updatedAt: Date,
  lastSeen: Date
}
```

#### 2. PublicRooms Collection
```javascript
{
  _id: ObjectId,
  name: String (required),
  description: String,
  createdBy: ObjectId (ref: Users),
  createdAt: Date,
  participants: [ObjectId] (refs: Users),
  isActive: Boolean
}
```

#### 3. Messages Collection
```javascript
{
  _id: ObjectId,
  senderId: ObjectId (ref: Users),
  roomId: ObjectId (ref: PublicRooms), // null for private messages
  receiverId: ObjectId (ref: Users), // null for public messages
  content: String (required),
  messageType: String (text/image/file),
  isPrivate: Boolean,
  isRead: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

#### 4. PrivateChats Collection
```javascript
{
  _id: ObjectId,
  participants: [ObjectId] (refs: Users, exactly 2),
  createdAt: Date,
  lastMessageAt: Date,
  isActive: Boolean
}
```

## Node-Cache Strategy

### Cached Data (for Netlify serverless compatibility)
```javascript
// User sessions cache
userSessions = {
  userId: {
    socketId: String,
    username: String,
    status: String,
    lastActivity: Date
  }
}

// Active connections cache
activeConnections = {
  socketId: userId
}

// Online users list cache
onlineUsers = [userId1, userId2, ...]

// Room participants cache
roomParticipants = {
  roomId: [userId1, userId2, ...]
}
```

### Cache Configuration
- **TTL:** 1 hour (3600 seconds)
- **Check Period:** 10 minutes (600 seconds)
- **Auto-refresh:** On user activity

## WebSocket Events

### Client -> Server Events
```javascript
// Authentication
'authenticate' - { token: String }

// Public Chat
'join_public_room' - { roomId: String }
'leave_public_room' - { roomId: String }
'send_public_message' - { roomId: String, message: String }

// Private Chat
'request_user_list' - {}
'start_private_chat' - { receiverId: String }
'send_private_message' - { receiverId: String, message: String }
'mark_as_read' - { messageId: String }

// User Status
'user_status_change' - { status: String }
'typing_start' - { roomId: String | receiverId: String }
'typing_stop' - { roomId: String | receiverId: String }
```

### Server -> Client Events
```javascript
// Connection
'connected' - { userId: String, socketId: String }
'user_joined' - { userId: String, username: String }
'user_left' - { userId: String, username: String }

// Public Chat
'public_message' - { messageId: String, senderId: String, content: String, timestamp: Date }
'room_history' - { messages: Array }

// Private Chat
'user_list' - { users: Array }
'private_message' - { messageId: String, senderId: String, content: String, timestamp: Date }
'chat_history' - { messages: Array }
'message_read' - { messageId: String }

// User Status
'user_online' - { userId: String }
'user_offline' - { userId: String }
'user_typing' - { userId: String, isTyping: Boolean }

// Errors
'error' - { message: String, code: String }
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user
- `POST /api/auth/refresh` - Refresh access token
- `GET /api/auth/me` - Get current user info

### Users
- `GET /api/users` - Get all users (for user selection)
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/profile` - Update user profile
- `POST /api/users/profile-picture` - Upload profile picture

### Public Rooms
- `GET /api/rooms` - Get all public rooms
- `POST /api/rooms` - Create new public room
- `GET /api/rooms/:id` - Get room details
- `GET /api/rooms/:id/messages` - Get room message history

### Private Chats
- `GET /api/chats` - Get user's private chats
- `POST /api/chats` - Start new private chat
- `GET /api/chats/:id/messages` - Get chat message history

## Appwrite Integration

### File Storage Structure
```
Bucket: profile_pictures_bucket_id
├── user_{userId}_profile.jpg
├── user_{userId}_profile.png
└── ...
```

### File Operations
1. **Upload:** User uploads profile picture -> Store in Appwrite -> Save fileId in MongoDB
2. **Retrieve:** Get fileId from MongoDB -> Construct Appwrite URL -> Display image
3. **Update:** Delete old file -> Upload new file -> Update fileId in MongoDB

### URL Format
```
https://cloud.appwrite.io/v1/storage/buckets/{bucketId}/files/{fileId}/view?project={projectId}
```

## Project Structure
```
social-app/
├── server/
│   ├── config/
│   │   ├── database.js        # MongoDB connection
│   │   ├── appwrite.js        # Appwrite configuration
│   │   └── cache.js           # Node-cache setup
│   ├── models/
│   │   ├── User.js
│   │   ├── Message.js
│   │   ├── PublicRoom.js
│   │   └── PrivateChat.js
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── userController.js
│   │   ├── roomController.js
│   │   └── chatController.js
│   ├── middleware/
│   │   ├── auth.js
│   │   ├── validation.js
│   │   └── errorHandler.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── users.js
│   │   ├── rooms.js
│   │   └── chats.js
│   ├── socket/
│   │   ├── socketHandler.js
│   │   ├── publicChatHandler.js
│   │   └── privateChatHandler.js
│   ├── utils/
│   │   ├── jwt.js
│   │   ├── validators.js
│   │   └── helpers.js
│   └── server.js              # Main server file
├── client/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Auth/
│   │   │   │   ├── Login.jsx
│   │   │   │   └── Register.jsx
│   │   │   ├── Chat/
│   │   │   │   ├── PublicRoom.jsx
│   │   │   │   ├── PrivateChat.jsx
│   │   │   │   ├── MessageList.jsx
│   │   │   │   ├── MessageInput.jsx
│   │   │   │   └── UserSelector.jsx
│   │   │   ├── User/
│   │   │   │   ├── UserList.jsx
│   │   │   │   ├── UserProfile.jsx
│   │   │   │   └── ProfilePicture.jsx
│   │   │   └── Layout/
│   │   │       ├── Header.jsx
│   │   │       ├── Sidebar.jsx
│   │   │       └── ChatWindow.jsx
│   │   ├── services/
│   │   │   ├── api.js
│   │   │   ├── socket.js
│   │   │   └── auth.js
│   │   ├── hooks/
│   │   │   ├── useAuth.js
│   │   │   ├── useSocket.js
│   │   │   └── useChat.js
│   │   ├── context/
│   │   │   ├── AuthContext.jsx
│   │   │   └── SocketContext.jsx
│   │   ├── utils/
│   │   │   └── helpers.js
│   │   ├── App.jsx
│   │   └── index.jsx
│   └── package.json
├── netlify/
│   └── functions/
│       └── api.js             # Netlify function wrapper
├── .env
├── .env.example
├── .gitignore
├── package.json
├── netlify.toml
└── README.md
```

## Security Considerations

1. **Authentication:**
   - JWT tokens with expiration
   - Refresh token mechanism
   - Password hashing with bcrypt (10 rounds)

2. **WebSocket Security:**
   - Token-based authentication
   - Origin verification
   - Rate limiting

3. **Data Validation:**
   - Input sanitization
   - XSS prevention
   - SQL injection prevention (MongoDB parameterized queries)

4. **CORS Configuration:**
   - Whitelist allowed origins
   - Credentials support

5. **Environment Variables:**
   - Never commit .env file
   - Use strong secrets in production

## Deployment Strategy (Netlify)

### Netlify Configuration
```toml
[build]
  command = "npm run build"
  functions = "netlify/functions"
  publish = "client/build"

[[redirects]]
  from = "/api/*"
  to = "/.netlify/functions/api/:splat"
  status = 200

[[redirects]]
  from = "/socket.io/*"
  to = "/.netlify/functions/api/:splat"
  status = 200

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

### Considerations
- WebSocket connections handled via Socket.io with fallback to polling
- node-cache for session management (serverless-friendly)
- MongoDB Atlas for persistent storage
- Appwrite for file storage (external service)

## Next Steps

1. **Setup Phase:**
   - Initialize Node.js project
   - Install dependencies
   - Configure MongoDB connection
   - Setup Appwrite account and bucket

2. **Backend Development:**
   - Create database models
   - Implement authentication
   - Build REST API endpoints
   - Setup WebSocket handlers
   - Configure node-cache

3. **Frontend Development:**
   - Create React components
   - Implement authentication flow
   - Build chat interfaces
   - Integrate Socket.io client
   - Add user selection UI

4. **Integration:**
   - Connect frontend with backend
   - Test WebSocket connections
   - Implement file upload/download
   - Test caching mechanism

5. **Testing & Deployment:**
   - Unit testing
   - Integration testing
   - Deploy to Netlify
   - Configure environment variables
   - Test production deployment

## Key Features Implementation

### User Selection Modal
```javascript
// When user clicks "New Chat" button:
1. Open modal window
2. Fetch user list from API
3. Display users with profile pictures (from Appwrite)
4. Allow search/filter
5. On user selection:
   - Check if private chat exists
   - Create new chat or open existing
   - Initialize WebSocket connection
   - Load chat history
```

### Message Flow
```javascript
// Public Message:
User types -> Click send -> Emit 'send_public_message' -> 
Server validates -> Save to MongoDB -> 
Broadcast to room participants -> Update UI

// Private Message:
User types -> Click send -> Emit 'send_private_message' -> 
Server validates -> Save to MongoDB -> 
Emit to receiver -> Update cache -> Update UI
```

### Online Status
```javascript
// Status tracked via:
1. WebSocket connection events
2. node-cache for real-time data
3. Periodic heartbeat
4. Last seen timestamp in MongoDB
```

This architecture provides a scalable, real-time chat application with proper separation of concerns and deployment readiness for Netlify.
