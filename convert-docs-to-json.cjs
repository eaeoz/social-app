const fs = require('fs');
const path = require('path');

// Starting date: Last Monday at 02:00 (adjusted for timezone)
const startDate = new Date('2025-11-17T02:00:00+03:00');

// Tag mapping based on content analysis
const tagMapping = {
  'mongodb': ['database', 'mongodb', 'backend', 'setup'],
  'security': ['security', 'authentication', 'protection', 'best-practices'],
  'deployment': ['deployment', 'production', 'hosting', 'devops'],
  'docker': ['docker', 'containers', 'deployment'],
  'netlify': ['netlify', 'frontend', 'hosting', 'deployment'],
  'render': ['render', 'backend', 'hosting', 'deployment'],
  'railway': ['railway', 'backend', 'hosting', 'deployment'],
  'email': ['email', 'smtp', 'verification', 'communication'],
  'google': ['google', 'oauth', 'analytics', 'adsense', 'integration'],
  'oauth': ['oauth', 'authentication', 'google', 'social-login'],
  'jwt': ['jwt', 'authentication', 'tokens', 'security'],
  'session': ['session', 'authentication', 'timeout', 'security'],
  'admin': ['admin', 'dashboard', 'management', 'administration'],
  'blog': ['blog', 'cms', 'content', 'articles'],
  'mobile': ['mobile', 'react-native', 'ios', 'android'],
  'calling': ['calling', 'webrtc', 'video', 'audio', 'communication'],
  'setup': ['setup', 'installation', 'configuration', 'guide'],
  'api': ['api', 'backend', 'rest', 'integration'],
  'frontend': ['frontend', 'react', 'ui', 'client'],
  'backend': ['backend', 'server', 'nodejs', 'api'],
  'database': ['database', 'mongodb', 'data', 'storage'],
  'seo': ['seo', 'optimization', 'search-engine', 'marketing'],
  'recaptcha': ['recaptcha', 'security', 'bot-protection', 'google'],
  'architecture': ['architecture', 'design', 'system', 'structure'],
  'testing': ['testing', 'qa', 'verification', 'validation'],
  'appwrite': ['appwrite', 'backend', 'baas', 'cloud'],
  'socket': ['socket', 'websocket', 'real-time', 'communication'],
  'chat': ['chat', 'messaging', 'real-time', 'communication'],
  'user': ['user', 'profile', 'management', 'account'],
  'rate-limit': ['rate-limiting', 'security', 'throttling', 'protection'],
  'cors': ['cors', 'security', 'api', 'cross-origin'],
  'headers': ['headers', 'security', 'http', 'configuration'],
  'csp': ['csp', 'security', 'content-security-policy', 'protection'],
  'backup': ['backup', 'data', 'recovery', 'maintenance'],
  'cleanup': ['cleanup', 'maintenance', 'optimization', 'database'],
  'sound': ['sound', 'audio', 'notifications', 'ui'],
  'notification': ['notification', 'alerts', 'real-time', 'ui'],
  'report': ['report', 'moderation', 'content', 'management'],
  'nsfw': ['nsfw', 'moderation', 'content-filter', 'ai'],
  'profanity': ['profanity', 'filter', 'moderation', 'content'],
  'password': ['password', 'authentication', 'security', 'recovery'],
  'verification': ['verification', 'email', 'authentication', 'security'],
  'room': ['room', 'chat', 'group', 'messaging'],
  'private': ['private', 'chat', 'messaging', 'direct-message'],
  'photo': ['photo', 'image', 'editing', 'media'],
  'dropbox': ['dropbox', 'storage', 'cloud', 'integration'],
  'supabase': ['supabase', 'backend', 'database', 'backup'],
  'sitemap': ['sitemap', 'seo', 'xml', 'search-engine'],
  'analytics': ['analytics', 'tracking', 'google', 'metrics'],
  'gtm': ['gtm', 'google-tag-manager', 'tracking', 'analytics'],
  'accessibility': ['accessibility', 'a11y', 'ui', 'usability'],
  'windows': ['windows', 'desktop', 'electron', 'app'],
  'electron': ['electron', 'desktop', 'windows', 'app']
};

