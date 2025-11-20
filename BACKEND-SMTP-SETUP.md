# Backend SMTP Email Setup Guide

## Overview

The backend server now sends verification emails directly using SMTP (via nodemailer), without depending on Netlify functions. This is essential for the mobile app which doesn't use Netlify.

## Required Environment Variables

Add these variables to your backend server's environment configuration:

```env
# SMTP Email Configuration
SMTP_USER=your-email@yandex.com
SMTP_PASS=your-app-password
SMTP_HOST=smtp.yandex.com
SMTP_PORT=587

# Frontend URL (for email verification links)
CLIENT_URL=https://netcify.netlify.app
```

## Supported Email Providers

### 1. Yandex Mail (Recommended)
```env
SMTP_HOST=smtp.yandex.com
SMTP_PORT=587
SMTP_USER=your-email@yandex.com
SMTP_PASS=your-password
```

**Features:**
- ✅ Free
- ✅ Reliable
- ✅ No daily limits for personal use
- ✅ Works great with nodemailer

**Setup:**
1. Create a Yandex Mail account: https://mail.yandex.com
2. Enable "Access for mail clients" in settings
3. Use your regular password (no app password needed)

### 2. Gmail
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

**Setup:**
1. Enable 2-Factor Authentication
2. Generate App Password: https://myaccount.google.com/apppasswords
3. Use the 16-character app password

**Limitations:**
- ⚠️ Requires app password (2FA must be enabled)
- ⚠️ Daily sending limit: ~500 emails

### 3. Outlook/Hotmail
```env
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_USER=your-email@outlook.com
SMTP_PASS=your-password
```

**Limitations:**
- ⚠️ Stricter spam filters
- ⚠️ May require additional verification

### 4. Custom SMTP Server
```env
SMTP_HOST=mail.yourdomain.com
SMTP_PORT=587  # or 465 for SSL
SMTP_USER=noreply@yourdomain.com
SMTP_PASS=your-password
```

## Environment Variable Setup

### Development (Local)

Create `.env` file in project root:

```env
# MongoDB
MONGODB_URI=mongodb://localhost:27017/netcify

# JWT
JWT_SECRET=your-jwt-secret-key-here
JWT_REFRESH_SECRET=your-refresh-secret-key-here

# Appwrite
APPWRITE_ENDPOINT=https://fra.cloud.appwrite.io/v1
APPWRITE_PROJECT_ID=your-project-id
APPWRITE_API_KEY=your-api-key
BUCKET_ID=your-bucket-id

# SMTP Email
SMTP_USER=your-email@yandex.com
SMTP_PASS=your-password
SMTP_HOST=smtp.yandex.com
SMTP_PORT=587

# Frontend URL
CLIENT_URL=http://localhost:5173

# Server
PORT=4000
NODE_ENV=development
```

### Production (Railway/Render/etc.)

Set environment variables in your hosting platform's dashboard:

**Railway:**
1. Go to your project → Variables tab
2. Add each variable:
   - `SMTP_USER` = your-email@yandex.com
   - `SMTP_PASS` = your-password
   - `SMTP_HOST` = smtp.yandex.com
   - `SMTP_PORT` = 587
   - `CLIENT_URL` = https://netcify.netlify.app

**Render:**
1. Go to Dashboard → Your service → Environment
2. Add each variable as Key-Value pairs

**Heroku:**
```bash
heroku config:set SMTP_USER=your-email@yandex.com
heroku config:set SMTP_PASS=your-password
heroku config:set SMTP_HOST=smtp.yandex.com
heroku config:set SMTP_PORT=587
heroku config:set CLIENT_URL=https://netcify.netlify.app
```

## How It Works

### Registration Flow
1. User registers in mobile app
2. Backend creates user with `isEmailVerified: false`
3. Backend generates verification token (24-hour expiry)
4. Backend calls `sendVerificationEmail()` from `emailService.js`
5. Email sent via SMTP using configured provider
6. User receives email with verification link
7. User clicks link → verifies email via web frontend
8. User logs in to mobile app → gets full access

### Email Service (`server/utils/emailService.js`)
```javascript
import { sendVerificationEmail } from '../utils/emailService.js';

// In registration
sendVerificationEmail(email, username, verificationToken)
  .then((result) => {
    if (result.success) {
      console.log('✅ Verification email sent to:', email);
    }
  });
```

## Testing Email Configuration

### 1. Test SMTP Connection

Create `test-email.js` in project root:

