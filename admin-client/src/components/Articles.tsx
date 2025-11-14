import { useState, useEffect } from 'react';
import { Query } from 'appwrite';
import { databases, DATABASE_ID, COLLECTION_ID } from '../config/appwrite';
import './Articles.css';

interface Article {
  id: string;
  title: string;
  author: string;
  date: string;
  tags: string[];
  logo: string;
  excerpt: string;
  content: string;
}

function Articles() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingArticle, setEditingArticle] = useState<Article | null>(null);
  const [selectedArticles, setSelectedArticles] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [showMarkdownHelp, setShowMarkdownHelp] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Form state
  const [formData, setFormData] = useState<Article>({
    id: '',
    title: '',
    author: '',
    date: new Date().toISOString().split('T')[0],
    tags: [],
    logo: '📝',
    excerpt: '',
    content: ''
  });
  const [tagInput, setTagInput] = useState('');

  useEffect(() => {
    fetchArticles();
  }, []);

  const fetchArticles = async () => {
    try {
      setLoading(true);
      
      // Read directly from Appwrite (no server, no cache!)
      console.log('📖 Fetching articles directly from Appwrite...');
      
      const response = await databases.listDocuments(
        DATABASE_ID,
        COLLECTION_ID,
        [
          Query.orderDesc('$createdAt'),
          Query.limit(100)
        ]
      );

      const articles = response.documents.map((doc: any) => ({
        id: doc.articleId,
        title: doc.title,
        author: doc.author,
        date: doc.date,
        tags: typeof doc.tags === 'string' ? JSON.parse(doc.tags) : doc.tags,
        logo: doc.logo,
        excerpt: doc.excerpt,
        content: doc.content
      }));

      console.log(`✅ Fetched ${articles.length} articles from Appwrite`);
      setArticles(articles);
    } catch (err) {
      console.error('Error fetching articles from Appwrite:', err);
      setError('Failed to load articles from Appwrite');
    } finally {
      setLoading(false);
    }
  };

  const handleNewArticle = () => {
    setEditingArticle(null);
    setFormData({
      id: Date.now().toString(),
      title: '',
      author: '',
      date: new Date().toISOString().split('T')[0],
      tags: [],
      logo: '📝',
      excerpt: '',
      content: ''
    });
    setTagInput('');
    setShowModal(true);
  };

  const handleEditArticle = (article: Article) => {
    setEditingArticle(article);
    setFormData({ ...article });
    setTagInput('');
    setShowModal(true);
  };

  const handleDeleteArticle = async (articleId: string) => {
    const article = articles.find(a => a.id === articleId);
    if (!article) return;

    // Show custom confirmation
    const confirmed = await showConfirmDialog(
      'Delete Article',
      `Are you sure you want to delete "${article.title}"?`,
      'This action cannot be undone.'
    );

    if (!confirmed) return;

    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000';
      const token = localStorage.getItem('adminToken');

      const response = await fetch(`${apiUrl}/blog/${articleId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete article');
      }

      await fetchArticles();
      showSuccessMessage('Article deleted successfully!');
    } catch (err) {
      console.error('Error deleting article:', err);
      showErrorMessage('Failed to delete article');
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedArticles.size === 0) return;

    const confirmed = await showConfirmDialog(
      'Delete Multiple Articles',
      `Are you sure you want to delete ${selectedArticles.size} article(s)?`,
      'This action cannot be undone.'
    );

    if (!confirmed) return;

    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000';
      const token = localStorage.getItem('adminToken');

      await Promise.all(
        Array.from(selectedArticles).map(id =>
          fetch(`${apiUrl}/blog/${id}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${token}`
            }
          })
        )
      );

      setSelectedArticles(new Set());
      await fetchArticles();
      showSuccessMessage(`${selectedArticles.size} article(s) deleted successfully!`);
    } catch (err) {
      console.error('Error deleting articles:', err);
      showErrorMessage('Failed to delete some articles');
    }
  };

  const handleSaveArticle = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title || !formData.author || !formData.excerpt || !formData.content) {
      showErrorMessage('Please fill in all required fields');
      return;
    }

    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000';
      const token = localStorage.getItem('adminToken');
      const isEditing = !!editingArticle;

      const response = await fetch(
        isEditing ? `${apiUrl}/blog/${formData.id}` : `${apiUrl}/blog`,
        {
          method: isEditing ? 'PUT' : 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(formData)
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to ${isEditing ? 'update' : 'create'} article`);
      }

      setShowModal(false);
      showSuccessMessage(`Article ${isEditing ? 'updated' : 'created'} successfully!`);
      
      // Wait a moment for backend sync to complete, then refresh
      setTimeout(async () => {
        await fetchArticles();
      }, 1000);
    } catch (err) {
      console.error('Error saving article:', err);
      showErrorMessage(`Failed to ${editingArticle ? 'update' : 'create'} article`);
    }
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData({
        ...formData,
        tags: [...formData.tags, tagInput.trim()]
      });
      setTagInput('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter(t => t !== tag)
    });
  };

  const toggleSelectArticle = (articleId: string) => {
    const newSelected = new Set(selectedArticles);
    if (newSelected.has(articleId)) {
      newSelected.delete(articleId);
    } else {
      newSelected.add(articleId);
    }
    setSelectedArticles(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedArticles.size === paginatedArticles.length) {
      setSelectedArticles(new Set());
    } else {
      setSelectedArticles(new Set(paginatedArticles.map(a => a.id)));
    }
  };

  // Search and filter logic
  const isSearching = searchQuery.length >= 3;
  const filteredArticles = isSearching
    ? articles.filter((article) => {
        const query = searchQuery.toLowerCase();
        return (
          article.title.toLowerCase().includes(query) ||
          article.author.toLowerCase().includes(query) ||
          article.excerpt.toLowerCase().includes(query) ||
          article.tags.some(tag => tag.toLowerCase().includes(query))
        );
      })
    : articles;

  // Pagination
  const displayItemsPerPage = isSearching ? 5 : itemsPerPage;
  const totalPages = Math.ceil(filteredArticles.length / displayItemsPerPage);
  const startIndex = (currentPage - 1) * displayItemsPerPage;
  const paginatedArticles = filteredArticles.slice(startIndex, startIndex + displayItemsPerPage);

  // Reset page when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  // Handle ESC key to close modal
  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && showModal) {
        setShowModal(false);
      }
    };

    if (showModal) {
      document.addEventListener('keydown', handleEscKey);
    }

    return () => {
      document.removeEventListener('keydown', handleEscKey);
    };
  }, [showModal]);

  // Handle Alt+N to open new article modal
  useEffect(() => {
    const handleAltN = (event: KeyboardEvent) => {
      if (event.altKey && event.key.toLowerCase() === 'n' && !showModal) {
        event.preventDefault();
        handleNewArticle();
      }
    };

    document.addEventListener('keydown', handleAltN);

    return () => {
      document.removeEventListener('keydown', handleAltN);
    };
  }, [showModal]);

  if (loading) {
    return (
      <div className="articles-container">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading articles...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="articles-container">
      <div className="articles-header">
        <div className="header-left">
          <h2>📝 Blog Articles</h2>
          <span className="article-count">{articles.length} total</span>
        </div>
        <div className="header-right">
          {selectedArticles.size > 0 && (
            <button
              className="btn btn-danger"
              onClick={handleDeleteSelected}
            >
              🗑️ Delete Selected ({selectedArticles.size})
            </button>
          )}
          <div className="new-article-wrapper">
            <button className="btn btn-primary" onClick={handleNewArticle} title="New Article (Alt+N)">
              ➕ New Article
            </button>
            <span className="keyboard-hint">Alt+N</span>
          </div>
        </div>
      </div>

      {error && (
        <div className="error-message">
          <span>⚠️</span>
          <span>{error}</span>
        </div>
      )}

      <div className="search-section">
        <div className="search-input-wrapper">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            className="search-input"
            placeholder="Search articles... (min 3 characters)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              className="clear-search"
              onClick={() => setSearchQuery('')}
              title="Clear search"
            >
              ✕
            </button>
          )}
        </div>
        {isSearching && (
          <div className="search-results-info">
            {filteredArticles.length === 0 ? (
              <span className="no-results">No articles found matching "{searchQuery}"</span>
            ) : (
              <span className="results-count">
                Found {filteredArticles.length} article{filteredArticles.length !== 1 ? 's' : ''} matching "{searchQuery}" (showing max 5 per page)
              </span>
            )}
          </div>
        )}
      </div>

      <div className="articles-table-container">
        <table className="articles-table">
          <thead>
            <tr>
              <th className="checkbox-col">
                <input
                  type="checkbox"
                  checked={selectedArticles.size === paginatedArticles.length && paginatedArticles.length > 0}
                  onChange={toggleSelectAll}
                />
              </th>
              <th className="logo-col">Logo</th>
              <th className="title-col">Title</th>
              <th className="author-col">Author</th>
              <th className="date-col">Date</th>
              <th className="tags-col">Tags</th>
              <th className="actions-col">Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedArticles.map((article) => (
              <tr key={article.id}>
                <td className="checkbox-col">
                  <input
                    type="checkbox"
                    checked={selectedArticles.has(article.id)}
                    onChange={() => toggleSelectArticle(article.id)}
                  />
                </td>
                <td className="logo-col">
                  <span className="article-logo">{article.logo}</span>
                </td>
                <td className="title-col">
                  <div className="article-title-cell">
                    <div className="article-title">{article.title}</div>
                    <div className="article-excerpt">{article.excerpt}</div>
                  </div>
                </td>
                <td className="author-col">{article.author}</td>
                <td className="date-col">{article.date}</td>
                <td className="tags-col">
                  <div className="tags-cell">
                    {article.tags.slice(0, 2).map((tag) => (
                      <span key={tag} className="tag-badge">{tag}</span>
                    ))}
                    {article.tags.length > 2 && (
                      <span className="tag-badge more">+{article.tags.length - 2}</span>
                    )}
                  </div>
                </td>
                <td className="actions-col">
                  <button
                    className="btn-icon btn-edit"
                    onClick={() => handleEditArticle(article)}
                    title="Edit article"
                  >
                    ✏️
                  </button>
                  <button
                    className="btn-icon btn-delete"
                    onClick={() => handleDeleteArticle(article.id)}
                    title="Delete article"
                  >
                    🗑️
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {articles.length === 0 && (
          <div className="empty-state">
            <div className="empty-icon">📝</div>
            <h3>No Articles Yet</h3>
            <p>Create your first blog article to get started!</p>
            <button className="btn btn-primary" onClick={handleNewArticle}>
              ➕ Create Article
            </button>
          </div>
        )}
      </div>

      {filteredArticles.length > 0 && (
        <div className="pagination-container">
          <div className="pagination-info">
            Showing {startIndex + 1} to {Math.min(startIndex + displayItemsPerPage, filteredArticles.length)} of {filteredArticles.length}
            {isSearching && ` (filtered from ${articles.length} total)`}
          </div>
          
          <div className="pagination-controls">
            {!isSearching && (
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="items-per-page"
              >
                <option value={5}>5 per page</option>
                <option value={10}>10 per page</option>
                <option value={25}>25 per page</option>
                <option value={50}>50 per page</option>
                <option value={100}>100 per page</option>
              </select>
            )}

            <div className="pagination-buttons">
              <button
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                className="pagination-btn"
              >
                ⏮️
              </button>
              <button
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage === 1}
                className="pagination-btn"
              >
                ◀️
              </button>
              <span className="page-info">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="pagination-btn"
              >
                ▶️
              </button>
              <button
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
                className="pagination-btn"
              >
                ⏭️
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Article Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content article-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingArticle ? '✏️ Edit Article' : '➕ New Article'}</h3>
              <div className="modal-close-section">
                <span className="esc-hint">Press ESC to close</span>
                <button className="modal-close" onClick={() => setShowModal(false)} title="Close (ESC)">×</button>
              </div>
            </div>

            <form onSubmit={handleSaveArticle} className="article-form">
              <div className="form-row">
                <div className="form-group">
                  <label>
                    Title <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Enter article title"
                    required
                  />
                </div>

                <div className="form-group logo-group">
                  <label>Logo Emoji</label>
                  <input
                    type="text"
                    value={formData.logo}
                    onChange={(e) => setFormData({ ...formData, logo: e.target.value })}
                    placeholder="📝"
                    maxLength={10}
                    className="logo-input"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>
                    Author <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.author}
                    onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                    placeholder="Enter author name"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>
                    Date <span className="required">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Tags</label>
                <div className="tags-input-container">
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddTag();
                      }
                    }}
                    placeholder="Type a tag and press Enter"
                  />
                  <button type="button" onClick={handleAddTag} className="btn-add-tag">
                    Add
                  </button>
                </div>
                <div className="tags-list">
                  {formData.tags.map((tag) => (
                    <span key={tag} className="tag-item">
                      {tag}
                      <button type="button" onClick={() => handleRemoveTag(tag)}>×</button>
                    </span>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label>
                  Excerpt <span className="required">*</span>
                </label>
                <textarea
                  value={formData.excerpt}
                  onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                  placeholder="Brief summary of the article (max 500 characters)"
                  rows={3}
                  maxLength={500}
                  required
                />
                <span className="char-count">{formData.excerpt.length}/500</span>
              </div>

              <div className="form-group">
                <label className="label-with-help">
                  <span>
                    Content (Markdown) <span className="required">*</span>
                  </span>
                  <button
                    type="button"
                    className="help-icon"
                    onMouseEnter={() => setShowMarkdownHelp(true)}
                    onMouseLeave={() => setShowMarkdownHelp(false)}
                    title="Markdown help"
                  >
                    ❓
                  </button>
                </label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="Write your article content in Markdown format..."
                  rows={15}
                  className="content-textarea"
                  required
                />
                <span className="char-count">{formData.content.length}/50000</span>

                {showMarkdownHelp && (
                  <div className="markdown-help-popup">
                    <h4>Markdown Syntax Guide</h4>
                    <div className="help-grid">
                      <div className="help-item">
                        <code># Heading 1</code>
                        <span>Large heading</span>
                      </div>
                      <div className="help-item">
                        <code>## Heading 2</code>
                        <span>Medium heading</span>
                      </div>
                      <div className="help-item">
                        <code>**bold**</code>
                        <span>Bold text</span>
                      </div>
                      <div className="help-item">
                        <code>*italic*</code>
                        <span>Italic text</span>
                      </div>
                      <div className="help-item">
                        <code>[link](url)</code>
                        <span>Hyperlink</span>
                      </div>
                      <div className="help-item">
                        <code>- List item</code>
                        <span>Bullet list</span>
                      </div>
                      <div className="help-item">
                        <code>1. Item</code>
                        <span>Numbered list</span>
                      </div>
                      <div className="help-item">
                        <code>`code`</code>
                        <span>Inline code</span>
                      </div>
                      <div className="help-item">
                        <code>```code```</code>
                        <span>Code block</span>
                      </div>
                      <div className="help-item">
                        <code>{'>'} quote</code>
                        <span>Blockquote</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="form-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingArticle ? '💾 Update Article' : '➕ Create Article'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Custom Notification Container */}
      <div id="notification-container"></div>
    </div>
  );
}

// Helper functions for custom dialogs
function showConfirmDialog(title: string, message: string, detail?: string): Promise<boolean> {
  return new Promise((resolve) => {
    const overlay = document.createElement('div');
    overlay.className = 'confirm-overlay';
    
    const dialog = document.createElement('div');
    dialog.className = 'confirm-dialog';
    dialog.innerHTML = `
      <div class="confirm-icon">⚠️</div>
      <h3>${title}</h3>
      <p>${message}</p>
      ${detail ? `<p class="confirm-detail">${detail}</p>` : ''}
      <div class="confirm-actions">
        <button class="btn btn-secondary" id="cancel-btn">Cancel</button>
        <button class="btn btn-danger" id="confirm-btn">Delete</button>
      </div>
    `;
    
    overlay.appendChild(dialog);
    document.body.appendChild(overlay);
    
    const handleCancel = () => {
      document.body.removeChild(overlay);
      resolve(false);
    };
    
    const handleConfirm = () => {
      document.body.removeChild(overlay);
      resolve(true);
    };
    
    dialog.querySelector('#cancel-btn')?.addEventListener('click', handleCancel);
    dialog.querySelector('#confirm-btn')?.addEventListener('click', handleConfirm);
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) handleCancel();
    });
  });
}

function showSuccessMessage(message: string) {
  showNotification(message, 'success');
}

function showErrorMessage(message: string) {
  showNotification(message, 'error');
}

function showNotification(message: string, type: 'success' | 'error') {
  const container = document.getElementById('notification-container');
  if (!container) return;
  
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.innerHTML = `
    <span class="notification-icon">${type === 'success' ? '✅' : '❌'}</span>
    <span class="notification-message">${message}</span>
  `;
  
  container.appendChild(notification);
  
  setTimeout(() => {
    notification.style.animation = 'slideOut 0.3s ease-out forwards';
    setTimeout(() => {
      container.removeChild(notification);
    }, 300);
  }, 3000);
}

export default Articles;
