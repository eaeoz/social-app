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
    let isMounted = true;

    // Set a timeout fallback to prevent indefinite loading
    const timeoutId = setTimeout(() => {
      if (!processed && isMounted) {
        console.error('⏱️ OAuth callback timeout - redirecting to login');
        navigate('/login?error=timeout', { replace: true });
      }
    }, 5000); // 5 second timeout

    const processCallback = () => {
      try {
        // Prevent double processing
        if (processed) {
          console.log('⚠️ Callback already processed, skipping...');
          return;
        }

        console.log('🔄 Processing OAuth callback...');
        
        const token = searchParams.get('token');
        const refresh = searchParams.get('refresh');
        const userParam = searchParams.get('user');

        console.log('📋 Callback params:', { 
          hasToken: !!token, 
          hasRefresh: !!refresh, 
          hasUser: !!userParam 
        });

        if (!token || !refresh || !userParam) {
          processed = true;
          clearTimeout(timeoutId);
          console.error('❌ Missing OAuth parameters');
          setStatus('Missing parameters...');
          if (isMounted) {
            navigate('/login?error=missing_params', { replace: true });
          }
          return;
        }

        setStatus('Parsing user data...');
        const user = JSON.parse(decodeURIComponent(userParam));
        console.log('👤 Parsed user:', user.username);
        
        setStatus('Storing credentials...');
        
        // Clear any existing session first
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        
        // Store new tokens
        localStorage.setItem('accessToken', token);
        localStorage.setItem('refreshToken', refresh);
        
        // Format user data to match expected structure
        const userData = {
          userId: user._id,
          username: user.username,
          email: user.email,
          displayName: user.displayName || user.username,
          nickName: user.nickName || user.username,
          profilePicture: user.profilePictureUrl || null,
          age: user.age,
          gender: user.gender,
          bio: user.bio || '',
          isEmailVerified: user.isEmailVerified,
          createdAt: user.createdAt
        };
        
        localStorage.setItem('user', JSON.stringify(userData));
        console.log('💾 User data stored in localStorage');

        setStatus('Logging in...');
        // Call success handler (non-blocking)
        if (isMounted) {
          onLoginSuccess(userData);
          console.log('✅ Login success handler called');
        }
        
        processed = true;
        clearTimeout(timeoutId);
        
        setStatus('Success! Redirecting...');
        // Navigate immediately - don't wait
        if (isMounted) {
          console.log('🔄 Navigating to home...');
          navigate('/', { replace: true });
        }
      } catch (error) {
        processed = true;
        clearTimeout(timeoutId);
        console.error('❌ Error in OAuth callback:', error);
        setStatus('Error occurred...');
        if (isMounted) {
          navigate('/login?error=invalid_callback', { replace: true });
        }
      }
    };

    // Small delay to ensure component is mounted
    const processingTimer = setTimeout(() => {
      if (isMounted) {
        processCallback();
      }
    }, 100);

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
      clearTimeout(processingTimer);
    };
  }, []); // Empty deps to run only once

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
