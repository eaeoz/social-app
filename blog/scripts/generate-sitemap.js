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

  // Create article URLs with SEO-friendly structure using title
  const articlePages = articles.map(article => {
    // Use existing slug if available, otherwise create from title
    let slug;
    if (article.slug) {
      slug = article.slug;
    } else if (article.title) {
      // Create SEO-friendly slug from title + id for uniqueness
      const titleSlug = slugify(article.title);
      slug = `${titleSlug}-${article.$id.substring(0, 8)}`;
    } else {
      // Fallback to just ID
      slug = article.$id;
    }
    
    const lastmod = article.$updatedAt || article.$createdAt || date;
    
    return {
      path: `/article/${slug}`,
      lastmod: new Date(lastmod).toISOString(),
      priority: '0.9', // High priority for content
      changefreq: 'weekly',
      title: article.title || 'Article'
    };
  });

  // Combine static pages with article pages
  const allPages = [...staticPages, ...articlePages];

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${allPages.map(page => `  <url>
    <loc>${SITE_URL}${page.path}</loc>
    <lastmod>${page.lastmod || date}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`).join('\n')}
</urlset>`;

  const outputPath = join(__dirname, '..', 'public', 'sitemap.xml');
  writeFileSync(outputPath, sitemap);
  
  console.log('✅ Sitemap generated successfully!');
  console.log(`📊 Total URLs: ${allPages.length}`);
  console.log(`   - Static pages: ${staticPages.length}`);
  console.log(`   - Article pages: ${articlePages.length}`);
  if (articlePages.length > 0) {
    console.log('\n📝 Article URLs:');
    articlePages.forEach(article => {
      console.log(`   - ${article.path} (${article.title})`);
    });
  }
  console.log(`\n📁 Location: public/sitemap.xml`);
}

async function main() {
  console.log('🚀 Starting sitemap generation...');
  console.log(`🌐 Site URL: ${SITE_URL}`);
  
  const articles = await fetchArticles();
  generateSitemap(articles);
}

main();
