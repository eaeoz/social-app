# Netlify Contact Function Setup Guide

This guide explains how to use the Netlify serverless function for contact form emails that fetches SMTP credentials from MongoDB instead of environment variables.

## Overview

The Netlify function (`client/netlify/functions/contact.js`) replaces the Render backend email functionality by:
- Connecting directly to MongoDB to fetch SMTP credentials from the `sitesettings` collection
- Using detailed debug logging for troubleshooting
- Handling email sending through Netlify's serverless infrastructure

## File Structure

```
client/
├── netlify/
│   └── functions/
│       ├── contact.js          # Main serverless function
│       └── package.json        # Function dependencies
├── netlify.toml                # Netlify configuration
```

## MongoDB Database Structure

The function expects the following structure in your MongoDB `sitesettings` collection:

```json
{
  "_id": "690d83fe62a3271ed78e2e25",
  "settingType": "global",
  "showuserlistpicture": 0,
  "searchUserCount": 4,
  "defaultUsersDisplayCount": 3,
  "siteEmail": "sedatergoz@gmail.com",
  "smtpUser": "sedatergoz@yandex.com",
  "smtpPass": "ihinuaqtejpjnjhm",
  "smtpHost": "smtp.yandex.com",
  "smtpPort": 587,
  "recipientEmail": "sedatergoz@gmail.com",
  "createdAt": "2025-11-07T05:30:38.264+00:00",
  "updatedAt": "2025-11-08T05:05:36.772+00:00"
}
```

### Required Fields for Email Functionality

- `smtpUser`: SMTP username/email for authentication
- `smtpPass`: SMTP password or app-specific password
- `smtpHost`: SMTP server hostname (e.g., smtp.yandex.com)
- `smtpPort`: SMTP server port (e.g., 587 for TLS, 465 for SSL)
- `recipientEmail`: Email address where contact form submissions will be sent
- `siteEmail`: Fallback email if recipientEmail is not set

## Netlify Environment Variables

You need to set these environment variables in your Netlify dashboard:

1. Go to your Netlify site dashboard
2. Navigate to: **Site settings** → **Environment variables**
3. Add the following variables:

```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/?retryWrites=true&w=majority
MONGODB_DB_NAME=social-app
```

### How to Get MongoDB URI

