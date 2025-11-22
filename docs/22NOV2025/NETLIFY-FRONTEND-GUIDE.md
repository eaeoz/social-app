# 🌐 Netlify Frontend Deployment Guide

Guide for deploying your React frontend on Netlify with backend on Render.

## 📋 Architecture

- **Backend (Render)**: https://social-app-5hge.onrender.com
- **Frontend (Netlify)**: https://your-app-name.netlify.app

---

## 🚀 Step-by-Step Deployment

### 1. Prepare Your Repository

First, create a `_redirects` file for client-side routing:

```bash
# This file should be in client/public/_redirects
/*    /index.html   200
```

This ensures React Router works correctly on Netlify.

### 2. Update Frontend Environment Variables

Check your `client/.env` or `client/.env.production` file:

```env
VITE_API_URL=https://social-app-5hge.onrender.com/api
VITE_SOCKET_URL=https://social-app-5hge.onrender.com
VITE_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
VITE_APPWRITE_PROJECT_ID=your_project_id
VITE_APP_NAME=ChatApp
```

**IMPORTANT**: Never commit real credentials to `.env` files. Use Netlify's environment variables instead.

### 3. Deploy to Netlify

#### Option A: Using Netlify Dashboard (Recommended)

1. Go to https://netlify.com and sign in
2. Click **"Add new site"** → **"Import an existing project"**
3. Connect your GitHub/GitLab repository
4. Configure build settings:
   - **Base directory**: `client`
   - **Build command**: `npm run build`
   - **Publish directory**: `client/dist`
   - **Branch to deploy**: `main` (or your branch)

5. Click **"Show advanced"** → **"New variable"** and add:

| Key | Value |
|-----|-------|
| VITE_API_URL | https://social-app-5hge.onrender.com/api |
| VITE_SOCKET_URL | https://social-app-5hge.onrender.com |
| VITE_APPWRITE_ENDPOINT | https://cloud.appwrite.io/v1 |
| VITE_APPWRITE_PROJECT_ID | your_appwrite_project_id |
| VITE_APP_NAME | ChatApp |

6. Click **"Deploy site"**

#### Option B: Using Netlify CLI

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login to Netlify
netlify login

# Navigate to client directory
cd client

# Deploy
netlify deploy --prod
```

### 4. Update Backend CORS Settings

Once your Netlify site is deployed, you'll get a URL like:
`https://your-app-name.netlify.app`

Go to your **Render dashboard** and update these environment variables:

| Key | New Value |
|-----|-----------|
| CLIENT_URL | https://your-app-name.netlify.app |
| SOCKET_CORS_ORIGIN | https://your-app-name.netlify.app |

**After updating, Render will automatically redeploy with the new CORS settings.**

### 5. Custom Domain (Optional)

If you have a custom domain:

1. In Netlify: **Domain settings** → **Add custom domain**
2. Follow DNS configuration instructions
3. Update Render environment variables with your custom domain

---

## 📁 Required Files

### client/public/_redirects

Create this file if it doesn't exist:

```
/*    /index.html   200
```

This file handles client-side routing for React.

### client/.env.production (Optional)

You can create this file for production-specific values:

```env
VITE_API_URL=https://social-app-5hge.onrender.com/api
VITE_SOCKET_URL=https://social-app-5hge.onrender.com
```

But it's better to use Netlify's environment variables instead.

---

## 🔧 Netlify Configuration File (Alternative Method)

Create `netlify.toml` in your **repository root**:

```toml
[build]
  base = "client"
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[build.environment]
  NODE_VERSION = "18"
```

This provides the same configuration as the UI but in code.

---

## 🧪 Testing Your Deployment

### 1. Test Backend Connection

```bash
# Test health endpoint
curl https://social-app-5hge.onrender.com/health

# Expected response:
# {"status":"ok","message":"Server is running"}
```

### 2. Test Frontend

Visit your Netlify URL:
- https://your-app-name.netlify.app

Check browser console for:
- ✅ No CORS errors
- ✅ API requests going to Render backend
- ✅ WebSocket connection established

---

## 🐛 Troubleshooting

### CORS Errors

**Problem**: `Access to fetch at 'https://social-app-5hge.onrender.com/api/...' from origin 'https://your-app.netlify.app' has been blocked by CORS`

**Solution**:
1. Verify `CLIENT_URL` in Render matches your Netlify URL exactly
2. Verify `SOCKET_CORS_ORIGIN` in Render matches your Netlify URL
3. Wait for Render to redeploy after changing environment variables
4. Clear browser cache and try again

### 404 on Page Refresh

**Problem**: Refreshing any page except home gives 404

**Solution**: Ensure `_redirects` file exists in `client/public/` with:
```
/*    /index.html   200
```

### Environment Variables Not Working

**Problem**: Frontend can't connect to backend

**Solution**:
1. Check environment variables are set in Netlify dashboard
2. Variables must start with `VITE_` to be accessible in Vite apps
3. Redeploy after adding variables (Netlify → Deploys → Trigger deploy)

### Build Fails on Netlify

**Problem**: Build fails with dependency errors

**Solution**:
1. Ensure `client/package.json` has all dependencies
2. Check Node version matches (set in netlify.toml or Netlify UI)
3. Try clearing Netlify cache: Deploy settings → Clear cache and deploy

### WebSocket Connection Issues

**Problem**: Real-time features not working

**Solution**:
1. Verify `VITE_SOCKET_URL` points to Render backend
2. Check browser console for WebSocket errors
3. Ensure `SOCKET_CORS_ORIGIN` in Render includes your Netlify URL
4. Test WebSocket connection manually:
   ```javascript
   const socket = io('https://social-app-5hge.onrender.com');
   ```

---

## 📊 Deployment Summary

### What You Need to Do:

1. ✅ **Create `_redirects` file** in `client/public/`
2. ✅ **Deploy to Netlify** with correct build settings
3. ✅ **Add environment variables** in Netlify
4. ✅ **Update CORS settings** on Render backend
5. ✅ **Test the application**

### Final Configuration:

**Netlify Settings:**
- Base directory: `client`
- Build command: `npm run build`
- Publish directory: `client/dist`
- Environment variables: All `VITE_*` variables

**Render Settings:**
- Root directory: `server`
- Build command: `npm install`
- Start command: `node server.js`
- Environment variables: Updated `CLIENT_URL` and `SOCKET_CORS_ORIGIN`

---

## 🎯 Quick Commands

```bash
# Create _redirects file
echo "/*    /index.html   200" > client/public/_redirects

# Test build locally
cd client
npm run build

# Deploy to Netlify (if using CLI)
netlify deploy --prod
```

---

## 📚 Additional Resources

- [Netlify Docs](https://docs.netlify.com/)
- [Vite Environment Variables](https://vitejs.dev/guide/env-and-mode.html)
- [React Router on Netlify](https://docs.netlify.com/routing/redirects/rewrites-proxies/#history-pushstate-and-single-page-apps)
- [CORS on Express](https://expressjs.com/en/resources/middleware/cors.html)

---

## 🎉 Success Checklist

After deployment, verify:

- [ ] Frontend loads at Netlify URL
- [ ] Can register/login successfully
- [ ] API calls work (check Network tab)
- [ ] WebSocket connects (real-time features work)
- [ ] No CORS errors in console
- [ ] Page refresh works on all routes
- [ ] Images and assets load correctly

---

**Happy Deploying! 🚀**
