import { useState, useEffect } from 'react';
import { databases, config } from '../config/appwrite';
import { Article } from '../types/article';
import ArticleCard from '../components/ArticleCard';
import { Loader, Search, X } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { Query } from 'appwrite';
import '../styles/Home.css';

export default function Home() {
  const [allArticles, setAllArticles] = useState<Article[]>([]);
  const [filteredArticles, setFilteredArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchArticles();
  }, []);

  // Real-time filtering on every keypress
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredArticles(allArticles);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = allArticles.filter(article => {
      const titleMatch = article.title.toLowerCase().includes(query);
      const excerptMatch = article.excerpt.toLowerCase().includes(query);
      const contentMatch = article.content.toLowerCase().includes(query);
      const authorMatch = article.author.toLowerCase().includes(query);
      const tagsMatch = article.tags.toLowerCase().includes(query);
      
      return titleMatch || excerptMatch || contentMatch || authorMatch || tagsMatch;
    });

    setFilteredArticles(filtered);
  }, [searchQuery, allArticles]);

  const fetchArticles = async () => {
    try {
      setLoading(true);
      setError(null);

      const queries = [
        Query.orderDesc('$createdAt'),
        Query.limit(100)
      ];

      const response = await databases.listDocuments(
        config.databaseId,
        config.articlesCollectionId,
        queries
      );

      const articles = response.documents as unknown as Article[];
      setAllArticles(articles);
      setFilteredArticles(articles);
    } catch (err) {
      console.error('Error fetching articles:', err);
      setError('Failed to load articles. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleClearSearch = () => {
    setSearchQuery('');
  };

  return (
    <>
      <Helmet>
        <title>{searchQuery ? `Search: ${searchQuery}` : import.meta.env.VITE_SITE_NAME || "Sedat's Blog"}</title>
        <meta name="description" content={import.meta.env.VITE_SITE_DESCRIPTION || "Modern tech blog with articles about software development"} />
      </Helmet>

      <div className="home-container">
        <div className="hero-section">
          <h1 className="hero-title">
            {searchQuery ? `Search Results for "${searchQuery}"` : 'Welcome to Our Blog'}
          </h1>
          <p className="hero-description">
            {searchQuery 
              ? `Found ${filteredArticles.length} ${filteredArticles.length === 1 ? 'article' : 'articles'} matching your search`
              : 'Discover insightful articles on technology, programming, and software development'
            }
          </p>
        </div>

        {/* Real-time Search Input */}
        <div className="search-section">
          <div className="search-container">
            <Search className="search-icon" size={20} />
            <input
              type="text"
              className="search-input"
              placeholder="Search articles by title, content, author, or tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              disabled={loading}
            />
            {searchQuery && (
              <button
                className="search-clear-btn"
                onClick={handleClearSearch}
                title="Clear search"
                aria-label="Clear search"
              >
                <X size={18} />
              </button>
            )}
          </div>
          
          {/* Real-time Results Counter */}
          {searchQuery && !loading && (
            <div className="search-results-info">
              <span className="results-count">
                {filteredArticles.length === 0 ? (
                  <>❌ No articles found</>
                ) : filteredArticles.length === allArticles.length ? (
                  <>✅ Showing all {allArticles.length} {allArticles.length === 1 ? 'article' : 'articles'}</>
                ) : (
                  <>✅ {filteredArticles.length} of {allArticles.length} {filteredArticles.length === 1 ? 'article' : 'articles'}</>
                )}
              </span>
            </div>
          )}
        </div>

        {loading ? (
          <div className="loading-container">
            <Loader className="loading" />
            <p>Loading articles...</p>
          </div>
        ) : error ? (
          <div className="error-container">
            <p>{error}</p>
          </div>
        ) : filteredArticles.length === 0 ? (
          <div className="empty-container">
            <p>{searchQuery ? `No articles found matching "${searchQuery}". Try different keywords.` : 'No articles available yet.'}</p>
          </div>
        ) : (
          <div className="articles-grid">
            {filteredArticles.map((article, index) => (
              <ArticleCard key={article.$id} article={article} index={index} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
