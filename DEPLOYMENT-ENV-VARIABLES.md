# Environment Variables Configuration Guide

This guide explains where to set environment variables for your frontend and backend deployments.

## Important: Frontend vs Backend

- **Frontend (Netlify)**: Hosts your React client application
- **Backend (Render/Railway)**: Hosts your Node.js server that handles JWT tokens

**JWT settings MUST be set in your BACKEND, not frontend!**

---

## Backend Configuration (Render)

### Where to Set JWT_EXPIRES_IN on Render

1. **Login to Render Dashboard**
   - Go to: https://dashboard.render.com
   - Sign in to your account

2. **Select Your Backend Service**
   - Find your backend/server service (the Node.js app)
   - Click on it to open

3. **Navigate to Environment Tab**
   - In the left sidebar, click **"Environment"**
   - You'll see a list of environment variables

4. **Add JWT Variables**
   - Click **"Add Environment Variable"** button
   - Add each variable:

   ```
   Key: JWT_SECRET
   Value: your-super-secret-jwt-key-change-this
   
   Key: JWT_EXPIRES_IN
   Value: 7d
   
   Key: JWT_REFRESH_SECRET
   Value: your-refresh-secret-key-change-this
   
   Key: JWT_REFRESH_EXPIRES_IN
   Value: 30d
   ```

5. **Save Changes - Important!**
   - Click **"Save Changes"** button
   - **For environment variable changes ONLY, you do NOT need to "Build and Deploy"**
   - Render will automatically do a **"Deploy"** (which is faster)
   - This is different from code changes which need "Build and Deploy"

6. **What Happens After Save:**
   - Render automatically triggers a **deployment** (not a full rebuild)
   - This only restarts your service with new environment variables
   - Takes about 1-2 minutes (much faster than full build)
   - Wait for the green "Live" status
   - Your backend is now configured!

**Note:** Environment variable changes don't need code rebuild, so Render just redeploys the existing build with new variables. This is much faster!

### Complete Backend Environment Variables (Render)

```env
# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/dbname

# JWT Authentication
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=your-refresh-secret-key-change-this
JWT_REFRESH_EXPIRES_IN=30d

# CORS & URLs
CLIENT_URL=https://your-frontend.netlify.app
ADMIN_URL=https://your-admin.netlify.app

# Server
PORT=4000
NODE_ENV=production

# Email (if using email features)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Other services (if using)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=https://your-backend.onrender.com/api/auth/google/callback
```

---

## Backend Configuration (Railway)

### Where to Set JWT_EXPIRES_IN on Railway

1. **Login to Railway Dashboard**
   - Go to: https://railway.app
   - Sign in to your account

2. **Select Your Backend Project**
   - Click on your backend project
   - This is the Node.js server project

3. **Open Variables Tab**
   - Click **"Variables"** tab at the top
   - You'll see existing variables

4. **Add JWT Variables**
   - Click **"New Variable"** or **"Raw Editor"**
   - Add each variable:

   ```
   JWT_SECRET=your-super-secret-jwt-key-change-this
   JWT_EXPIRES_IN=7d
   JWT_REFRESH_SECRET=your-refresh-secret-key-change-this
   JWT_REFRESH_EXPIRES_IN=30d
   ```

5. **Deploy**
   - Railway will automatically redeploy your service
   - Wait for deployment to complete

---

## Frontend Configuration (Netlify)

### Where to Set Frontend Variables on Netlify

**Note**: You do NOT set JWT variables here! Only frontend-specific variables.

1. **Login to Netlify Dashboard**
   - Go to: https://app.netlify.com
   - Sign in to your account

2. **Select Your Frontend Site**
   - Click on your frontend site
   - This is your React application

3. **Navigate to Environment Variables**
   - Go to **Site settings** (or **Site configuration**)
   - Click **"Environment variables"** in the left sidebar
   - Or click **"Build & deploy"** → **"Environment"**

4. **Add Frontend Variables**
   - Click **"Add a variable"** or **"Add environment variable"**
   - Add these variables:

   ```
   Key: VITE_API_URL
   Value: https://your-backend.onrender.com
   
   Key: VITE_SOCKET_URL
   Value: https://your-backend.onrender.com
   
   Key: VITE_APP_NAME
   Value: netcify
   ```

