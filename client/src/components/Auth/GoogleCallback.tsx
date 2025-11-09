import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

interface GoogleCallbackProps {
  onLoginSuccess: (user: any) => void;
}

function GoogleCallback({ onLoginSuccess }: GoogleCallbackProps) {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('Processing...');

  useEffect(() => {
    let processed = false;

    // Set a timeout fallback to prevent indefinite loading
    const timeoutId = setTimeout(() => {
      if (!processed) {
        console.error('OAuth callback timeout - redirecting to login');
        navigate('/login?error=timeout');
      }
    }, 5000); // 5 second timeout

    const processCallback = async () => {
      try {
        const token = searchParams.get('token');
        const refresh = searchParams.get('refresh');
        const userParam = searchParams.get('user');

        if (!token || !refresh || !userParam) {
          processed = true;
          clearTimeout(timeoutId);
          setStatus('Missing parameters...');
          setTimeout(() => navigate('/login?error=missing_params'), 1000);
          return;
        }

        setStatus('Parsing user data...');
        const user = JSON.parse(decodeURIComponent(userParam));
        
        setStatus('Storing credentials...');
        // Store tokens
        localStorage.setItem('accessToken', token);
        localStorage.setItem('refreshToken', refresh);
        
        // Format user data to match expected structure
        const userData = {
          userId: user._id,
          username: user.username,
          email: user.email,
          displayName: user.displayName || user.username,
          age: user.age,
          gender: user.gender,
          bio: user.bio || '',
          isEmailVerified: user.isEmailVerified,
          createdAt: user.createdAt
        };
        
        localStorage.setItem('user', JSON.stringify(userData));

        setStatus('Logging in...');
        // Call success handler
        await onLoginSuccess(userData);
        
        processed = true;
        clearTimeout(timeoutId);
        
        setStatus('Redirecting to home...');
        // Use a small delay to ensure state updates complete
        setTimeout(() => {
          navigate('/', { replace: true });
        }, 100);
      } catch (error) {
        processed = true;
        clearTimeout(timeoutId);
        console.error('Error parsing OAuth callback data:', error);
        setStatus('Error occurred...');
        setTimeout(() => navigate('/login?error=invalid_callback'), 1000);
      }
    };

    processCallback();

    return () => {
      clearTimeout(timeoutId);
    };
  }, [searchParams, onLoginSuccess, navigate]);

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    }}>
      <div style={{
        background: 'white',
        padding: '40px',
        borderRadius: '12px',
        boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
        textAlign: 'center',
        maxWidth: '400px'
      }}>
        <h2>🔐 Completing Google Sign In...</h2>
        <p style={{ margin: '10px 0', color: '#666' }}>{status}</p>
        <div style={{
          marginTop: '20px',
          fontSize: '40px',
          animation: 'spin 1s linear infinite'
        }}>
          ⏳
        </div>
        <p style={{ marginTop: '20px', fontSize: '12px', color: '#999' }}>
          This should only take a moment...
        </p>
      </div>
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

export default GoogleCallback;
