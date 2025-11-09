# Email Verification System Guide

This guide explains the account activation/email verification system that has been implemented in the application.

## Overview

When users register for an account, they must verify their email address before they can fully access the application. This adds an extra layer of security and ensures that users provide valid email addresses.

## How It Works

### 1. Registration Process

When a user registers:
1. User submits registration form with username, email, password, etc.
2. Backend creates the user account with `isEmailVerified: false`
3. A unique verification token is generated (32-byte random hex string)
4. The token expires after 24 hours
5. A verification email is sent to the user's email address via Netlify Function
6. User receives tokens but is marked as unverified

### 2. Email Verification

The verification email contains:
- A personalized greeting with the username
- A prominent "Verify Email Address" button
- The verification link expires in 24 hours
- An alternative text link if the button doesn't work
- Professional styling with gradient colors

### 3. Verification Process

When a user clicks the verification link:
1. They are redirected to `/verify-email?token=<verification_token>`
2. Frontend calls the backend API: `POST /api/auth/verify-email`
3. Backend validates the token and checks expiration
4. If valid, user's `isEmailVerified` is set to `true`
5. Verification token is removed from database
6. User can now log in without restrictions

## Database Schema Changes

### Users Collection

New fields added to the users collection:

```javascript
{
  isEmailVerified: { bsonType: 'bool' },              // Default: false
  emailVerificationToken: { bsonType: ['string', 'null'] },  // Unique token
  emailVerificationExpires: { bsonType: ['date', 'null'] }   // 24 hours from creation
}
```

## API Endpoints

### 1. Register (Modified)
**POST** `/api/auth/register`

**Response includes:**
```json
{
  "message": "Registration successful! Please check your email to verify your account.",
  "user": {
    "userId": "...",
    "username": "...",
    "email": "...",
    "isEmailVerified": false
  },
  "accessToken": "...",
  "refreshToken": "...",
  "requiresEmailVerification": true
}
```

### 2. Verify Email (New)
**POST** `/api/auth/verify-email`

**Request Body:**
```json
{
  "token": "verification_token_from_email"
}
```

**Success Response:**
```json
{
  "message": "Email verified successfully! You can now log in.",
  "success": true
}
```

**Error Responses:**
- `400`: Invalid or expired token
- `500`: Server error

### 3. Resend Verification Email (New)
**POST** `/api/auth/resend-verification`

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Success Response:**
```json
{
  "message": "Verification email sent! Please check your inbox.",
  "success": true
}
```

**Error Responses:**
- `400`: Email already verified
- `404`: User not found
- `500`: Failed to send email

## Netlify Function

### verify-email Function

**Location:** `client/netlify/functions/verify-email.js`

**Purpose:** Sends verification emails using SMTP

**Environment Variables Required:**
- `SMTP_USER`: SMTP username
- `SMTP_PASS`: SMTP password
- `SMTP_HOST`: SMTP server (default: smtp.yandex.com)
- `SMTP_PORT`: SMTP port (default: 587)
- `VITE_CLIENT_URL`: Frontend URL for verification link

**Local Testing:**
```bash
# In client directory
netlify dev
```

**Production URL:**
```
/.netlify/functions/verify-email
```

## Setup Instructions

### 1. Update Database Schema

Run the migration script to add email verification fields to existing users:

```bash
cd server
node utils/addEmailVerificationFields.js
```

