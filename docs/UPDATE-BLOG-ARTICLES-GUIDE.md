# Blog Articles Update Guide

## Problem Summary
When generating new articles from markdown files, they weren't appearing in the sitemap because:
1. The conversion script was outputting to the wrong location (`articles.json` in root)
2. The sitemap generator reads from `server/data/blogArticles.json`
3. This caused a disconnect between generated articles and the sitemap

## Solution Implemented
Updated `convert-docs-to-json.cjs` to:
- Output directly to `server/data/blogArticles.json`
- Merge with existing articles (no overwriting)
- Prevent duplicate articles based on title

## How to Update Blog Articles

### Step 1: Add New Markdown Files
Place your markdown documentation files in the `docs/` directory or subdirectories.

### Step 2: Convert Markdown to JSON
Run the conversion script from the root directory:
```bash
node convert-docs-to-json.cjs
```

This will:
- Scan all markdown files in the `docs/` directory
- Extract titles, summaries, and tags automatically
- Merge new articles with existing ones in `server/data/blogArticles.json`
- Avoid duplicates based on article titles

### Step 3: Regenerate Sitemaps
Regenerate sitemaps for both blog and client:
```bash
# Regenerate blog sitemap
cd blog
node scripts/generate-sitemap.js
cd ..

# Regenerate client sitemap
cd client
node scripts/generate-sitemap.js
cd ..
```

This will:
- Read all articles from `server/data/blogArticles.json`
- Generate complete sitemaps with all 106+ articles
- Output to `blog/public/sitemap.xml` and `client/public/sitemap.xml`

### Step 4: Verify Results
Check the output of both commands:
- Conversion script shows: `✓ Total articles: X`
- Sitemap script shows: `✓ Total URLs: X` (5 static pages + articles)

## Current Status
- **Total Articles**: 106 (as of Nov 22, 2025)
  - 6 manually created articles
  - 100 documentation articles from markdown
- **Sitemap URLs**: 111 total (5 static pages + 106 articles)

## Important Notes

### About Article Dates
The conversion script automatically assigns dates starting from a configured date and increments by 1 hour per article. This is configured in `convert-docs-to-json.cjs`:
```javascript
const startDate = new Date('2025-11-17T02:00:00+03:00');
```

### About Duplicate Prevention
The script prevents duplicates by checking article titles. If you need to update an article:
1. Delete it from `server/data/blogArticles.json` manually
2. Re-run the conversion script

### About Manual Articles
Your 6 manually created articles (from desktopapp) are preserved during the merge process. The conversion script only adds new articles, never removes existing ones.

## Troubleshooting

### Articles Not Appearing in Sitemap
1. Verify articles exist in `server/data/blogArticles.json`
2. Check that each article has required fields: `id`, `title`, `date`, `slug` (or title for slug generation)
3. Regenerate the sitemap

### Conversion Script Issues
1. Ensure markdown files exist in `docs/` directory
2. Check that `server/data/` directory exists
3. Verify Node.js can read/write to these locations

### Sitemap Generation Issues
1. Ensure `server/data/blogArticles.json` exists and is valid JSON
2. Check that the blog directory structure is intact
3. Verify the VITE_SITE_URL environment variable (defaults to https://sedat.netlify.app)

## File Locations
- Conversion Script: `convert-docs-to-json.cjs`
- Articles Data: `server/data/blogArticles.json`
- Blog Sitemap Generator: `blog/scripts/generate-sitemap.js`
- Client Sitemap Generator: `client/scripts/generate-sitemap.js`
- Generated Blog Sitemap: `blog/public/sitemap.xml`
- Generated Client Sitemap: `client/public/sitemap.xml`
- Markdown Docs: `docs/` directory (recursively scanned)

## Quick Commands Reference
```bash
# Convert markdown to JSON
node convert-docs-to-json.cjs

# Generate blog sitemap
cd blog && node scripts/generate-sitemap.js && cd ..

# Generate client sitemap
cd client && node scripts/generate-sitemap.js && cd ..

# All commands at once
node convert-docs-to-json.cjs && cd blog && node scripts/generate-sitemap.js && cd .. && cd client && node scripts/generate-sitemap.js && cd ..
