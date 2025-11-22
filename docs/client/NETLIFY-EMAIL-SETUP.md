# Netlify Email Functions Setup Guide

This guide explains how to configure the Netlify serverless functions for sending emails (verification and password reset).

## 📧 Email Functions

The project includes two Netlify functions for sending emails:

1. **`verify-email`** - Sends email verification links to new users
2. **`reset-password`** - Sends password reset links to users

## 🔧 Required Environment Variables

Add these environment variables to your Netlify site settings:

### **Navigate to:** Site Settings → Environment Variables

Add the following variables:

```env
SMTP_USER=sedatergoz@yandex.com
SMTP_PASS=ihinuaqtejpjnjhm
SMTP_HOST=smtp.yandex.com
SMTP_PORT=587
VITE_FRONTEND_URL=https://netcify.netlify.app
```

### **Variable Descriptions:**

- **SMTP_USER**: Your email address (sender)
- **SMTP_PASS**: Your email app password (NOT your regular password)
- **SMTP_HOST**: Your SMTP server hostname
- **SMTP_PORT**: SMTP port (587 for TLS, 465 for SSL)
- **VITE_FRONTEND_URL**: Your frontend URL (for generating links in emails)

## 🔒 Security Notes

1. **Never commit** SMTP credentials to Git
2. **Use App Passwords** instead of your regular email password
3. **Enable 2FA** on your email account before generating app passwords

### **Getting Yandex App Password:**

1. Go to https://passport.yandex.com/profile
2. Navigate to Security settings
3. Enable 2-Factor Authentication
4. Generate an "App Password" for "Mail"
5. Use this password for SMTP_PASS

## 📝 Function Endpoints

Once deployed, your functions will be available at:

```
https://netcify.netlify.app/.netlify/functions/verify-email
https://netcify.netlify.app/.netlify/functions/reset-password
```

## ✅ Testing the Functions

### **Test Verification Email:**
```bash
curl -X POST https://netcify.netlify.app/.netlify/functions/verify-email \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "username": "testuser",
    "verificationToken": "test-token-123"
  }'
```

### **Test Password Reset Email:**
```bash
curl -X POST https://netcify.netlify.app/.netlify/functions/reset-password \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "username": "testuser",
    "resetToken": "test-token-123"
  }'
```

## 🚀 Backend Integration

The backend (`server/utils/sendPasswordRecoveryEmail.js`) will automatically use the Netlify function if `NETLIFY_FUNCTION_URL` is configured:

### **Add to Railway/Render Backend Environment Variables:**
```env
NETLIFY_FUNCTION_URL=https://netcify.netlify.app
```

This enables the backend to use Netlify functions instead of direct SMTP.

## 📊 How It Works

```
┌─────────────┐
│   Backend   │
│  (Railway)  │
└──────┬──────┘
       │
       │ 1. Send email request
       ↓
┌─────────────────┐
│ Netlify Function│
│  (reset-password)│
└──────┬──────────┘
       │
       │ 2. Read SMTP env vars
       │ 3. Connect to SMTP
       ↓
┌─────────────┐
│   Yandex    │
│ SMTP Server │
└──────┬──────┘
       │
       │ 4. Send email
       ↓
┌─────────────┐
│    User     │
│   Inbox     │
└─────────────┘
```

## 🔄 Deployment

After adding environment variables:

1. **Redeploy** your Netlify site (or it will auto-deploy)
2. Environment variables are available to functions immediately
3. No code changes needed - functions automatically pick up the variables

## 🐛 Troubleshooting

### **"Email service not configured"**
- Check that all SMTP environment variables are set in Netlify
- Verify SMTP credentials are correct
- Ensure SMTP_PORT is set to "587" (not 587 as number)

### **"Connection timeout"**
- Check SMTP_HOST is correct
- Verify SMTP_PORT (587 for TLS, 465 for SSL)
- Check Yandex SMTP is not blocked

### **"Authentication failed"**
- Verify you're using an App Password, not your regular password
- Check 2FA is enabled on Yandex account
- Regenerate the App Password if needed

### **Test Locally:**
You can test the functions locally using Netlify Dev:
```bash
cd client
netlify dev
```

Then test at: `http://localhost:8888/.netlify/functions/reset-password`

## 📚 Additional Resources

- [Netlify Functions Documentation](https://docs.netlify.com/functions/overview/)
- [Netlify Environment Variables](https://docs.netlify.com/configure-builds/environment-variables/)
- [Yandex Mail App Passwords](https://yandex.com/support/id/authorization/app-passwords.html)
- [Nodemailer Documentation](https://nodemailer.com/)

## ✨ Features

Both email functions include:
- ✅ Beautiful HTML email templates
- ✅ Plain text fallback
- ✅ Responsive design
- ✅ Security notices
- ✅ Expiration warnings
- ✅ CORS support
- ✅ Error handling
- ✅ Debug logging
