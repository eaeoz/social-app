# Blog System Setup Guide

This guide explains how to set up and manage the blog system with Appwrite integration.

## 📋 Overview

The blog system stores articles in Appwrite database and syncs them automatically every hour from a JSON file. Articles are displayed in a modern, searchable interface with markdown support.

## 🔧 Prerequisites

- Appwrite account and project set up
- Appwrite credentials in `.env` file:
  - `APPWRITE_ENDPOINT`
  - `APPWRITE_PROJECT_ID`
  - `APPWRITE_API_KEY`

## 🚀 Initial Setup

### Step 1: Initialize Appwrite Collection

Run the initialization script to create the blog collection in Appwrite:

```bash
node server/utils/initializeBlogCollection.js
```

This script will:
- ✅ Create the `main` database (if it doesn't exist)
- ✅ Create the `blog_articles` collection
- ✅ Set up all required attributes (title, author, date, tags, logo, excerpt, content)
- ✅ Create indexes for efficient querying
- ✅ Set appropriate read/write permissions

### Step 2: Initial Data Sync

Run the sync script to populate Appwrite with the blog articles:

```bash
node server/utils/syncBlogData.js
```

This will:
- ✅ Read articles from `server/data/blogArticles.json`
- ✅ Upload them to Appwrite
- ✅ Display sync summary (created, updated, skipped)

### Step 3: Start the Server

The server will automatically:
- ✅ Sync blog data on startup
- ✅ Schedule hourly syncs at the top of every hour
- ✅ Serve blog articles via `/api/blog` endpoint

```bash
npm run server
# or
npm run dev
```

## 📝 Managing Blog Articles

### Adding New Articles

1. Open `server/data/blogArticles.json`
2. Add your new article following this format:

```json
{
  "id": "7",
  "title": "Your Article Title",
  "author": "Author Name",
  "date": "2024-03-20",
  "tags": ["tag1", "tag2", "tag3"],
  "logo": "🚀",
  "excerpt": "A brief summary of your article...",
  "content": "# Full Article Content\n\nYour markdown content here..."
}
```

3. The article will be automatically synced to Appwrite within the hour
4. Or manually sync: `node server/utils/syncBlogData.js`

### Editing Articles

1. Edit the article in `server/data/blogArticles.json`
2. Keep the same `id` to update the existing article
3. Changes sync automatically or run manual sync

### Deleting Articles

1. Remove the article from `server/data/blogArticles.json`
2. Manually delete from Appwrite console, or
3. The article will remain in Appwrite (manual cleanup needed)

## 🔄 Sync Behavior

### Automatic Sync
- Runs every hour on the hour
- Syncs from `server/data/blogArticles.json` to Appwrite
- Logs: Created, Updated, and Skipped counts

### Manual Sync
```bash
node server/utils/syncBlogData.js
```

### Sync Logic
- **New articles** (by `id`): Created in Appwrite
- **Existing articles** (matching `id`): Updated in Appwrite
- **Errors**: Logged and skipped (continues with remaining articles)

## 🌐 API Endpoints

### Get All Articles
```
GET /api/blog
```

Response:
```json
{
  "success": true,
  "articles": [
    {
      "id": "1",
      "title": "Article Title",
      "author": "Author Name",
      "date": "2024-03-15",
      "tags": ["tag1", "tag2"],
      "logo": "🚀",
      "excerpt": "Brief summary...",
      "content": "Full markdown content..."
    }
  ]
}
```

### Get Specific Article
```
GET /api/blog/:id
```

Response:
```json
{
  "success": true,
  "article": {
    "id": "1",
    "title": "Article Title",
    ...
  }
}
```

## 📊 Article Format

### Required Fields
- `id` (string): Unique identifier
- `title` (string): Article title (max 255 chars)
- `author` (string): Author name (max 100 chars)
- `date` (string): Publication date
- `tags` (array): List of tags
- `logo` (string): Emoji logo (max 10 chars)
- `excerpt` (string): Brief summary (max 500 chars)
- `content` (string): Full markdown content (max 50,000 chars)

### Markdown Support
The `content` field supports full markdown syntax:
- Headers: `# H1`, `## H2`, etc.
- **Bold**, *Italic*
- Lists (ordered and unordered)
- Links: `[text](url)`
- Code blocks: ` ```language ... ``` `
- Blockquotes: `> quote`
- And more!

## 🎨 Frontend Features

### Blog Modal
- Modern, animated interface
- Smooth transitions between list and article view
- ESC key to close
- Responsive design

### Search Functionality
- Minimum 3 characters to search
- Searches in: title, excerpt, author, tags, content
- Real-time filtering
- Clear button for quick reset

### Article Display
- Logo emoji header
- Tags with hover effects
- Author and date metadata
- Full markdown rendering
- Smooth collapse/expand animations

## 🔍 Troubleshooting

### Articles Not Loading

1. Check server logs for sync errors
2. Verify Appwrite credentials in `.env`
3. Ensure collection was initialized:
   ```bash
   node server/utils/initializeBlogCollection.js
   ```
4. Check Appwrite dashboard for data

### Sync Failing

1. Check `server/data/blogArticles.json` format
2. Verify Appwrite API key permissions
3. Check network connectivity
4. Review server logs for detailed errors

### Articles Not Updating

1. Ensure article `id` matches existing entry
2. Run manual sync to force update
3. Check Appwrite dashboard for actual data
4. Clear browser cache if frontend not updating

## 📁 File Structure

```
social-app/
├── server/
│   ├── data/
│   │   └── blogArticles.json       # Source of truth for articles
│   ├── routes/
│   │   └── blogRoutes.js           # API endpoints
│   ├── utils/
│   │   ├── initializeBlogCollection.js  # Collection setup
│   │   └── syncBlogData.js         # Sync utility
│   └── server.js                   # Includes cron job
└── client/
    └── src/
        └── components/
            └── Legal/
                ├── Blog.tsx         # React component
                └── Blog.css         # Styles
```

## 🔐 Security Considerations

- Blog articles are publicly readable
- Only server-side API key can write to Appwrite
- No admin panel for article management yet
- Edit articles by modifying JSON file
- Future: Add admin interface for CRUD operations

## 📈 Future Enhancements

Potential improvements:
- [ ] Admin panel for article management
- [ ] Rich text editor integration
- [ ] Image upload support
- [ ] Comments system
- [ ] Article categories
- [ ] View counters
- [ ] Related articles suggestions
- [ ] RSS feed generation

## 🆘 Support

For issues or questions:
1. Check server logs for detailed errors
2. Review Appwrite dashboard for data integrity
3. Verify environment variables are set correctly
4. Ensure all dependencies are installed

## ✅ Quick Checklist

- [ ] Appwrite credentials configured in `.env`
- [ ] Run `node server/utils/initializeBlogCollection.js`
- [ ] Run `node server/utils/syncBlogData.js`
- [ ] Start server with `npm run dev`
- [ ] Access blog from login page footer or home page header
- [ ] Verify articles load correctly
- [ ] Test search functionality
- [ ] Test article expand/collapse animations

---

**Congratulations!** Your blog system is now set up and ready to use! 🎉
