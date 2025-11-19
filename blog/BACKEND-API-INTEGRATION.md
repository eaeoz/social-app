# Blog Backend API Integration Guide

## Overview

The blog now supports **optional backend API integration** for fetching articles. This allows you to use your backend server (which caches Appwrite data) instead of directly connecting to Appwrite from the frontend.

## Benefits of Using Backend API

✅ **Better Performance**: Backend server caches Appwrite data, reducing API calls and improving load times  
✅ **Reduced Costs**: Fewer direct Appwrite API calls can help stay within free tier limits  
✅ **Centralized Data**: Same cached data used across your entire application (client, admin, blog)  
✅ **Automatic Sync**: Backend automatically syncs with Appwrite on a schedule (configurable)  
✅ **Fallback Support**: Blog still works if backend is temporarily unavailable (uses Appwrite directly)

## Configuration

### Environment Variables

Add these variables to your `blog/.env` file:

```env
# Backend API Configuration
VITE_USE_BACKEND=1
VITE_API_URL=https://social-app-5hge.onrender.com/api
```

### Options

- **`VITE_USE_BACKEND`**: 
  - Set to `1` to use backend API (cached data)
  - Set to `0` or leave empty to use Appwrite directly
  
- **`VITE_API_URL`**: 
  - Your backend server URL
  - Example: `https://your-backend.onrender.com/api`

## How It Works

### Architecture

```
┌─────────────┐     ┌──────────────┐     ┌──────────┐
│   Blog      │────▶│  Backend     │────▶│ Appwrite │
│  Frontend   │     │   Server     │     │ Database │
└─────────────┘     └──────────────┘     └──────────┘
                    (Cached Data)
```

When `USE_BACKEND=1`:
1. Blog requests articles from backend API endpoint `/blog`
2. Backend returns cached data (updated via scheduled sync)
3. Blog displays articles to users

When `USE_BACKEND=0`:
1. Blog directly queries Appwrite database
2. Articles are fetched in real-time
3. Blog displays articles to users

### Backend API Endpoints Used

The blog uses these backend API endpoints:

- **`GET /api/blog`** - Get all blog articles (cached)
  - Returns: `{ success: true, articles: [...] }`
  - Used by: Home page (article list)
  
- **`GET /api/blog/:id`** - Get specific article by ID (cached)
  - Returns: `{ success: true, article: {...} }`
  - Used by: Article detail pages

### Data Sync

The backend server automatically syncs with Appwrite:

- **Sync Schedule**: Configurable in admin dashboard (default: every minute)
- **Manual Sync**: Admin can trigger manual sync via admin dashboard
- **Auto-Sync on Changes**: When admin creates/updates/deletes articles

## Implementation Details

### Modified Files

1. **`blog/src/pages/Home.tsx`**
   - Added conditional logic to check `USE_BACKEND` flag
   - Fetches from backend API when enabled
   - Falls back to Appwrite when disabled

2. **`blog/src/pages/ArticleDetail.tsx`**
   - Added conditional logic to check `USE_BACKEND` flag
   - Fetches from backend API when enabled
   - Falls back to Appwrite when disabled

### Code Example

```typescript
// Check if we should use backend API
const USE_BACKEND = import.meta.env.VITE_USE_BACKEND === '1';
const API_URL = import.meta.env.VITE_API_URL || 'https://social-app-5hge.onrender.com/api';

if (USE_BACKEND) {
  // Fetch from backend (cached data)
  const response = await fetch(`${API_URL}/blog`);
  const data = await response.json();
  // Use data.articles
} else {
  // Fetch directly from Appwrite
  const response = await databases.listDocuments(...);
  // Use response.documents
}
```

## Setup Instructions

### Step 1: Configure Environment Variables

Edit `blog/.env`:

```env
USE_BACKEND=1
VITE_API_URL=https://social-app-5hge.onrender.com/api
```

### Step 2: Ensure Backend Server is Running

