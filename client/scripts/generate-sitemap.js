import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const SITE_URL = 'https://netcify.netlify.app';
const OUTPUT_PATH = path.join(__dirname, '../public/sitemap.xml');
const BLOG_ARTICLES_PATH = path.join(__dirname, '../../server/data/blogArticles.json');

// Helper function to generate SEO-friendly URL from title
function generateSeoUrl(title) {
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-')     // Replace spaces with hyphens
    .replace(/-+/g, '-')      // Replace multiple hyphens with single hyphen
    .trim();
}

// Define your routes with their properties
const routes = [
  {
    path: '/',
    changefreq: 'daily',
    priority: 1.0,
    comment: 'Homepage'
  },
  {
    path: '/about',
    changefreq: 'monthly',
    priority: 0.8,
    comment: 'Information Pages'
  },
  {
    path: '/contact',
    changefreq: 'monthly',
    priority: 0.8,
    comment: 'Information Pages'
  },
  {
    path: '/privacy',
    changefreq: 'monthly',
    priority: 0.8,
    comment: 'Information Pages'
  },
  {
    path: '/terms',
    changefreq: 'monthly',
    priority: 0.8,
    comment: 'Information Pages'
  }
];

// Load blog articles
function loadBlogArticles() {
  try {
    const articlesData = fs.readFileSync(BLOG_ARTICLES_PATH, 'utf8');
    return JSON.parse(articlesData);
  } catch (error) {
    console.warn('⚠️ Could not load blog articles:', error.message);
    return [];
  }
}

// Generate sitemap XML
function generateSitemap() {
  const today = new Date().toISOString().split('T')[0];
  const articles = loadBlogArticles();
  
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n';
  xml += '        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"\n';
  xml += '        xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9\n';
  xml += '        http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">\n';
  
  let currentSection = null;
  
  // Add regular routes
  routes.forEach(route => {
    // Add section comment if it's a new section
    if (route.comment && route.comment !== currentSection) {
      xml += `  \n  <!-- ${route.comment} -->\n`;
      currentSection = route.comment;
    }
    
    xml += '  <url>\n';
    xml += `    <loc>${SITE_URL}${route.path}</loc>\n`;
    xml += `    <lastmod>${today}</lastmod>\n`;
    xml += `    <changefreq>${route.changefreq}</changefreq>\n`;
    xml += `    <priority>${route.priority}</priority>\n`;
    xml += '  </url>\n';
  });
  
  // Add blog articles section
  if (articles.length > 0) {
    xml += '  \n  <!-- Blog Articles -->\n';
    
    articles.forEach(article => {
      const seoUrl = generateSeoUrl(article.title);
      const articleDate = article.date || today;
      
      xml += '  <url>\n';
      xml += `    <loc>${SITE_URL}/posts/${seoUrl}</loc>\n`;
      xml += `    <lastmod>${articleDate}</lastmod>\n`;
      xml += '    <changefreq>monthly</changefreq>\n';
      xml += '    <priority>0.8</priority>\n';
      xml += '  </url>\n';
    });
  }
  
  xml += '\n</urlset>\n';
  
  return xml;
}

// Write sitemap to file
function writeSitemap() {
  try {
    const articles = loadBlogArticles();
    const sitemap = generateSitemap();
    fs.writeFileSync(OUTPUT_PATH, sitemap, 'utf8');
    console.log('✅ Sitemap generated successfully at:', OUTPUT_PATH);
    console.log(`📊 Total URLs: ${routes.length + articles.length}`);
    console.log(`   - Static routes: ${routes.length}`);
    console.log(`   - Blog articles: ${articles.length}`);
    console.log(`🌐 Site URL: ${SITE_URL}`);
    console.log(`📅 Last modified: ${new Date().toISOString().split('T')[0]}`);
  } catch (error) {
    console.error('❌ Error generating sitemap:', error);
    process.exit(1);
  }
}

// Run the script
writeSitemap();
