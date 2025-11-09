import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Auth.css';
import PrivacyPolicy from '../Legal/PrivacyPolicy';
import TermsConditions from '../Legal/TermsConditions';
import About from '../Legal/About';
import Contact from '../Legal/Contact';

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
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [recaptchaLoaded, setRecaptchaLoaded] = useState(false);
  const [showResendOption, setShowResendOption] = useState(false);
  const [unverifiedEmail, setUnverifiedEmail] = useState('');
  const [showPrivacyPolicy, setShowPrivacyPolicy] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const [showContact, setShowContact] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';
  const navigate = useNavigate();

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

  const handleResendVerification = async () => {
    if (!unverifiedEmail) return;
    
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/auth/resend-verification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: unverifiedEmail }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to resend verification email');
      }

      alert('Verification email sent! Please check your inbox.');
      setError('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
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
        }
        throw new Error(data.error || 'Login failed');
      }

      // Reset verification error state on successful login
      setShowResendOption(false);
      setUnverifiedEmail('');

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
      <button className="auth-theme-toggle" onClick={toggleTheme} title="Toggle theme">
        {theme === 'light' ? '🌙' : '☀️'}
      </button>
      <div className="auth-card">
        <div className="auth-logo">
          <h1 className="auth-logo-text">💬 {import.meta.env.VITE_APP_NAME || 'netcify'}</h1>
        </div>
        <h1>🚀 Welcome Back!</h1>
        <p className="subtitle">Sign in to your account</p>

        <form onSubmit={handleSubmit}>
          {error && <div className="error-message">{error}</div>}

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

          <button type="submit" className="auth-button" disabled={loading || !recaptchaLoaded}>
            {loading ? 'Signing in...' : !recaptchaLoaded ? 'Loading...' : 'Sign In'}
          </button>

          {showResendOption && (
            <button 
              type="button"
              className="auth-button" 
              onClick={handleResendVerification}
              disabled={loading}
              style={{ 
                marginTop: '10px',
                background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
              }}
            >
              📧 Resend Verification Email
            </button>
          )}

          <div className="recaptcha-notice">
            <small>
              This site is protected by reCAPTCHA and the Google{' '}
              <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">Privacy Policy</a> and{' '}
              <a href="https://policies.google.com/terms" target="_blank" rel="noopener noreferrer">Terms of Service</a> apply.
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
      {showAbout && <About onClose={() => setShowAbout(false)} />}
      {showContact && <Contact onClose={() => setShowContact(false)} />}
    </div>
  );
}

export default Login;
