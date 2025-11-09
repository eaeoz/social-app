# Email Verification Resend Limit Feature

## Overview

This feature implements a resend limit for email verification attempts to prevent abuse and ensure proper verification workflow. Users can only resend verification emails a limited number of times (default: 4 attempts).

## Key Features

### 1. **Credential Verification Required**
- Users must provide their **email and password** to resend verification emails
- This ensures that only the account owner can request resend attempts
- Invalid credentials will not count toward the attempt limit

### 2. **Attempt Tracking**
- Each user has an `emailResendCount` field that tracks resend attempts
- The system displays remaining attempts to users (e.g., "3/4 attempts remaining")
- Fresh start: When a user fails to login due to unverified email, the counter shows "4/4" (full attempts available)

### 3. **Maximum Attempt Limit**
- Default limit: **4 attempts** (configurable in siteSettings)
- After reaching the limit, users must contact the site administrator
- The limit prevents spam and abuse of the email system

### 4. **Enhanced UI/UX**
- When email verification is required, the "Sign In" button is replaced with a password input and "Resend Verification Email" button
- Clear visual feedback showing remaining attempts
- Color-coded status: Blue for available attempts, Red for exhausted attempts
- Informative error messages guiding users to contact admin when needed

## Technical Implementation

### Backend Changes

#### 1. Database Schema Updates

**siteSettings Collection:**
```javascript
{
  settingType: 'global',
  verificationEmailResendCount: 4, // Maximum resend attempts
  // ... other settings
}
```

**users Collection:**
```javascript
{
  email: 'user@example.com',
  emailResendCount: 0, // Tracks current resend attempts
  isEmailVerified: false,
  emailVerificationToken: 'token...',
  emailVerificationExpires: Date,
  // ... other user fields
}
```

#### 2. API Endpoint Changes

**POST /api/auth/resend-verification**

Request:
```json
{
  "email": "user@example.com",
  "password": "user_password"
}
```

Response (Success):
```json
{
  "message": "Verification email sent! Please check your inbox. (3 attempts remaining)",
  "success": true,
  "remainingAttempts": 3,
  "maxAttempts": 4,
  "currentAttempt": 1
}
```

Response (Limit Reached):
```json
{
  "error": "Maximum verification email attempts reached",
  "message": "You have reached the maximum number of verification email attempts. Please contact the site administrator for assistance.",
  "remainingAttempts": 0,
  "maxAttempts": 4
}
```

Response (Invalid Credentials):
```json
{
  "error": "Invalid email or password"
}
```

### Frontend Changes

#### Login Component Updates

1. **Password Input for Resend**: When email verification is required, a password field appears for authentication
2. **Attempt Counter Display**: Shows remaining attempts in a clear, color-coded format
3. **Button State Management**: Disables resend button when limit is reached or password is empty
4. **Error Handling**: Displays appropriate error messages for different scenarios

## Installation & Setup

### 1. Run Migration Script

Add the `emailResendCount` field to existing users:

```bash
cd server
node utils/addEmailResendCountField.js
```

This script will:
- Add `emailResendCount: 0` to all existing users
- Add `verificationEmailResendCount: 4` to siteSettings if not present

### 2. Update Environment Variables

No additional environment variables are required. The feature uses existing configuration.

### 3. Restart Server

```bash
npm run dev
```

## Configuration

### Changing the Maximum Attempts

To change the default maximum attempts (default: 4), update the siteSettings in your database:

```javascript
// Using MongoDB shell or database client
db.siteSettings.updateOne(
  { settingType: 'global' },
  { $set: { verificationEmailResendCount: 5 } } // Change to desired value
)
```

Or programmatically:

```javascript
import { updateSiteSettings } from './server/utils/initializeSiteSettings.js';

await updateSiteSettings({
  verificationEmailResendCount: 5
});
```

## User Flow

### Scenario 1: New User Registration

1. User registers → Receives verification email (no attempts counted yet)
2. User tries to login → Gets "email not verified" error
3. User sees resend option with "4/4 attempts remaining"
4. User enters password → Clicks "Resend Verification Email"
5. Counter updates to "3/4 attempts remaining"
6. User can resend up to 4 times total

### Scenario 2: Reaching the Limit

1. User has used all 4 attempts
2. Counter shows "0/4 attempts remaining"
3. Resend button is disabled
4. Message: "Maximum attempts reached. Please contact the site administrator for assistance."

### Scenario 3: Invalid Credentials

1. User enters wrong password
2. Error: "Invalid email or password"
3. Attempt counter does NOT increase (protection against unauthorized resends)

## Admin Support

When a user reaches the maximum attempts and contacts support, administrators can:

### Option 1: Reset User's Resend Count

```javascript
// Using MongoDB shell
db.users.updateOne(
  { email: "user@example.com" },
  { $set: { emailResendCount: 0 } }
)
```

### Option 2: Manually Verify User's Email

```javascript
// Using MongoDB shell
db.users.updateOne(
  { email: "user@example.com" },
  { 
    $set: { 
      isEmailVerified: true,
      emailVerificationToken: null,
      emailVerificationExpires: null
    }
  }
)
```

## Security Considerations

1. **Password Required**: Prevents unauthorized users from spamming resend requests
2. **Rate Limiting**: The 4-attempt limit prevents email server abuse
3. **Invalid Credentials Don't Count**: Failed authentication doesn't increment the counter
4. **Token Expiration**: Verification tokens expire after 24 hours
5. **Secure Logging**: All resend attempts are logged with attempt numbers

## Testing

### Test the Feature

1. **Create a test user** (register normally)
2. **Try to login** without verifying email
3. **Verify the UI changes**: Password field and resend button appear
4. **Test resend attempts**: 
   - Enter password and click resend
   - Check email inbox
   - Verify counter decreases
5. **Test limit enforcement**:
   - Resend 4 times
   - Verify button becomes disabled
   - Verify error message appears
6. **Test invalid credentials**:
   - Enter wrong password
   - Verify error appears
   - Verify counter doesn't decrease

## Files Modified

### Backend
- `server/controllers/authController.js` - Updated `resendVerificationEmail` function
- `server/utils/initializeSiteSettings.js` - Added `verificationEmailResendCount` field
- `server/utils/addEmailResendCountField.js` - New migration script

### Frontend
- `client/src/components/Auth/Login.tsx` - Enhanced UI with password field and attempt counter

### Documentation
- `EMAIL-VERIFICATION-RESEND-LIMIT.md` - This file

## Troubleshooting

### Issue: Counter not showing
**Solution**: Run the migration script to add the field to existing users

### Issue: Limit not enforced
**Solution**: Check siteSettings has `verificationEmailResendCount` field

### Issue: Counter not resetting
**Solution**: Reset manually via database or delete and recreate user

### Issue: Emails not being sent
**Solution**: Check email configuration in `.env` file and Netlify functions

## Future Enhancements

Possible improvements for future versions:

1. **Time-based Reset**: Auto-reset counter after X days
2. **Admin Dashboard**: GUI for managing user verification status
3. **Email Template**: Customizable verification email content
4. **Alternative Verification**: SMS or phone verification options
5. **Notification System**: Alert admins when users reach the limit

## Support

If you need assistance:
1. Check the logs for error messages
2. Verify database schema is correct
3. Ensure siteSettings is properly configured
4. Contact the development team with specific error details
