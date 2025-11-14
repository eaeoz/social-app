import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import './Blog.css';
import './Legal.css';

// Helper function to generate SEO URL from title (same as in sitemap script)
function generateSeoUrl(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-')     // Replace spaces with hyphens
    .replace(/-+/g, '-')      // Replace multiple hyphens with single hyphen
    .trim();
}

interface BlogArticle {
  id: string;
  title: string;
  date: string;
  author: string;
  tags: string[];
  content: string;
  excerpt: string;
  logo: string;
}

function BlogArticle() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [article, setArticle] = useState<BlogArticle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchArticle = async () => {
      try {
        setLoading(true);
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000';
        const response = await fetch(`${apiUrl}/blog`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch blog articles');
        }
        
        const data = await response.json();
        if (data.success && data.articles) {
          // Find article by matching SEO URL
          const foundArticle = data.articles.find((a: BlogArticle) => 
            generateSeoUrl(a.title) === slug
          );
          
          if (foundArticle) {
            setArticle(foundArticle);
          } else {
            setError('Article not found');
          }
        } else {
          throw new Error('Invalid response format');
        }
      } catch (err) {
        console.error('Error fetching article:', err);
        setError('Failed to load article. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      fetchArticle();
    }
  }, [slug]);

  if (loading) {
    return (
      <div className="legal-modal-overlay">
        <div className="legal-modal-content blog-modal-content">
          <div className="legal-modal-body">
            <div style={{ textAlign: 'center', padding: '80px 40px', color: 'var(--text-secondary)' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📚</div>
              <div style={{ fontSize: '1.2rem' }}>Loading article...</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="legal-modal-overlay">
        <div className="legal-modal-content blog-modal-content">
          <div className="legal-modal-header blog-header">
            <div className="legal-header-content">
              <span className="legal-icon">⚠️</span>
              <h2>Article Not Found</h2>
            </div>
            <button 
              className="legal-modal-close" 
              onClick={() => navigate('/')}
              aria-label="Go back"
            >
              ×
            </button>
          </div>
          <div className="legal-modal-body">
            <div style={{ textAlign: 'center', padding: '80px 40px', color: 'var(--text-secondary)' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>😕</div>
              <div style={{ fontSize: '1.2rem', marginBottom: '2rem' }}>
                {error || 'The article you\'re looking for could not be found.'}
              </div>
              <button
                onClick={() => navigate('/')}
                style={{
                  padding: '12px 24px',
                  fontSize: '1rem',
                  background: 'var(--primary-color)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: '500'
                }}
              >
                Go to Home
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="legal-modal-overlay">
      <div className="legal-modal-content blog-modal-content article-expanded">
        <div className="blog-article-view">
          <button
            className="blog-article-close"
            onClick={() => navigate('/')}
            aria-label="Go back to home"
            title="Go back to home"
          >
            ×
          </button>
          <div className="blog-article-content">
            <div className="blog-article-header-full">
              <div className="blog-article-logo-large">{article.logo || '📝'}</div>
              <div className="blog-article-tags-full">
                {article.tags.map((tag) => (
                  <span key={tag} className="blog-tag">
                    {tag}
                  </span>
                ))}
              </div>
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
        </div>
      </div>
    </div>
  );
}

export default BlogArticle;
