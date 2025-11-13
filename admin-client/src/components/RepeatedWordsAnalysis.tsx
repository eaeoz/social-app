import { useState, useEffect } from 'react';
import './RepeatedWordsAnalysis.css';

interface WordData {
  word: string;
  count: number;
}

interface UserWordStats {
  userId: string;
  username: string;
  nickName: string;
  email: string;
  totalRepeatedWords: number;
  publicRepeatedWords: number;
  privateRepeatedWords: number;
  publicMessageCount: number;
  privateMessageCount: number;
  topPublicWords: WordData[];
  topPrivateWords: WordData[];
}

interface AnalysisData {
  topUsers: UserWordStats[];
  totalAnalyzedUsers: number;
  totalMessages: number;
}

function RepeatedWordsAnalysis() {
  const [data, setData] = useState<AnalysisData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<UserWordStats | null>(null);

  useEffect(() => {
    fetchAnalysis();
  }, []);

  const fetchAnalysis = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('adminToken');
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/admin/repeated-words-analysis`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch analysis');
      }

      const result = await response.json();
      setData(result);
    } catch (err) {
      console.error('Error fetching analysis:', err);
      setError(err instanceof Error ? err.message : 'Failed to load analysis');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Analyzing repeated words...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <p className="error-message">❌ {error}</p>
        <button onClick={fetchAnalysis} className="retry-button">
          Retry
        </button>
      </div>
    );
  }

  if (!data || data.topUsers.length === 0) {
    return (
      <div className="no-data-container">
        <p>No repeated words data available</p>
        <p className="hint">
          Users need to send messages with words 10+ characters long
        </p>
      </div>
    );
  }

  const maxRepeatedWords = Math.max(
    ...data.topUsers.map((u) => u.totalRepeatedWords)
  );

  return (
    <div className="repeated-words-analysis">
      <h1 className="visually-hidden">
        Repeated Words Analysis - Netcify Admin Dashboard
      </h1>
      <h2>📊 Repeated Words Analysis</h2>

      <div className="analysis-summary">
        <div className="summary-card">
          <div className="summary-value">{data.totalMessages}</div>
          <div className="summary-label">Total Messages Analyzed</div>
        </div>
        <div className="summary-card">
          <div className="summary-value">{data.totalAnalyzedUsers}</div>
          <div className="summary-label">Users with Repeated Words</div>
        </div>
        <div className="summary-card">
          <div className="summary-value">{data.topUsers.length}</div>
          <div className="summary-label">Top Users Displayed</div>
        </div>
      </div>

      <div className="chart-container">
        <h3>Top 10 Users by Repeated Words (10+ characters)</h3>
        <div className="bar-chart">
          {data.topUsers.map((user, index) => {
            const percentage = (user.totalRepeatedWords / maxRepeatedWords) * 100;

            return (
              <div
                key={user.userId}
                className="bar-item"
                onClick={() => setSelectedUser(user)}
              >
                <div className="bar-label">
                  <span className="rank">#{index + 1}</span>
                  <span className="username">{user.nickName}</span>
                </div>
                <div className="bar-wrapper">
                  <div
                    className="bar-fill"
                    style={{ width: `${percentage}%` }}
                  >
                    <span className="bar-value">{user.totalRepeatedWords}</span>
                  </div>
                </div>
                <div className="bar-details">
                  <span className="detail-item public">
                    📢 {user.publicRepeatedWords} public
                  </span>
                  <span className="detail-item private">
                    🔒 {user.privateRepeatedWords} private
                  </span>
                </div>
                <div className="message-counts">
                  <span className="message-count">
                    Public msgs: {user.publicMessageCount}
                  </span>
                  <span className="message-count">
                    Private msgs: {user.privateMessageCount}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {selectedUser && (
        <div className="user-detail-modal" onClick={() => setSelectedUser(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button
              className="close-button"
              onClick={() => setSelectedUser(null)}
            >
              ×
            </button>
            <h3>📋 Details for {selectedUser.nickName}</h3>
            <p className="user-email">{selectedUser.email}</p>

            <div className="word-lists">
              <div className="word-list-section">
                <h4>📢 Top Public Words</h4>
                {selectedUser.topPublicWords.length > 0 ? (
                  <ul>
                    {selectedUser.topPublicWords.map((word, i) => (
                      <li key={i}>
                        <span className="word">{word.word}</span>
                        <span className="count">×{word.count}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="no-words">No repeated public words</p>
                )}
              </div>

              <div className="word-list-section">
                <h4>🔒 Top Private Words</h4>
                {selectedUser.topPrivateWords.length > 0 ? (
                  <ul>
                    {selectedUser.topPrivateWords.map((word, i) => (
                      <li key={i}>
                        <span className="word">{word.word}</span>
                        <span className="count">×{word.count}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="no-words">No repeated private words</p>
                )}
              </div>
            </div>

            <div className="stats-summary">
              <div className="stat-row">
                <span>Total Repeated Words:</span>
                <strong>{selectedUser.totalRepeatedWords}</strong>
              </div>
              <div className="stat-row">
                <span>Public Messages:</span>
                <strong>{selectedUser.publicMessageCount}</strong>
              </div>
              <div className="stat-row">
                <span>Private Messages:</span>
                <strong>{selectedUser.privateMessageCount}</strong>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default RepeatedWordsAnalysis;
