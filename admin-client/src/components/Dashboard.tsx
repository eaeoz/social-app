import { useState } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import Users from './Users';
import Reports from './Reports';
import Settings from './Settings';
import Statistics from './Statistics';
import Rooms from './Rooms';
import ArchivedReports from './ArchivedReports';
import Cleanup from './Cleanup';
import Articles from './Articles';
import { useTheme } from '../contexts/ThemeContext';
import './Dashboard.css';

interface DashboardProps {
  admin: any;
  onLogout: () => void;
}

function Dashboard({ admin, onLogout }: DashboardProps) {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="dashboard-container">
      <aside className={`dashboard-sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <h2>🔐 Admin Panel</h2>
          <button 
            className="sidebar-close"
            onClick={() => setSidebarOpen(false)}
          >
            ×
          </button>
        </div>

        <nav className="sidebar-nav">
          <Link
            to="/"
            className={`nav-item ${location.pathname === '/' ? 'active' : ''}`}
            onClick={() => setSidebarOpen(false)}
          >
            <span className="nav-icon">📊</span>
            <span className="nav-label">Statistics</span>
          </Link>
          <Link
            to="/users"
            className={`nav-item ${location.pathname === '/users' ? 'active' : ''}`}
            onClick={() => setSidebarOpen(false)}
          >
            <span className="nav-icon">👥</span>
            <span className="nav-label">Users</span>
          </Link>
          <Link
            to="/rooms"
            className={`nav-item ${location.pathname === '/rooms' ? 'active' : ''}`}
            onClick={() => setSidebarOpen(false)}
          >
            <span className="nav-icon">🏠</span>
            <span className="nav-label">Rooms</span>
          </Link>
          <Link
            to="/archived-reports"
            className={`nav-item ${location.pathname === '/archived-reports' ? 'active' : ''}`}
            onClick={() => setSidebarOpen(false)}
          >
            <span className="nav-icon">📦</span>
            <span className="nav-label">Archived Reports</span>
          </Link>
          <Link
            to="/settings"
            className={`nav-item ${location.pathname === '/settings' ? 'active' : ''}`}
            onClick={() => setSidebarOpen(false)}
          >
            <span className="nav-icon">⚙️</span>
            <span className="nav-label">Settings</span>
          </Link>
          <Link
            to="/cleanup"
            className={`nav-item ${location.pathname === '/cleanup' ? 'active' : ''}`}
            onClick={() => setSidebarOpen(false)}
          >
            <span className="nav-icon">🧹</span>
            <span className="nav-label">Cleanup</span>
          </Link>
          
          <div className="nav-separator"></div>
          
          <Link
            to="/reports"
            className={`nav-item ${location.pathname === '/reports' ? 'active' : ''}`}
            onClick={() => setSidebarOpen(false)}
          >
            <span className="nav-icon">🚨</span>
            <span className="nav-label">Reports</span>
          </Link>
          <Link
            to="/articles"
            className={`nav-item ${location.pathname === '/articles' ? 'active' : ''}`}
            onClick={() => setSidebarOpen(false)}
          >
            <span className="nav-icon">📝</span>
            <span className="nav-label">Articles</span>
          </Link>
        </nav>

        <div className="sidebar-footer">
          <div className="admin-info">
            <div className="admin-avatar">
              {admin.profilePicture ? (
                <img src={admin.profilePicture} alt={admin.username} />
              ) : (
                admin.username.charAt(0).toUpperCase()
              )}
            </div>
            <div className="admin-details">
              <div className="admin-name">{admin.nickName || admin.username}</div>
              <div className="admin-role">Administrator</div>
            </div>
          </div>
          <button className="logout-button" onClick={onLogout}>
            🚪 Logout
          </button>
        </div>
      </aside>

      <main className="dashboard-main">
        <header className="dashboard-header">
          <button
            className="mobile-menu-button"
            onClick={() => setSidebarOpen(true)}
          >
            <span className="hamburger-line"></span>
            <span className="hamburger-line"></span>
            <span className="hamburger-line"></span>
          </button>
          <h1>Netcify Admin Dashboard</h1>
          <ThemeToggle />
        </header>

        <div className="dashboard-content">
          <Routes>
            <Route path="/" element={<Statistics />} />
            <Route path="/users" element={<Users />} />
            <Route path="/articles" element={<Articles />} />
            <Route path="/rooms" element={<Rooms />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/archived-reports" element={<ArchivedReports />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/cleanup" element={<Cleanup />} />
          </Routes>
        </div>
      </main>

      {sidebarOpen && (
        <div 
          className="sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}

function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      className="theme-toggle"
      onClick={toggleTheme}
      aria-label="Toggle theme"
      title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
    >
      <div className="theme-toggle-slider">
        <span className="theme-toggle-icon">
          {theme === 'light' ? '☀️' : '🌙'}
        </span>
      </div>
    </button>
  );
}

export default Dashboard;
