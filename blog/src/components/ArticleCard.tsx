import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Article } from '../types/article';
import '../styles/ArticleCard.css';

interface ArticleCardProps {
  article: Article;
  index: number;
}

// Convert title to SEO-friendly slug
function slugify(text: string): string {
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
function parseAndSlugifyTags(tagsString: string): string {
  try {
    const tags = tagsString.split(',')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0)
      .slice(0, 3); // Use max 3 tags for URL
    
    return tags.map(tag => slugify(tag)).join('-');
  } catch {
    return '';
  }
}

export default function ArticleCard({ article, index }: ArticleCardProps) {
  const parseTags = (tagsString: string): string[] => {
    try {
      return tagsString.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
    } catch {
      return [];
    }
  };

  // Generate SEO-friendly URL with tags and title
  const getArticleUrl = () => {
    // Use existing slug if available
    if (article.slug) {
      return `/article/${article.slug}`;
    }
    
    // Create SEO slug from tags + title
    const tagSlug = parseAndSlugifyTags(article.tags || '');
    const titleSlug = slugify(article.title || 'article');
    
    let slug: string;
    
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
    
    return `/article/${slug}`;
  };

  const tags = parseTags(article.tags);

  return (
    <motion.article
      className="blog-article-card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.05 }}
      whileHover={{ y: -8 }}
    >
      <Link to={getArticleUrl()} className="article-card-link">
        <div className="blog-article-header">
          <div className="blog-article-logo">{article.logo || '📝'}</div>
          <div className="blog-article-meta">
            <time className="blog-article-date">{article.date}</time>
            <span className="blog-article-author">By {article.author}</span>
          </div>
        </div>
        
        <h3 className="blog-article-title">{article.title}</h3>
        <p className="blog-article-excerpt">{article.excerpt}</p>
        
        {tags.length > 0 && (
          <div className="blog-article-tags">
            {tags.map((tag, idx) => (
              <span key={idx} className="blog-tag">{tag}</span>
            ))}
          </div>
        )}
        
        <div className="blog-article-footer">
          <span className="blog-read-more">
            Read more <span className="blog-arrow">→</span>
          </span>
        </div>
      </Link>
    </motion.article>
  );
}
