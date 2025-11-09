# Google OAuth Installation Instructions

## Step 1: Install Required NPM Packages

Run these commands to install the necessary packages:

### Backend Packages (from root directory):
```bash
npm install passport passport-google-oauth20 express-session
```

### If you're using separate package.json for server:
```bash
cd server
npm install passport passport-google-oauth20 express-session
cd ..
```

## Step 2: Update Environment Variables

### Add to `.env` file (root directory):
```env
# Google OAuth Configuration
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
GOOGLE_CALLBACK_URL=http://localhost:4000/api/auth/google/callback
```

### Add to `client/.env` file:
```env
# Google OAuth (Client Side)
VITE_GOOGLE_CLIENT_ID=your_google_client_id_here
```

## Step 3: Update .env.example Files

### Update `.env.example`:
```env
# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
GOOGLE_CALLBACK_URL=http://localhost:4000/api/auth/google/callback
```

### Update `client/.env.example` (if exists):
```env
# Google OAuth
VITE_GOOGLE_CLIENT_ID=your_google_client_id_here
```

## Step 4: Get Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google+ API:
   - Navigate to "APIs & Services" > "Library"
   - Search for "Google+ API"
   - Click "Enable"

4. Create OAuth 2.0 Credentials:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth 2.0 Client ID"
   - Configure OAuth consent screen if prompted
   - Select "Web application"
   - Add Authorized redirect URIs:
     ```
     http://localhost:4000/api/auth/google/callback
     http://localhost:5173/auth/callback
     https://yourdomain.com/api/auth/google/callback
     ```
   - Click "Create"
   - Copy your Client ID and Client Secret

5. Configure OAuth Consent Screen:
   - Add your app name
   - Add support email
   - Add authorized domains (your production domain)
   - Add scopes: email, profile, openid

## Step 5: Update App.tsx to Add Callback Route

You need to add the Google callback route to your App.tsx. The GoogleCallback component is already created at `client/src/components/Auth/GoogleCallback.tsx`.

Add this route to your router configuration:
```tsx
import GoogleCallback from './components/Auth/GoogleCallback';

// In your routes:
<Route path="/auth/callback" element={<GoogleCallback onLoginSuccess={handleLoginSuccess} />} />
```

## Step 6: Update Netlify/Production Environment Variables

Add these environment variables in your Netlify/hosting dashboard:

```
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=https://your-api-domain.com/api/auth/google/callback
VITE_GOOGLE_CLIENT_ID=your_google_client_id
```

Make sure to update the callback URL to match your production API endpoint.

## Step 7: Update Google Cloud Console for Production

In Google Cloud Console, add your production redirect URIs:
```
https://your-production-domain.com/api/auth/google/callback
https://your-production-domain.com/auth/callback
```

## Testing Locally

1. Start your backend server:
   ```bash
   npm run dev
   ```

2. Start your frontend (in another terminal):
   ```bash
   cd client
   npm run dev
   ```

3. Go to http://localhost:5173/login
4. Click "Continue with Google"
5. Sign in with your Google account
6. You should be redirected back and logged in automatically

## Troubleshooting

### Error: "redirect_uri_mismatch"
- Verify the callback URL in your .env matches exactly what's in Google Cloud Console
- Include the protocol (http:// or https://)
- No trailing slashes

### Error: "invalid_client"
- Check your Client ID and Client Secret are correct
- Verify they're in the correct environment variables

### Error: "Access blocked: This app's request is invalid"
- Make sure you've configured the OAuth consent screen
- Verify your authorized domains are correct

### Users can't sign in
- Check if Google+ API is enabled
- Verify OAuth consent screen is published (for production)
- Ensure you're using the correct Google account

## Package Versions

The following package versions are recommended:
```json
{
  "passport": "^0.7.0",
  "passport-google-oauth20": "^2.0.0",
  "express-session": "^1.17.3"
}
```

## Security Notes

- Never commit your Client Secret to version control
- Always use environment variables
- Keep .env files in .gitignore
- Use different OAuth credentials for development and production
- Regularly rotate your Client Secret in production

## Benefits

✅ **Free Forever** - No costs involved
✅ **One-Click Login** - Users don't need to remember passwords
✅ **Verified Email** - Email is automatically verified
✅ **Secure** - Google handles all security
✅ **Trusted** - Users trust Google authentication
✅ **Fast Setup** - New users are created instantly

## Files Created/Modified

### New Files:
- `server/config/passport.js` - Passport configuration
- `server/routes/googleAuthRoutes.js` - Google OAuth routes
- `client/src/components/Auth/GoogleCallback.tsx` - OAuth callback handler
- `GOOGLE-OAUTH-SETUP.md` - Setup guide
- `GOOGLE-OAUTH-INSTALLATION.md` - This file

### Modified Files:
- `server/server.js` - Added passport initialization and Google routes
- `client/src/components/Auth/Login.tsx` - Added Google sign-in button
- Need to modify: `client/src/App.tsx` - Add callback route

## Next Steps

1. Install the packages: `npm install passport passport-google-oauth20 express-session`
2. Get your Google OAuth credentials from Google Cloud Console
3. Add environment variables to `.env` files
4. Add the callback route to your App.tsx
5. Test locally
6. Deploy and update production environment variables
