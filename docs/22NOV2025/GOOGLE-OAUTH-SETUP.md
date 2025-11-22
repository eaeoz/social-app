# Google OAuth Setup Guide

## Overview
Google OAuth is **completely FREE** and allows users to sign in with their Google accounts. This guide will help you set it up.

## Step 1: Create Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API:
   - Go to "APIs & Services" > "Library"
   - Search for "Google+ API"
   - Click "Enable"

4. Create OAuth 2.0 credentials:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth 2.0 Client ID"
   - Select "Web application"
   - Add these authorized redirect URIs:
     ```
     http://localhost:5173/auth/google/callback
     http://localhost:4000/api/auth/google/callback
     https://yourdomain.com/api/auth/google/callback
     https://your-netlify-site.netlify.app/api/auth/google/callback
     ```
   - Click "Create"
   - **Save your Client ID and Client Secret**

## Step 2: Add Environment Variables

### For Backend (server/.env):
```env
# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
GOOGLE_CALLBACK_URL=http://localhost:4000/api/auth/google/callback
```

### For Frontend (client/.env):
```env
# Google OAuth
VITE_GOOGLE_CLIENT_ID=your_google_client_id_here
```

### For Netlify:
Add these environment variables in your Netlify dashboard:
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_CALLBACK_URL` (use your Netlify function URL)

## Step 3: Install Required Packages

```bash
# In server directory
cd server
npm install passport passport-google-oauth20

# In root directory
cd ..
npm install passport passport-google-oauth20
```

## Step 4: Test the Setup

1. Start your development server: `npm run dev`
2. Go to the login page
3. Click "Sign in with Google" button
4. Authenticate with your Google account
5. You should be automatically logged in!

## Benefits of Google OAuth

✅ **Free Forever** - No costs involved
✅ **One-Click Login** - No need to remember passwords
✅ **Verified Email** - Users are automatically email verified
✅ **Secure** - Google handles all security
✅ **Trusted** - Users trust Google authentication
✅ **Fast Registration** - New users sign up instantly

## Security Notes

- Never commit your Client Secret to version control
- Use environment variables for all sensitive data
- Update your authorized redirect URIs when deploying
- Keep your Google Cloud Console project secure

## Troubleshooting

**Error: redirect_uri_mismatch**
- Make sure the redirect URI in your code matches exactly what's in Google Console
- Include the protocol (http:// or https://)
- No trailing slashes

**Error: invalid_client**
- Check your Client ID and Client Secret are correct
- Make sure they're in the right environment variables

**Users can't sign in**
- Verify Google+ API is enabled
- Check your OAuth consent screen is configured
- Ensure authorized domains are added
