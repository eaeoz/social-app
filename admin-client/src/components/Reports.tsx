import { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  LineChart,
  Line,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import './Reports.css';

interface Report {
  _id: string;
  reportedUserId: string;
  reporterId: string;
  reason: string;
  description: string;
  status: string;
  createdAt: string;
  reportedUser?: {
    username: string;
    email: string;
  };
  reporter?: {
    username: string;
    email: string;
  };
}

interface ReportStatistics {
  totalReports: number;
  pendingReports: number;
  resolvedReports: number;
  reportsByReason: { name: string; value: number }[];
  reportsByDate: { date: string; count: number }[];
  topReportedUsers: { username: string; count: number }[];
  reportsByStatus: { name: string; value: number }[];
}

function Reports() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [showStatistics, setShowStatistics] = useState(true);
  const [statistics, setStatistics] = useState<ReportStatistics | null>(null);

  const COLORS = ['#667eea', '#764ba2', '#f093fb', '#4facfe', '#43e97b', '#fa709a'];

  useEffect(() => {
    fetchReports();
  }, []);

  useEffect(() => {
    if (reports.length > 0) {
      calculateStatistics();
    }
  }, [reports]);

  const fetchReports = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/admin/reports`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setReports(data.reports);
      }
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStatistics = () => {
    // Calculate reports by reason
    const reasonCounts: { [key: string]: number } = {};
    reports.forEach(report => {
      reasonCounts[report.reason] = (reasonCounts[report.reason] || 0) + 1;
    });
    const reportsByReason = Object.entries(reasonCounts).map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value
    }));

    // Calculate reports by status
    const statusCounts: { [key: string]: number } = {};
    reports.forEach(report => {
      statusCounts[report.status] = (statusCounts[report.status] || 0) + 1;
    });
    const reportsByStatus = Object.entries(statusCounts).map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value
    }));

    // Calculate reports by date (last 7 days)
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      return date.toISOString().split('T')[0];
    });

    const dateCounts: { [key: string]: number } = {};
    reports.forEach(report => {
      const date = new Date(report.createdAt).toISOString().split('T')[0];
      if (last7Days.includes(date)) {
        dateCounts[date] = (dateCounts[date] || 0) + 1;
      }
    });

    const reportsByDate = last7Days.map(date => ({
      date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      count: dateCounts[date] || 0
    }));

    // Calculate top reported users
    const userCounts: { [key: string]: number } = {};
    reports.forEach(report => {
      if (report.reportedUser?.username) {
        userCounts[report.reportedUser.username] = (userCounts[report.reportedUser.username] || 0) + 1;
      }
    });
    const topReportedUsers = Object.entries(userCounts)
      .map(([username, count]) => ({ username, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    setStatistics({
      totalReports: reports.length,
      pendingReports: reports.filter(r => r.status === 'pending').length,
      resolvedReports: reports.filter(r => r.status === 'resolved').length,
      reportsByReason,
      reportsByDate,
      topReportedUsers,
      reportsByStatus
    });
  };

  const filteredReports = filter === 'all' 
    ? reports 
    : reports.filter(r => r.status === filter);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading reports...</p>
      </div>
    );
  }

  return (
    <div className="reports-container">
      <div className="reports-header">
        <div className="header-content">
          <h2>Reports Management</h2>
          <button 
            className="toggle-stats-btn"
            onClick={() => setShowStatistics(!showStatistics)}
          >
            <svg viewBox="0 0 20 20" fill="currentColor">
              <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
            </svg>
            {showStatistics ? 'Hide Statistics' : 'Show Statistics'}
          </button>
        </div>
        <div className="filter-buttons">
          <button 
            className={filter === 'all' ? 'active' : ''}
            onClick={() => setFilter('all')}
          >
            All ({reports.length})
          </button>
          <button 
            className={filter === 'pending' ? 'active' : ''}
            onClick={() => setFilter('pending')}
          >
            Pending ({reports.filter(r => r.status === 'pending').length})
          </button>
          <button 
            className={filter === 'resolved' ? 'active' : ''}
            onClick={() => setFilter('resolved')}
          >
            Resolved ({reports.filter(r => r.status === 'resolved').length})
          </button>
        </div>
      </div>

      {showStatistics && statistics && (
        <div className="statistics-section">
          <h3 className="statistics-title">
            <svg viewBox="0 0 20 20" fill="currentColor">
              <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
            </svg>
            Report Statistics & Analytics
          </h3>

          {/* Summary Cards */}
          <div className="stats-cards">
            <div className="stat-card total">
              <div className="stat-icon">
                <svg viewBox="0 0 20 20" fill="currentColor">
                  <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                  <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="stat-info">
                <p className="stat-label">Total Reports</p>
                <p className="stat-value">{statistics.totalReports}</p>
              </div>
            </div>

            <div className="stat-card pending">
              <div className="stat-icon">
                <svg viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="stat-info">
                <p className="stat-label">Pending</p>
                <p className="stat-value">{statistics.pendingReports}</p>
              </div>
            </div>

            <div className="stat-card resolved">
              <div className="stat-icon">
                <svg viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="stat-info">
                <p className="stat-label">Resolved</p>
                <p className="stat-value">{statistics.resolvedReports}</p>
              </div>
            </div>

            <div className="stat-card rate">
              <div className="stat-icon">
                <svg viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="stat-info">
                <p className="stat-label">Resolution Rate</p>
                <p className="stat-value">
                  {statistics.totalReports > 0 
                    ? Math.round((statistics.resolvedReports / statistics.totalReports) * 100)
                    : 0}%
                </p>
              </div>
            </div>
          </div>

          {/* Charts Grid */}
          <div className="charts-grid">
            {/* Reports by Status - Pie Chart */}
            <div className="chart-card">
              <h4 className="chart-title">Reports by Status</h4>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={statistics.reportsByStatus}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {statistics.reportsByStatus.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Reports by Reason - Bar Chart */}
            <div className="chart-card">
              <h4 className="chart-title">Reports by Reason</h4>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={statistics.reportsByReason}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="name" stroke="#718096" />
                  <YAxis stroke="#718096" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      border: 'none',
                      borderRadius: '8px',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                    }}
                  />
                  <Bar dataKey="value" fill="#667eea" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Reports Trend - Line Chart */}
            <div className="chart-card">
              <h4 className="chart-title">Reports Trend (Last 7 Days)</h4>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={statistics.reportsByDate}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="date" stroke="#718096" />
                  <YAxis stroke="#718096" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      border: 'none',
                      borderRadius: '8px',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="count" 
                    stroke="#764ba2" 
                    strokeWidth={3}
                    dot={{ fill: '#667eea', strokeWidth: 2, r: 5 }}
                    activeDot={{ r: 8 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Top Reported Users */}
            <div className="chart-card">
              <h4 className="chart-title">Top Reported Users</h4>
              <div className="top-users-list">
                {statistics.topReportedUsers.length > 0 ? (
                  statistics.topReportedUsers.map((user, index) => (
                    <div key={user.username} className="top-user-item">
                      <div className="user-rank">{index + 1}</div>
                      <div className="user-info">
                        <span className="user-name">@{user.username}</span>
                        <div className="user-bar">
                          <div 
                            className="user-bar-fill"
                            style={{ 
                              width: `${(user.count / statistics.topReportedUsers[0].count) * 100}%`,
                              backgroundColor: COLORS[index % COLORS.length]
                            }}
                          />
                        </div>
                      </div>
                      <div className="user-count">{user.count}</div>
                    </div>
                  ))
                ) : (
                  <p className="no-data">No reported users data available</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="reports-list-header">
        <h3>
          <svg viewBox="0 0 20 20" fill="currentColor">
            <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
            <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
          </svg>
          All Reports
        </h3>
      </div>

      <div className="reports-grid">
        {filteredReports.map((report) => (
          <div key={report._id} className="report-card">
            <div className="report-header">
              <span className={`status-badge ${report.status}`}>
                {report.status}
              </span>
              <span className="report-date">
                {new Date(report.createdAt).toLocaleDateString()}
              </span>
            </div>
            
            <div className="report-body">
              <div className="report-info">
                <strong>Reported User:</strong> @{report.reportedUser?.username || 'Unknown'}
              </div>
              <div className="report-info">
                <strong>Reporter:</strong> @{report.reporter?.username || 'Unknown'}
              </div>
              <div className="report-info">
                <strong>Reason:</strong> {report.reason}
              </div>
              {report.description && (
                <div className="report-description">
                  <strong>Description:</strong>
                  <p>{report.description}</p>
                </div>
              )}
            </div>

            <div className="report-actions">
              <button className="btn-view">View Details</button>
              <button className="btn-resolve">Mark Resolved</button>
            </div>
          </div>
        ))}
      </div>

      {filteredReports.length === 0 && (
        <div className="no-results">
          <p>No reports found.</p>
        </div>
      )}
    </div>
  );
}

export default Reports;
