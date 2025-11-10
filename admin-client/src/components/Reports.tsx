import { useState, useEffect } from 'react';
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

function Reports() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchReports();
  }, []);

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
        <h2>Reports Management</h2>
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
