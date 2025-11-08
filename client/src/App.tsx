import { useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
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
        }
      });

      newSocket.on('connect', () => {
        console.log('✅ Connected to server:', newSocket.id);
        console.log('👤 User data for authentication:', {
          userId: user.userId,
          username: user.username,
          fullUser: user
        });
        // Authenticate immediately upon connection
        console.log('📤 Sending authenticate event...');
        newSocket.emit('authenticate', {
          userId: user.userId,
          username: user.username
        });
        console.log('✅ Authenticate event sent');
      });

      newSocket.on('disconnect', () => {
        console.log('❌ Disconnected from server');
      });

      newSocket.on('connect_error', (error) => {
        console.error('Connection error:', error);
      });

      setSocket(newSocket);

      return () => {
        newSocket.close();
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
    setAuthView('login'); // Always redirect to login page after logout
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

  // If user is authenticated, show Home page
  if (user) {
    return <Home user={user} socket={socket} onLogout={handleLogout} />;
  }

  // Otherwise show authentication pages
  if (authView === 'login') {
    return (
      <Login
        onLoginSuccess={handleLoginSuccess}
        onSwitchToRegister={() => setAuthView('register')}
      />
    );
  }

  return (
    <Register
      onRegisterSuccess={handleRegisterSuccess}
      onSwitchToLogin={() => setAuthView('login')}
    />
  );
}

export default App;
