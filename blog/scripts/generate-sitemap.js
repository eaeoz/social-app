import { writeFileSync, readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { config } from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
config({ path: join(__dirname, '..', '.env') });

const SITE_URL = process.env.VITE_SITE_URL || 'https://sedat.netlify.app';
const BLOG_ARTICLES_PATH = join(__dirname, '../../server/data/blogArticles.json');

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
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
}

// Parse tags and create tag slug
function parseAndSlugifyTags(tagsString) {
  try {
    let tags;
    
    // Try parsing as JSON array first
    if (typeof tagsString === 'string' && tagsString.startsWith('[')) {
      const parsed = JSON.parse(tagsString);
      tags = Array.isArray(parsed) ? parsed : [];
    } else if (Array.isArray(tagsString)) {
      tags = tagsString;
    } else if (typeof tagsString === 'string') {
      // Fallback to comma-separated
      tags = tagsString.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
    } else {
      return '';
    }
    
    // Use max 3 tags for URL
    return tags.slice(0, 3).map(tag => slugify(tag)).join('-');
  } catch {
    return '';
  }
}

// Generate slug from article using only title
function generateSlugFromArticle(article) {
  if (article.slug) {
    return article.slug;
  }
  
  return slugify(article.title || 'article');
}

// Load blog articles from local JSON file
function loadBlogArticles() {
  try {
    const articlesData = readFileSync(BLOG_ARTICLES_PATH, 'utf8');
    const articles = JSON.parse(articlesData);
    console.log(`✅ Loaded ${articles.length} articles from local file`);
    return articles;
  } catch (error) {
    console.warn('⚠️ Could not load blog articles:', error.message);
    console.log('📝 Generating sitemap with static pages only...');
    return [];
  }
}

function generateSitemap(articles) {
  const today = new Date().toISOString().split('T')[0];

  // Create article URLs with SEO-friendly structure using tags and title
  const articlePages = articles.map(article => {
    const slug = generateSlugFromArticle(article);
    const articleDate = article.date || today;
    
    return {
      path: `/article/${slug}`,
      lastmod: articleDate,
      priority: '0.8',
      changefreq: 'monthly'
    };
  });

  // Generate sitemap XML
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n';
  xml += '        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"\n';
  xml += '        xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9\n';
  xml += '        http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">\n';
  
  // Add section comments for better organization
  const sections = {
    '/': 'Homepage',
    '/about': 'Information Pages'
  };
  
  let currentSection = null;
  
  // Add static pages with section comments
  staticPages.forEach(page => {
    // Add section comment if it's a new section
    if (sections[page.path] && sections[page.path] !== currentSection) {
      xml += `  \n  <!-- ${sections[page.path]} -->\n`;
      currentSection = sections[page.path];
    }
    
    xml += '  <url>\n';
    xml += `    <loc>${SITE_URL}${page.path}</loc>\n`;
    xml += `    <lastmod>${today}</lastmod>\n`;
    xml += `    <changefreq>${page.changefreq}</changefreq>\n`;
    xml += `    <priority>${page.priority}</priority>\n`;
    xml += '  </url>\n';
  });
  
  // Add blog articles section (newest first)
  if (articlePages.length > 0) {
    xml += '  \n  <!-- Blog Articles -->\n';
    
    // Keep articles in original order (newest first)
    articlePages.forEach(article => {
      xml += '  <url>\n';
      xml += `    <loc>${SITE_URL}${article.path}</loc>\n`;
      xml += `    <lastmod>${article.lastmod}</lastmod>\n`;
      xml += `    <changefreq>${article.changefreq}</changefreq>\n`;
      xml += `    <priority>${article.priority}</priority>\n`;
      xml += '  </url>\n';
    });
  }
  
  xml += '\n</urlset>\n';

  const outputPath = join(__dirname, '..', 'public', 'sitemap.xml');
  writeFileSync(outputPath, xml);
  
  console.log('✅ Sitemap generated successfully!');
  console.log(`📊 Total URLs: ${staticPages.length + articlePages.length}`);
  console.log(`   - Static pages: ${staticPages.length}`);
  console.log(`   - Blog articles: ${articlePages.length}`);
  console.log(`🌐 Site URL: ${SITE_URL}`);
  console.log(`📅 Last modified: ${today}`);
  console.log(`📁 Location: public/sitemap.xml`);
}

function main() {
  console.log('🚀 Starting sitemap generation...');
  console.log(`🌐 Site URL: ${SITE_URL}`);
  console.log('📌 Using SEO format: /article/{title-slug}');
  
  const articles = loadBlogArticles();
  generateSitemap(articles);
}

main();
