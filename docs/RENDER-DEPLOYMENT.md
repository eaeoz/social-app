# 🎨 Render Deployment Guide

This guide explains how to deploy your social-app to Render.

## 📋 Render Configuration

### Name
Choose a unique name for your service (e.g., `social-app`, `my-chat-app`)

### Language
**Node**

### Branch
**main** (or your default branch name)

### Region
Choose the region closest to your users (e.g., Oregon (US West), Frankfurt (EU Central))

### Root Directory
**Leave empty** (repository root)

Since this is a monorepo, Render should run from the root directory. The build and start commands will handle the client build process.

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

This starts the Node.js backend server.

### Instance Type
- **Free**: For testing (spins down after inactivity)
- **Starter or higher**: Recommended for production (always on, better performance)

---

## 🔐 Environment Variables

Add these environment variables in Render's dashboard:

### MongoDB Configuration
```
MONGODB_URI=your_mongodb_atlas_connection_string
MONGODB_DB_NAME=social-app
```

**Important**: 
- Use MongoDB Atlas (cloud) connection string
- Whitelist Render's IP range (0.0.0.0/0 for all IPs) in MongoDB Atlas Network Access
- Replace `<password>` in connection string with your actual password

### Server Configuration
```
PORT=10000
NODE_ENV=production
CLIENT_URL=https://your-app-name.onrender.com
```

**Note**: 
- Render typically uses port 10000 by default, but reads from `PORT` env variable
- Replace `your-app-name` with your actual Render service name after deployment

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
SOCKET_CORS_ORIGIN=https://your-app-name.onrender.com
MAX_SOCKET_CONNECTIONS=1000
```

**Note**: Update `SOCKET_CORS_ORIGIN` with your Render URL after deployment.

---

## 📝 Complete Environment Variables List

Here's a quick copy-paste template for Render. Replace the values with your actual credentials:

| Key | Value |
|-----|-------|
| MONGODB_URI | mongodb+srv://username:password@cluster.mongodb.net/?retryWrites=true&w=majority |
| MONGODB_DB_NAME | social-app |
| PORT | 10000 |
| NODE_ENV | production |
| CLIENT_URL | https://your-app-name.onrender.com |
| JWT_SECRET | generate_a_long_random_string_here |
| JWT_EXPIRES_IN | 7d |
| JWT_REFRESH_SECRET | generate_another_long_random_string_here |
| JWT_REFRESH_EXPIRES_IN | 30d |
| APPWRITE_ENDPOINT | https://cloud.appwrite.io/v1 |
| APPWRITE_PROJECT_ID | your_project_id |
| APPWRITE_API_KEY | your_api_key |
| APPWRITE_BUCKET_ID | your_bucket_id |
| CACHE_TTL | 3600 |
| CACHE_CHECK_PERIOD | 600 |
| SOCKET_CORS_ORIGIN | https://your-app-name.onrender.com |
| MAX_SOCKET_CONNECTIONS | 1000 |

---

## 🚀 Deployment Steps

### 1. Prepare MongoDB Atlas
1. Go to https://cloud.mongodb.com
2. Create a cluster (if not already created)
3. Go to **Network Access** → **Add IP Address** → **Allow Access from Anywhere** (0.0.0.0/0)
4. Go to **Database Access** → Create a user with read/write permissions
5. Get connection string from **Connect** → **Connect your application**
6. Replace `<password>` with your database user password

### 2. Setup Appwrite
1. Go to https://cloud.appwrite.io
2. Create a new project
3. Go to **Storage** → **Create Bucket**
4. Configure bucket permissions:
   - Read access: Any
   - Write access: Users (or as needed)
5. Go to **Settings** → **API Keys** → **Create API Key**
   - Add scopes: `files.read`, `files.write`, `files.delete`
6. Copy:
   - Project ID (from Settings)
   - Bucket ID (from Storage)
   - API Key (from API Keys)

### 3. Deploy to Render
1. Go to https://render.com and sign in
2. Click **New** → **Web Service**
3. Connect your GitHub/GitLab repository
4. Configure the service:
   - **Name**: Choose a unique name
   - **Language**: Node
   - **Branch**: main (or your branch)
   - **Region**: Select closest region
   - **Root Directory**: Leave empty
   - **Build Command**: 
     ```bash
     npm install && cd client && npm install && npm run build && cd ..
     ```
   - **Start Command**: 
     ```bash
     node server/server.js
     ```
5. Click **Advanced** → **Add Environment Variable**
6. Add all environment variables from the list above
7. Choose instance type (Free or Starter+)
8. Click **Create Web Service**

### 4. Post-Deployment
1. Wait for the initial deployment to complete
2. Note your Render URL (e.g., `https://your-app-name.onrender.com`)
3. Update these environment variables with your actual URL:
   - `CLIENT_URL`
   - `SOCKET_CORS_ORIGIN`
4. Render will automatically redeploy with updated variables
5. Test your application!

---

## 🔍 Troubleshooting

### Free Instance Spinning Down
**Issue**: Free instances spin down after 15 minutes of inactivity
**Solution**: 
- Upgrade to Starter plan ($7/month) for always-on service
- Or use a service like UptimeRobot to ping your app every 14 minutes

### MongoDB Connection Issues - SSL/TLS Errors
**Issue**: `MongoServerSelectionError: SSL routines:ssl3_read_bytes:tlsv1 alert internal error`