5. **Trigger Redeploy**
   - Go to **"Deploys"** tab
   - Click **"Trigger deploy"** → **"Clear cache and deploy site"**
   - Wait for deployment to complete

### Complete Frontend Environment Variables (Netlify)

```env
# Backend API endpoints
VITE_API_URL=https://your-backend.onrender.com
VITE_SOCKET_URL=https://your-backend.onrender.com

# App configuration
VITE_APP_NAME=netcify

# Google services (if using)
VITE_GOOGLE_CLIENT_ID=your-google-client-id
VITE_RECAPTCHA_SITE_KEY=your-recaptcha-site-key
VITE_GTM_ID=GTM-XXXXXXX

# Analytics (if using)
VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

---

## Testing Token Expiration

### For Testing (1 minute expiration)

**On Backend Only (Render/Railway):**

1. Change JWT_EXPIRES_IN to:
   ```
   JWT_EXPIRES_IN=1m
   ```

2. **Just click "Save Changes"** - DO NOT manually trigger "Build and Deploy"
   - Render will automatically redeploy (1-2 minutes)
   - Railway will automatically redeploy (1-2 minutes)

3. Wait for deployment to complete (check for "Live" status)

4. Test the application:
   - Login
   - Wait 1 minute
   - Try to interact (view rooms/users)
   - You should be automatically logged out

4. **Important**: After testing, change back to normal:
   ```
   JWT_EXPIRES_IN=7d
   ```

---

## Recommended Token Expiration Times

### For Different Use Cases

**Active Social App (Daily Users):**
```env
JWT_EXPIRES_IN=7d          # 7 days
JWT_REFRESH_EXPIRES_IN=30d # 30 days
```

**Enterprise/Corporate App:**
```env
JWT_EXPIRES_IN=8h          # 8 hours (workday)
JWT_REFRESH_EXPIRES_IN=7d  # 7 days
```

**High Security App:**
```env
JWT_EXPIRES_IN=1h          # 1 hour
JWT_REFRESH_EXPIRES_IN=1d  # 1 day
```

**Casual App (Less Frequent Use):**
```env
JWT_EXPIRES_IN=3d          # 3 days
JWT_REFRESH_EXPIRES_IN=14d # 14 days
```

---

## Troubleshooting

### Problem: Changed JWT_EXPIRES_IN but nothing changed

**Solution:**
1. Make sure you changed it in the **backend** (Render/Railway), not frontend (Netlify)
2. **After clicking "Save Changes", wait for automatic redeploy to complete** (1-2 minutes)
   - Check deployment status - should show "Live" when ready
   - Do NOT manually click "Build and Deploy" - it's not needed for env changes
3. **Clear your browser's localStorage**:
   - Open browser console (F12)
   - Go to Application/Storage tab
   - Click "Clear site data" or manually delete items
4. Login again with a fresh token

### Problem: Users still getting logged out too quickly

**Solution:**
1. Verify the JWT_EXPIRES_IN value in your backend dashboard
2. Check backend logs to see what token expiration is being used
3. Make sure JWT_SECRET is set (if missing, tokens may not work)

### Problem: "Token expired" immediately after login

**Solution:**
1. Check server and client system times are synchronized
2. Verify JWT_SECRET is the same as when tokens were generated
3. Clear all browser storage and login again

---

## Quick Reference

| Variable | Set Where | Example Value |
|----------|-----------|---------------|
| JWT_EXPIRES_IN | Backend (Render/Railway) | `7d` |
| JWT_REFRESH_EXPIRES_IN | Backend (Render/Railway) | `30d` |
| JWT_SECRET | Backend (Render/Railway) | `your-secret-key` |
| VITE_API_URL | Frontend (Netlify) | `https://backend.onrender.com` |
| VITE_SOCKET_URL | Frontend (Netlify) | `https://backend.onrender.com` |

---

## Next Steps

After setting environment variables:

1. ✅ Set JWT variables in **backend** (Render/Railway)
2. ✅ Set VITE variables in **frontend** (Netlify)
3. ✅ Wait for both deployments to complete
4. ✅ Clear browser cache/localStorage
5. ✅ Test login and session management
6. ✅ Verify automatic logout works when token expires

Need help? Check the main `SESSION-MANAGEMENT.md` file for more details about how session management works.
