import { useState } from 'react';
import { useGoogleReCaptcha } from 'react-google-recaptcha-v3';
import { loginRateLimiter, AuditLogger, sanitizeInput } from '../utils/security';
import './Login.css';

interface LoginProps {
  onLogin: (admin: any, token: string) => void;
}

function Login({ onLogin }: LoginProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { executeRecaptcha } = useGoogleReCaptcha();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // Sanitize inputs
      const sanitizedUsername = sanitizeInput(username.trim());
      
      // Check rate limiting
      if (!loginRateLimiter.canMakeRequest('login')) {
        setError('Too many login attempts. Please try again in 15 minutes.');
        AuditLogger.log('LOGIN_RATE_LIMITED', { username: sanitizedUsername });
        setIsLoading(false);
        return;
      }

      // Get reCAPTCHA token
      if (!executeRecaptcha) {
        setError('reCAPTCHA not loaded. Please refresh the page.');
        setIsLoading(false);
        return;
      }

      const recaptchaToken = await executeRecaptcha('admin_login');
      
      AuditLogger.log('LOGIN_ATTEMPT', { username: sanitizedUsername });

      const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          username: sanitizedUsername, 
          password,
          recaptchaToken 
        })
      });

      const data = await response.json();

      if (response.ok) {
        // Check if user has admin role
        if (data.user.role === 'admin') {
          AuditLogger.log('LOGIN_SUCCESS', { 
            userId: data.user.id, 
            username: sanitizeInput(username.trim())
          });
          // Reset rate limiter on successful login
          loginRateLimiter.reset('login');
          onLogin(data.user, data.accessToken);
        } else {
          AuditLogger.log('LOGIN_FAILED_INVALID_ROLE', { 
            username: sanitizeInput(username.trim()),
            role: data.user.role 
          });
          setError('Access denied. Admin privileges required.');
        }
      } else {
        AuditLogger.log('LOGIN_FAILED', { 
          username: sanitizeInput(username.trim()),
          error: data.error 
        });
        setError(data.error || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      AuditLogger.log('LOGIN_ERROR', { 
        username: sanitizeInput(username.trim()),
        error: String(error) 
      });
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-background-shapes">
        <div className="shape shape-1"></div>
        <div className="shape shape-2"></div>
        <div className="shape shape-3"></div>
      </div>
      
      <div className="login-card">
        <div className="login-logo-container">
          <img 
            src="/logo_sedatchat.gif" 
            alt="Netcify Logo" 
            className="login-logo"
          />
        </div>

        <div className="login-header">
          <h1>Admin Dashboard</h1>
          <p>Sign in to manage your platform</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          {error && (
            <div className="error-message">
              <svg className="error-icon" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          <div className="form-group">
            <label htmlFor="username">
              <svg className="input-icon" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
              </svg>
              Username
            </label>
            <div className="input-wrapper">
              <input
                type="text"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter admin username"
                required
                disabled={isLoading}
                autoComplete="username"
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="password">
              <svg className="input-icon" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
              </svg>
              Password
            </label>
            <div className="input-wrapper">
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                required
                disabled={isLoading}
                autoComplete="current-password"
              />
            </div>
          </div>

          <button
            type="submit"
            className="login-button"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <span className="button-spinner"></span>
                Signing in...
              </>
            ) : (
              <>
                <svg className="button-icon" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M3 3a1 1 0 011 1v12a1 1 0 11-2 0V4a1 1 0 011-1zm7.707 3.293a1 1 0 010 1.414L9.414 9H17a1 1 0 110 2H9.414l1.293 1.293a1 1 0 01-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Sign In
              </>
            )}
          </button>
        </form>

        <div className="login-footer">
          <div className="security-badge">
            <svg viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span>Secure Admin Access</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
