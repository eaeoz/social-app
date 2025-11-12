import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import './Auth.css';
import { updateSEOTags } from '../../utils/seo';

function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');

  // Update SEO tags for email verification page
  useEffect(() => {
    updateSEOTags('/verify-email');
  }, []);
  const [message, setMessage] = useState('');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

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

  useEffect(() => {
    const verifyEmail = async () => {
      const token = searchParams.get('token');

      if (!token) {
        setStatus('error');
        setMessage('No verification token provided');
        return;
      }

      try {
        const response = await fetch(`${API_URL}/auth/verify-email`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ token }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Verification failed');
        }

        setStatus('success');
        setMessage(data.message || 'Email verified successfully!');

        // Redirect to login after 3 seconds
        setTimeout(() => {
          navigate('/');
        }, 3000);
      } catch (error: any) {
        setStatus('error');
        setMessage(error.message || 'Verification failed');
      }
    };

    verifyEmail();
  }, [searchParams, navigate, API_URL]);

  return (
    <div className="auth-container" data-theme={theme}>
      <button className="auth-theme-toggle" onClick={toggleTheme} title="Toggle theme">
        {theme === 'light' ? '🌙' : '☀️'}
      </button>
      
      <div className="auth-card">
        <div className="auth-logo">
          <h1 className="auth-logo-text">💬 {import.meta.env.VITE_APP_NAME || 'netcify'}</h1>
        </div>

        {status === 'verifying' && (
          <>
            <div style={{ fontSize: '4rem', textAlign: 'center', marginBottom: '20px' }}>
              ⏳
            </div>
            <h1>Verifying Email...</h1>
            <p className="subtitle">Please wait while we verify your email address</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div style={{ fontSize: '4rem', textAlign: 'center', marginBottom: '20px' }}>
              ✅
            </div>
            <h1>Email Verified!</h1>
            <p className="subtitle">{message}</p>
            <p className="subtitle">Redirecting to login page...</p>
            <button 
              className="auth-button" 
              onClick={() => navigate('/')}
              style={{ marginTop: '20px' }}
            >
              Go to Login Now
            </button>
          </>
        )}

        {status === 'error' && (
          <>
            <div style={{ fontSize: '4rem', textAlign: 'center', marginBottom: '20px' }}>
              ❌
            </div>
            <h1>Verification Failed</h1>
            <div className="error-message">{message}</div>
            <p className="subtitle">
              The verification link may have expired or is invalid.
              Please try registering again or contact support.
            </p>
            <button 
              className="auth-button" 
              onClick={() => navigate('/')}
              style={{ marginTop: '20px' }}
            >
              Back to Login
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default VerifyEmail;