function extractTags(filename, content) {
  const tags = new Set(['documentation', 'guide']);
  const lowerContent = content.toLowerCase();
  const lowerFilename = filename.toLowerCase();
  
  // Check filename and content for keywords
  Object.keys(tagMapping).forEach(keyword => {
    if (lowerFilename.includes(keyword) || lowerContent.includes(keyword)) {
      tagMapping[keyword].forEach(tag => tags.add(tag));
    }
  });
  
  return Array.from(tags).slice(0, 8); // Limit to 8 tags
}

function extractTitle(content, filename) {
  // Try to find the first # heading
  const lines = content.split('\n');
  for (let line of lines) {
    line = line.trim();
    if (line.startsWith('# ')) {
      return line.substring(2).trim();
    }
  }
  
  // Fallback: Use filename
  return filename
    .replace(/\.md$/, '')
    .replace(/-/g, ' ')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

function extractSummary(content) {
  const lines = content.split('\n');
  let summary = '';
  let foundHeading = false;
  
  for (let line of lines) {
    line = line.trim();
    
    // Skip first heading
    if (line.startsWith('# ') && !foundHeading) {
      foundHeading = true;
      continue;
    }
    
    // Skip second level headings and below
    if (line.startsWith('#')) {
      continue;
    }
    
    // Get first meaningful paragraph
    if (line.length > 20 && !line.startsWith('```') && !line.startsWith('|')) {
      summary = line;
      break;
    }
  }
  
  // Truncate if too long
  if (summary.length > 200) {
    summary = summary.substring(0, 197) + '...';
  }
  
  return summary || 'Comprehensive guide and documentation';
}

function getAllMarkdownFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      getAllMarkdownFiles(filePath, fileList);
    } else if (file.endsWith('.md')) {
      fileList.push(filePath);
    }
  });
  
  return fileList;
}

function convertMarkdownToArticles() {
  const docsDir = path.join(__dirname, 'docs');
  const markdownFiles = getAllMarkdownFiles(docsDir);
  const articles = [];
  
  console.log(`Found ${markdownFiles.length} markdown files`);
  
  markdownFiles.forEach((filePath, index) => {
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const relativePath = path.relative(docsDir, filePath);
      const filename = path.basename(filePath);
      
      // Calculate date (starting from last Monday 02:00, add 1 hour for each article)
      const articleDate = new Date(startDate);
      articleDate.setHours(articleDate.getHours() + index);
      
      const title = extractTitle(content, filename);
      const summary = extractSummary(content);
      const tags = extractTags(filename, content);
      
      // Format date as YYYY-MM-DD for the date field
      const dateStr = articleDate.toISOString().split('T')[0];
      
      const article = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        title: title,
        author: 'Documentation Team',
        date: dateStr,
        tags: tags,
        logo: '📝',
        excerpt: summary,
        content: content,
        $id: Math.random().toString(36).substr(2, 20) + Math.random().toString(36).substr(2, 4),
        $createdAt: articleDate.toISOString(),
        $updatedAt: articleDate.toISOString()
      };
      
      articles.push(article);
      console.log(`✓ Converted: ${title}`);
    } catch (error) {
      console.error(`✗ Error processing ${filePath}:`, error.message);
    }
  });
  
  // Sort by date
  articles.sort((a, b) => new Date(a.date) - new Date(b.date));
  
  // Write to JSON file
  const outputPath = path.join(__dirname, 'articles.json');
  fs.writeFileSync(outputPath, JSON.stringify(articles, null, 2), 'utf-8');
  
  console.log(`\n✓ Successfully converted ${articles.length} articles to ${outputPath}`);
  console.log(`✓ Date range: ${articles[0].date} to ${articles[articles.length - 1].date}`);
}

// Run the conversion
convertMarkdownToArticles();
