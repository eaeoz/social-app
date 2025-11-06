import { useState, useEffect } from 'react';
import { Socket } from 'socket.io-client';
import './Home.css';

interface HomeProps {
  user: any;
  socket: Socket | null;
  onLogout: () => void;
}

function Home({ user, socket, onLogout }: HomeProps) {
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (socket) {
      setConnected(socket.connected);

      socket.on('connect', () => {
        setConnected(true);
        console.log('✅ Connected to server');
      });

      socket.on('disconnect', () => {
        setConnected(false);
        console.log('❌ Disconnected from server');
      });
    }

    return () => {
      if (socket) {
        socket.off('connect');
        socket.off('disconnect');
      }
    };
  }, [socket]);

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    onLogout();
  };

  return (
    <div className="home-container">
      <header className="home-header">
        <div className="header-left">
          <h1>💬 {import.meta.env.VITE_APP_NAME || 'Chat App'}</h1>
        </div>
        <div className="header-right">
          <div className="user-info">
            <div className="user-avatar">
              {user.fullName ? user.fullName.charAt(0).toUpperCase() : user.username.charAt(0).toUpperCase()}
            </div>
            <div className="user-details">
              <span className="user-name">{user.fullName || user.username}</span>
              <span className={`connection-status ${connected ? 'connected' : 'disconnected'}`}>
                {connected ? '🟢 Online' : '🔴 Offline'}
              </span>
            </div>
          </div>
          <button onClick={handleLogout} className="logout-button">
            Logout
          </button>
        </div>
      </header>

      <div className="home-content">
        <aside className="sidebar">
          <div className="sidebar-section">
            <h3>🌍 Public Rooms</h3>
            <div className="room-list">
              <div className="room-item active">
                <span className="room-icon">💬</span>
                <span className="room-name">General</span>
                <span className="room-badge">12</span>
              </div>
              <div className="room-item">
                <span className="room-icon">🎮</span>
                <span className="room-name">Gaming</span>
                <span className="room-badge">5</span>
              </div>
              <div className="room-item">
                <span className="room-icon">💻</span>
                <span className="room-name">Tech Talk</span>
                <span className="room-badge">8</span>
              </div>
            </div>
          </div>

          <div className="sidebar-section">
            <div className="section-header">
              <h3>👤 Private Chats</h3>
              <button className="add-button" title="New Private Chat">
                +
              </button>
            </div>
            <div className="chat-list">
              <p className="empty-message">No private chats yet</p>
            </div>
          </div>
        </aside>

        <main className="main-chat">
          <div className="chat-header">
            <div className="chat-title">
              <span className="room-icon">💬</span>
              <div>
                <h2>General</h2>
                <p className="chat-description">Public chat room</p>
              </div>
            </div>
          </div>

          <div className="messages-container">
            <div className="welcome-message">
              <h2>👋 Welcome to the Chat App!</h2>
              <p>You're now logged in as <strong>{user.username}</strong></p>
              <div className="feature-cards">
                <div className="feature-card">
                  <span className="feature-icon">🌍</span>
                  <h3>Public Rooms</h3>
                  <p>Join public chat rooms and connect with everyone</p>
                </div>
                <div className="feature-card">
                  <span className="feature-icon">💬</span>
                  <h3>Private Messaging</h3>
                  <p>Click + to start a private conversation</p>
                </div>
                <div className="feature-card">
                  <span className="feature-icon">⚡</span>
                  <h3>Real-time Updates</h3>
                  <p>All messages are delivered instantly via WebSocket</p>
                </div>
              </div>
            </div>
          </div>

          <div className="message-input-container">
            <input
              type="text"
              className="message-input"
              placeholder="Type a message... (Coming soon)"
              disabled
            />
            <button className="send-button" disabled>
              Send
            </button>
          </div>
        </main>
      </div>
    </div>
  );
}

export default Home;
