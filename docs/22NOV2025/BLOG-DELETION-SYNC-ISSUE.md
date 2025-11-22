# Blog Article Deletion Sync Issue

## Problem
When deleting an article from the admin dashboard:
- ✅ Article is deleted from Appwrite (source of truth)
- ✅ Admin client updates immediately
- ❌ Blog still shows the deleted article

## Root Cause Analysis

The system has two data sources:
1. **Appwrite Database** - Source of truth where articles are stored
2. **JSON Cache** (`server/data/blogArticles.json`) - Cached copy for fast reads

The blog frontend can fetch articles from two sources (configured via environment variables):
1. **Direct Appwrite mode** (`VITE_USE_BACKEND=0`) - Reads directly from Appwrite
2. **Backend API mode** (`VITE_USE_BACKEND=1`) - Reads from cached JSON via backend API

## Why Deletions Might Not Show Immediately

### If Using Direct Appwrite Mode
- The blog queries Appwrite directly
- Deletions should appear immediately after page refresh
- **Solution**: Hard refresh the browser (Ctrl+F5 or Cmd+Shift+R)

### If Using Backend API Mode  
- The blog reads from JSON cache via backend API
- The sync function DOES update the cache correctly
- **Possible issues**:
  1. Browser has cached the API response
  2. CDN/Netlify has cached the response
  3. Need to wait for cache invalidation

## Solutions

### Solution 1: Hard Refresh Browser (Immediate)
```
Windows/Linux: Ctrl + F5 or Ctrl + Shift + R
Mac: Cmd + Shift + R
```
This clears browser cache and forces a fresh fetch.

### Solution 2: Configure Blog to Use Backend API
Ensure your blog's environment variables are set:
```env
# In blog/.env or Netlify environment variables
VITE_USE_BACKEND=1
VITE_API_URL=https://your-backend-server.onrender.com/api
```

This uses the backend cache which is automatically updated when articles are deleted.

### Solution 3: Clear CDN Cache (For Production)
If deployed to Netlify:
1. Go to Netlify Dashboard → Your blog site
2. Click "Deploys"
3. Click "Clear cache and deploy site"

Or trigger a new deploy which will clear CDN cache.

### Solution 4: Add Cache Control Headers (Recommended)
Update the blog's `netlify.toml` to prevent aggressive caching:

```toml
[[headers]]
  for = "/api/*"
  [headers.values]
    Cache-Control = "public, max-age=60, s-maxage=60"
```

This ensures API responses are only cached for 60 seconds.

## How The Sync Actually Works (It's Working Correctly!)

When you delete an article:

1. **Admin Dashboard** → Deletes from Appwrite via DELETE request
2. **Backend** → Triggers `syncBlogData()` function
3. **Sync Function**:
   - Fetches ALL articles from Appwrite (source of truth)
   - The deleted article is NOT in this list anymore ✅
   - Overwrites `server/data/blogArticles.json` with the new list ✅
   - Regenerates sitemap without the deleted article ✅

The sync IS working correctly. The issue is caching at different levels:
- Browser cache
- CDN cache  
- Service worker cache (if any)

## Verification Steps

### 1. Check Backend Logs
When you delete an article, you should see:
```
✅ Article deleted from Appwrite: [Article Title]
🔄 Triggered immediate cache sync
🔄 Starting blog data sync (Appwrite → JSON cache)...
📊 Found X articles in Appwrite
✅ Updated JSON cache with X articles
📊 Sync Summary:
   ➖ Deleted: 1
```

### 2. Check JSON Cache File
Look at `server/data/blogArticles.json` - the deleted article should NOT be there.

### 3. Check Blog Response
Open browser DevTools → Network tab → Refresh blog page
- Check the API response for `/api/blog`
- The deleted article should NOT be in the response

If it's NOT in the API response but still shows on the page, it's a browser cache issue.

## Recommended Setup

### For Development
```env
# blog/.env
VITE_USE_BACKEND=1
VITE_API_URL=http://localhost:4000/api
```

### For Production
```env
# Netlify environment variables for blog
VITE_USE_BACKEND=1
VITE_API_URL=https://your-backend-server.onrender.com/api
```

## Quick Fix Summary

1. **Immediate fix**: Hard refresh browser (Ctrl+F5)
2. **Long-term fix**: Configure proper cache headers in `netlify.toml`
3. **Best practice**: Use backend API mode with reasonable cache duration

## Testing Deletion

1. Delete an article in admin dashboard
2. Wait 5 seconds for sync to complete
3. Hard refresh the blog (Ctrl+F5)
4. Article should be gone

If article is still there after hard refresh:
- Check backend logs to confirm sync ran
- Check `server/data/blogArticles.json` to confirm article was removed
- Check if blog is using correct API URL
- Check if backend server is running and accessible

## Date Documented
November 22, 2025
