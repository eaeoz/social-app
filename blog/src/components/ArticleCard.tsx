import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Calendar, User, Clock } from 'lucide-react';
import { Article } from '../types/article';
import '../styles/ArticleCard.css';

interface ArticleCardProps {
  article: Article;
  index: number;
}

export default function ArticleCard({ article, index }: ArticleCardProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const calculateReadTime = (content: string) => {
    const wordsPerMinute = 200;
    const words = content.split(/\s+/).length;
    const minutes = Math.ceil(words / wordsPerMinute);
    return `${minutes} min read`;
  };

  const parseTags = (tagsString: string): string[] => {
    try {
      return tagsString.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
    } catch {
      return [];
    }
  };

  const tags = parseTags(article.tags);

  return (
    <motion.div
      className="article-card"
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      whileHover={{ y: -5 }}
    >
      <Link to={`/article/${article.$id}`} className="article-link">
        {article.logo && (
          <div className="article-image">
            <img src={article.logo} alt={article.title} loading="lazy" />
          </div>
        )}
        
        <div className="article-content">
          <h2 className="article-title">{article.title}</h2>
          
          <p className="article-excerpt">{article.excerpt}</p>
          
          <div className="article-meta">
            <div className="meta-item">
              <User size={16} />
              <span>{article.author}</span>
            </div>
            <div className="meta-item">
              <Calendar size={16} />
              <span>{article.date}</span>
            </div>
            <div className="meta-item">
              <Clock size={16} />
              <span>{calculateReadTime(article.content)}</span>
            </div>
          </div>

          {tags.length > 0 && (
            <div className="article-tags">
              {tags.slice(0, 3).map((tag, idx) => (
                <span key={idx} className="tag">{tag}</span>
              ))}
            </div>
          )}
        </div>
      </Link>
    </motion.div>
  );
}
