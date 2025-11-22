# Session Timeout Configuration Guide

## Overview

The session timeout feature allows administrators to configure how long users stay logged in before their session expires. This setting controls both JWT token expiration and socket connection activity timeout, ensuring consistent session management across the entire application.

## What is Session Timeout?

Session timeout determines how long a user can remain logged in without being automatically logged out. When the timeout period expires:

1. **JWT Token expires** - User cannot make authenticated API requests
2. **Activity timeout triggers** - User is marked as offline
3. **Automatic logout** - Client automatically redirects to login page

## Default Configuration

- **Default Value**: 7 days
- **Minimum**: 1 day
- **Maximum**: 365 days
- **Storage**: MongoDB `siteSettings` collection
- **Field Name**: `sessionTimeout`

## How It Works

### 1. Database Storage

The session timeout value is stored in MongoDB:

```javascript
{
  "_id": ObjectId("..."),
  "settingType": "global",
  "sessionTimeout": 7,  // Days
  // ... other settings
}
```

### 2. JWT Token Generation

When a user logs in or registers, the system:

1. Reads `sessionTimeout` from the database
2. Generates JWT token with expiration: `${sessionTimeout}d`
3. Generates refresh token with expiration: `${sessionTimeout * 4}d`

**Backend Code** (`server/utils/jwt.js`):
```javascript
const settings = await getSiteSettings();
const sessionTimeoutDays = settings.sessionTimeout || 7;

const token = jwt.sign(
  { userId, username },
  JWT_SECRET,
  { expiresIn: `${sessionTimeoutDays}d` }
);
```

### 3. Activity Timeout

Socket connections also use the database value:

**Backend Code** (`server/server.js`):
```javascript
const settings = await getSiteSettings();
const sessionTimeoutDays = settings.sessionTimeout || 7;
const sessionTimeoutMs = sessionTimeoutDays * 24 * 60 * 60 * 1000;

setTimeout(() => {
  updateUserStatus(userId, 'offline');
}, sessionTimeoutMs);
```

### 4. Client-Side Token Validation

The client checks token expiration every minute:

**Frontend Code** (`client/src/App.tsx`):
```javascript
setInterval(() => {
  const token = localStorage.getItem('token');
  if (token && isTokenExpired(token)) {
    handleAutoLogout();
  }
}, 60000); // Check every minute
```

## Configuration Methods

### Method 1: Admin Dashboard (Recommended)

1. Log in to admin dashboard at `https://netcifyadmin.netlify.app`
2. Navigate to **Settings** section
3. Find **"Session Timeout"** under **System Settings**
4. Enter desired value (1-365 days)
5. Click **"💾 Save Changes"**
6. Changes take effect immediately for new logins

### Method 2: Direct Database Update

```javascript
// Using MongoDB shell or Compass
db.siteSettings.updateOne(
  { settingType: 'global' },
  { $set: { sessionTimeout: 7 } }
);
```

### Method 3: MongoDB Compass GUI

1. Connect to your MongoDB database
2. Navigate to `social-db` → `siteSettings` collection
3. Find document with `settingType: "global"`
4. Edit `sessionTimeout` field
5. Save changes

## Important Notes

### ⚠️ Existing Sessions

- Changing the session timeout **does NOT affect existing logged-in users**
- Only **new logins** after the change will use the new timeout
- Existing users will be logged out when their current token expires

### 🔄 Real-time vs Stored Sessions

- **JWT tokens** are self-contained and cannot be revoked
- Once issued, a token remains valid until its expiration time
- To force immediate logout of all users, you would need to:
  1. Change the `JWT_SECRET` environment variable (logs out everyone)
  2. Restart the server

### 📊 Recommended Values

| Use Case | Recommended Timeout | Reason |
|----------|-------------------|--------|
| High Security | 1-3 days | Frequent re-authentication |
| Standard | 7 days | Balance of security and UX |
| Convenience | 30 days | Less frequent logins |
| Maximum | 365 days | Use with caution |

### 🔐 Security Considerations

**Shorter timeouts:**
- ✅ More secure
- ✅ Better for shared/public devices
- ❌ Users must log in more frequently

**Longer timeouts:**
- ✅ Better user experience
- ✅ Fewer login interruptions
- ❌ Higher security risk if device is compromised

## Testing the Feature

### Test Session Timeout

1. **Set a short timeout for testing** (e.g., 1 minute):
   ```javascript
   // In MongoDB
   db.siteSettings.updateOne(
     { settingType: 'global' },
     { $set: { sessionTimeout: 0.0007 } } // Approximately 1 minute
   );
   ```

2. **Log in to the application**
3. **Wait for the timeout period**
4. **Verify automatic logout occurs**
5. **Check that user cannot access protected resources**

### Verify Token Expiration

Check the JWT token expiration:

```javascript
// In browser console
const token = localStorage.getItem('token');
const payload = JSON.parse(atob(token.split('.')[1]));
const expiresAt = new Date(payload.exp * 1000);
console.log('Token expires at:', expiresAt);
```

## Troubleshooting

### Issue: Users Stay Logged In Too Long

**Solution:**
1. Check `sessionTimeout` value in database
2. Verify new logins use the correct timeout
3. Remember: existing sessions keep their original timeout

### Issue: Users Logged Out Immediately

**Possible Causes:**
1. `sessionTimeout` set to very low value (< 1 day)
2. System clock mismatch between server and client
3. JWT_SECRET changed, invalidating all tokens

**Solution:**
1. Check database value: `db.siteSettings.findOne({settingType: 'global'})`
2. Ensure `sessionTimeout` is reasonable (>= 1 day)
3. Verify server time is correct

### Issue: Setting Not Taking Effect

**Solution:**
1. Verify setting saved correctly in database
2. User must **log in again** for new timeout to apply
3. Check server logs for any errors during JWT generation
4. Restart server if needed (for code changes only)

## Related Files

- `server/utils/initializeSiteSettings.js` - Default settings initialization
- `server/utils/jwt.js` - JWT token generation with timeout
- `server/controllers/authController.js` - Login/register handlers
- `server/server.js` - Socket activity timeout
- `admin-client/src/components/Settings.tsx` - Admin UI
- `client/src/App.tsx` - Client-side token validation

## API Endpoints

### Get Site Settings
```http
GET /api/settings/site
Response: { sessionTimeout: 7, ... }
```

### Update Settings (Admin Only)
```http
PUT /api/admin/settings
Authorization: Bearer <admin-token>
Body: { sessionTimeout: 14, ... }
```

## Migration from Environment Variables

**Before** (hardcoded in environment):
```bash
JWT_EXPIRES_IN=7d
```

**After** (database-driven):
- Setting stored in MongoDB
- Configurable via admin dashboard
- Fallback to 7 days if database unavailable
- No environment variable needed

## Summary

✅ **Session timeout is now fully configurable**
✅ **No code deployment needed to change timeout**
✅ **Consistent across JWT and socket connections**
✅ **Admin-friendly UI for configuration**
✅ **Automatic fallback to safe defaults**

For questions or issues, contact the development team.
