# Mobile App Email Verification Implementation

## Overview

The mobile app now implements email verification to ensure users verify their email addresses before accessing the app. This matches the web frontend's email verification flow.

## Architecture

### Email Sending
- **Backend Server**: Handles registration and calls Netlify Function
- **Netlify Function**: `client/netlify/functions/verify-email.js` sends emails via SMTP
- **Mobile App**: Does NOT send emails directly (backend handles this)

### Flow

```
Registration → Backend Creates User → Netlify Function Sends Email
     ↓
User receives email with verification link
     ↓
User clicks link in email (opens web browser)
     ↓
Web frontend verifies token via backend API
     ↓
User returns to mobile app and logs in
     ↓
App checks isEmailVerified status → Grants/Denies access
```

## Implementation Details

### 1. Registration Flow (`RegisterScreen.tsx`)

- User fills registration form
- Backend creates user with `isEmailVerified: false`
- Backend generates `emailVerificationToken` (24-hour expiry)
- Backend calls Netlify Function to send verification email
- User sees success message with instructions

### 2. Email Verification Screen (`EmailVerificationScreen.tsx`)

**When Shown:**
- After successful registration (auto-login with unverified account)
- When unverified user tries to log in

**Features:**
- ✅ Clear instructions for users
- ✅ Tips for finding verification email
- ✅ Resend email button (with attempt limits)
- ✅ "Back to Login" button
- ✅ 24-hour expiry warning

### 3. Login Flow (`LoginScreen.tsx`)

Backend blocks unverified users during login:
```javascript
if (!user.isEmailVerified) {
  return res.status(403).json({ 
    error: 'Please verify your email address...',
    requiresEmailVerification: true,
    email: user.email
  });
}
```

### 4. App-Level Protection (`App.tsx`)

```tsx
{user ? (
  user.isEmailVerified === false ? (
    <EmailVerificationScreen email={user.email} />
  ) : (
    <RootNavigator />  // Main app
  )
) : (
  <LoginScreen />  // Not logged in
)}
```

## User Experience

### New User Registration
1. User fills registration form
2. Submits registration
3. Account created, user auto-logged in
4. **Email Verification Screen shown** (can't access app yet)
5. User checks email
6. Clicks verification link
7. Email verified via web browser
8. Returns to app, logs out and logs back in
9. Now has full access

### Returning Unverified User
1. User tries to login
2. Backend returns 403 error with `requiresEmailVerification: true`
3. App shows Email Verification Screen
4. User verifies email
5. Logs in again
6. Gets full access

## Backend Endpoints

### Registration
```
POST /auth/register
Response: { 
  user: { isEmailVerified: false, ... },
  requiresEmailVerification: true
}
```

### Login (Unverified)
```
POST /auth/login
Response: 403 { 
  error: "Please verify your email...",
  requiresEmailVerification: true,
  email: "user@example.com"
}
```

### Verify Email
```
POST /auth/verify-email
Body: { token: "..." }
Response: { success: true, message: "Email verified!" }
```

### Resend Verification Email
```
POST /auth/resend-verification-email
Body: { email: "...", password: "..." }
Response: { 
  success: true,
  remainingAttempts: 3,
  maxAttempts: 4
}
```

## Configuration

### Environment Variables (Backend)
```env
CLIENT_URL=https://your-frontend.netlify.app
SMTP_USER=your-email@yandex.com
SMTP_PASS=your-password
SMTP_HOST=smtp.yandex.com
SMTP_PORT=587
```

### Site Settings (Admin Panel)
- `verificationEmailResendCount`: Max resend attempts (default: 4)

## Security Features

### 1. Token Expiration
- Verification tokens expire after 24 hours
- Expired tokens return error, user must re-register or resend

### 2. Resend Limits
- Configurable maximum resend attempts (default: 4)
- Prevents email abuse
- Counter tracked in user document

### 3. Password Verification
- Resend requires password verification
- Prevents unauthorized email sending

### 4. Account Lockout
- Failed login attempts tracked
- Account locks after 5 failed attempts (30 minutes)
- Lock cleared on successful verification

## User Type

```typescript
interface User {
  userId: string;
  username: string;
  email: string;
  isEmailVerified?: boolean;  // ← Verification status
  // ... other fields
}

interface AuthUser extends User {
  accessToken: string;
  refreshToken: string;
}
```

## Testing Checklist

- [ ] New user registration shows verification screen
- [ ] Verification email received
- [ ] Clicking email link verifies account
- [ ] Unverified user blocked from login
- [ ] Verified user can access app
- [ ] Resend email works
- [ ] Resend attempt limits enforced
- [ ] Token expiration works
- [ ] "Back to Login" button works
- [ ] Theme toggle works on verification screen

## Troubleshooting

### Email Not Received
1. Check spam/junk folder
2. Wait a few minutes for delivery
3. Verify SMTP credentials in backend
4. Check Netlify Function logs
5. Use resend button (if attempts remain)

### Can't Access App
- Ensure email is verified
- Try logging out and back in
- Check `isEmailVerified` field in database
- Verify token hasn't expired

### Backend Errors
```javascript
// Check backend logs for:
console.log('✅ Verification email sent via Netlify function to:', email);
console.log('❌ Failed to send verification email:', emailError);
```

## Mobile App vs Web Frontend

### Similarities
- Both use same backend API
- Both use Netlify Function for emails
- Both enforce email verification
- Both show verification screens

### Differences
- **Mobile**: Shows EmailVerificationScreen component
- **Web**: Shows banner/modal on dashboard
- **Mobile**: Requires logout/login after verification
- **Web**: Can refresh page to update status

## Future Enhancements

- [ ] Deep linking for email verification (open mobile app directly)
- [ ] Push notifications for verification status
- [ ] In-app email verification check (without logout)
- [ ] Biometric authentication after verification
- [ ] Social login with auto-verified emails

## Related Files

- `mobileapp/src/screens/EmailVerificationScreen.tsx` - Verification UI
- `mobileapp/src/screens/RegisterScreen.tsx` - Registration with verification
- `mobileapp/src/screens/LoginScreen.tsx` - Login with verification check
- `mobileapp/App.tsx` - App-level verification protection
- `server/controllers/authController.js` - Backend verification logic
- `client/netlify/functions/verify-email.js` - Email sending via SMTP
