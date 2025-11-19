import { writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { config } from 'dotenv';
import { Client, Databases, Query } from 'appwrite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
config({ path: join(__dirname, '..', '.env') });

const SITE_URL = process.env.VITE_SITE_URL || 'https://sedat.netlify.app';

// Static pages
const staticPages = [
  { path: '/', priority: '1.0', changefreq: 'daily' },
  { path: '/about', priority: '0.8', changefreq: 'monthly' },
  { path: '/contact', priority: '0.8', changefreq: 'monthly' },
  { path: '/privacy', priority: '0.5', changefreq: 'yearly' },
  { path: '/terms', priority: '0.5', changefreq: 'yearly' }
];

// Convert title to SEO-friendly slug
function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')           // Replace spaces with -
    .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
    .replace(/\-\-+/g, '-')         // Replace multiple - with single -
    .replace(/^-+/, '')             // Trim - from start of text
    .replace(/-+$/, '');            // Trim - from end of text
}

// Parse tags and create tag slug
function parseAndSlugifyTags(tagsString) {
  try {
    let tags;
    
    // Try parsing as JSON array first
    if (tagsString.startsWith('[')) {
      const parsed = JSON.parse(tagsString);
      tags = Array.isArray(parsed) ? parsed : [];
    } else {
      // Fallback to comma-separated
      tags = tagsString.split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);
    }
    
    // Use max 3 tags for URL
    return tags.slice(0, 3).map(tag => slugify(tag)).join('-');
  } catch {
    return '';
  }
}

async function fetchArticles() {
  try {
    // Initialize Appwrite client
    const client = new Client()
      .setEndpoint(process.env.VITE_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1')
      .setProject(process.env.VITE_APPWRITE_PROJECT_ID || '');

    const databases = new Databases(client);

    // Fetch all articles
    const response = await databases.listDocuments(
      process.env.VITE_APPWRITE_DATABASE_ID || '',
      process.env.VITE_APPWRITE_ARTICLES_COLLECTION_ID || '',
      [
        Query.orderDesc('$createdAt'),
        Query.limit(1000) // Get all articles
      ]
    );

    console.log(`✅ Fetched ${response.documents.length} articles from Appwrite`);
    return response.documents;
  } catch (error) {
    console.error('⚠️ Error fetching articles from Appwrite:', error.message);
    console.log('📝 Generating sitemap with static pages only...');
    return [];
  }
}

function generateSitemap(articles) {
  const date = new Date().toISOString();

  // Create article URLs with SEO-friendly structure using tags and title
  const articlePages = articles.map(article => {
    let slug;
    
    if (article.slug) {
      // Use custom slug if available
      slug = article.slug;
    } else {
      // Create SEO slug from tags + title
      const tagSlug = parseAndSlugifyTags(article.tags || '');
      const titleSlug = slugify(article.title || 'article');
      
      // Combine: tags-title (e.g., react-javascript-my-article-title)
      if (tagSlug) {
        slug = `${tagSlug}-${titleSlug}`;
      } else {
        slug = titleSlug;
      }
      
      // Limit total length to keep URLs reasonable
      if (slug.length > 80) {
        slug = slug.substring(0, 80).replace(/-[^-]*$/, ''); // Cut at word boundary
      }
    }
    
    const lastmod = article.$updatedAt || article.$createdAt || date;
    
    return {
      path: `/article/${slug}`,
      lastmod: new Date(lastmod).toISOString(),
      priority: '0.9',
      changefreq: 'weekly',
      title: article.title || 'Article',
      tags: article.tags || '',
      id: article.$id
    };
  });

  // Combine static pages with article pages
  const allPages = [...staticPages, ...articlePages];

  // Generate sitemap with proper formatting (no whitespace in URLs)
  const urlEntries = allPages.map(page => {
    const fullUrl = `${SITE_URL}${page.path}`;
    return `  <url>
    <loc>${fullUrl}</loc>
    <lastmod>${page.lastmod || date}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`;
  }).join('\n');

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${urlEntries}
</urlset>`;

  const outputPath = join(__dirname, '..', 'public', 'sitemap.xml');
  writeFileSync(outputPath, sitemap);
  
  console.log('✅ Sitemap generated successfully!');
  console.log(`📊 Total URLs: ${allPages.length}`);
  console.log(`   - Static pages: ${staticPages.length}`);
  console.log(`   - Article pages: ${articlePages.length}`);
  if (articlePages.length > 0) {
    console.log('\n📝 Article URLs (Tags + Title format):');
    articlePages.forEach(article => {
      const tagsPart = article.tags ? `[${article.tags}]` : '[no tags]';
      console.log(`   - ${article.path}`);
      console.log(`     Title: "${article.title}" ${tagsPart}`);
      console.log(`     ID: ${article.id}`);
    });
  }
  console.log(`\n📁 Location: public/sitemap.xml`);
}

async function main() {
  console.log('🚀 Starting sitemap generation...');
  console.log(`🌐 Site URL: ${SITE_URL}`);
  console.log('📌 Using SEO format: /article/{tags}-{title}');
  
  const articles = await fetchArticles();
  generateSitemap(articles);
}

main();
