import { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
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

type SortField = 'reportedUser' | 'reporter' | 'reason' | 'date';
type SortDirection = 'asc' | 'desc';

function Reports() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [showStatistics, setShowStatistics] = useState(true);
  const [statistics, setStatistics] = useState<ReportStatistics | null>(null);
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const reportsPerPage = 10;

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
      const response = await fetch(`${import.meta.env.VITE_API_URL}/admin/reports?status=pending`, {
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

  const handleResolveReport = async (reportId: string, reportedUserId: string, reporterId: string) => {
    console.log('🔧 Resolving report:', {
      reportId,
      reportedUserId,
      reporterId
    });
    
    setResolvingId(reportId);
    try {
      const token = localStorage.getItem('adminToken');
      const requestBody = { 
        status: 'resolved',
        reportedUserId,
        reporterId
      };
      
      console.log('📤 Sending request:', requestBody);
      
      const response = await fetch(`${import.meta.env.VITE_API_URL}/admin/reports/${reportId}`, {
        method: 'PUT',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Report resolved successfully:', data);
        
        if (data.source === 'user_array') {
          console.log(`📝 Report removed from user's array. Remaining reports: ${data.remainingReports}`);
        } else if (data.source === 'collection') {
          console.log('📋 Report status updated in reports collection');
        }
        
        // Remove the resolved report from the list
        setReports(reports.filter(r => r._id !== reportId));
      } else {
        const errorData = await response.json();
        console.error('❌ Failed to resolve report:', errorData);
        alert(`Failed to resolve report: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('💥 Error resolving report:', error);
      alert('An error occurred while resolving the report');
    } finally {
      setResolvingId(null);
    }
  };

  const calculateStatistics = () => {
    const reasonCounts: { [key: string]: number } = {};
    reports.forEach(report => {
      reasonCounts[report.reason] = (reasonCounts[report.reason] || 0) + 1;
    });
    const reportsByReason = Object.entries(reasonCounts).map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value
    }));

    const statusCounts: { [key: string]: number } = {};
    reports.forEach(report => {
      statusCounts[report.status] = (statusCounts[report.status] || 0) + 1;
    });
    const reportsByStatus = Object.entries(statusCounts).map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value
    }));

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

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedReports = [...reports].sort((a, b) => {
    let compareA: string = '';
    let compareB: string = '';

    switch (sortField) {
      case 'reportedUser':
        compareA = (a.reportedUser?.username || '').toLowerCase();
        compareB = (b.reportedUser?.username || '').toLowerCase();
        break;
      case 'reporter':
        compareA = (a.reporter?.username || '').toLowerCase();
        compareB = (b.reporter?.username || '').toLowerCase();
        break;
      case 'reason':
        compareA = a.reason.toLowerCase();
        compareB = b.reason.toLowerCase();
        break;
      case 'date':
        return sortDirection === 'asc' 
          ? new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          : new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }

    if (sortDirection === 'asc') {
      return compareA.localeCompare(compareB);
    } else {
      return compareB.localeCompare(compareA);
    }
  });

  // Calculate pagination
  const totalPages = Math.ceil(sortedReports.length / reportsPerPage);
  const startIndex = (currentPage - 1) * reportsPerPage;
  const endIndex = startIndex + reportsPerPage;
  const paginatedReports = sortedReports.slice(startIndex, endIndex);

  // Calculate progress bar percentage
  const progressPercentage = totalPages > 0 ? (currentPage / totalPages) * 100 : 0;

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      // Scroll to top of reports list
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Reset to page 1 when reports change
  useEffect(() => {
    setCurrentPage(1);
  }, [reports.length]);

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
                <p className="stat-label">Total Pending</p>
                <p className="stat-value">{statistics.pendingReports}</p>
              </div>
            </div>

            <div className="stat-card pending">
              <div className="stat-icon">
                <svg viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="stat-info">
                <p className="stat-label">Resolved</p>
                <p className="stat-value">{statistics.resolvedReports}</p>
              </div>
            </div>

            <div className="stat-card resolved">
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
          Pending Reports ({reports.length})
        </h3>
        {reports.length > reportsPerPage && (
          <div className="pagination-info">
            <span>Page {currentPage} of {totalPages}</span>
            <span className="showing-records">
              Showing {startIndex + 1}-{Math.min(endIndex, reports.length)} of {reports.length}
            </span>
          </div>
        )}
      </div>

      {reports.length > reportsPerPage && (
        <div className="pagination-bar-container">
          <div className="pagination-progress-bar">
            <div 
              className="pagination-progress-fill"
              style={{ width: `${progressPercentage}%` }}
            />
            <div className="pagination-markers">
              {Array.from({ length: totalPages }, (_, i) => (
                <div
                  key={i}
                  className={`pagination-marker ${currentPage === i + 1 ? 'active' : ''} ${currentPage > i + 1 ? 'completed' : ''}`}
                  style={{ left: `${((i + 1) / totalPages) * 100}%` }}
                  onClick={() => handlePageChange(i + 1)}
                  title={`Page ${i + 1}`}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {reports.length > 0 ? (
        <>
        <div className="reports-table-container">
          <table className="reports-table">
            <thead>
              <tr>
                <th onClick={() => handleSort('reportedUser')} className="sortable">
                  <div className="th-content">
                    <span>Reported User</span>
                    <svg className={`sort-icon ${sortField === 'reportedUser' ? 'active' : ''} ${sortDirection}`} viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </div>
                </th>
                <th onClick={() => handleSort('reporter')} className="sortable">
                  <div className="th-content">
                    <span>Reporter</span>
                    <svg className={`sort-icon ${sortField === 'reporter' ? 'active' : ''} ${sortDirection}`} viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </div>
                </th>
                <th onClick={() => handleSort('reason')} className="sortable">
                  <div className="th-content">
                    <span>Reason</span>
                    <svg className={`sort-icon ${sortField === 'reason' ? 'active' : ''} ${sortDirection}`} viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </div>
                </th>
                <th onClick={() => handleSort('date')} className="sortable">
                  <div className="th-content">
                    <span>Date</span>
                    <svg className={`sort-icon ${sortField === 'date' ? 'active' : ''} ${sortDirection}`} viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </div>
                </th>
                <th className="action-column">Action</th>
              </tr>
            </thead>
            <tbody>
              {paginatedReports.map((report) => (
                <tr key={report._id}>
                  <td>
                    <div className="user-cell">
                      <svg viewBox="0 0 20 20" fill="currentColor" className="user-icon">
                        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                      </svg>
                      <span>@{report.reportedUser?.username || 'Unknown'}</span>
                    </div>
                  </td>
                  <td>
                    <div className="user-cell">
                      <svg viewBox="0 0 20 20" fill="currentColor" className="user-icon">
                        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                      </svg>
                      <span>@{report.reporter?.username || 'Unknown'}</span>
                    </div>
                  </td>
                  <td>
                    <span className="reason-badge">{report.reason}</span>
                  </td>
                  <td>
                    <span className="date-text">
                      {new Date(report.createdAt).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </span>
                  </td>
                  <td className="action-cell">
                    <button 
                      className="resolve-btn"
                      onClick={() => handleResolveReport(
                        report._id, 
                        String(report.reportedUserId),
                        String(report.reporterId)
                      )}
                      disabled={resolvingId === report._id}
                      title="Mark as Resolved"
                    >
                      {resolvingId === report._id ? (
                        <div className="btn-spinner"></div>
                      ) : (
                        <svg viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {reports.length > reportsPerPage && (
          <div className="pagination-controls">
            <button 
              className="pagination-btn"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <svg viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Previous
            </button>

            <div className="pagination-pages">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                const showPage = 
                  page === 1 || 
                  page === totalPages || 
                  (page >= currentPage - 1 && page <= currentPage + 1);
                
                const showEllipsis = 
                  (page === 2 && currentPage > 3) ||
                  (page === totalPages - 1 && currentPage < totalPages - 2);

                if (showEllipsis) {
                  return <span key={page} className="pagination-ellipsis">...</span>;
                }

                if (!showPage) {
                  return null;
                }

                return (
                  <button
                    key={page}
                    className={`pagination-page ${currentPage === page ? 'active' : ''}`}
                    onClick={() => handlePageChange(page)}
                  >
                    {page}
                  </button>
                );
              })}
            </div>

            <button 
              className="pagination-btn"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              Next
              <svg viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        )}
        </>
      ) : (
        <div className="no-results">
          <svg viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <p>No pending reports</p>
        </div>
      )}
    </div>
  );
}

export default Reports;
