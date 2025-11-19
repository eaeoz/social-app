import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Article } from '../types/article';
import '../styles/ArticleCard.css';

interface ArticleCardProps {
  article: Article;
  index: number;
}

export default function ArticleCard({ article, index }: ArticleCardProps) {
  const parseTags = (tagsString: string): string[] => {
    try {
      return tagsString.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
    } catch {
      return [];
    }
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
      <Link to={`/article/${article.$id}`} className="article-card-link">
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
