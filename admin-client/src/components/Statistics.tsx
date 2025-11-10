import { useState, useEffect } from 'react';
import './Statistics.css';

function Statistics() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    onlineUsers: 0,
    totalMessages: 0,
    pendingReports: 0,
    loading: true
  });

  useEffect(() => {
    fetchStatistics();
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

      <div className="welcome-section">
        <h3>Welcome to Admin Dashboard</h3>
        <p>Manage users, handle reports, and configure site settings from this dashboard.</p>
      </div>
    </div>
  );
}

export default Statistics;
