import { useState, useEffect } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { io, Socket } from 'socket.io-client';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import VerifyEmail from './components/Auth/VerifyEmail';
import GoogleCallback from './components/Auth/GoogleCallback';
import Home from './components/Home/Home';
import './App.css';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:4000';

type AuthView = 'login' | 'register';

function App() {
  // Debug: Log the URLs being used
  console.log('🔧 Environment Check:', {
    SOCKET_URL,
    API_URL: import.meta.env.VITE_API_URL,
    NODE_ENV: import.meta.env.MODE,
    ALL_ENV: import.meta.env
  });
  const navigate = useNavigate();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [user, setUser] = useState<any>(null);
  const [authView, setAuthView] = useState<AuthView>('login');
  const [isLoading, setIsLoading] = useState(true);

  // Check for existing session on mount
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    const savedUser = localStorage.getItem('user');

    if (token && savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        setUser(parsedUser);
      } catch (error) {
        console.error('Failed to parse saved user:', error);
        localStorage.removeItem('user');
        localStorage.removeItem('accessToken');
      }
    }
    setIsLoading(false);
  }, []);

  // Initialize Socket.IO connection when user is authenticated
  useEffect(() => {
    if (user && !socket) {
      const token = localStorage.getItem('accessToken');
      
      const newSocket = io(SOCKET_URL, {
        transports: ['websocket', 'polling'],
        auth: {
          token
        },
        autoConnect: true
      });

      newSocket.on('connect', () => {
        console.log('✅ Connected to server:', newSocket.id);
        console.log('👤 User data for authentication:', {
          userId: user.userId,
          username: user.username,
          fullUser: user
        });
        
        // Verify we have required user data
        if (!user.userId || !user.username) {
          console.error('❌ Missing user data! Cannot authenticate');
          console.error('User object:', user);
          return;
        }
        
        // Authenticate immediately upon connection
        console.log('📤 Sending authenticate event...');
        newSocket.emit('authenticate', {
          userId: user.userId,
          username: user.username
        });
        console.log('✅ Authenticate event sent');
        
        // Set socket AFTER authentication is sent (with longer delay to ensure it's processed)
        setTimeout(() => {
          console.log('⏱️ Setting socket in state after authentication');
          setSocket(newSocket);
        }, 200);
      });

      newSocket.on('disconnect', () => {
        console.log('❌ Disconnected from server');
      });

      newSocket.on('connect_error', (error) => {
        console.error('Connection error:', error);
      });

      // Don't set socket immediately - wait for connect event
      // setSocket(newSocket); <- REMOVED

      return () => {
        newSocket.close();
        setSocket(null);
      };
    } else if (!user && socket) {
      socket.close();
      setSocket(null);
    }
  }, [user]);

  const handleLoginSuccess = (userData: any) => {
    setUser(userData);
  };

  const handleRegisterSuccess = (userData: any) => {
    setUser(userData);
  };

  const handleLogout = () => {
    setUser(null);
    setAuthView('login');
    navigate('/');
    if (socket) {
      socket.close();
      setSocket(null);
    }
  };

  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <Routes>
      {/* Email verification route - accessible without authentication */}
      <Route path="/verify-email" element={<VerifyEmail />} />
      
      {/* Google OAuth callback route */}
      <Route path="/auth/callback" element={<GoogleCallback onLoginSuccess={handleLoginSuccess} />} />
      
      {/* Main app routes */}
      <Route path="/*" element={
        user ? (
          <Home user={user} socket={socket} onLogout={handleLogout} />
        ) : authView === 'login' ? (
          <Login
            onLoginSuccess={handleLoginSuccess}
            onSwitchToRegister={() => setAuthView('register')}
          />
        ) : (
          <Register
            onRegisterSuccess={handleRegisterSuccess}
            onSwitchToLogin={() => setAuthView('login')}
          />
        )
      } />
    </Routes>
  );
}

export default App;