This will:
- Add `isEmailVerified`, `emailVerificationToken`, and `emailVerificationExpires` fields to all users
- Update the MongoDB collection validator
- Set existing users as unverified (they won't need to verify if created before this feature)

### 2. Configure Environment Variables

**Backend (.env):**
```env
# Already configured if contact form is working
SMTP_USER=your_email@yandex.com
SMTP_PASS=your_app_password
SMTP_HOST=smtp.yandex.com
SMTP_PORT=587
```

**Frontend (client/.env):**
```env
VITE_CLIENT_URL=http://localhost:5173  # or your production URL
```

### 3. Test Locally

1. **Start Netlify Dev** (for functions):
   ```bash
   cd client
   netlify dev
   ```
   This runs on `http://localhost:8888`

2. **Start Backend Server**:
   ```bash
   cd server
   node server.js
   ```
   This runs on `http://localhost:4000`

3. **Register a new user** and check your email for the verification link

4. **Click the verification link** or manually call the API

## Frontend Integration

### Registration Flow

After successful registration, show a message to the user:

```javascript
if (response.requiresEmailVerification) {
  // Show message: "Please check your email to verify your account"
  // Optionally provide a "Resend Email" button
}
```

### Email Verification Page

Create a new page at `/verify-email` that:
1. Gets the token from URL query parameters
2. Calls the verification API
3. Shows success or error message
4. Redirects to login page after successful verification

Example:
```javascript
const urlParams = new URLSearchParams(window.location.search);
const token = urlParams.get('token');

fetch('/api/auth/verify-email', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ token })
})
.then(response => response.json())
.then(data => {
  if (data.success) {
    // Show success message
    // Redirect to login after 3 seconds
  }
});
```

### Resend Verification Button

Add this to your registration success page:

```javascript
function resendVerification(email) {
  fetch('/api/auth/resend-verification', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email })
  })
  .then(response => response.json())
  .then(data => {
    alert(data.message);
  });
}
```

## Optional: Enforce Email Verification on Login

If you want to prevent unverified users from logging in, add this check to the login controller:

```javascript
// In login function, after password verification:
if (!user.isEmailVerified) {
  return res.status(403).json({ 
    error: 'Please verify your email address before logging in.',
    requiresEmailVerification: true,
    email: user.email
  });
}
```

## Security Considerations

1. **Token Expiration**: Tokens expire after 24 hours for security
2. **One-time Use**: Tokens are deleted after successful verification
3. **Random Generation**: Uses cryptographically secure random bytes
4. **HTTPS**: Always use HTTPS in production for secure token transmission
5. **Rate Limiting**: Consider adding rate limiting to prevent abuse

## Troubleshooting

### Email Not Received

1. Check spam/junk folder
2. Verify SMTP credentials in environment variables
3. Check Netlify function logs for errors
4. Try resending the verification email

### Verification Link Expired

1. User can request a new verification email
2. Use the "Resend Verification" endpoint
3. New token will be generated with fresh 24-hour expiration

### Function Not Working Locally

1. Ensure `netlify dev` is running (not just `npm run dev`)
2. Check that environment variables are in `client/.env`
3. Verify the function URL in the backend matches: `http://localhost:8888/.netlify/functions/verify-email`

## Production Deployment

### Netlify

1. Add environment variables to Netlify dashboard
2. Deploy your site
3. Verification emails will automatically use production function URL

### Backend

1. Set `NODE_ENV=production`
2. Ensure `VITE_CLIENT_URL` points to your production frontend URL
3. Backend will automatically use `/.netlify/functions/verify-email` for production

## Testing Checklist

- [ ] User can register successfully
- [ ] Verification email is received
- [ ] Email has correct content and styling
- [ ] Verification link works
- [ ] User is marked as verified after clicking link
- [ ] Expired tokens are rejected
- [ ] Invalid tokens are rejected
- [ ] Resend verification works
- [ ] Already verified users cannot request new emails
- [ ] Email verification status is shown in user profile

## Files Modified/Created

### New Files:
- `server/utils/addEmailVerificationFields.js` - Migration script
- `client/netlify/functions/verify-email.js` - Email sending function
- `EMAIL-VERIFICATION-GUIDE.md` - This documentation

### Modified Files:
- `server/controllers/authController.js` - Added verification logic
- `server/routes/authRoutes.js` - Added verification routes
- `mongodb-schema.json` - Updated with new fields (done via migration)

## Support

If you encounter issues:
1. Check the backend console logs
2. Check Netlify function logs
3. Verify all environment variables are set
4. Ensure MongoDB schema has been updated
5. Test email sending with the contact form first
