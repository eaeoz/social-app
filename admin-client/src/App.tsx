import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { GoogleReCaptchaProvider } from 'react-google-recaptcha-v3';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import { ThemeProvider } from './contexts/ThemeContext';
import { SecureSessionManager, AuditLogger, isTokenExpired } from './utils/security';
import { updatePageMetadata } from './utils/seo';
import './App.css';

// SEO metadata updater component
function SEOUpdater() {
  const location = useLocation();

  useEffect(() => {
    // Update page metadata when route changes
    updatePageMetadata(location.pathname);
  }, [location.pathname]);

  return null;
}

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [admin, setAdmin] = useState<any>(null);

  useEffect(() => {
    checkAuth();
    
    // Initialize session management
    SecureSessionManager.init(() => {
      AuditLogger.log('SESSION_EXPIRED', { userId: admin?.id });
      handleLogout();
      alert('Your session has expired due to inactivity. Please log in again.');
    });

    // Cleanup on unmount
    return () => {
      SecureSessionManager.cleanup();
    };
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem('adminToken');
    const adminData = localStorage.getItem('adminData');
    
    if (!token || !adminData) {
      setIsLoading(false);
      return;
    }

    try {
      // Check if token is expired
      if (isTokenExpired(token)) {
        AuditLogger.log('TOKEN_EXPIRED');
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminData');
        setIsLoading(false);
        return;
      }

      const parsedAdmin = JSON.parse(adminData);
      if (parsedAdmin.role === 'admin') {
        setAdmin(parsedAdmin);
        setIsAuthenticated(true);
        AuditLogger.log('AUTH_CHECK_SUCCESS', { userId: parsedAdmin.id });
      } else {
        AuditLogger.log('AUTH_CHECK_FAILED_INVALID_ROLE', { role: parsedAdmin.role });
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminData');
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      AuditLogger.log('AUTH_CHECK_ERROR', { error: String(error) });
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminData');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = (adminData: any, token: string) => {
    localStorage.setItem('adminToken', token);
    localStorage.setItem('adminData', JSON.stringify(adminData));
    setAdmin(adminData);
    setIsAuthenticated(true);
    
    // Reset session timer
    SecureSessionManager.updateActivity();
    
    // Log successful login
    AuditLogger.log('LOGIN_SUCCESS', {
      userId: adminData.id,
      username: adminData.username,
      timestamp: new Date().toISOString()
    }, adminData.id);
  };

  const handleLogout = () => {
    // Log logout before clearing data
    AuditLogger.log('LOGOUT', {
      userId: admin?.id,
      username: admin?.username,
      timestamp: new Date().toISOString()
    }, admin?.id);
    
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminData');
    setAdmin(null);
    setIsAuthenticated(false);
    
    // Cleanup session
    SecureSessionManager.cleanup();
  };

  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <GoogleReCaptchaProvider
      reCaptchaKey={import.meta.env.VITE_RECAPTCHA_SITE_KEY || ''}
      scriptProps={{
        async: true,
        defer: true,
        appendTo: 'head',
      }}
    >
      <ThemeProvider>
        <Router>
          <SEOUpdater />
          <Routes>
          <Route
            path="/login"
            element={
              isAuthenticated ? (
                <Navigate to="/" replace />
              ) : (
                <Login onLogin={handleLogin} />
              )
            }
          />
          <Route
            path="/*"
            element={
              isAuthenticated ? (
                <Dashboard admin={admin} onLogout={handleLogout} />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
          </Routes>
        </Router>
      </ThemeProvider>
    </GoogleReCaptchaProvider>
  );
}

export default App;