```javascript
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

async function testEmail() {
  try {
    await transporter.verify();
    console.log('✅ SMTP connection successful!');
    
    const info = await transporter.sendMail({
      from: process.env.SMTP_USER,
      to: 'your-test-email@gmail.com',
      subject: 'Test Email from netcify',
      text: 'If you receive this, SMTP is working correctly!'
    });
    
    console.log('✅ Test email sent:', info.messageId);
  } catch (error) {
    console.error('❌ SMTP test failed:', error);
  }
}

testEmail();
```

Run test:
```bash
node test-email.js
```

### 2. Test via Registration

1. Register a new user in mobile app
2. Check backend logs for:
```
📤 Sending verification email to: user@example.com
✅ SMTP connection verified
✅ Verification email sent successfully to user@example.com
📧 Message ID: <...>
```

3. Check email inbox (including spam folder)

## Troubleshooting

### Email Not Received

**Check Backend Logs:**
```
// Success:
✅ Verification email sent to: user@example.com

// Failure:
❌ Error sending verification email: [error message]
```

**Common Issues:**

1. **Authentication Failed**
   - Verify SMTP_USER and SMTP_PASS are correct
   - For Gmail: use app password, not regular password
   - For Yandex: enable "Access for mail clients"

2. **Connection Timeout**
   - Check SMTP_HOST and SMTP_PORT
   - Verify firewall allows outbound port 587/465
   - Try different port (587 vs 465)

3. **Email in Spam**
   - Check spam/junk folder
   - Add sender to contacts
   - Use custom domain for better deliverability

4. **Environment Variables Not Set**
   ```
   ❌ SMTP credentials not configured
   ```
   - Verify `.env` file exists and is loaded
   - Check variable names match exactly

### Debug Mode

Enable detailed logging in `emailService.js`:

```javascript
const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: SMTP_PORT,
  secure: SMTP_PORT === 465,
  auth: {
    user: SMTP_USER,
    pass: SMTP_PASS
  },
  debug: true,  // ← Add this
  logger: true  // ← Add this
});
```

## Security Best Practices

1. **Never commit .env file**
   - Add to `.gitignore`
   - Use environment variables in production

2. **Use App Passwords**
   - Gmail: Generate app-specific password
   - Don't use main account password

3. **Rotate Credentials**
   - Change SMTP password periodically
   - Update in all environments

4. **Monitor Email Logs**
   - Track sending failures
   - Watch for unusual activity

## Email Templates

The email service includes professional HTML templates:

### Verification Email Features:
- ✅ Beautiful gradient header
- ✅ Clear call-to-action button
- ✅ Alternative text link
- ✅ 24-hour expiry warning
- ✅ Responsive design
- ✅ Plain text fallback

### Password Reset Email Features:
- ✅ Different color scheme (red/orange)
- ✅ 1-hour expiry warning
- ✅ Security information
- ✅ Professional footer

## CLIENT_URL Configuration

The `CLIENT_URL` is used for verification links in emails:

### Development:
```env
CLIENT_URL=http://localhost:5173
```
Link in email: `http://localhost:5173/verify-email?token=...`

### Production:
```env
CLIENT_URL=https://netcify.netlify.app
```
Link in email: `https://netcify.netlify.app/verify-email?token=...`

**Important:** User clicks link → opens web browser → web frontend verifies token → user returns to mobile app and logs in.

## Monitoring

### Success Indicators:
```
📧 Email transporter initialized: smtp.yandex.com:587
✅ SMTP connection verified
📤 Sending verification email to: user@example.com
✅ Verification email sent successfully to user@example.com
📧 Message ID: <unique-id@yandex.com>
```

### Failure Indicators:
```
❌ SMTP credentials not configured
❌ Error sending verification email: Invalid login
❌ Failed to send verification email: Connection timeout
```

## Alternative: SendGrid/Mailgun (Advanced)

For production apps with high volume, consider:

### SendGrid:
```bash
npm install @sendgrid/mail
```

### Mailgun:
```bash
npm install mailgun.js
```

Both provide better deliverability and analytics, but require paid plans for high volume.

## Summary

✅ **What We Did:**
- Created `server/utils/emailService.js` for SMTP email sending
- Updated `authController.js` to use email service
- Removed dependency on Netlify functions
- Added support for verification and password reset emails

✅ **What You Need:**
- SMTP credentials (Yandex, Gmail, or custom)
- Environment variables set correctly
- CLIENT_URL pointing to your frontend

✅ **Mobile App Ready:**
- Backend sends emails directly
- No Netlify function dependency
- Works with mobile app registration
- Email verification flow complete

## Next Steps

1. Set up SMTP credentials (Yandex recommended)
2. Add environment variables to backend
3. Test registration in mobile app
4. Verify email delivery
5. Monitor backend logs for issues
