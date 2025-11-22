# Dynamic Sitemap Generation Guide

## Overview

The blog automatically generates a sitemap that includes both static pages and dynamic article routes fetched from Appwrite, with proper SEO structure.

## Features

✅ **Dynamic Article Routes** - Automatically fetches all articles from Appwrite
✅ **Proper SEO Structure** - Includes priority, changefreq, and lastmod for each URL
✅ **Enhanced XML Namespaces** - Supports news, xhtml, and image schemas
✅ **Automatic Updates** - Regenerates on every build
✅ **Individual Timestamps** - Each article uses its own update date

## Sitemap Structure

### Static Pages (5 URLs)

| Page | Priority | Change Frequency | Notes |
|------|----------|------------------|-------|
| `/` (Home) | 1.0 | daily | Highest priority - main landing page |
| `/about` | 0.8 | monthly | About page |
| `/contact` | 0.8 | monthly | Contact page |
| `/privacy` | 0.5 | yearly | Privacy policy |
| `/terms` | 0.5 | yearly | Terms of service |

### Dynamic Article Pages

Each article from Appwrite gets its own URL with:
- **Path**: `/article/{slug or id}`
- **Priority**: 0.9 (high priority for content)
- **Change Frequency**: weekly
- **Last Modified**: Uses article's $updatedAt or $createdAt timestamp

## How It Works

### 1. Script Location
```
blog/scripts/generate-sitemap.js
```

### 2. Fetches Articles from Appwrite
The script connects to your Appwrite database and fetches all articles:

```javascript
const response = await databases.listDocuments(
  databaseId,
  articlesCollectionId,
  [Query.orderDesc('$createdAt'), Query.limit(1000)]
);
```

### 3. Generates SEO-Optimized URLs
Each article URL includes:
- Full URL path
- Individual last modified date
- Appropriate priority (0.9 for content)
- Weekly change frequency

### 4. XML with Enhanced Namespaces
```xml
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
```

## Usage

### Manual Generation
```bash
npm run generate-sitemap
```

### Automatic Generation (on Build)
```bash
npm run build
```

The sitemap is automatically regenerated before every build, ensuring it's always up to date.

## Environment Variables Required

The script uses these environment variables from your `.env` file:

```env
VITE_SITE_URL=https://sedat.netlify.app
VITE_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
VITE_APPWRITE_PROJECT_ID=your_project_id
VITE_APPWRITE_DATABASE_ID=your_database_id
VITE_APPWRITE_ARTICLES_COLLECTION_ID=your_collection_id
```

## Output

The generated sitemap is saved to:
```
blog/public/sitemap.xml
```

This file is automatically included in your build and deployed to:
```
https://sedat.netlify.app/sitemap.xml
```

## SEO Benefits

1. **Search Engine Discovery** - Helps Google, Bing, etc. discover all your articles
2. **Proper Indexing** - Provides metadata for better indexing
3. **Content Freshness** - Uses individual article timestamps
4. **Priority Signals** - Indicates which pages are most important
5. **Update Frequency** - Tells crawlers how often to check for updates

## Troubleshooting

### No Articles in Sitemap

If articles aren't showing up:

1. **Check Environment Variables**
   ```bash
   # Make sure .env file exists with correct values
   cat blog/.env
   ```

2. **Verify Appwrite Connection**
   - Check if credentials are correct
   - Ensure database/collection IDs are valid
   - Verify network connectivity

3. **Run Script Manually**
   ```bash
   cd blog
   npm run generate-sitemap
   ```

### Wrong Site URL

Update `VITE_SITE_URL` in your `.env` file:
```env
VITE_SITE_URL=https://sedat.netlify.app
```

Then regenerate:
```bash
npm run generate-sitemap
```

## Example Output

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
  <!-- Static Pages -->
  <url>
    <loc>https://sedat.netlify.app/</loc>
    <lastmod>2025-11-19T12:50:22.541Z</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  
  <!-- Dynamic Article Pages -->
  <url>
    <loc>https://sedat.netlify.app/article/my-article-slug</loc>
    <lastmod>2025-11-19T10:30:15.123Z</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>
  <!-- More articles... -->
</urlset>
```

## Google Search Console

After deployment, submit your sitemap to Google Search Console:

1. Go to [Google Search Console](https://search.google.com/search-console)
2. Select your property
3. Navigate to "Sitemaps" in the left menu
4. Add new sitemap: `https://sedat.netlify.app/sitemap.xml`
5. Submit

## Best Practices

✅ **Regenerate Regularly** - The build script does this automatically
✅ **Keep Under 50,000 URLs** - Current script handles this well
✅ **Use Proper URLs** - Always use full URLs with protocol
✅ **Update Timestamps** - Use actual article modification dates
✅ **Submit to Search Engines** - Add to Google Search Console, Bing Webmaster

## Maintenance

The sitemap automatically:
- ✅ Adds new articles when published
- ✅ Updates timestamps when articles are modified
- ✅ Maintains proper priority and frequency
- ✅ Includes all static pages

No manual maintenance required!