Make sure your backend server is deployed and running:
- Render: `https://social-app-5hge.onrender.com`
- Railway: Your Railway deployment URL
- Local: `http://localhost:5000/api`

### Step 3: Test the Integration

1. Start your blog development server:
   ```bash
   cd blog
   npm run dev
   ```

2. Open browser console and check for logs:
   - `📡 Fetching articles from backend API (cached)...` = Using backend
   - `📡 Fetching articles directly from Appwrite...` = Using Appwrite

3. Verify articles load correctly on:
   - Home page (`/`)
   - Article detail pages (`/article/[slug]`)

### Step 4: Deploy

When deploying to Netlify, add environment variables in Netlify dashboard:

1. Go to: **Site Settings** → **Environment Variables**
2. Add:
   - `VITE_USE_BACKEND` = `1`
   - `VITE_API_URL` = `https://social-app-5hge.onrender.com/api`

## Comparison: Backend API vs Direct Appwrite

| Feature | Backend API (USE_BACKEND=1) | Direct Appwrite (USE_BACKEND=0) |
|---------|----------------------------|----------------------------------|
| **Performance** | ⚡ Faster (cached data) | 🐌 Slower (real-time queries) |
| **API Calls** | 📉 Minimal | 📈 Every page load |
| **Data Freshness** | 🔄 Sync interval (e.g., 1 min) | ⚡ Real-time |
| **Backend Required** | ✅ Yes | ❌ No |
| **Cost** | 💰 Lower | 💰 Higher (more API calls) |
| **Setup Complexity** | 🔧 Medium | 🔧 Simple |

## Troubleshooting

### Articles Not Loading

**Issue**: Blog shows "Failed to load articles"

**Solutions**:
1. Check backend server is running and accessible
2. Verify `VITE_API_URL` is correct in `.env`
3. Check browser console for error messages
4. Try switching to direct Appwrite temporarily (`USE_BACKEND=0`)

### Outdated Articles

**Issue**: New articles don't appear immediately

**Cause**: Backend cache hasn't synced yet

**Solutions**:
1. Wait for next automatic sync (check sync schedule in admin dashboard)
2. Trigger manual sync from admin dashboard
3. Articles appear immediately after admin creates/updates them (auto-sync on change)

### Backend Server Timeout

**Issue**: Backend is slow or times out (e.g., Render free tier)

**Solutions**:
1. Backend automatically wakes up on first request
2. Initial load may be slow (15-30 seconds on cold start)
3. Subsequent loads will be fast (cached)
4. Consider upgrading backend hosting plan for always-on service

## Similar Implementation

This implementation is **identical to how the client login page works**:

```typescript
// Client Login Page (client/src/components/Auth/Login.tsx)
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

// Blog Pages (blog/src/pages/Home.tsx)
const USE_BACKEND = import.meta.env.VITE_USE_BACKEND === '1';
const API_URL = import.meta.env.VITE_API_URL || 'https://social-app-5hge.onrender.com/api';
```

Both use the same backend server and API endpoints for consistency.

## Best Practices

1. **Production**: Use `USE_BACKEND=1` for better performance
2. **Development**: Use `USE_BACKEND=0` for real-time data during testing
3. **Backend Maintenance**: Keep `USE_BACKEND=0` as fallback during backend updates
4. **Monitoring**: Check backend sync logs in admin dashboard regularly

## Related Documentation

- [Blog Setup Guide](./BLOG-SETUP-GUIDE.md)
- [Why Blog Changes Appear Immediately](./WHY-BLOG-CHANGES-APPEAR-IMMEDIATELY.md)
- [Admin Reads Directly from Appwrite](./ADMIN-READS-DIRECTLY-FROM-APPWRITE.md)
- [Render Backend Deployment](./RENDER-BACKEND-ONLY.md)

## Summary

The blog now has flexible data fetching:
- ✅ **Backend API** (recommended): Fast, cached, cost-effective
- ✅ **Direct Appwrite** (fallback): Real-time, simpler setup

Simply set `USE_BACKEND=1` in your `.env` file to enable backend API integration!
