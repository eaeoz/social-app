import { useState, useEffect } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { io, Socket } from 'socket.io-client';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import VerifyEmail from './components/Auth/VerifyEmail';
import ResetPassword from './components/Auth/ResetPassword';
import GoogleCallback from './components/Auth/GoogleCallback';
import Home from './components/Home/Home';
import Maintenance from './components/Maintenance/Maintenance';
import './App.css';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:4000';

type AuthView = 'login' | 'register';

function App() {
  const navigate = useNavigate();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [user, setUser] = useState<any>(null);
  const [authView, setAuthView] = useState<AuthView>('login');
  const [isLoading, setIsLoading] = useState(true);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [maintenanceSettings, setMaintenanceSettings] = useState<{
    estimatedTime?: string;
    reason?: string;
  }>({});

  // Check maintenance mode on mount and periodically
  useEffect(() => {
    const checkMaintenanceMode = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/settings/site`);
        if (response.ok) {
          const data = await response.json();
          if (data.settings) {
            setMaintenanceMode(data.settings.maintenanceMode || false);
            setMaintenanceSettings({
              estimatedTime: data.settings.maintenanceEstimatedTime,
              reason: data.settings.maintenanceReason
            });
          }
        }
      } catch (error) {
        console.error('Failed to check maintenance mode:', error);
      }
    };

    checkMaintenanceMode();
    
    // Check every 30 seconds
    const interval = setInterval(checkMaintenanceMode, 30000);
    
    return () => clearInterval(interval);
  }, []);

  // Check for existing session on mount
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    const savedUser = localStorage.getItem('user');

    if (token && savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        
        // Verify the session is still valid before setting user
        // This prevents issues with stale sessions after logout
        console.log('🔍 Validating saved session...');
        setUser(parsedUser);
      } catch (error) {
        console.error('Failed to parse saved user:', error);
        localStorage.removeItem('user');
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        sessionStorage.clear();
      }
    } else {
      // Ensure clean state if no valid session
      localStorage.removeItem('user');
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      sessionStorage.clear();
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
    // Clear user state first
    setUser(null);
    setAuthView('login');
    
    // Close socket connection
    if (socket) {
      socket.close();
      setSocket(null);
    }
    
    // Clear all auth data from storage
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    sessionStorage.clear();
    
    // Navigate to login using replace to prevent back navigation issues
    navigate('/', { replace: true });
  };

  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  // Show maintenance page if maintenance mode is enabled
  if (maintenanceMode) {
    return (
      <Maintenance 
        estimatedTime={maintenanceSettings.estimatedTime}
        reason={maintenanceSettings.reason}
      />
    );
  }

  return (
    <Routes>
      {/* Email verification route - accessible without authentication */}
      <Route path="/verify-email" element={<VerifyEmail />} />
      
      {/* Password reset route - accessible without authentication */}
      <Route path="/reset-password" element={<ResetPassword />} />
      
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
