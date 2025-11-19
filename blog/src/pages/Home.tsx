import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { databases, config } from '../config/appwrite';
import { Article } from '../types/article';
import ArticleCard from '../components/ArticleCard';
import { Loader } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { Query } from 'appwrite';
import '../styles/Home.css';

export default function Home() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchParams] = useSearchParams();
  const searchQuery = searchParams.get('search');

  useEffect(() => {
    fetchArticles();
  }, [searchQuery]);

  const fetchArticles = async () => {
    try {
      setLoading(true);
      setError(null);

      const queries = [
        Query.equal('published', true),
        Query.orderDesc('$createdAt'),
        Query.limit(100)
      ];

      if (searchQuery) {
        queries.push(Query.search('title', searchQuery));
      }

      const response = await databases.listDocuments(
        config.databaseId,
        config.articlesCollectionId,
        queries
      );

      setArticles(response.documents as unknown as Article[]);
    } catch (err) {
      console.error('Error fetching articles:', err);
      setError('Failed to load articles. Please try again later.');
    } finally {
      setLoading(false);
    }
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
              ? `Found ${articles.length} ${articles.length === 1 ? 'article' : 'articles'}`
              : 'Discover insightful articles on technology, programming, and software development'
            }
          </p>
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
        ) : articles.length === 0 ? (
          <div className="empty-container">
            <p>{searchQuery ? 'No articles found matching your search.' : 'No articles available yet.'}</p>
          </div>
        ) : (
          <div className="articles-grid">
            {articles.map((article, index) => (
              <ArticleCard key={article.$id} article={article} index={index} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
