import { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import './Blog.css';

interface BlogProps {
  onClose: () => void;
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

function Blog({ onClose }: BlogProps) {
  const [blogArticles, setBlogArticles] = useState<BlogArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedArticle, setSelectedArticle] = useState<BlogArticle | null>(null);
  const [listAnimation, setListAnimation] = useState<'slide-out-left' | 'slide-in-left' | ''>('');
  const [articleAnimation, setArticleAnimation] = useState<'slide-in-right' | 'slide-out-right' | ''>('');
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Fetch blog articles from API
  useEffect(() => {
    const fetchArticles = async () => {
      try {
        setLoading(true);
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000';
        const response = await fetch(`${apiUrl}/blog`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch blog articles');
        }
        
        const data = await response.json();
        if (data.success && data.articles) {
          setBlogArticles(data.articles);
        } else {
          throw new Error('Invalid response format');
        }
      } catch (err) {
        console.error('Error fetching blog articles:', err);
        setError('Failed to load blog articles. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchArticles();
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        if (selectedArticle) {
          handleCloseArticle();
        } else {
          onClose();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose, selectedArticle]);

  useEffect(() => {
    if (!selectedArticle) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    }
  }, [selectedArticle]);

  const handleOpenArticle = (article: BlogArticle) => {
    // Slide list out to left
    setListAnimation('slide-out-left');
    
    setTimeout(() => {
      setSelectedArticle(article);
      // Slide article in from right
      setArticleAnimation('slide-in-right');
      
      setTimeout(() => {
        setArticleAnimation('');
      }, 400);
    }, 400);
  };

  const handleCloseArticle = () => {
    // Slide article out to right
    setArticleAnimation('slide-out-right');
    
    setTimeout(() => {
      setSelectedArticle(null);
      // Slide list in from left
      setListAnimation('slide-in-left');
      
      setTimeout(() => {
        setListAnimation('');
      }, 400);
    }, 400);
  };

  const filteredArticles = blogArticles.filter(article => {
    if (searchQuery.length < 3) return true;
    
    const query = searchQuery.toLowerCase();
    return (
      article.title.toLowerCase().includes(query) ||
      article.excerpt.toLowerCase().includes(query) ||
      article.tags.some(tag => tag.toLowerCase().includes(query)) ||
      article.author.toLowerCase().includes(query)
    );
  });

  return (
    <div className="legal-modal-overlay blog-modal-overlay" onClick={selectedArticle ? undefined : onClose}>
      <div 
        className={`legal-modal-content blog-modal-content ${selectedArticle ? 'article-expanded' : ''}`}
        onClick={(e) => e.stopPropagation()}
      >
        {!selectedArticle ? (
          <div className={`blog-list-view ${listAnimation}`}>
            <div className="legal-modal-header blog-header">
              <div className="legal-header-content">
                <span className="legal-icon">📝</span>
                <h2>Blog</h2>
              </div>
              <button className="legal-modal-close" onClick={onClose} aria-label="Close">
                ×
              </button>
            </div>

            <div className="blog-search-section">
              <div className="blog-search-container">
                <span className="blog-search-icon">🔍</span>
                <input
                  ref={searchInputRef}
                  type="text"
                  className="blog-search-input"
                  placeholder="Search articles... (min 3 characters)"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  disabled={loading}
                />
                {searchQuery && (
                  <button
                    className="blog-search-clear"
                    onClick={() => setSearchQuery('')}
                    aria-label="Clear search"
                  >
                    ×
                  </button>
                )}
              </div>
              {searchQuery.length > 0 && searchQuery.length < 3 && (
                <div className="blog-search-hint">
                  Type at least 3 characters to search
                </div>
              )}
              {searchQuery.length >= 3 && filteredArticles.length === 0 && !loading && (
                <div className="blog-search-hint">
                  No articles found matching "{searchQuery}"
                </div>
              )}
            </div>

            <div className="legal-modal-body blog-list-body">
              {loading ? (
                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                  <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>📚</div>
                  <div>Loading articles...</div>
                </div>
              ) : error ? (
                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                  <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⚠️</div>
                  <div>{error}</div>
                </div>
              ) : filteredArticles.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                  <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>📝</div>
                  <div>No articles available yet. Check back soon!</div>
                </div>
              ) : (
                <div className="blog-articles-grid">
                  {filteredArticles.map((article, index) => (
                    <article
                      key={article.id}
                      className="blog-article-card"
                      onClick={() => handleOpenArticle(article)}
                      style={{ animationDelay: `${index * 0.05}s` }}
                    >
                      <div className="blog-article-header">
                        <div className="blog-article-logo">{article.logo || '📝'}</div>
                        <div className="blog-article-meta">
                          <time className="blog-article-date">{article.date}</time>
                          <span className="blog-article-author">By {article.author}</span>
                        </div>
                      </div>
                      <h3 className="blog-article-title">{article.title}</h3>
                      <p className="blog-article-excerpt">{article.excerpt}</p>
                      <div className="blog-article-tags">
                        {article.tags.map((tag) => (
                          <span key={tag} className="blog-tag">
                            {tag}
                          </span>
                        ))}
                      </div>
                      <div className="blog-article-footer">
                        <span className="blog-read-more">
                          Read more <span className="blog-arrow">→</span>
                        </span>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className={`blog-article-view ${articleAnimation}`}>
            <button
              className="blog-article-close"
              onClick={handleCloseArticle}
              aria-label="Close article"
              title="Close article (ESC)"
            >
              ×
            </button>
            <div className="blog-article-content">
              <div className="blog-article-header-full">
                <div className="blog-article-logo-large">{selectedArticle.logo || '📝'}</div>
                <div className="blog-article-tags-full">
                  {selectedArticle.tags.map((tag) => (
                    <span key={tag} className="blog-tag">
                      {tag}
                    </span>
                  ))}
                </div>
                <h1 className="blog-article-title-full">{selectedArticle.title}</h1>
                <div className="blog-article-meta-full">
                  <time className="blog-article-date">{selectedArticle.date}</time>
                  <span className="blog-meta-separator">•</span>
                  <span className="blog-article-author">By {selectedArticle.author}</span>
                </div>
              </div>
              <div className="blog-article-body markdown-content">
                <ReactMarkdown>
                  {selectedArticle.content}
                </ReactMarkdown>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Blog;
