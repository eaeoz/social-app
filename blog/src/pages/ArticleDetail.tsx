import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { databases, config } from '../config/appwrite';
import { Article } from '../types/article';
import { Helmet } from 'react-helmet-async';
import { ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import { Query } from 'appwrite';
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

  const fetchArticle = async (slugOrId: string) => {
    try {
      setLoading(true);
      setError(null);

      // First, try to fetch by document ID (for backward compatibility)
      // Extract potential ID from slug (last 8 chars after last dash)
      let articleId = slugOrId;
      
      // If it contains a dash, it might be a slug with ID at the end
      if (slugOrId.includes('-')) {
        const parts = slugOrId.split('-');
        const potentialId = parts[parts.length - 1];
        
        // Check if the last part looks like an Appwrite ID (alphanumeric, 8+ chars)
        if (potentialId.length >= 8 && /^[a-z0-9]+$/i.test(potentialId)) {
          articleId = potentialId;
        }
      }

      try {
        // Try direct ID fetch first
        const response = await databases.getDocument(
          config.databaseId,
          config.articlesCollectionId,
          articleId
        );
        setArticle(response as unknown as Article);
        return;
      } catch (directFetchError) {
        // If direct fetch fails, try searching by slug field
        try {
          const searchResponse = await databases.listDocuments(
            config.databaseId,
            config.articlesCollectionId,
            [Query.equal('slug', slugOrId), Query.limit(1)]
          );
          
          if (searchResponse.documents.length > 0) {
            setArticle(searchResponse.documents[0] as unknown as Article);
            return;
          }
        } catch (slugSearchError) {
          // If slug search also fails, continue to error
        }
        
        // If both methods fail, show error
        throw new Error('Article not found');
      }
    } catch (err) {
      console.error('Error fetching article:', err);
      setError('Article not found or failed to load.');
    } finally {
      setLoading(false);
    }
  };

  const parseTags = (tagsString: string): string[] => {
    try {
      return tagsString.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
    } catch {
      return [];
    }
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

  const tags = parseTags(article.tags);

  return (
    <>
      <Helmet>
        <title>{article.title} - {import.meta.env.VITE_SITE_NAME || "Sedat's Blog"}</title>
        <meta name="description" content={article.excerpt} />
        <meta property="og:title" content={article.title} />
        <meta property="og:description" content={article.excerpt} />
        <meta property="og:type" content="article" />
        <meta name="author" content={article.author} />
        <meta name="keywords" content={tags.join(', ')} />
      </Helmet>

      <motion.div
        className="blog-article-view"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <Link to="/" className="blog-article-close" title="Back to Home">
          ×
        </Link>
        
        <div className="blog-article-content">
          <div className="blog-article-header-full">
            <div className="blog-article-logo-large">{article.logo || '📝'}</div>
            
            {tags.length > 0 && (
              <div className="blog-article-tags-full">
                {tags.map((tag, idx) => (
                  <span key={idx} className="blog-tag">{tag}</span>
                ))}
              </div>
            )}
            
            <h1 className="blog-article-title-full">{article.title}</h1>
            
            <div className="blog-article-meta-full">
              <time className="blog-article-date">{article.date}</time>
              <span className="blog-meta-separator">•</span>
              <span className="blog-article-author">By {article.author}</span>
            </div>
          </div>
          
          <div className="blog-article-body markdown-content">
            <ReactMarkdown>
              {article.content}
            </ReactMarkdown>
          </div>
        </div>
      </motion.div>
    </>
  );
}
