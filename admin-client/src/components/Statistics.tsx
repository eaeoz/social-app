import { useState, useEffect } from 'react';
import './Statistics.css';

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
  userSuspended?: boolean;
}

interface AnalysisData {
  topUsers: UserWordStats[];
  totalAnalyzedUsers: number;
  totalMessages: number;
}

function Statistics() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    onlineUsers: 0,
    totalMessages: 0,
    pendingReports: 0,
    loading: true
  });

  const [wordAnalysis, setWordAnalysis] = useState<AnalysisData | null>(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserWordStats | null>(null);
  const [suspendingUser, setSuspendingUser] = useState(false);
  const [cleaningMessages, setCleaningMessages] = useState(false);

  useEffect(() => {
    fetchStatistics();
    fetchWordAnalysis();
  }, []);

  const fetchStatistics = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      
      const response = await fetch(`${import.meta.env.VITE_API_URL}/admin/statistics`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setStats({
          ...data,
          loading: false
        });
      } else {
        setStats(prev => ({ ...prev, loading: false }));
      }
    } catch (error) {
      console.error('Error fetching statistics:', error);
      setStats(prev => ({ ...prev, loading: false }));
    }
  };

  const fetchWordAnalysis = async () => {
    try {
      setAnalysisLoading(true);
      const token = localStorage.getItem('adminToken');
      
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/admin/repeated-words-analysis`,
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        setWordAnalysis(data);
      }
    } catch (error) {
      console.error('Error fetching word analysis:', error);
    } finally {
      setAnalysisLoading(false);
    }
  };

  const fetchUserDetails = async (userId: string) => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/admin/users?search=&page=1&limit=1000`,
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );

      if (response.ok) {
        const data = await response.json();
        const user = data.users.find((u: any) => u._id === userId);
        return user;
      }
    } catch (error) {
      console.error('Error fetching user details:', error);
    }
    return null;
  };

  const handleUserClick = async (user: UserWordStats) => {
    // Fetch full user details including suspension status
    const userDetails = await fetchUserDetails(user.userId);
    if (userDetails) {
      setSelectedUser({
        ...user,
        userSuspended: userDetails.userSuspended || false
      });
    } else {
      setSelectedUser(user);
    }
  };

  const handleSuspendUser = async () => {
    if (!selectedUser || suspendingUser) return;

    if (!confirm(`Are you sure you want to suspend ${selectedUser.nickName}?`)) {
      return;
    }

    try {
      setSuspendingUser(true);
      const token = localStorage.getItem('adminToken');
      
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/admin/users/${selectedUser.userId}/suspend`,
        {
          method: 'PUT',
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ suspended: true })
        }
      );

      if (response.ok) {
        alert(`User ${selectedUser.nickName} has been suspended successfully.`);
        setSelectedUser(null);
        fetchWordAnalysis();
      } else {
        const error = await response.json();
        alert(`Failed to suspend user: ${error.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error suspending user:', error);
      alert('Failed to suspend user. Please try again.');
    } finally {
      setSuspendingUser(false);
    }
  };

  const handleCleanPublicMessages = async () => {
    if (!selectedUser || cleaningMessages) return;

    if (!confirm(`Are you sure you want to delete all public messages from ${selectedUser.nickName}? This action cannot be undone.`)) {
      return;
    }

    try {
      setCleaningMessages(true);
      const token = localStorage.getItem('adminToken');
      
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/admin/cleanup/public-messages/${selectedUser.userId}`,
        {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );

      if (response.ok) {
        const data = await response.json();
        alert(`Successfully deleted ${data.deletedCount} public messages from ${selectedUser.nickName}.`);
        fetchWordAnalysis();
      } else {
        const error = await response.json();
        alert(`Failed to delete messages: ${error.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error deleting public messages:', error);
      alert('Failed to delete messages. Please try again.');
    } finally {
      setCleaningMessages(false);
    }
  };

  const handleCleanPrivateMessages = async () => {
    if (!selectedUser || cleaningMessages) return;

    if (!confirm(`Are you sure you want to delete all private messages from ${selectedUser.nickName}? This action cannot be undone.`)) {
      return;
    }

    try {
      setCleaningMessages(true);
      const token = localStorage.getItem('adminToken');
      
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/admin/cleanup/private-messages/${selectedUser.userId}`,
        {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );

      if (response.ok) {
        const data = await response.json();
        alert(`Successfully deleted ${data.deletedCount} private messages from ${selectedUser.nickName}.`);
        fetchWordAnalysis();
      } else {
        const error = await response.json();
        alert(`Failed to delete messages: ${error.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error deleting private messages:', error);
      alert('Failed to delete messages. Please try again.');
    } finally {
      setCleaningMessages(false);
    }
  };


  if (stats.loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading statistics...</p>
      </div>
    );
  }

  return (
    <div className="statistics-container">
      <h1 className="visually-hidden">Statistics - Netcify Admin Dashboard</h1>
      
      <div className="welcome-section">
        <h2>Welcome to Admin Dashboard</h2>
        <p>Manage users, handle reports, and configure site settings from this dashboard.</p>
      </div>

      <h2>Dashboard Overview</h2>
      
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">👥</div>
          <div className="stat-info">
            <div className="stat-value">{stats.totalUsers}</div>
            <div className="stat-label">Total Users</div>
          </div>
        </div>

        <div className="stat-card online">
          <div className="stat-icon">🟢</div>
          <div className="stat-info">
            <div className="stat-value">{stats.onlineUsers}</div>
            <div className="stat-label">Online Users</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">💬</div>
          <div className="stat-info">
            <div className="stat-value">{stats.totalMessages}</div>
            <div className="stat-label">Total Messages</div>
          </div>
        </div>

        <div className="stat-card reports">
          <div className="stat-icon">🚨</div>
          <div className="stat-info">
            <div className="stat-value">{stats.pendingReports}</div>
            <div className="stat-label">Pending Reports</div>
          </div>
        </div>
      </div>

      {/* Repeated Words Analysis Section */}
      <div className="repeated-words-section">
        <h3>🔤 Repeated Words Analysis</h3>
        <p className="section-description">
          Top 10 users with most repeated words (10+ characters) in their messages
        </p>

        {analysisLoading ? (
          <div className="analysis-loading">
            <div className="spinner"></div>
            <p>Analyzing messages...</p>
          </div>
        ) : wordAnalysis && wordAnalysis.topUsers.length > 0 ? (
          <>
            <div className="analysis-summary-mini">
              <span>📊 {wordAnalysis.totalMessages} messages analyzed</span>
              <span>👥 {wordAnalysis.totalAnalyzedUsers} users with repeated words</span>
            </div>

            <div className="word-bar-chart">
              {wordAnalysis.topUsers.map((user, index) => {
                const maxWords = wordAnalysis.topUsers[0].totalRepeatedWords;
                const percentage = (user.totalRepeatedWords / maxWords) * 100;

                return (
                  <div
                    key={user.userId}
                    className="word-bar-item"
                    onClick={() => handleUserClick(user)}
                  >
                    <div className="word-bar-header">
                      <span className="word-rank">#{index + 1}</span>
                      <span className="word-username">{user.nickName}</span>
                      <span className="word-total">{user.totalRepeatedWords} words</span>
                    </div>
                    <div className="word-bar-wrapper">
                      <div
                        className="word-bar-fill"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <div className="word-bar-details">
                      <span className="detail-public">📢 {user.publicRepeatedWords} public</span>
                      <span className="detail-private">🔒 {user.privateRepeatedWords} private</span>
                      <span className="detail-msgs">
                        {user.publicMessageCount + user.privateMessageCount} total msgs
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <div className="no-analysis-data">
            <p>No repeated words data available yet</p>
          </div>
        )}
      </div>

      {/* User Detail Modal */}
      {selectedUser && (
        <div className="word-modal-overlay" onClick={() => setSelectedUser(null)}>
          <div className="word-modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="word-modal-close" onClick={() => setSelectedUser(null)}>
              ×
            </button>
            <h4>📋 {selectedUser.nickName}</h4>
            <p className="modal-email">{selectedUser.email}</p>

            <div className="modal-word-lists">
              <div className="modal-word-section">
                <h5>📢 Top Public Words</h5>
                {selectedUser.topPublicWords.length > 0 ? (
                  <ul>
                    {selectedUser.topPublicWords.map((word, i) => (
                      <li key={i}>
                        <span>{word.word}</span>
                        <strong>×{word.count}</strong>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="no-words-msg">No repeated public words</p>
                )}
              </div>

              <div className="modal-word-section">
                <h5>🔒 Top Private Words</h5>
                {selectedUser.topPrivateWords.length > 0 ? (
                  <ul>
                    {selectedUser.topPrivateWords.map((word, i) => (
                      <li key={i}>
                        <span>{word.word}</span>
                        <strong>×{word.count}</strong>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="no-words-msg">No repeated private words</p>
                )}
              </div>
            </div>

            <div className="modal-stats">
              <div className="modal-stat-row">
                <span>Total Repeated Words:</span>
                <strong>{selectedUser.totalRepeatedWords}</strong>
              </div>
              <div className="modal-stat-row">
                <span>Public Messages:</span>
                <strong>{selectedUser.publicMessageCount}</strong>
              </div>
              <div className="modal-stat-row">
                <span>Private Messages:</span>
                <strong>{selectedUser.privateMessageCount}</strong>
              </div>
            </div>

            <div className="modal-actions">
              {!selectedUser.userSuspended && (
                <button 
                  className="suspend-user-btn"
                  onClick={handleSuspendUser}
                  disabled={suspendingUser}
                >
                  {suspendingUser ? '⏳ Suspending...' : '🚫 Suspend User'}
                </button>
              )}
              <button 
                className="clean-messages-btn public"
                onClick={handleCleanPublicMessages}
                disabled={cleaningMessages}
              >
                {cleaningMessages ? '⏳ Cleaning...' : '🧹 Clean All Public'}
              </button>
              <button 
                className="clean-messages-btn private"
                onClick={handleCleanPrivateMessages}
                disabled={cleaningMessages}
              >
                {cleaningMessages ? '⏳ Cleaning...' : '🧹 Clean All Private'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Statistics;
