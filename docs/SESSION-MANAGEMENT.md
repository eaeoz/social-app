# Session Management & Token Expiration

## Overview

The application uses JWT (JSON Web Tokens) for authentication. This document explains how session management works and how to configure token expiration times.

## Current Implementation

### Token Expiration Settings

By default, tokens have the following expiration times:

- **Access Token**: 7 days (configurable via `JWT_EXPIRES_IN` environment variable)
- **Refresh Token**: 30 days (configurable via `JWT_REFRESH_EXPIRES_IN` environment variable)

### Automatic Session Management

The client application now includes automatic session management that:

1. **Checks token expiration on startup** - Validates the stored token when the app loads
2. **Periodically checks token validity** - Checks every minute if the token is still valid
3. **Handles expired tokens during API calls** - Automatically detects 401/403 errors and logs out the user
4. **Provides user-friendly alerts** - Notifies users when their session has expired

### Activity Tracking

The server tracks user activity to maintain online/offline status:

- **5-minute inactivity timeout** - Users are marked as offline after 5 minutes of no activity
- **Client-side heartbeat** - The client sends activity updates every 90 seconds
- **User interaction tracking** - Mouse movements, keyboard input, and clicks are tracked

## Configuration

### Server Configuration (.env file)

```env
# JWT Token Settings
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=7d                    # Access token expiration (e.g., '1d', '7d', '24h')
JWT_REFRESH_SECRET=your-refresh-secret
JWT_REFRESH_EXPIRES_IN=30d           # Refresh token expiration
```

### Supported Time Formats

You can use the following formats for token expiration:
- `60` - 60 seconds
- `2m` - 2 minutes
- `10h` - 10 hours
- `7d` - 7 days
- `4w` - 4 weeks

### Example Configurations

**Short Session (1 hour):**
```env
JWT_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=1d
```

**Standard Session (7 days):**
```env
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d
```

**Extended Session (30 days):**
```env
JWT_EXPIRES_IN=30d
JWT_REFRESH_EXPIRES_IN=90d
```

## User Experience

### What Happens When a Token Expires

1. **During page load**: If the token is expired when the user opens/refreshes the page, they are automatically redirected to the login page

2. **During active use**: If the token expires while the user is actively using the app:
   - The client detects this within 1 minute (periodic check)
   - User sees an alert: "Your session has expired. Please log in again."
   - User is automatically logged out and redirected to login page

3. **During API calls**: If an API call fails due to an expired token:
   - User sees an alert: "Your session has expired. Please log in again."
   - User is automatically logged out and redirected to login page

### Best Practices

1. **Choose appropriate expiration times** based on your security requirements:
   - Shorter tokens = More secure but less convenient
   - Longer tokens = More convenient but slightly less secure

2. **Consider your user base**:
   - Active daily users: 7-14 days is reasonable
   - Occasional users: Shorter tokens (1-3 days) may be better
   - High-security apps: Very short tokens (hours)

3. **Monitor user feedback**: If users complain about frequent logouts, consider extending token lifetime

4. **Use HTTPS in production**: Always use HTTPS to protect tokens in transit

## Troubleshooting

### Issue: Users can't see rooms/users after a while

**Cause**: JWT token has expired

**Solution**: The application now automatically handles this by:
1. Detecting the expired token
2. Logging the user out
3. Redirecting to the login page
4. Showing a clear message

### Issue: Users are marked offline while still active

**Cause**: Activity heartbeat not working properly

**Solution**: The client sends activity updates every 90 seconds and tracks user interaction (mouse, keyboard, clicks)

### Issue: Token expires too quickly

**Solution**: Increase the `JWT_EXPIRES_IN` value in your `.env` file

```env
# Change from 1 day to 7 days
JWT_EXPIRES_IN=7d
```

### Issue: Token expires too slowly (security concern)

**Solution**: Decrease the `JWT_EXPIRES_IN` value in your `.env` file

```env
# Change from 30 days to 7 days
JWT_EXPIRES_IN=7d
```

## Security Considerations

1. **Token Storage**: Tokens are stored in localStorage. Clear all storage on logout
2. **Token Validation**: Server validates tokens on every authenticated request
3. **Automatic Cleanup**: Client automatically clears expired tokens
4. **Force Logout**: Server can force logout suspended/deleted users via socket events

## Future Improvements

Potential enhancements for session management:

1. **Token Refresh**: Implement automatic token refresh before expiration
2. **Remember Me**: Option for extended sessions
3. **Multiple Devices**: Track sessions across devices
4. **Session History**: Show users their active sessions
5. **Manual Revocation**: Allow users to revoke sessions

## Related Files

- `server/utils/jwt.js` - JWT token generation and verification
- `server/middleware/auth.js` - Authentication middleware
- `client/src/App.tsx` - Token expiration checking
- `client/src/components/Home/Home.tsx` - API error handling for expired tokens
- `server/server.js` - Activity tracking and user status management
