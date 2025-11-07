# 🚂 Railway Deployment Guide

This guide explains how to deploy your social-app to Railway.

## 📋 Railway Configuration

### Root Directory
**Leave empty** or set to `/` (repository root)

Since this is a monorepo with both server and client code, Railway should run from the root directory. The build and start commands will handle navigating to the correct directories.

### Build Command
```bash
npm install && cd client && npm install && npm run build && cd ..
```

This command:
1. Installs root dependencies (backend)
2. Navigates to client directory
3. Installs frontend dependencies
4. Builds the frontend
5. Returns to root

### Start Command
```bash
node server/server.js
```

This starts the Node.js backend server which will also serve the built frontend files.

### Port Configuration
Railway automatically assigns a port via the `PORT` environment variable. Your server is already configured to use `process.env.PORT || 3000`.

---

## 🔐 Environment Variables

Add these environment variables in Railway's dashboard:

### MongoDB Configuration
```
MONGODB_URI=your_mongodb_atlas_connection_string
MONGODB_DB_NAME=social-app
```

**Important**: 
- Use MongoDB Atlas (cloud) connection string
- Whitelist Railway's IP range (0.0.0.0/0 for all IPs) in MongoDB Atlas Network Access
- Replace `<password>` in connection string with your actual password

### Server Configuration
```
PORT=3000
NODE_ENV=production
CLIENT_URL=https://your-app-name.up.railway.app
```

**Note**: Replace `your-app-name` with your actual Railway domain after deployment.

### JWT Authentication
```
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=your_refresh_token_secret_change_this_too
JWT_REFRESH_EXPIRES_IN=30d
```

**Important**: Generate strong random secrets for production:
```bash
# Generate secure random strings
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### Appwrite Configuration (for file storage)
```
APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
APPWRITE_PROJECT_ID=your_appwrite_project_id
APPWRITE_API_KEY=your_appwrite_api_key
APPWRITE_BUCKET_ID=your_appwrite_bucket_id
```

**Setup Appwrite**:
1. Create account at https://cloud.appwrite.io
2. Create a new project
3. Create a storage bucket
4. Generate API key with storage permissions
5. Copy the IDs and keys to these variables

### Cache Configuration
```
CACHE_TTL=3600
CACHE_CHECK_PERIOD=600
```

### WebSocket Configuration
```
SOCKET_CORS_ORIGIN=https://your-app-name.up.railway.app
MAX_SOCKET_CONNECTIONS=1000
```

**Note**: Update `SOCKET_CORS_ORIGIN` with your Railway domain after deployment.

---

## 📝 Complete Environment Variables List

Here's a quick copy-paste template. Replace the values with your actual credentials:

```env
# MongoDB
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/?retryWrites=true&w=majority
MONGODB_DB_NAME=social-app

# Server
PORT=3000
NODE_ENV=production
CLIENT_URL=https://your-app-name.up.railway.app

# JWT
JWT_SECRET=generate_a_long_random_string_here
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=generate_another_long_random_string_here
JWT_REFRESH_EXPIRES_IN=30d

# Appwrite
APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
APPWRITE_PROJECT_ID=your_project_id
APPWRITE_API_KEY=your_api_key
APPWRITE_BUCKET_ID=your_bucket_id

# Cache
CACHE_TTL=3600
CACHE_CHECK_PERIOD=600

# WebSocket
SOCKET_CORS_ORIGIN=https://your-app-name.up.railway.app
MAX_SOCKET_CONNECTIONS=1000
```

---

## 🚀 Deployment Steps

### 1. Prepare MongoDB Atlas
1. Go to https://cloud.mongodb.com
2. Create a cluster (if not already created)
3. Go to Network Access → Add IP Address → Allow Access from Anywhere (0.0.0.0/0)
4. Go to Database Access → Create a user with read/write permissions
5. Get connection string from Connect → Connect your application

### 2. Setup Appwrite
1. Go to https://cloud.appwrite.io
2. Create a new project
3. Go to Storage → Create Bucket
4. Set bucket permissions appropriately
5. Go to Settings → API Keys → Create API Key
6. Copy Project ID, Bucket ID, and API Key

### 3. Deploy to Railway
1. Go to https://railway.app
2. Create new project → Deploy from GitHub repo
3. Select your repository
4. Configure settings:
   - **Root Directory**: Leave empty or `/`
   - **Build Command**: `npm install && cd client && npm install && npm run build && cd ..`
   - **Start Command**: `node server/server.js`
5. Add all environment variables from the list above
6. Deploy!

### 4. Post-Deployment
1. Note your Railway domain (e.g., `https://your-app-name.up.railway.app`)
2. Update these environment variables with your actual domain:
   - `CLIENT_URL`
   - `SOCKET_CORS_ORIGIN`
3. Update CORS in client if needed
4. Test the deployment!

---

## 🔍 Troubleshooting

### MongoDB Connection Issues
- Verify IP whitelist in MongoDB Atlas (use 0.0.0.0/0 for Railway)
- Check connection string format
- Ensure password doesn't contain special characters (or URL encode them)

### Build Failures
- Check Railway logs for specific errors
- Ensure all dependencies are in package.json
- Verify Node.js version compatibility

### WebSocket Issues
- Verify `SOCKET_CORS_ORIGIN` matches your Railway domain
- Check that Railway assigns a PORT correctly
- Ensure Socket.IO client connects to the correct URL

### Static Files Not Loading
- Verify the build command completes successfully
- Check that `client/dist` directory is created during build
- Ensure Express is configured to serve static files from `client/dist`

---

## 📊 Monitoring

Railway provides:
- **Logs**: View real-time application logs
- **Metrics**: CPU, Memory, Network usage
- **Deployments**: Track deployment history

Access these from your Railway dashboard.

---

## 🔄 Updates

To update your deployment:
1. Push changes to your GitHub repository
2. Railway automatically detects and redeploys
3. Or manually trigger redeployment from Railway dashboard

---

## 💡 Tips

1. **Environment Variables**: Never commit sensitive data to GitHub
2. **Secrets**: Generate strong random strings for JWT secrets
3. **CORS**: Always set correct origins in production
4. **MongoDB**: Use connection pooling and proper indexes
5. **Monitoring**: Check Railway logs regularly for issues

---

## 📚 Additional Resources

- [Railway Documentation](https://docs.railway.app)
- [MongoDB Atlas Documentation](https://docs.atlas.mongodb.com)
- [Appwrite Documentation](https://appwrite.io/docs)
- [Socket.IO Documentation](https://socket.io/docs/v4/)

---

**Happy Deploying! 🚀**
