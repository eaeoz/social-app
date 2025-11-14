import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './Auth.css';
import PrivacyPolicy from '../Legal/PrivacyPolicy';
import TermsConditions from '../Legal/TermsConditions';
import About from '../Legal/About';
import Contact from '../Legal/Contact';
import Blog from '../Legal/Blog';
import { updateSEOTags } from '../../utils/seo';

interface LoginProps {
  onLoginSuccess: (user: any, token: string) => void;
  onSwitchToRegister: () => void;
}

// Declare grecaptcha for TypeScript
declare global {
  interface Window {
    grecaptcha: any;
  }
}

function Login({ onLoginSuccess, onSwitchToRegister }: LoginProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [recaptchaLoaded, setRecaptchaLoaded] = useState(false);
  const [showResendOption, setShowResendOption] = useState(false);
  const [unverifiedEmail, setUnverifiedEmail] = useState('');
  const [resendLoading, setResendLoading] = useState(false);
  const [remainingAttempts, setRemainingAttempts] = useState<number | null>(null);
  const [maxAttempts, setMaxAttempts] = useState<number | null>(null);
  const [showPrivacyPolicy, setShowPrivacyPolicy] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const [showContact, setShowContact] = useState(false);
  const [showBlog, setShowBlog] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

  // Handle direct URL access to modal pages
  useEffect(() => {
    const path = location.pathname;
    
    // Update SEO tags based on current path
    updateSEOTags(path);
    
    // Open corresponding modal based on URL path
    if (path === '/about') {
      setShowAbout(true);
      navigate('/', { replace: true }); // Reset URL to home
    } else if (path === '/contact') {
      setShowContact(true);
      navigate('/', { replace: true });
    } else if (path === '/privacy') {
      setShowPrivacyPolicy(true);
      navigate('/', { replace: true });
    } else if (path === '/terms') {
      setShowTerms(true);
      navigate('/', { replace: true });
    } else if (path === '/blog') {
      // Open blog modal for /blog URL only (articles now have dedicated routes)
      setShowBlog(true);
      navigate('/', { replace: true });
    }
  }, [location.pathname, navigate]);

  const handleGoogleLogin = () => {
    // Redirect to Google OAuth
    window.location.href = `${API_URL}/auth/google`;
  };

  // Load reCAPTCHA script
  useEffect(() => {
    const siteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY;
    if (!siteKey) {
      console.error('reCAPTCHA site key not found');
      return;
    }

    // Check if script already exists
    if (document.querySelector(`script[src*="recaptcha"]`)) {
      setRecaptchaLoaded(true);
      return;
    }

    const script = document.createElement('script');
    script.src = `https://www.google.com/recaptcha/api.js?render=${siteKey}`;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      setRecaptchaLoaded(true);
    };
    document.head.appendChild(script);
  }, []);

  useEffect(() => {
    const savedTheme = localStorage.getItem('authTheme') as 'light' | 'dark' | null;
    if (savedTheme) {
      setTheme(savedTheme);
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('authTheme', newTheme);
  };

  const handleResendVerification = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    if (!unverifiedEmail || !password) {
      alert('Please ensure email and password are entered');
      return;
    }
    
    setResendLoading(true);
    try {
      const response = await fetch(`${API_URL}/auth/resend-verification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: unverifiedEmail, password: password }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Show simple error in alert modal
        if (response.status === 401) {
          alert('Password wrong!');
        } else if (response.status === 429) {
          alert('Maximum attempts reached. Please contact the site administrator.');
        } else {
          alert(data.error || 'Failed to resend verification email');
        }
        
        // Update attempts counter if provided
        if (data.remainingAttempts !== undefined) {
          setRemainingAttempts(data.remainingAttempts);
          setMaxAttempts(data.maxAttempts);
        }
        return;
      }

      // Update remaining attempts
      if (data.remainingAttempts !== undefined) {
        setRemainingAttempts(data.remainingAttempts);
        setMaxAttempts(data.maxAttempts);
      }

      alert(data.message || 'Verification email sent! Please check your inbox.');
    } catch (err: any) {
      alert('An error occurred while sending the verification email. Please try again.');
    } finally {
      setResendLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Get reCAPTCHA token
      let recaptchaToken = '';
      if (recaptchaLoaded && window.grecaptcha) {
        const siteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY;
        try {
          recaptchaToken = await window.grecaptcha.execute(siteKey, { action: 'login' });
        } catch (error) {
          console.error('reCAPTCHA execution failed:', error);
          setError('Security verification failed. Please try again.');
          setLoading(false);
          return;
        }
      }

      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password, recaptchaToken }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Check if it's an email verification error
        if (data.requiresEmailVerification) {
          setShowResendOption(true);
          setUnverifiedEmail(data.email);
          
          // Fetch current attempt count from backend
          try {
            const attemptsResponse = await fetch(`${API_URL}/auth/get-resend-attempts`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ email: data.email }),
            });
            
            if (attemptsResponse.ok) {
              const attemptsData = await attemptsResponse.json();
              setRemainingAttempts(attemptsData.remainingAttempts || 4);
              setMaxAttempts(attemptsData.maxAttempts || 4);
            } else {
              // Fallback to default
              setRemainingAttempts(4);
              setMaxAttempts(4);
            }
          } catch (error) {
            // Fallback to default if fetch fails
            setRemainingAttempts(4);
            setMaxAttempts(4);
          }
        }
        throw new Error(data.error || 'Login failed');
      }

      // Reset verification error state on successful login
      setShowResendOption(false);
      setUnverifiedEmail('');
      setRemainingAttempts(null);
      setMaxAttempts(null);

      // Store token in localStorage
      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
      localStorage.setItem('user', JSON.stringify(data.user));

      onLoginSuccess(data.user, data.accessToken);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container" data-theme={theme}>
      <div className="auth-card">
        <div className="auth-logo">
          <h1 className="auth-logo-text">💬 {import.meta.env.VITE_APP_NAME || 'Netcify'}</h1>
          <button className="auth-theme-toggle-card" onClick={toggleTheme} title="Toggle theme" aria-label="Toggle theme">
            <div className={`toggle-switch ${theme === 'dark' ? 'active' : ''}`}>
              <div className="toggle-slider">
                <span className="toggle-icon">{theme === 'light' ? '☀️' : '🌙'}</span>
              </div>
            </div>
          </button>
        </div>
        <div className="auth-header-with-logo">
          <img 
            src="/logo_sedatchat.gif" 
            alt="Netcify Logo" 
            className="auth-logo-image"
          />
          <div className="auth-header-text">
            <h1>🚀 Welcome Back!</h1>
            <p className="subtitle">Sign in to your account</p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {error && <div className="error-message">{error}</div>}

          {!showResendOption && (
            <>
              <div className="form-group">
                <input
                  type="text"
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Username or Email"
                  required
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  required
                  disabled={loading}
                />
              </div>
            </>
          )}

          {showResendOption && (
            <div className="form-group">
              <label htmlFor="password" style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
                Enter your password to resend verification email:
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                required
                disabled={resendLoading}
              />
            </div>
          )}

          {!showResendOption && (
            <>
              <button type="submit" className="auth-button" disabled={loading || !recaptchaLoaded}>
                {loading ? 'Signing in...' : !recaptchaLoaded ? 'Loading...' : 'Sign In'}
              </button>

              <div style={{ 
                margin: '20px 0', 
                display: 'flex', 
                alignItems: 'center', 
                gap: '10px',
                color: '#666'
              }}>
                <div style={{ flex: 1, height: '1px', background: '#ddd' }}></div>
                <span style={{ fontSize: '14px' }}>OR</span>
                <div style={{ flex: 1, height: '1px', background: '#ddd' }}></div>
              </div>

              <button
                type="button"
                onClick={handleGoogleLogin}
                className="auth-button"
                disabled={loading}
                style={{
                  background: 'white',
                  color: '#444',
                  border: '2px solid #ddd',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px',
                  fontWeight: '500'
                }}
              >
                <svg width="18" height="18" viewBox="0 0 18 18">
                  <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"/>
                  <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z"/>
                  <path fill="#FBBC05" d="M3.964 10.707c-.18-.54-.282-1.117-.282-1.707 0-.593.102-1.17.282-1.709V4.958H.957C.347 6.173 0 7.548 0 9c0 1.452.348 2.827.957 4.042l3.007-2.335z"/>
                  <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"/>
                </svg>
                Continue with Google
              </button>
            </>
          )}

          {showResendOption && (
            <>
              {remainingAttempts !== null && maxAttempts !== null && (
                <div style={{ 
                  marginTop: '10px', 
                  padding: '10px', 
                  background: remainingAttempts > 0 ? 'rgba(59, 130, 246, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                  borderRadius: '8px',
                  fontSize: '14px',
                  textAlign: 'center'
                }}>
                  {remainingAttempts > 0 ? (
                    <span style={{ color: '#3b82f6' }}>
                      📧 Attempts remaining: <strong>{remainingAttempts}/{maxAttempts}</strong>
                    </span>
                  ) : (
                    <span style={{ color: '#ef4444' }}>
                      ⚠️ Maximum attempts reached. Please contact the site administrator for assistance.
                    </span>
                  )}
                </div>
              )}

              <button
                type="button"
                className="auth-button" 
                onClick={handleResendVerification}
                disabled={resendLoading || (remainingAttempts !== null && remainingAttempts <= 0)}
                style={{ 
                  marginTop: '10px',
                  background: (remainingAttempts !== null && remainingAttempts <= 0) 
                    ? 'linear-gradient(135deg, #9ca3af 0%, #6b7280 100%)'
                    : 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
                }}
              >
                {resendLoading ? 'Sending...' : '📧 Resend Verification Email'}
              </button>

              <button 
                type="button"
                className="auth-button" 
                onClick={() => {
                  setShowResendOption(false);
                  setUnverifiedEmail('');
                  setRemainingAttempts(null);
                  setMaxAttempts(null);
                }}
                style={{ 
                  marginTop: '10px',
                  background: 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)'
                }}
              >
                ← Back to Sign In
              </button>
            </>
          )}

          <div className="recaptcha-notice">
            <small>
              This site is protected by reCAPTCHA and the Google{' '}
              <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" aria-label="Read Google's Privacy Policy">Privacy Policy</a> and{' '}
              <a href="https://policies.google.com/terms" target="_blank" rel="noopener noreferrer" aria-label="Read Google's Terms of Service">Terms of Service</a> apply.
            </small>
          </div>
        </form>

        <div className="auth-footer">
          <p>
            Don't have an account?{' '}
            <button onClick={onSwitchToRegister} className="link-button">
              Sign Up
            </button>
          </p>
        </div>

        <div className="auth-footer-links">
          <button onClick={() => setShowPrivacyPolicy(true)} className="footer-link-button">
            Privacy Policy
          </button>
          <span className="footer-separator">•</span>
          <button onClick={() => setShowTerms(true)} className="footer-link-button">
            Terms
          </button>
          <span className="footer-separator">•</span>
          <button onClick={() => setShowBlog(true)} className="footer-link-button">
            Blog
          </button>
          <span className="footer-separator">•</span>
          <button onClick={() => setShowAbout(true)} className="footer-link-button">
            About
          </button>
          <span className="footer-separator">•</span>
          <button onClick={() => setShowContact(true)} className="footer-link-button">
            Contact
          </button>
        </div>
      </div>

      {showPrivacyPolicy && <PrivacyPolicy onClose={() => setShowPrivacyPolicy(false)} />}
      {showTerms && <TermsConditions onClose={() => setShowTerms(false)} />}
      {showBlog && <Blog onClose={() => setShowBlog(false)} />}
      {showAbout && <About onClose={() => setShowAbout(false)} />}
      {showContact && <Contact onClose={() => setShowContact(false)} />}
    </div>
  );
}

export default Login;
