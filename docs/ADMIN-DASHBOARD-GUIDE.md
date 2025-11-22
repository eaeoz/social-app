# Admin Dashboard Implementation Guide

## Overview

A full-featured admin dashboard has been successfully implemented for the social chat application. The dashboard provides comprehensive tools for managing users, handling reports, configuring settings, and monitoring system statistics.

## What Was Implemented

### 1. Frontend (admin-client/)

#### Project Setup
- Created separate React + TypeScript project using Vite
- Configured for port 5174 to avoid conflicts with main client
- Set up routing with React Router
- Implemented responsive design with CSS

#### Components Created

1. **Login.tsx** - Admin authentication
   - Username/password login
   - Role verification (admin only)
   - JWT token management
   - Error handling

2. **Dashboard.tsx** - Main layout
   - Sidebar navigation
   - Route management
   - Logout functionality
   - User info display

3. **Statistics.tsx** - Dashboard overview
   - Total users count
   - Online users count
   - Total messages count
   - Pending reports count
   - New users today count

4. **Users.tsx** - User management
   - User list with pagination
   - Search functionality
   - User details display
   - Action buttons (view, suspend, delete)
   - Online status indicators

5. **Reports.tsx** - Reports management
   - Reports list
   - Filter by status (all, pending, resolved)
   - Reporter and reported user details
   - Action buttons

6. **Settings.tsx** - Site configuration
   - Toggle user profile pictures
   - Toggle registration
   - Set max message length
   - Set rate limits
   - Maintenance mode toggle

#### Features
- Authentication with localStorage persistence
- Protected routes
- Real-time data fetching
- Responsive UI design
- Loading states
- Error handling

### 2. Backend (server/)

#### Admin Routes (server/routes/adminRoutes.js)

All routes require authentication and admin role verification:

1. **GET /api/admin/statistics**
   - Returns dashboard statistics
   - Total users, online users, messages, reports, new users

2. **GET /api/admin/users**
   - Returns paginated user list
   - Search functionality
   - Excludes sensitive data (passwords)

3. **GET /api/admin/reports**
   - Returns all reports
   - Includes reporter and reported user details
   - Filter by status

4. **PUT /api/admin/reports/:reportId**
   - Update report status
   - Add admin notes
   - Track resolution

5. **PUT /api/admin/users/:userId/suspend**
   - Suspend or unsuspend users
   - Track suspension details

6. **DELETE /api/admin/users/:userId**
   - Delete user account
   - Clean up associated data (messages, reports, settings)

7. **GET /api/admin/settings**
   - Retrieve site settings

8. **PUT /api/admin/settings**
   - Update site settings
   - Apply changes immediately

#### Security Features
- JWT authentication required
- Admin role verification middleware
- Input validation
- Rate limiting (inherited from main app)
- CORS configured for admin dashboard

### 3. Database

#### User Schema Updates
- Added `role` field (default: 'user', possible: 'admin')
- Utility scripts created for role management

#### Utility Scripts Created

1. **server/utils/setUserRole.js**
   - Set user role via command line
   - Usage: `node utils/setUserRole.js <username> <role>`

2. **server/utils/listAdmins.js**
   - List all admin users
   - Usage: `node utils/listAdmins.js`

3. **server/utils/createAdminUser.js**
   - Create new admin account
   - Usage: `node utils/createAdminUser.js <username> <email> <password>`

## Setup Instructions

### 1. Install Dependencies

```bash
# Install admin dashboard dependencies
cd admin-client
npm install

# Backend dependencies already installed
```

### 2. Configure Environment

Create `admin-client/.env`:
```env
VITE_API_URL=http://localhost:3000/api
VITE_APP_NAME=SedatChat
```

### 3. Create Admin User

Option A - Using utility script:
```bash
cd server
node utils/createAdminUser.js adminuser admin@example.com securepassword
```

Option B - Manually in database:
```javascript
db.users.updateOne(
  { username: "existing_user" },
  { $set: { role: "admin" } }
)
```

### 4. Start Servers

Terminal 1 - Backend:
```bash
cd server
npm start
```

Terminal 2 - Main Client:
```bash
cd client
npm run dev
# Runs on http://localhost:5173
```

Terminal 3 - Admin Dashboard:
```bash
cd admin-client
npm run dev
# Runs on http://localhost:5174
```

### 5. Access Admin Dashboard

1. Open http://localhost:5174
2. Login with admin credentials
3. Navigate through dashboard sections

## Usage Guide

### User Management
- Search users by username, nickname, or email
- View user details (status, role, join date)
- Suspend/unsuspend users
- Delete user accounts

### Reports Management
- View all user reports
- Filter by status (pending/resolved)
- See reporter and reported user details
- Mark reports as resolved
- Add admin notes

### Settings Management
- Enable/disable user profile pictures
- Enable/disable new registrations
- Configure message length limits
- Set rate limits
- Toggle maintenance mode