This is a common SSL/TLS handshake error on Render with MongoDB Atlas.

**Solutions**:
1. ✅ **Already Fixed**: The `server/config/database.js` file now includes proper TLS options
2. **Verify Connection String Format**: Ensure your MongoDB URI follows this format:
   ```
   mongodb+srv://username:password@cluster.mongodb.net/?retryWrites=true&w=majority
   ```
3. **MongoDB Atlas Settings**:
   - Go to MongoDB Atlas → Network Access
   - Click "Add IP Address"
   - Select "Allow Access from Anywhere" (0.0.0.0/0)
   - Save changes
4. **Password Special Characters**: If your password contains special characters, URL encode them:
   - `@` becomes `%40`
   - `#` becomes `%23`
   - `$` becomes `%24`
   - `:` becomes `%3A`
   - `/` becomes `%2F`
   - Use [URL Encoder](https://www.urlencoder.org/) if needed
5. **Check MongoDB Version**: Ensure you're using MongoDB 4.4+ in Atlas
6. **Test Locally First**: Verify the connection string works on your local machine

### Other MongoDB Issues
- Verify IP whitelist in MongoDB Atlas (use 0.0.0.0/0 for Render)
- Check connection string format
- Ensure password doesn't contain special characters (or URL encode them)
- Test connection string locally first

### Build Failures
- Check Render logs in the **Logs** tab
- Ensure all dependencies are in package.json
- Verify Node.js version compatibility (Render uses Node 20 by default)
- Check for case-sensitive file path issues

### WebSocket Connection Issues
- Verify `SOCKET_CORS_ORIGIN` matches your Render URL exactly
- Ensure client is connecting to the correct WebSocket URL
- Check that PORT environment variable is set correctly
- Review Render logs for WebSocket errors

### Static Files Not Loading (404 errors)
**Issue**: Frontend files not found
**Solution**: 
1. Verify build command completed successfully in logs
2. Check that `client/dist` directory exists after build
3. Ensure server is configured to serve static files:

```javascript
// In server/server.js, add:
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Serve static files from client/dist
app.use(express.static(path.join(__dirname, '../client/dist')));

// Handle client-side routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/dist/index.html'));
});
```

### Environment Variable Not Working
- Double-check spelling and formatting
- Restart the service after adding/updating variables
- Check Render logs to see if variables are being read correctly

---

## 📊 Monitoring & Logs

Render provides excellent monitoring tools:

### Logs
- **Access**: Dashboard → Your Service → Logs tab
- **Real-time**: See live application logs
- **Persistent**: Logs are stored and searchable

### Metrics
- **CPU Usage**: Monitor processing load
- **Memory**: Track memory consumption
- **Bandwidth**: Network traffic statistics
- **Requests**: HTTP request counts

### Alerts
- Set up alerts for downtime or errors
- Get notified via email or Slack

---

## 🔄 Auto-Deploy

Render automatically deploys when you push to your connected branch:

1. Push code to GitHub/GitLab
2. Render detects changes
3. Automatically builds and deploys
4. Zero-downtime deployment (on paid plans)

### Manual Deploy
- Go to Dashboard → Your Service
- Click **Manual Deploy** → **Deploy latest commit**

### Deploy Hooks
Create a deploy hook URL to trigger deployments via API/webhook

---

## 💰 Pricing Tiers

### Free Tier
- ✅ Great for testing and demos
- ✅ HTTPS included
- ✅ Automatic SSL certificates
- ❌ Spins down after 15 mins of inactivity
- ❌ Slower cold starts (up to 30 seconds)
- ❌ 750 hours/month limit across all free services

### Starter ($7/month)
- ✅ Always on (no spin down)
- ✅ Fast startup
- ✅ 512 MB RAM
- ✅ SSH access
- ✅ Better for production

### Standard ($25/month)
- ✅ 2 GB RAM
- ✅ Better performance
- ✅ Multiple instances for scaling

---

## 🔒 Security Best Practices

1. **Never commit secrets** to your repository
2. **Use strong JWT secrets** (64+ character random strings)
3. **Enable CORS properly** with specific origins
4. **Use HTTPS** (Render provides free SSL)
5. **Whitelist IPs** in MongoDB Atlas
6. **Set NODE_ENV=production** for optimizations
7. **Rate limit** API endpoints (already configured in your app)
8. **Keep dependencies updated** regularly

---

## 🎯 Performance Tips

1. **Enable compression** in Express
2. **Use production builds** for React
3. **Implement caching** (already using node-cache)
4. **Optimize database queries** with indexes
5. **Use CDN** for static assets (optional)
6. **Monitor performance** with Render metrics
7. **Upgrade instance** if needed for better performance

---

## 📚 Additional Resources

- [Render Documentation](https://render.com/docs)
- [Deploy Node.js Apps](https://render.com/docs/deploy-node-express-app)
- [Environment Variables](https://render.com/docs/environment-variables)
- [MongoDB Atlas Documentation](https://docs.atlas.mongodb.com)
- [Appwrite Documentation](https://appwrite.io/docs)
- [Socket.IO on Render](https://render.com/docs/websocket-support)

---

## 🆘 Getting Help

- **Render Community**: https://community.render.com
- **Render Support**: Available on paid plans
- **Discord**: Render has an active Discord community
- **Documentation**: Comprehensive guides at render.com/docs

---

**Happy Deploying! 🎨**
