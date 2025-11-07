# 🎨 Render Backend-Only Deployment

Since you're deploying only the backend to Render, here's the correct configuration.

## 📋 Render Configuration (Backend Only)

### Name
Choose a unique name (e.g., `social-app-backend`)

### Language
**Node**

### Branch
**main**

### Region
Choose closest to your users

### Root Directory
**server**

### Build Command
```bash
npm install
```

### Start Command
```bash
node server.js
```

### Instance Type
- **Free**: For testing
- **Starter**: For production ($7/month)

---

## 🔐 Environment Variables

Add these in Render's Environment Variables section:

| Key | Value |
|-----|-------|
| MONGODB_URI | mongodb+srv://username:password@cluster.mongodb.net/?retryWrites=true&w=majority |
| MONGODB_DB_NAME | social-app |
| PORT | 10000 |
| NODE_ENV | production |
| CLIENT_URL | https://your-frontend-url.com |
| JWT_SECRET | *generate strong random string* |
| JWT_EXPIRES_IN | 7d |
| JWT_REFRESH_SECRET | *generate another strong random string* |
| JWT_REFRESH_EXPIRES_IN | 30d |
| APPWRITE_ENDPOINT | https://cloud.appwrite.io/v1 |
| APPWRITE_PROJECT_ID | *your project ID* |
| APPWRITE_API_KEY | *your API key* |
| APPWRITE_BUCKET_ID | *your bucket ID* |
| CACHE_TTL | 3600 |
| CACHE_CHECK_PERIOD | 600 |
| SOCKET_CORS_ORIGIN | https://your-frontend-url.com |
| MAX_SOCKET_CONNECTIONS | 1000 |

**IMPORTANT**: 
- Set `CLIENT_URL` and `SOCKET_CORS_ORIGIN` to your frontend deployment URL
- Your backend will be at: `https://social-app-5hge.onrender.com`

---

## 🌐 Frontend Deployment Options

You have several options for deploying your frontend:

### Option 1: Vercel (Recommended)
1. Go to https://vercel.com
2. Import your repository
3. Configure:
   - **Root Directory**: `client`
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Add environment variables:
   ```
   VITE_API_URL=https://social-app-5hge.onrender.com/api
   VITE_SOCKET_URL=https://social-app-5hge.onrender.com
   VITE_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
   VITE_APPWRITE_PROJECT_ID=your_project_id
   VITE_APP_NAME=ChatApp
   ```

### Option 2: Netlify
1. Go to https://netlify.com
2. Import your repository
3. Configure:
   - **Base directory**: `client`
   - **Build command**: `npm run build`
   - **Publish directory**: `client/dist`
4. Add environment variables (same as Vercel)
5. Add `_redirects` file in `client/public`:
   ```
   /*    /index.html   200
   ```

### Option 3: Deploy Frontend on Render Too
1. Create a **new Static Site** on Render
2. Connect the same repository
3. Configure:
   - **Root Directory**: `client`
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `dist`
4. Add environment variables (same as above)

### Option 4: Full-Stack on Render (Single Service)
If you want everything on one Render service, use this configuration:

**Root Directory**: Leave empty
**Build Command**: 
```bash
npm install && cd client && npm install && npm run build && cd ..
```
**Start Command**:
```bash
node server/server.js
```

Then your server.js (which I already updated) will serve both backend API and frontend.

---

## 🔧 Update Backend CORS

Since your backend is at `https://social-app-5hge.onrender.com`, you need to update these environment variables on Render:

1. `CLIENT_URL` - Set to your frontend URL (e.g., `https://your-app.vercel.app`)
2. `SOCKET_CORS_ORIGIN` - Set to your frontend URL

After updating, Render will automatically redeploy.

---

## 🧪 Testing Backend

Your backend API endpoints:
- Health check: `https://social-app-5hge.onrender.com/health`
- API info: `https://social-app-5hge.onrender.com/api`
- Auth endpoints: `https://social-app-5hge.onrender.com/api/auth/*`
- Room endpoints: `https://social-app-5hge.onrender.com/api/rooms/*`

Test the health endpoint in your browser or with curl:
```bash
curl https://social-app-5hge.onrender.com/health
```

Expected response:
```json
{"status":"ok","message":"Server is running"}
```

---

## 📝 Quick Decision Guide

**Choose Full-Stack on Render (Option 4)** if:
- ✅ You want everything in one place
- ✅ You're okay with slightly longer build times
- ✅ You want to pay for just one service

**Choose Separate Frontend Deployment (Options 1-3)** if:
- ✅ You want faster frontend deployments
- ✅ You want to use a specialized frontend platform
- ✅ Vercel/Netlify's free tier is attractive

---

## 🚀 Recommended Approach

**I recommend Option 4 (Full-Stack on Render)** since:
1. Your server.js is already configured to serve static files
2. Simpler management (one deployment)
3. No CORS issues
4. Everything stays on one platform

To implement:
1. Update your Render service settings:
   - **Root Directory**: Change from `server` to empty (root)
   - **Build Command**: 
     ```bash
     npm install && cd client && npm install && npm run build && cd ..
     ```
   - **Start Command**: Keep as `node server/server.js`
2. Update environment variable:
   - `CLIENT_URL` = `https://social-app-5hge.onrender.com`
   - `SOCKET_CORS_ORIGIN` = `https://social-app-5hge.onrender.com`
3. Save and let Render redeploy

---

## ✅ What to Do Next

1. **Decide on deployment strategy** (I recommend Option 4)
2. **Update Render configuration** based on your choice
3. **Update environment variables** with correct URLs
4. **Test your deployment** once it's complete

Let me know which option you'd like to go with!
