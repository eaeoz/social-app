import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

interface GoogleCallbackProps {
  onLoginSuccess: (user: any) => void;
}

function GoogleCallback({ onLoginSuccess }: GoogleCallbackProps) {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const token = searchParams.get('token');
    const refresh = searchParams.get('refresh');
    const userParam = searchParams.get('user');

    if (token && refresh && userParam) {
      try {
        const user = JSON.parse(decodeURIComponent(userParam));
        
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

        // Call success handler
        onLoginSuccess(userData);
        
        // Navigate to home
        navigate('/');
      } catch (error) {
        console.error('Error parsing OAuth callback data:', error);
        navigate('/login?error=invalid_callback');
      }
    } else {
      // Missing parameters
      navigate('/login?error=missing_params');
    }
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
        textAlign: 'center'
      }}>
        <h2>🔐 Completing Google Sign In...</h2>
        <p>Please wait while we log you in.</p>
        <div style={{
          marginTop: '20px',
          fontSize: '40px',
          animation: 'spin 1s linear infinite'
        }}>
          ⏳
        </div>
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
