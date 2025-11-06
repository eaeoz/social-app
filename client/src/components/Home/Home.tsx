import { useState, useEffect, useRef } from 'react';
import { Socket } from 'socket.io-client';
import './Home.css';

interface HomeProps {
  user: any;
  socket: Socket | null;
  onLogout: () => void;
}

interface Message {
  messageId: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: Date;
  messageType?: string;
}

interface Room {
  roomId: string;
  name: string;
  description: string;
  participantCount: number;
}

interface User {
  userId: string;
  username: string;
  displayName: string;
  status: string;
}

function Home({ user, socket, onLogout }: HomeProps) {
  const [connected, setConnected] = useState(false);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [showUserModal, setShowUserModal] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<number | null>(null);

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load rooms and theme on mount
  useEffect(() => {
    loadRooms();
    loadUsers();
    
    // Load saved theme
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.setAttribute('data-theme', savedTheme);
    }
  }, []);

  // Socket connection and authentication
  useEffect(() => {
    if (socket) {
      setConnected(socket.connected);

      socket.on('connect', () => {
        setConnected(true);
        console.log('✅ Connected to server');
        
        // Authenticate socket
        socket.emit('authenticate', {
          userId: user.userId,
          username: user.username
        });
      });

      socket.on('disconnect', () => {
        setConnected(false);
        console.log('❌ Disconnected from server');
      });

      // Message events
      socket.on('room_message', (message: Message) => {
        console.log('📨 New room message:', message);
        setMessages(prev => [...prev, message]);
      });

      socket.on('room_messages', (data: { roomId: string; messages: Message[] }) => {
        console.log('📚 Room messages loaded:', data.messages.length);
        setMessages(data.messages);
      });

      socket.on('user_joined', (data: { username: string }) => {
        console.log(`👋 ${data.username} joined the room`);
      });

      socket.on('user_left', (data: { username: string }) => {
        console.log(`👋 ${data.username} left the room`);
      });

      socket.on('user_typing', (data: { username: string }) => {
        setTypingUsers(prev => {
          if (!prev.includes(data.username)) {
            return [...prev, data.username];
          }
          return prev;
        });
      });

      socket.on('user_stop_typing', (data: { username: string }) => {
        setTypingUsers(prev => prev.filter(u => u !== data.username));
      });

      socket.on('error', (error: { message: string }) => {
        console.error('Socket error:', error.message);
      });

      return () => {
        socket.off('connect');
        socket.off('disconnect');
        socket.off('room_message');
        socket.off('room_messages');
        socket.off('user_joined');
        socket.off('user_left');
        socket.off('user_typing');
        socket.off('user_stop_typing');
        socket.off('error');
      };
    }
  }, [socket, user]);

  const loadRooms = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/rooms/public`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setRooms(data.rooms);
        
        // Auto-select first room
        if (data.rooms.length > 0 && !selectedRoom) {
          selectRoom(data.rooms[0]);
        }
      }
    } catch (error) {
      console.error('Failed to load rooms:', error);
    }
  };

  const loadUsers = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/rooms/users`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setUsers(data.users);
      }
    } catch (error) {
      console.error('Failed to load users:', error);
    }
  };

  const selectRoom = (room: Room) => {
    // Leave previous room
    if (selectedRoom && socket) {
      socket.emit('leave_room', {
        roomId: selectedRoom.roomId,
        userId: user.userId,
        username: user.username
      });
    }

    setSelectedRoom(room);
    setMessages([]);

    // Join new room
    if (socket) {
      socket.emit('join_room', {
        roomId: room.roomId,
        userId: user.userId,
        username: user.username
      });

      // Load room messages
      socket.emit('get_room_messages', {
        roomId: room.roomId,
        limit: 50
      });
    }
  };

  const sendMessage = () => {
    if (!messageInput.trim() || !socket || !selectedRoom) return;

    socket.emit('send_room_message', {
      roomId: selectedRoom.roomId,
      senderId: user.userId,
      senderName: user.fullName || user.username,
      content: messageInput.trim(),
      messageType: 'text'
    });

    setMessageInput('');
    stopTyping();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessageInput(e.target.value);
    
    if (!isTyping && socket && selectedRoom) {
      setIsTyping(true);
      socket.emit('typing', {
        roomId: selectedRoom.roomId,
        userId: user.userId,
        username: user.username
      });
    }

    // Reset typing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = window.setTimeout(() => {
      stopTyping();
    }, 2000);
  };

  const stopTyping = () => {
    if (isTyping && socket && selectedRoom) {
      setIsTyping(false);
      socket.emit('stop_typing', {
        roomId: selectedRoom.roomId,
        userId: user.userId,
        username: user.username
      });
    }
  };

  const formatTime = (timestamp: Date) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  const handleLogout = () => {
    if (socket && selectedRoom) {
      socket.emit('leave_room', {
        roomId: selectedRoom.roomId,
        userId: user.userId,
        username: user.username
      });
    }
    
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    onLogout();
  };

  return (
    <div className="home-container">
      <header className="home-header">
        <div className="header-left">
          <button 
            className="mobile-menu-button"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            title="Toggle menu"
          >
            <span className="hamburger-line"></span>
            <span className="hamburger-line"></span>
            <span className="hamburger-line"></span>
          </button>
          <h1>💬 {import.meta.env.VITE_APP_NAME || 'Chat App'}</h1>
        </div>
        <div className="header-right">
          <button 
            onClick={toggleTheme} 
            className="theme-toggle"
            title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
          >
            <div className="toggle-track">
              <div className={`toggle-thumb ${theme}`}>
                {theme === 'light' ? '☀️' : '🌙'}
              </div>
            </div>
          </button>
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
        {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)}></div>}
        <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
          <div className="sidebar-section">
            <h3>🌍 Public Rooms</h3>
            <div className="room-list">
              {rooms.map(room => (
                <div
                  key={room.roomId}
                  className={`room-item ${selectedRoom?.roomId === room.roomId ? 'active' : ''}`}
                  onClick={() => {
                    selectRoom(room);
                    setSidebarOpen(false);
                  }}
                >
                  <span className="room-icon">
                    {room.name === 'General' ? '💬' : room.name === 'Gaming' ? '🎮' : '💻'}
                  </span>
                  <span className="room-name">{room.name}</span>
                  <span className="room-badge">{room.participantCount}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="sidebar-section">
            <div className="section-header">
              <h3>👤 Private Chats</h3>
              <button 
                className="add-button" 
                title="New Private Chat"
                onClick={() => setShowUserModal(true)}
              >
                +
              </button>
            </div>
            <div className="chat-list">
              <p className="empty-message">No private chats yet</p>
            </div>
          </div>
        </aside>

        <main className="main-chat">
          {selectedRoom ? (
            <>
              <div className="chat-header">
                <div className="chat-title">
                  <span className="room-icon">
                    {selectedRoom.name === 'General' ? '💬' : selectedRoom.name === 'Gaming' ? '🎮' : '💻'}
                  </span>
                  <div>
                    <h2>{selectedRoom.name}</h2>
                    <p className="chat-description">{selectedRoom.description}</p>
                  </div>
                </div>
              </div>

              <div className="messages-container">
                {messages.length === 0 ? (
                  <div className="welcome-message">
                    <h2>👋 Welcome to {selectedRoom.name}!</h2>
                    <p>Start chatting by typing a message below</p>
                  </div>
                ) : (
                  <div className="messages-list">
                    {messages.map(msg => (
                      <div
                        key={msg.messageId}
                        className={`message ${msg.senderId === user.userId ? 'own-message' : ''}`}
                      >
                        <div className="message-avatar">
                          {msg.senderName.charAt(0).toUpperCase()}
                        </div>
                        <div className="message-content">
                          <div className="message-header">
                            <span className="message-sender">{msg.senderName}</span>
                            <span className="message-time">{formatTime(msg.timestamp)}</span>
                          </div>
                          <div className="message-text">{msg.content}</div>
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
                )}
                
                {typingUsers.length > 0 && (
                  <div className="typing-indicator">
                    <span>{typingUsers.join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...</span>
                  </div>
                )}
              </div>

              <div className="message-input-container">
                <input
                  type="text"
                  className="message-input"
                  placeholder="Type a message..."
                  value={messageInput}
                  onChange={handleInputChange}
                  onKeyPress={handleKeyPress}
                  disabled={!connected}
                />
                <button 
                  className="send-button" 
                  onClick={sendMessage}
                  disabled={!connected || !messageInput.trim()}
                >
                  Send
                </button>
              </div>
            </>
          ) : (
            <div className="messages-container">
              <div className="welcome-message">
                <h2>👋 Welcome to the Chat App!</h2>
                <p>You're now logged in as <strong>{user.username}</strong></p>
                <p>Select a room from the sidebar to start chatting</p>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* User Selection Modal */}
      {showUserModal && (
        <div className="modal-overlay" onClick={() => setShowUserModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Select User</h2>
              <button className="modal-close" onClick={() => setShowUserModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="user-list">
                {users.map(u => (
                  <div key={u.userId} className="user-item">
                    <div className="user-avatar">{u.displayName.charAt(0).toUpperCase()}</div>
                    <div className="user-details">
                      <div className="user-name">{u.displayName}</div>
                      <div className="user-status">
                        <span className={`status-dot ${u.status}`}></span>
                        {u.status}
                      </div>
                    </div>
                    <button className="select-button">Chat</button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Home;
