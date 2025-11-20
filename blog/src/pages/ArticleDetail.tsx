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

// Check if we should use backend API instead of Appwrite
const USE_BACKEND = import.meta.env.VITE_USE_BACKEND === '1';
const API_URL = import.meta.env.VITE_API_URL || 'https://social-app-5hge.onrender.com/api';

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

// Generate slug from article using only title (matches sitemap generation)
function generateSlugFromArticle(article: any): string {
  if (article.slug) {
    return article.slug;
  }
  
  return slugify(article.title || 'article');
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

      if (USE_BACKEND) {
        // Fetch from backend server (cached data from Appwrite)
        console.log('📡 Fetching articles from backend API (cached)...');
        const response = await fetch(`${API_URL}/blog`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch articles from backend');
        }
        
        const data = await response.json();
        
        if (data.success && data.articles) {
          // Map backend response and find matching article by slug
          const articles = data.articles.map((article: any) => ({
            $id: article.id,
            articleId: article.id,
            title: article.title,
            author: article.author,
            date: article.date,
            tags: typeof article.tags === 'string' ? article.tags : JSON.stringify(article.tags),
            logo: article.logo,
            excerpt: article.excerpt,
            content: article.content,
            slug: article.slug
          }));
          
          // Find article where generated slug matches
          const matchedArticle = articles.find((doc: any) => {
            const generatedSlug = generateSlugFromArticle(doc);
            return generatedSlug === slug || doc.slug === slug;
          });
          
          if (matchedArticle) {
            setArticle(matchedArticle as unknown as Article);
            console.log(`✅ Found article from backend: ${matchedArticle.title}`);
          } else {
            throw new Error('Article not found');
          }
        } else {
          throw new Error('Invalid response from backend');
        }
      } else {
        // Fetch directly from Appwrite
        console.log('📡 Fetching article directly from Appwrite...');
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
          console.log(`✅ Found article from Appwrite: ${matchedArticle.title}`);
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
            console.log(`✅ Found article from Appwrite (extended search): ${foundArticle.title}`);
          } else {
            throw new Error('Article not found');
          }
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
