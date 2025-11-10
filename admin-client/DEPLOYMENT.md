# 🚀 Admin Dashboard Deployment Guide

This guide will help you deploy the Netcify Admin Dashboard to Netlify.

## Prerequisites

- GitHub account (to connect your repository)
- Netlify account (sign up at https://netlify.com)
- Admin user configured in MongoDB with `role: 'admin'`
- Backend deployed and accessible (e.g., on Railway)

## Step 1: Prepare for Deployment

### 1.1 Create a `.gitignore` file (if not exists)
Ensure you have a `.gitignore` in the `admin-client` directory:
```
node_modules
dist
.env.local
.DS_Store
```

### 1.2 Test Build Locally
```bash
cd admin-client
npm run build
```

This should create a `dist` folder. If there are any errors, fix them before deploying.

## Step 2: Deploy to Netlify

### Option A: Deploy via Netlify Website (Recommended)

1. **Push your code to GitHub**
   ```bash
   git add .
   git commit -m "Add admin dashboard"
   git push origin main
   ```

2. **Go to Netlify Dashboard**
   - Visit https://app.netlify.com
   - Click "Add new site" > "Import an existing project"

3. **Connect to GitHub**
   - Select "GitHub" as your Git provider
   - Authorize Netlify to access your repositories
   - Select your `social-app` repository

4. **Configure Build Settings**
   - **Base directory:** `admin-client`
   - **Build command:** `npm run build`
   - **Publish directory:** `admin-client/dist`

5. **Add Environment Variables**
   Click "Show advanced" and add these variables:
   ```
   VITE_API_URL=https://your-backend.railway.app/api
   VITE_APP_NAME=Netcify Admin
   ```
   
   Replace `your-backend.railway.app` with your actual backend URL.

6. **Deploy**
   - Click "Deploy site"
   - Wait for the build to complete (usually 2-3 minutes)
   - Your admin dashboard will be live!

### Option B: Deploy via Netlify CLI

1. **Install Netlify CLI**
   ```bash
   npm install -g netlify-cli
   ```

2. **Login to Netlify**
   ```bash
   netlify login
   ```

3. **Initialize Site**
   ```bash
   cd admin-client
   netlify init
   ```

4. **Configure Build Settings**
   - Build command: `npm run build`
   - Publish directory: `dist`

5. **Set Environment Variables**
   ```bash
   netlify env:set VITE_API_URL "https://your-backend.railway.app/api"
   netlify env:set VITE_APP_NAME "Netcify Admin"
   ```

6. **Deploy**
   ```bash
   netlify deploy --prod
   ```

## Step 3: Update Backend CORS

After deployment, you need to add your Netlify URL to the backend's allowed origins.

1. **Get your Netlify URL**
   - It will be something like: `https://your-admin-dashboard.netlify.app`

2. **Update `server/server.js`**
   Add your Netlify URL to the `allowedOrigins` array:
   ```javascript
   const allowedOrigins = [
     'http://localhost:5173',
     'http://localhost:5174',
     'http://localhost:3000',
     'http://localhost:4000',
     'http://localhost:8888',
     'https://netcify.netlify.app',
     'https://your-admin-dashboard.netlify.app', // Add this
     process.env.CLIENT_URL
   ].filter(Boolean);
   ```

3. **Deploy the backend changes**
   ```bash
   git add server/server.js
   git commit -m "Add admin dashboard to CORS"
   git push origin main
   ```

   If using Railway, it will auto-deploy. Wait for deployment to complete.

## Step 4: Create Admin User

If you haven't already, create an admin user in MongoDB:

### Using MongoDB Compass:
1. Connect to your database
2. Find the `users` collection
3. Find your user document
4. Add/update the `role` field to `"admin"`
5. Save

### Using MongoDB Shell:
```javascript
use social-app
db.users.updateOne(
  { username: "your_username" },
  { $set: { role: "admin" } }
)
```

### Using Node.js Script:
Create `make-admin.js` in the root directory:
```javascript
import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

async function makeAdmin() {
  const client = new MongoClient(process.env.MONGODB_URI);
  
  try {
    await client.connect();
    const db = client.db('social-app');
    
    const result = await db.collection('users').updateOne(
      { username: 'your_username' }, // Change this
      { $set: { role: 'admin' } }
    );
    
    console.log('✅ Admin role granted:', result.modifiedCount);
  } finally {
    await client.close();
  }
}

makeAdmin();
```

Run: `node make-admin.js`

## Step 5: Test the Deployment

1. **Visit your Netlify URL**
   - `https://your-admin-dashboard.netlify.app`

2. **Login with admin credentials**
   - Use the username/password of the user you made admin

3. **Test all features**
   - Navigate to Statistics, Users, Reports, Settings
   - Verify data loads correctly
   - Check that actions work (if implemented)

## Troubleshooting

### Build Fails
- Check the build logs in Netlify dashboard
- Ensure all dependencies are in `package.json`
- Verify `NODE_VERSION` is set to 18 in `netlify.toml`

### Can't Login
- Verify the user has `role: 'admin'` in MongoDB
- Check browser console for errors
- Verify `VITE_API_URL` environment variable is correct
- Ensure backend is running and accessible

### CORS Errors
- Verify your Netlify URL is added to backend's `allowedOrigins`
- Check that backend is deployed with the updated CORS config
- Open browser DevTools > Network tab to see the exact error

### Data Not Loading
- Open browser DevTools > Network tab
- Check if API requests are being made
- Verify the API endpoints are returning data
- Check that JWT token is valid

### 404 on Page Refresh
- Ensure `netlify.toml` has the redirect rule
- The `[[redirects]]` section should be configured correctly

## Custom Domain (Optional)

1. **Add Custom Domain in Netlify**
   - Go to Site settings > Domain management
   - Click "Add custom domain"
   - Follow instructions to configure DNS

2. **Update Backend CORS**
   - Add your custom domain to `allowedOrigins` in `server/server.js`

## Continuous Deployment

Netlify automatically deploys when you push to your connected Git branch:

```bash
# Make changes to admin-client
cd admin-client
# ... edit files ...

# Commit and push
git add .
git commit -m "Update admin dashboard"
git push origin main

# Netlify will automatically build and deploy!
```

## Security Best Practices

1. **Never commit `.env` files** - Use Netlify's environment variables
2. **Use strong admin passwords** - Consider enabling 2FA on admin accounts
3. **Monitor admin actions** - Log admin activities in your backend
4. **Limit admin access** - Only give admin role to trusted users
5. **Use HTTPS** - Netlify provides free SSL certificates

## Support

If you encounter issues:
- Check Netlify build logs
- Review browser console for errors
- Verify environment variables are set correctly
- Ensure backend is accessible and CORS is configured

---

**Admin Dashboard deployed! 🎉**

Your admin dashboard is now live and ready to manage your Netcify platform.
