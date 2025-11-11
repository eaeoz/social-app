import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const SITE_URL = 'https://netcify.netlify.app';
const OUTPUT_PATH = path.join(__dirname, '../public/sitemap.xml');

// Define your routes with their properties
const routes = [
  {
    path: '/',
    changefreq: 'daily',
    priority: 1.0,
    comment: 'Homepage'
  },
  {
    path: '/login',
    changefreq: 'monthly',
    priority: 0.8,
    comment: 'Authentication Pages'
  },
  {
    path: '/register',
    changefreq: 'monthly',
    priority: 0.8
  },
  {
    path: '/about',
    changefreq: 'monthly',
    priority: 0.7,
    comment: 'Legal Pages'
  },
  {
    path: '/contact',
    changefreq: 'monthly',
    priority: 0.7
  },
  {
    path: '/privacy',
    changefreq: 'monthly',
    priority: 0.6
  },
  {
    path: '/terms',
    changefreq: 'monthly',
    priority: 0.6
  }
];

// Generate sitemap XML
function generateSitemap() {
  const today = new Date().toISOString().split('T')[0];
  
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n';
  xml += '        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"\n';
  xml += '        xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9\n';
  xml += '        http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">\n';
  
  let currentSection = null;
  
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
  
  xml += '\n</urlset>\n';
  
  return xml;
}

// Write sitemap to file
function writeSitemap() {
  try {
    const sitemap = generateSitemap();
    fs.writeFileSync(OUTPUT_PATH, sitemap, 'utf8');
    console.log('✅ Sitemap generated successfully at:', OUTPUT_PATH);
    console.log(`📊 Total URLs: ${routes.length}`);
    console.log(`🌐 Site URL: ${SITE_URL}`);
    console.log(`📅 Last modified: ${new Date().toISOString().split('T')[0]}`);
  } catch (error) {
    console.error('❌ Error generating sitemap:', error);
    process.exit(1);
  }
}

// Run the script
writeSitemap();
