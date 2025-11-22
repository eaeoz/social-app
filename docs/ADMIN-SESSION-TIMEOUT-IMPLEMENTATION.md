# Admin Client Session Timeout Implementation

## Overview

The admin-client now has the same session timeout popup and automatic logout functionality as the main client site. When a session expires, the admin will see a popup alert and be automatically logged out.

## Implementation Details

### Changes Made

**File: `admin-client/src/App.tsx`**

1. **Added Periodic Token Check** (Every 60 seconds)
   - Checks if the JWT token has expired
   - Runs only when admin is authenticated
   - Automatically triggers logout when token expires

2. **Added `handleAutoLogout` Function**
   - Shows alert popup: "Your session has expired. Please log in again."
   - Logs the automatic logout event with audit trail
   - Clears all authentication data (token, admin data)
   - Cleans up session management
   - Resets authentication state

3. **Separation of Logout Types**
   - `handleLogout()`: Manual logout by admin
   - `handleAutoLogout()`: Automatic logout due to session expiration

## How It Works

### 1. Token Expiration Check
```typescript
useEffect(() => {
  if (!isAuthenticated || !admin) return;

  const checkTokenInterval = setInterval(() => {
    const token = localStorage.getItem('adminToken');
    
    if (!token || isTokenExpired(token)) {
      handleAutoLogout();
    }
  }, 60000); // Check every minute

  return () => clearInterval(checkTokenInterval);
}, [isAuthenticated, admin]);
```

### 2. Automatic Logout Flow
1. **Token Check**: Every minute, the system checks if the JWT token is expired
2. **Expiration Detected**: When token expires, `handleAutoLogout()` is called
3. **Audit Log**: System logs the automatic logout event
4. **Clean Up**: All authentication data is removed
5. **Alert Popup**: Admin sees: "Your session has expired. Please log in again."
6. **Redirect**: Admin is automatically redirected to login page

### 3. Session Inactivity Timeout
The existing `SecureSessionManager` continues to work:
- **Default Timeout**: 30 minutes of inactivity
- **Activity Tracking**: Mouse, keyboard, scroll, touch events
- **Inactivity Alert**: "Your session has expired due to inactivity. Please log in again."

## Two Types of Timeouts

### 1. JWT Token Expiration (Database-Configured)
- **Controlled By**: `sessionTimeout` in site settings (default: 7 days)
- **Trigger**: Token expiration time reached (regardless of activity)
- **Message**: "Your session has expired. Please log in again."
- **Use Case**: Long-term session management

### 2. Inactivity Timeout (Client-Side)
- **Duration**: 30 minutes of no user activity
- **Trigger**: No mouse, keyboard, scroll, or touch events
- **Message**: "Your session has expired due to inactivity. Please log in again."
- **Use Case**: Security for unattended sessions

## Benefits

✅ **Consistent UX**: Admin-client now matches client-site behavior
✅ **Security**: Automatic logout prevents unauthorized access
✅ **User Awareness**: Alert popup informs admin why they were logged out
✅ **Audit Trail**: All automatic logouts are logged for security monitoring
✅ **Dual Protection**: Both JWT expiration and inactivity timeouts

## Testing

### Test JWT Token Expiration

1. **Set Short Session Timeout** (for testing only):
   ```javascript
   // In MongoDB site settings
   sessionTimeout: 0.0007  // ~1 minute
   ```

2. **Admin Login**: Log in to admin dashboard
3. **Wait**: Wait for the timeout period (~1 minute)
4. **Verify**: Alert popup appears and admin is logged out
5. **Check Logs**: Verify `AUTO_LOGOUT_SESSION_EXPIRED` in audit logs

### Test Inactivity Timeout

1. **Admin Login**: Log in to admin dashboard
2. **No Activity**: Don't interact with the page for 30 minutes
3. **Verify**: Alert popup appears and admin is logged out
4. **Check Logs**: Verify `SESSION_EXPIRED` in audit logs

### Test Manual Logout

1. **Admin Login**: Log in to admin dashboard
2. **Click Logout**: Use the logout button
3. **Verify**: No alert popup (clean logout)
4. **Check Logs**: Verify `LOGOUT` in audit logs

## Comparison with Client Site

Both client and admin-client now have identical timeout behavior:

| Feature | Client Site | Admin Client |
|---------|-------------|--------------|
| JWT Token Check | ✅ Every minute | ✅ Every minute |
| Auto-Logout Alert | ✅ Yes | ✅ Yes |
| Inactivity Timeout | ✅ Yes | ✅ Yes |
| Audit Logging | ✅ Yes | ✅ Yes |
| Session Cleanup | ✅ Yes | ✅ Yes |

## Security Considerations

1. **Token Validation**: Tokens are validated every minute
2. **No Server Dependency**: Client-side checks work even if server is unreachable
3. **Clean State**: All auth data is cleared on logout
4. **User Notification**: Users are always informed why they were logged out
5. **Audit Trail**: All logouts are logged for security review

## Related Files

- `admin-client/src/App.tsx` - Main application component (updated)
- `admin-client/src/utils/security.ts` - Security utilities including `isTokenExpired()`
- `SESSION-TIMEOUT-CONFIGURATION.md` - Session timeout configuration guide
- `client/src/App.tsx` - Client implementation (reference)

## Summary

The admin-client now provides the same secure and user-friendly session management as the main client site. Admins will receive clear notifications when their session expires, whether due to JWT token expiration or inactivity timeout.
