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

// Convert title to SEO-friendly slug
function slugify(text: string): string {
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
function parseAndSlugifyTags(tagsString: string): string {
  try {
    let tags: string[];
    
    // Try parsing as JSON array first
    if (tagsString.startsWith('[')) {
      const parsed = JSON.parse(tagsString);
      tags = Array.isArray(parsed) ? parsed : [];
    } else {
      // Fallback to comma-separated
      tags = tagsString.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
    }
    
    // Use max 3 tags for URL
    return tags.slice(0, 3).map(tag => slugify(tag)).join('-');
  } catch {
    return '';
  }
}

// Generate slug from article (same logic as ArticleCard)
function generateSlugFromArticle(article: any): string {
  if (article.slug) {
    return article.slug;
  }
  
  const tagSlug = parseAndSlugifyTags(article.tags || '');
  const titleSlug = slugify(article.title || 'article');
  
  let slug: string;
  if (tagSlug) {
    slug = `${tagSlug}-${titleSlug}`;
  } else {
    slug = titleSlug;
  }
  
  if (slug.length > 80) {
    slug = slug.substring(0, 80).replace(/-[^-]*$/, '');
  }
  
  return slug;
}

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

  const fetchArticle = async (slug: string) => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all articles and find by matching generated slug
      const response = await databases.listDocuments(
        config.databaseId,
        config.articlesCollectionId,
        [Query.limit(100)] // Fetch articles to search
      );

      // Find article where generated slug matches
      const matchedArticle = response.documents.find((doc: any) => {
        const generatedSlug = generateSlugFromArticle(doc);
        return generatedSlug === slug || doc.slug === slug;
      });

      if (matchedArticle) {
        setArticle(matchedArticle as unknown as Article);
      } else {
        // If no match found in first 100, try searching more
        const moreResponse = await databases.listDocuments(
          config.databaseId,
          config.articlesCollectionId,
          [Query.limit(1000)]
        );
        
        const foundArticle = moreResponse.documents.find((doc: any) => {
          const generatedSlug = generateSlugFromArticle(doc);
          return generatedSlug === slug || doc.slug === slug;
        });
        
        if (foundArticle) {
          setArticle(foundArticle as unknown as Article);
        } else {
          throw new Error('Article not found');
        }
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
      // Try parsing as JSON array first
      if (tagsString.startsWith('[')) {
        const parsed = JSON.parse(tagsString);
        return Array.isArray(parsed) ? parsed : [];
      }
      // Fallback to comma-separated
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