### Statistics Dashboard
- Monitor total users
- Track online users
- View message count
- Check pending reports
- See new registrations

## Deployment

### Admin Dashboard Deployment

#### Netlify
1. Build: `npm run build`
2. Deploy `dist` directory
3. Set environment variables:
   - VITE_API_URL
   - VITE_APP_NAME

#### Vercel
1. Connect repository
2. Set build command: `npm run build`
3. Set output directory: `dist`
4. Configure environment variables

### Backend Considerations
- Ensure CORS allows admin dashboard origin
- Configure rate limiting appropriately
- Use HTTPS in production
- Secure JWT secret
- Set appropriate session timeouts

## Security Considerations

### Authentication
- JWT tokens with expiration
- Role-based access control
- Secure password hashing (bcrypt)
- Session management

### Authorization
- Admin middleware on all admin routes
- Role verification at database level
- Protected frontend routes

### Data Protection
- Passwords excluded from API responses
- Input validation and sanitization
- SQL injection prevention (using MongoDB)
- XSS protection

### Rate Limiting
- Inherited from main application
- Additional limits can be added for admin routes
- IP blocking for failed attempts

## API Documentation

### Authentication

```typescript
POST /api/auth/login
Body: { username: string, password: string }
Response: { user: {..., role: 'admin'}, accessToken: string }
```

### Admin Endpoints

All require `Authorization: Bearer <token>` header and admin role.

```typescript
GET /api/admin/statistics
Response: {
  totalUsers: number,
  onlineUsers: number,
  totalMessages: number,
  pendingReports: number,
  newUsersToday: number
}

GET /api/admin/users?page=1&limit=20&search=query
Response: {
  users: User[],
  pagination: {
    page: number,
    limit: number,
    total: number,
    pages: number
  }
}

GET /api/admin/reports?status=pending
Response: {
  reports: Report[]
}

PUT /api/admin/reports/:reportId
Body: { status: 'pending' | 'resolved' | 'dismissed', adminNotes?: string }

PUT /api/admin/users/:userId/suspend
Body: { suspend: boolean }

DELETE /api/admin/users/:userId

GET /api/admin/settings
Response: { settings: SiteSettings }

PUT /api/admin/settings
Body: SiteSettings
```

## Troubleshooting

### Cannot Login
- Verify user has `role: 'admin'` in database
- Check backend is running
- Verify VITE_API_URL is correct
- Check browser console for errors

### API Errors
- Verify CORS configuration
- Check JWT token is valid
- Ensure admin routes are registered
- Review server logs

### Build Errors
- Clear node_modules and reinstall
- Check TypeScript errors
- Verify all dependencies are installed
- Run `npm run build` to check for issues

## Future Enhancements

Possible improvements for future versions:

1. **Enhanced Analytics**
   - User activity graphs
   - Message volume charts
   - Report trends
   - Peak usage times

2. **Advanced User Management**
   - Bulk operations
   - User activity logs
   - Email notifications
   - Role management UI

3. **Better Report System**
   - Category-based filtering
   - Priority levels
   - Automated actions
   - Appeal system

4. **Settings Improvements**
   - Feature flags
   - A/B testing configuration
   - Email template editor
   - Backup/restore

5. **Real-time Updates**
   - WebSocket integration
   - Live statistics
   - Instant notifications
   - Online admin presence

## File Structure

```
admin-client/
├── public/
│   └── vite.svg
├── src/
│   ├── components/
│   │   ├── Dashboard.css
│   │   ├── Dashboard.tsx
│   │   ├── Login.css
│   │   ├── Login.tsx
│   │   ├── Reports.css
│   │   ├── Reports.tsx
│   │   ├── Settings.css
│   │   ├── Settings.tsx
│   │   ├── Statistics.css
│   │   ├── Statistics.tsx
│   │   ├── Users.css
│   │   └── Users.tsx
│   ├── App.css
│   ├── App.tsx
│   ├── index.css
│   ├── main.tsx
│   └── vite-env.d.ts
├── .env
├── .gitignore
├── index.html
├── package.json
├── README.md
├── tsconfig.json
├── tsconfig.app.json
├── tsconfig.node.json
└── vite.config.ts

server/
├── routes/
│   └── adminRoutes.js  (NEW)
├── utils/
│   ├── setUserRole.js  (NEW)
│   ├── listAdmins.js   (NEW)
│   └── createAdminUser.js  (NEW)
└── server.js  (MODIFIED - added admin routes)
```

## Conclusion

The admin dashboard is now fully functional with:
- ✅ Complete authentication system
- ✅ User management capabilities
- ✅ Reports handling
- ✅ Settings configuration
- ✅ Real-time statistics
- ✅ Secure API endpoints
- ✅ Role-based access control
- ✅ Responsive design
- ✅ Production-ready code

The dashboard can be extended with additional features as needed. All code follows best practices and includes proper error handling, validation, and security measures.