1. Log in to [MongoDB Atlas](https://cloud.mongodb.com)
2. Click on your cluster's **Connect** button
3. Select **Connect your application**
4. Copy the connection string
5. Replace `<password>` with your actual database password

## Deployment Steps

### 1. Install Dependencies

The Netlify function has its own dependencies defined in `client/netlify/functions/package.json`:

```json
{
  "name": "netlify-functions",
  "version": "1.0.0",
  "type": "module",
  "dependencies": {
    "mongodb": "^6.3.0",
    "nodemailer": "^6.9.8"
  }
}
```

Netlify will automatically install these when deploying.

### 2. Update Frontend API Calls

Update your frontend contact form to call the Netlify function instead of the Render backend:

**Before (Render backend):**
```javascript
const response = await axios.post('https://your-render-backend.onrender.com/api/contact', formData);
```

**After (Netlify function):**
```javascript
const response = await axios.post('/api/contact', formData);
// or
const response = await axios.post('/.netlify/functions/contact', formData);
```

### 3. Deploy to Netlify

```bash
cd client
npm run build
# Then push to GitHub - Netlify will auto-deploy
```

Or manually:
```bash
netlify deploy --prod
```

## API Endpoint

Once deployed, your contact function will be available at:
- `https://your-site.netlify.app/.netlify/functions/contact`
- `https://your-site.netlify.app/api/contact` (via redirect)

## Request Format

**POST** request with JSON body:

```json
{
  "username": "John Doe",
  "email": "john@example.com",
  "subject": "Hello",
  "message": "This is a test message"
}
```

## Response Format

**Success (200):**
```json
{
  "success": true,
  "message": "Message sent successfully! We'll get back to you soon.",
  "messageId": "<message-id@server>"
}
```

**Error (400/500):**
```json
{
  "success": false,
  "message": "Error message here"
}
```

## Debug Logging

The function includes comprehensive debug logging. To view logs:

1. Go to your Netlify dashboard
2. Navigate to: **Functions** → **contact**
3. Click on any invocation to see detailed logs

### Log Structure

Each operation is wrapped with detailed logging:

```
=====================================
[DEBUG] Stage Name
Timestamp: 2025-11-08T05:38:00.000Z
Data: { ... }
=====================================
```

Error logs include:
- Error message
- Stack trace
- Error code
- Timestamp

### Debug Stages

1. **Netlify Function Invoked** - Function entry point
2. **MongoDB Connection Start** - Database connection initialization
3. **MongoDB Connection Success** - Successful connection
4. **Querying siteSettings Collection** - Fetching settings
5. **Site Settings Retrieved** - Settings successfully fetched
6. **Creating Email Transporter** - Setting up nodemailer
7. **Email Transporter Verified** - SMTP connection verified
8. **Email Content Prepared** - Email ready to send
9. **Sending Email** - Transmission started
10. **Email Sent Successfully** - Email delivered

## Troubleshooting

### Error: "Site settings not configured in database"

**Cause:** No document with `settingType: 'global'` found in `sitesettings` collection.

**Solution:** 
1. Check MongoDB collection name is exactly `sitesettings` (lowercase)
2. Verify document exists with `settingType: 'global'`
3. Run this in MongoDB shell:
```javascript
db.sitesettings.findOne({ settingType: 'global' })
```

### Error: "Email authentication failed"

**Cause:** Invalid SMTP credentials in database.

**Solution:**
1. Verify `smtpUser` and `smtpPass` are correct in MongoDB
2. For Gmail/Yandex, use app-specific passwords, not regular passwords
3. Check the debug logs to see which credentials are being used

### Error: "Unable to connect to email server"

**Cause:** Network issues or incorrect SMTP host/port.

**Solution:**
1. Verify `smtpHost` and `smtpPort` in MongoDB
2. Common ports: 587 (TLS), 465 (SSL), 25 (unencrypted)
3. Ensure Netlify can connect to the SMTP server (no firewall blocks)

### Error: "MongoDB connection error"

**Cause:** Cannot connect to MongoDB Atlas.

**Solution:**
1. Verify `MONGODB_URI` environment variable is set in Netlify
2. Check MongoDB Atlas IP whitelist - add `0.0.0.0/0` to allow all IPs
3. Ensure connection string includes authentication credentials

### No logs appearing

**Cause:** Netlify might be caching function results.

**Solution:**
1. Clear Netlify deploy cache
2. Redeploy the site
3. Check function logs in real-time during testing

## Testing the Function

### Local Testing with Netlify CLI

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Navigate to client directory
cd client

# Set environment variables in .env file
echo "MONGODB_URI=your_mongodb_uri" > .env
echo "MONGODB_DB_NAME=social-app" >> .env

# Start Netlify Dev server
netlify dev
```

Then test with curl:
```bash
curl -X POST http://localhost:8888/.netlify/functions/contact \
  -H "Content-Type: application/json" \
  -d '{
    "username": "Test User",
    "email": "test@example.com",
    "subject": "Test Subject",
    "message": "Test message"
  }'
```

### Production Testing

Use Postman or curl to test the deployed function:

```bash
curl -X POST https://your-site.netlify.app/.netlify/functions/contact \
  -H "Content-Type: application/json" \
  -d '{
    "username": "Test User",
    "email": "test@example.com",
    "subject": "Test Subject",
    "message": "Test message"
  }'
```

## Disabling Render Backend Email

Since you're now using Netlify functions instead of the Render backend for emails:

1. **Keep the Render backend running** for other features (authentication, real-time messaging, etc.)
2. **Remove email environment variables from Render:**
   - Remove `SMTP_USER`
   - Remove `SMTP_PASS`
   - Remove `SMTP_HOST`
   - Remove `SMTP_PORT`

3. **Update frontend to use Netlify function** for contact form only

4. **Optional:** Comment out or remove the contact route in `server/routes/contactRoutes.js` if you want to completely disable backend email handling

## Security Considerations

1. **MongoDB Connection String:** Never commit the connection string to Git - always use environment variables
2. **SMTP Passwords:** Store in MongoDB with restricted database access
3. **CORS:** The function allows all origins (`*`) - restrict this for production:
   ```javascript
   'Access-Control-Allow-Origin': 'https://your-domain.com'
   ```
4. **Rate Limiting:** Consider adding rate limiting to prevent spam
5. **Input Validation:** The function validates email format and required fields

## Advantages Over Render Backend

1. ✅ **No separate backend needed** for contact form
2. ✅ **Serverless** - scales automatically
3. ✅ **Faster response** - function runs on Netlify's edge network
4. ✅ **Database-driven config** - update SMTP settings without redeployment
5. ✅ **Detailed logging** - comprehensive debug information
6. ✅ **Cost effective** - Netlify free tier includes 125K function invocations/month

## Monitoring

Check function usage in Netlify dashboard:
- **Site overview** → **Functions**
- View invocations, success rate, and duration
- Access logs for debugging

## Support

For issues or questions:
1. Check Netlify function logs
2. Verify MongoDB connection and data
3. Test SMTP credentials separately
4. Review this guide's troubleshooting section
