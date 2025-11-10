# Admin Dashboard

A comprehensive admin dashboard for managing the social chat application.

## Features

- **User Management**: View, search, suspend, and delete users
- **Reports Management**: Handle user reports and moderation
- **Site Settings**: Configure application-wide settings
- **Statistics**: Monitor system metrics and user activity
- **Secure Authentication**: Admin-only access with JWT tokens

## Getting Started

### Prerequisites

- Node.js 16+ installed
- Backend server running on `http://localhost:3000`
- Admin user account with `role: 'admin'` in the database

### Installation

1. Navigate to the admin-client directory:
```bash
cd admin-client
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file:
```env
VITE_API_URL=http://localhost:3000/api
VITE_APP_NAME=SedatChat
```

4. Start the development server:
```bash
npm run dev
```

The admin dashboard will be available at `http://localhost:5174`

## Creating an Admin User

You need to manually set a user's role to 'admin' in the database. You can use one of these methods:

### Method 1: Using the utility script

Run the provided utility script from the server directory:

```bash
cd ../server
node utils/setUserRole.js <username> admin
```

### Method 2: Using MongoDB Compass or CLI

Connect to your MongoDB database and run:

```javascript
db.users.updateOne(
  { username: "your_admin_username" },
  { $set: { role: "admin" } }
)
```

### Method 3: During registration

Modify the registration code temporarily to set role as 'admin', register your account, then revert the code.

## API Endpoints

The admin dashboard connects to these backend API endpoints:

- `POST /api/auth/login` - Admin authentication
- `GET /api/admin/statistics` - Dashboard statistics
- `GET /api/admin/users` - User list with pagination
- `GET /api/admin/reports` - Reports list
- `PUT /api/admin/reports/:reportId` - Update report status
- `PUT /api/admin/users/:userId/suspend` - Suspend/unsuspend user
- `DELETE /api/admin/users/:userId` - Delete user
- `GET /api/admin/settings` - Get site settings
- `PUT /api/admin/settings` - Update site settings

## Building for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

## Deployment

### Option 1: Netlify

1. Build the project: `npm run build`
2. Deploy the `dist` directory to Netlify
3. Configure environment variables in Netlify dashboard:
   - `VITE_API_URL`: Your production API URL
   - `VITE_APP_NAME`: Your app name

### Option 2: Vercel

1. Connect your repository to Vercel
2. Set build command: `npm run build`
3. Set output directory: `dist`
4. Configure environment variables

### Option 3: Static hosting

Simply upload the contents of the `dist` directory to any static hosting service.

## Security Notes

- Admin dashboard requires authentication via JWT tokens
- All API requests include the Authorization header
- Tokens are stored in localStorage
- Admin role is verified on the backend for all admin operations
- Rate limiting is applied to prevent abuse

## Troubleshooting

### Cannot login

- Verify the user has `role: 'admin'` in the database
- Check that the backend server is running
- Verify VITE_API_URL is correct in your .env file

### API errors

- Check browser console for detailed error messages
- Verify CORS is configured correctly on the backend
- Ensure admin routes are registered in server.js

### Features not loading

- Check network tab in browser dev tools
- Verify JWT token is being sent in Authorization header
- Confirm backend admin routes are accessible

## Development

### Project Structure

```
admin-client/
├── src/
│   ├── components/
│   │   ├── Dashboard.tsx      # Main dashboard layout
│   │   ├── Login.tsx          # Admin login
│   │   ├── Statistics.tsx     # Dashboard overview
│   │   ├── Users.tsx          # User management
│   │   ├── Reports.tsx        # Reports management
│   │   └── Settings.tsx       # Site settings
│   ├── App.tsx                # App root with routing
│   └── main.tsx               # Entry point
├── public/                     # Static assets
└── package.json               # Dependencies
```

### Technologies Used

- React 18 with TypeScript
- React Router for navigation
- Vite for build tooling
- CSS for styling

## License

Same as the main project license.
