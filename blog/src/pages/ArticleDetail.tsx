import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { databases, config } from '../config/appwrite';
import { Article } from '../types/article';
import { Helmet } from 'react-helmet-async';
import { Calendar, User, Clock, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import '../styles/ArticleDetail.css';

export default function ArticleDetail() {
  const { id } = useParams<{ id: string }>();
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      fetchArticle(id);
    }
  }, [id]);

  const fetchArticle = async (articleId: string) => {
    try {
      setLoading(true);
      setError(null);

      const response = await databases.getDocument(
        config.databaseId,
        config.articlesCollectionId,
        articleId
      );

      setArticle(response as unknown as Article);
    } catch (err) {
      console.error('Error fetching article:', err);
      setError('Article not found or failed to load.');
    } finally {
      setLoading(false);
    }
  };

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

  if (loading) {
    return (
      <div className="article-detail-container">
        <div className="loading-container">
          <div className="loading" />
          <p>Loading article...</p>
        </div>
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="article-detail-container">
        <div className="error-container">
          <p>{error || 'Article not found'}</p>
          <Link to="/" className="back-link">
            <ArrowLeft size={20} />
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>{article.title} - {import.meta.env.VITE_SITE_NAME || "Sedat's Blog"}</title>
        <meta name="description" content={article.excerpt || article.content.substring(0, 160)} />
        <meta property="og:title" content={article.title} />
        <meta property="og:description" content={article.excerpt || article.content.substring(0, 160)} />
        {article.imageUrl && <meta property="og:image" content={article.imageUrl} />}
      </Helmet>

      <motion.div
        className="article-detail-container"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <Link to="/" className="back-link">
          <ArrowLeft size={20} />
          Back to Home
        </Link>

        <article className="article-detail">
          {article.imageUrl && (
            <div className="article-header-image">
              <img src={article.imageUrl} alt={article.title} />
            </div>
          )}

          <div className="article-header">
            {article.category && (
              <span className="article-category">{article.category}</span>
            )}
            
            <h1 className="article-title">{article.title}</h1>

            <div className="article-meta">
              <div className="meta-item">
                <User size={18} />
                <span>{article.author}</span>
              </div>
              <div className="meta-item">
                <Calendar size={18} />
                <span>{formatDate(article.$createdAt)}</span>
              </div>
              <div className="meta-item">
                <Clock size={18} />
                <span>{calculateReadTime(article.content)}</span>
              </div>
            </div>
          </div>

          <div 
            className="article-body"
            dangerouslySetInnerHTML={{ __html: article.content.replace(/\n/g, '<br />') }}
          />

          {article.tags && article.tags.length > 0 && (
            <div className="article-tags">
              <h3>Tags</h3>
              <div className="tags-list">
                {article.tags.map((tag, idx) => (
                  <span key={idx} className="tag">{tag}</span>
                ))}
              </div>
            </div>
          )}
        </article>
      </motion.div>
    </>
  );
}
