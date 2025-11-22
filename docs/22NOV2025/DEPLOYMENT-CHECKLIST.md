# Netlify Contact Function - Deployment Checklist

## Current Status
✅ Function created: `client/netlify/functions/contact.js`
✅ Dependencies added to `client/package.json` (mongodb, nodemailer)
✅ Netlify config updated: `client/netlify.toml`
✅ Frontend updated: `client/src/components/Legal/Contact.tsx`
✅ Node version updated to 20

## Deployment Steps

### 1. Install Dependencies Locally (Test Build)
```bash
cd client
npm install
```

This will install mongodb and nodemailer packages.

### 2. Set Netlify Environment Variables

Go to Netlify Dashboard → Site Settings → Environment variables

Add these variables:
- `MONGODB_URI` = Your MongoDB Atlas connection string
- `MONGODB_DB_NAME` = `social-app` (or your database name)

**Important:** Make sure these are set BEFORE deploying!

### 3. Clear Netlify Build Cache

In Netlify Dashboard:
1. Go to **Site settings** → **Build & deploy**
2. Click **Clear build cache**
3. This ensures fresh install of dependencies

### 4. Deploy

#### Option A: Git Push (Recommended)
```bash
git add .
git commit -m "Add Netlify contact function with MongoDB credentials"
git push origin main
```

Netlify will auto-deploy.

#### Option B: Manual Deploy
```bash
cd client
npm run build
netlify deploy --prod
```

### 5. Verify Deployment

After deployment completes:

1. **Check Functions Tab** in Netlify Dashboard
   - Should see `contact` function listed
   - Status should be "Active"

2. **Test the Function**
   - Visit your site
   - Try submitting the contact form
   - Or use curl:
   ```bash
   curl -X POST https://your-site.netlify.app/.netlify/functions/contact \
     -H "Content-Type: application/json" \
     -d '{"username":"Test","email":"test@example.com","subject":"Test","message":"Test message"}'
   ```

3. **Check Function Logs**
   - Go to Netlify Dashboard → Functions → contact
   - Click on recent invocations
   - Verify debug logs appear

## Common Issues & Solutions

### Issue: 404 - Page Not Found

**Causes:**
1. Function didn't deploy successfully
2. Environment variables not set
3. Build failed

**Solutions:**
1. Check build logs in Netlify Dashboard
2. Verify environment variables are set
3. Clear cache and redeploy
4. Check that `client/netlify/functions/contact.js` exists in your repo

### Issue: Function Timeout

**Causes:**
1. MongoDB connection timeout
2. SMTP server not responding

**Solutions:**
1. Verify MongoDB URI is correct
2. Check MongoDB Atlas IP whitelist (add 0.0.0.0/0)
3. Test SMTP credentials separately

### Issue: "Could not resolve mongodb/nodemailer"

**Cause:** Dependencies not installed

**Solution:**
1. Verify `mongodb` and `nodemailer` are in `client/package.json` dependencies
2. Delete `client/netlify/functions/package.json` if it exists
3. Clear Netlify build cache
4. Redeploy

## Verification Checklist

Before marking as complete, verify:

- [ ] `npm install` runs successfully in `client` directory
- [ ] `mongodb` and `nodemailer` listed in `client/package.json`
- [ ] No `package.json` in `client/netlify/functions/`
- [ ] Environment variables set in Netlify
- [ ] Node version = 20 in `netlify.toml`
- [ ] Build completes without errors
- [ ] Function appears in Netlify Dashboard
- [ ] Contact form submits successfully
- [ ] Email is received at recipient address
- [ ] Function logs show detailed debug information

## Current File Structure

```
client/
├── netlify/
│   └── functions/
│       └── contact.js          ← Function file
├── src/
│   └── components/
│       └── Legal/
│           └── Contact.tsx     ← Updated to use /api/contact
├── netlify.toml                ← Functions config
└── package.json                ← Dependencies: mongodb, nodemailer
```

## MongoDB Database Requirements

Your `sitesettings` collection must have a document:

```javascript
{
  "settingType": "global",
  "smtpUser": "your-email@yandex.com",
  "smtpPass": "your-app-password",
  "smtpHost": "smtp.yandex.com",
  "smtpPort": 587,
  "recipientEmail": "recipient@example.com",
  "siteEmail": "site@example.com"
}
```

## Next Steps After Successful Deployment

1. Test contact form on your live site
2. Monitor function logs for any issues
3. Consider adding rate limiting
4. Update CORS to restrict to your domain only
5. Remove SMTP env vars from Render backend

## Support

For detailed documentation, see: `NETLIFY-CONTACT-FUNCTION-GUIDE.md`
