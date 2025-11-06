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
  unreadCount?: number;
  messageCount?: number;
}

interface User {
  userId: string;
  username: string;
  displayName: string;
  status: string;
}

interface PrivateChat {
  chatId: string;
  otherUser: User;
  lastMessage?: string;
  lastMessageAt?: Date;
  unreadCount: number;
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
  const [privateChats, setPrivateChats] = useState<PrivateChat[]>([]);
  const [selectedPrivateChat, setSelectedPrivateChat] = useState<PrivateChat | null>(null);
  const [chatType, setChatType] = useState<'room' | 'private'>('room');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<number | null>(null);
  const isInitialLoadRef = useRef(true);

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
    loadPrivateChats();
    
    // Load saved theme
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.setAttribute('data-theme', savedTheme);
    }

    // Poll for unread counts every 5 seconds
    const pollInterval = setInterval(() => {
      loadRooms();
      loadPrivateChats();
    }, 5000);

    // Cleanup interval on unmount
    return () => {
      clearInterval(pollInterval);
    };
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
        
        // Add message to current view if we're in the room
        setMessages(prev => [...prev, message]);
        
        // Update room counts (simplified - server tracks unread properly)
        setRooms(prev => prev.map(room => {
          // Increment message count for all rooms
          const newMessageCount = (room.messageCount || 0) + 1;
          
          // For the current room, don't increment unread
          if (selectedRoom?.roomId === room.roomId) {
            return {
              ...room,
              messageCount: newMessageCount
            };
          }
          // For other rooms, increment unread only if not our message
          else if (message.senderId !== user.userId) {
            return {
              ...room,
              messageCount: newMessageCount,
              unreadCount: (room.unreadCount || 0) + 1
            };
          }
          // For our own messages in other rooms
          else {
            return {
              ...room,
              messageCount: newMessageCount
            };
          }
        }));
      });

      socket.on('room_messages', (data: { roomId: string; messages: Message[] }) => {
        console.log('📚 Room messages loaded:', data.messages.length);
        setMessages(data.messages);
        
        // Update message count for the room
        setRooms(prev => prev.map(room => 
          room.roomId === data.roomId 
            ? { ...room, messageCount: data.messages.length }
            : room
        ));
      });

      socket.on('user_joined', (data: { username: string }) => {
        console.log(`👋 ${data.username} joined the room`);
      });

      socket.on('user_left', (data: { username: string }) => {
        console.log(`👋 ${data.username} left the room`);
      });

      socket.on('user_typing', (data: { username: string }) => {
        // Only show typing indicators in private chats, not in rooms
        if (chatType === 'private') {
          setTypingUsers(prev => {
            if (!prev.includes(data.username)) {
              return [...prev, data.username];
            }
            return prev;
          });
        }
      });

      socket.on('user_stop_typing', (data: { username: string }) => {
        // Only process typing indicators in private chats, not in rooms
        if (chatType === 'private') {
          setTypingUsers(prev => prev.filter(u => u !== data.username));
        }
      });

      // Private message events
      socket.on('private_message', async (message: any) => {
        console.log('🔒 New private message:', message);
        
        // Determine the other user (who we're chatting with)
        const otherUserId = message.senderId === user.userId ? message.receiverId : message.senderId;
        const isCurrentChat = chatType === 'private' && selectedPrivateChat?.otherUser.userId === otherUserId;
        
        console.log('📊 Notification Debug:', {
          otherUserId,
          isCurrentChat,
          chatType,
          selectedPrivateChatUserId: selectedPrivateChat?.otherUser.userId,
          messageSenderId: message.senderId,
          currentUserId: user.userId
        });
        
        // If we're currently viewing this chat, add message to the list and mark as read
        if (isCurrentChat) {
          setMessages(prev => [...prev, {
            messageId: message.messageId,
            senderId: message.senderId,
            senderName: message.senderName,
            content: message.content,
            timestamp: message.timestamp,
            messageType: message.messageType
          }]);
          
          // Mark as read if it's from the other user
          if (message.senderId !== user.userId && socket) {
            socket.emit('mark_as_read', { messageId: message.messageId });
          }
        }
        
        // Update or create private chat in list
        setPrivateChats(prev => {
          const existingChat = prev.find(c => c.otherUser.userId === otherUserId);
          
          console.log('💬 Chat Update:', {
            existingChat: !!existingChat,
            existingChatId: existingChat?.chatId,
            currentUnreadCount: existingChat?.unreadCount
          });
          
          if (existingChat) {
            // Update existing chat
            return prev.map(c => {
              if (c.chatId === existingChat.chatId) {
                // Increment unread count only if not viewing and message is from other user
                const shouldIncrement = !isCurrentChat && message.senderId !== user.userId;
                const newUnreadCount = shouldIncrement ? c.unreadCount + 1 : c.unreadCount;
                
                console.log('✅ Updating existing chat:', {
                  chatId: c.chatId,
                  shouldIncrement,
                  oldUnreadCount: c.unreadCount,
                  newUnreadCount,
                  isCurrentChat,
                  messageSender: message.senderId,
                  currentUser: user.userId
                });
                
                return {
                  ...c,
                  lastMessage: message.content,
                  lastMessageAt: message.timestamp,
                  unreadCount: newUnreadCount
                };
              }
              return c;
            });
          } else if (message.senderId !== user.userId) {
            // Auto-create new chat for incoming message from new user
            const senderInfo = users.find(u => u.userId === otherUserId);
            console.log('🆕 Creating new chat:', {
              senderInfo: !!senderInfo,
              senderUserId: otherUserId,
              availableUsers: users.length
            });
            
            if (senderInfo) {
              const newChat: PrivateChat = {
                chatId: message.chatId || `temp_${Date.now()}`,
                otherUser: senderInfo,
                lastMessage: message.content,
                lastMessageAt: message.timestamp,
                unreadCount: isCurrentChat ? 0 : 1
              };
              console.log('✅ New chat created with unread count:', newChat.unreadCount);
              return [...prev, newChat];
            } else {
              console.warn('⚠️ Sender info not found for userId:', otherUserId);
            }
          }
          return prev;
        });
      });

      socket.on('private_messages', (data: { otherUserId: string; messages: any[] }) => {
        console.log('📚 Private messages loaded:', data.messages.length);
        setMessages(data.messages.map(msg => ({
          messageId: msg.messageId,
          senderId: msg.senderId,
          senderName: msg.senderName,
          content: msg.content,
          timestamp: msg.timestamp,
          messageType: msg.messageType
        })));
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
        socket.off('private_message');
        socket.off('private_messages');
        socket.off('error');
      };
    }
  }, [socket, user, chatType, selectedPrivateChat, users]);

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
        
        // Auto-select first room ONLY on initial load
        if (isInitialLoadRef.current && data.rooms.length > 0) {
          selectRoom(data.rooms[0]);
          isInitialLoadRef.current = false;
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

  const loadPrivateChats = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/rooms/private-chats`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setPrivateChats(data.privateChats);
      }
    } catch (error) {
      console.error('Failed to load private chats:', error);
    }
  };

  const selectRoom = (room: Room) => {
    // Leave previous room (this updates lastSeenAt in DB)
    if (selectedRoom && socket) {
      socket.emit('leave_room', {
        roomId: selectedRoom.roomId,
        userId: user.userId,
        username: user.username
      });
    }

    // Clear unread count for this room locally
    setRooms(prev => prev.map(r =>
      r.roomId === room.roomId ? { ...r, unreadCount: 0 } : r
    ));

    setSelectedRoom(room);
    setSelectedPrivateChat(null);
    setChatType('room');
    setMessages([]);
    setTypingUsers([]);

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

  const startPrivateChat = (selectedUser: User) => {
    // Check if chat already exists
    const existingChat = privateChats.find(c => c.otherUser.userId === selectedUser.userId);
    
    if (existingChat) {
      selectPrivateChat(existingChat);
    } else {
      // Create new private chat
      const newChat: PrivateChat = {
        chatId: `temp_${Date.now()}`,
        otherUser: selectedUser,
        unreadCount: 0
      };
      setPrivateChats(prev => [...prev, newChat]);
      selectPrivateChat(newChat);
    }
    
    setShowUserModal(false);
    setSidebarOpen(false);
  };

  const selectPrivateChat = (chat: PrivateChat) => {
    // Leave room if in one
    if (selectedRoom && socket) {
      socket.emit('leave_room', {
        roomId: selectedRoom.roomId,
        userId: user.userId,
        username: user.username
      });
    }
    
    // Reset unread count for this chat
    setPrivateChats(prev => prev.map(c =>
      c.chatId === chat.chatId ? { ...c, unreadCount: 0 } : c
    ));
    
    setSelectedRoom(null);
    setSelectedPrivateChat(chat);
    setChatType('private');
    setMessages([]);
    setTypingUsers([]);
    
    // Load private messages
    if (socket) {
      socket.emit('get_private_messages', {
        userId: user.userId,
        otherUserId: chat.otherUser.userId,
        limit: 50
      });
      
      // Mark all messages from this user as read
      socket.emit('mark_chat_as_read', {
        userId: user.userId,
        otherUserId: chat.otherUser.userId
      });
    }
  };

  const sendMessage = () => {
    if (!messageInput.trim() || !socket) return;

    if (chatType === 'private' && selectedPrivateChat) {
      // Send private message
      socket.emit('send_private_message', {
        receiverId: selectedPrivateChat.otherUser.userId,
        senderId: user.userId,
        senderName: user.fullName || user.username,
        content: messageInput.trim(),
        messageType: 'text'
      });
      
      // Add message to UI immediately
      const tempMessage: Message = {
        messageId: `temp_${Date.now()}`,
        senderId: user.userId,
        senderName: user.fullName || user.username,
        content: messageInput.trim(),
        timestamp: new Date(),
        messageType: 'text'
      };
      setMessages(prev => [...prev, tempMessage]);
    } else if (selectedRoom) {
      // Send room message
      socket.emit('send_room_message', {
        roomId: selectedRoom.roomId,
        senderId: user.userId,
        senderName: user.fullName || user.username,
        content: messageInput.trim(),
        messageType: 'text'
      });
    }

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
    const value = e.target.value;
    setMessageInput(value);
    
    // Only handle typing for private chats
    if (chatType === 'private' && selectedPrivateChat && socket) {
      // If input is empty, stop typing immediately
      if (value.trim() === '') {
        if (isTyping) {
          stopTyping();
        }
        // Clear any pending timeout
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
          typingTimeoutRef.current = null;
        }
        return;
      }

      // Start typing if not already
      if (!isTyping) {
        setIsTyping(true);
        socket.emit('typing', {
          userId: user.userId,
          username: user.username,
          isPrivate: true,
          targetId: selectedPrivateChat.otherUser.userId
        });
      }

      // Clear any existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      // Set new timeout to stop typing after 2 seconds
      typingTimeoutRef.current = window.setTimeout(() => {
        stopTyping();
      }, 2000);
    }
  };

  const stopTyping = () => {
    if (isTyping && socket) {
      setIsTyping(false);
      
      if (chatType === 'private' && selectedPrivateChat) {
        // Private chat stop typing - ONLY send to the specific user
        socket.emit('stop_typing', {
          userId: user.userId,
          username: user.username,
          isPrivate: true,
          targetId: selectedPrivateChat.otherUser.userId
        });
      }
      // Room stop typing removed - no typing indicators in public rooms
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
            <div className="section-header">
              <h3>
                🌍 Public Rooms
                {rooms.reduce((total, room) => total + (room.unreadCount || 0), 0) > 0 && (
                  <span className="section-unread-badge">
                    {rooms.reduce((total, room) => total + (room.unreadCount || 0), 0)}
                  </span>
                )}
              </h3>
            </div>
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
                  {room.unreadCount && room.unreadCount > 0 ? (
                    <span className="room-badge unread">{room.unreadCount}</span>
                  ) : (
                    <span className="room-badge">{room.messageCount || 0}</span>
                  )}
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
              {privateChats.length === 0 ? (
                <p className="empty-message">No private chats yet</p>
              ) : (
                privateChats.map(chat => (
                  <div
                    key={chat.chatId}
                    className={`room-item ${selectedPrivateChat?.chatId === chat.chatId ? 'active' : ''}`}
                    onClick={() => {
                      selectPrivateChat(chat);
                      setSidebarOpen(false);
                    }}
                  >
                    <div className="user-avatar" style={{ width: '35px', height: '35px', fontSize: '0.9rem' }}>
                      {chat.otherUser.displayName.charAt(0).toUpperCase()}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="room-name">{chat.otherUser.displayName}</div>
                      {chat.lastMessage && (
                        <div style={{ 
                          fontSize: '0.75rem', 
                          color: 'var(--text-tertiary)',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}>
                          {chat.lastMessage}
                        </div>
                      )}
                    </div>
                    {chat.unreadCount > 0 && (
                      <span className="room-badge unread">{chat.unreadCount}</span>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </aside>

        <main className="main-chat">
          {selectedRoom || selectedPrivateChat ? (
            <>
              <div className="chat-header">
                <div className="chat-title">
                  {selectedRoom ? (
                    <>
                      <span className="room-icon">
                        {selectedRoom.name === 'General' ? '💬' : selectedRoom.name === 'Gaming' ? '🎮' : '💻'}
                      </span>
                      <div>
                        <h2>{selectedRoom.name}</h2>
                        <p className="chat-description">{selectedRoom.description}</p>
                      </div>
                    </>
                  ) : selectedPrivateChat ? (
                    <>
                      <div className="user-avatar" style={{ width: '45px', height: '45px', fontSize: '1.1rem' }}>
                        {selectedPrivateChat.otherUser.displayName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h2>{selectedPrivateChat.otherUser.displayName}</h2>
                        <p className="chat-description">Private conversation</p>
                      </div>
                    </>
                  ) : null}
                </div>
              </div>

              <div className="messages-container">
                {messages.length === 0 ? (
                  <div className="welcome-message">
                    <h2>👋 {selectedRoom ? `Welcome to ${selectedRoom.name}!` : `Chat with ${selectedPrivateChat?.otherUser.displayName}`}</h2>
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
                {users.filter(u => u.userId !== user.userId).map(u => (
                  <div key={u.userId} className="user-item">
                    <div className="user-avatar">{u.displayName.charAt(0).toUpperCase()}</div>
                    <div className="user-details">
                      <div className="user-name">{u.displayName}</div>
                      <div className="user-status">
                        <span className={`status-dot ${u.status}`}></span>
                        {u.status}
                      </div>
                    </div>
                    <button className="select-button" onClick={() => startPrivateChat(u)}>Chat</button>
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
