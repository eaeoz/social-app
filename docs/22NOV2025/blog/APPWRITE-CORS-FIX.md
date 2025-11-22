# Appwrite CORS Configuration

## 🚨 Issue

The blog is deployed but showing this error:
```
CORS header 'Access-Control-Allow-Origin' does not match 'https://localhost'
```

## ✅ Solution

Add your production domain to Appwrite's allowed platforms.

### Steps to Fix

1. **Go to Appwrite Console**:
   - Visit https://cloud.appwrite.io/console
   - Select your project (ID: `6901b7f00006bdd6e48d`)

2. **Go to Project Overview** (NOT Settings):
   - Click on "Overview" in the left sidebar (should be the first/top option)
   - Scroll down to the "Platforms" section
   - You'll see a list of platforms or an "Add Platform" button

3. **Add Web Platform**:
   - Click "Add Platform" button
   - Select "Web App" (or "Web")
   
4. **Configure Platform**:
   - **Name**: Sedat Blog Production
   - **Hostname**: `sedat.netlify.app`
   - Click "Next" or "Create"

5. **Optional - Add localhost**:
   If you also want localhost to work:
   - Add another platform
   - **Name**: Sedat Blog Local
   - **Hostname**: `localhost`

### Required Hostnames

Add these as separate web platforms:
- ✅ `sedat.netlify.app` (production)
- ✅ `localhost` (local development)

### After Adding

1. Save the changes
2. Wait 1-2 minutes for changes to propagate
3. Refresh your blog at https://sedat.netlify.app
4. Articles should now load! ✅

## 🔍 How to Verify

After adding the platform:
1. Visit https://sedat.netlify.app
2. Open browser console (F12)
3. Refresh the page
4. You should see articles loading
5. No more CORS errors!

## 📝 Current Configuration

### Your Appwrite Setup
- **Endpoint**: `https://cloud.appwrite.io/v1`
- **Project ID**: `6901b7f00006bdd6e48d`
- **Database ID**: `6901d5f00010cd2a48f1`
- **Collection ID**: `blog_articles`

### Domains to Add
1. Production: `sedat.netlify.app`
2. Local: `localhost` (optional)

## ⚠️ Common Mistakes

❌ **Don't add**:
- `https://sedat.netlify.app` (with protocol)
- `http://sedat.netlify.app` (with protocol)
- `www.sedat.netlify.app` (unless you use www)

✅ **Correct format**:
- `sedat.netlify.app` (just the hostname)
- `localhost` (for local dev)

## 🎯 After Fix

Once CORS is configured correctly:
- ✅ Articles will load from Appwrite
- ✅ Search will work
- ✅ Article detail pages will display
- ✅ No more CORS errors
- ✅ Blog fully functional!

## 📱 Mobile Testing

The blog is already responsive, test on:
- Mobile phones
- Tablets
- Different browsers

Everything should work once CORS is fixed!
