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
  age?: number;
  gender?: string;
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
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [privateChats, setPrivateChats] = useState<PrivateChat[]>([]);
  const [selectedPrivateChat, setSelectedPrivateChat] = useState<PrivateChat | null>(null);
  const [chatType, setChatType] = useState<'room' | 'private'>('room');
  const [userSearchText, setUserSearchText] = useState('');
  const [ageRange, setAgeRange] = useState<[number, number]>([18, 100]);
  const [selectedGenders, setSelectedGenders] = useState<string[]>(['Male', 'Female']);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedUserIndex, setSelectedUserIndex] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<number | null>(null);
  const isInitialLoadRef = useRef(true);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const userItemsRef = useRef<(HTMLDivElement | null)[]>([]);
  const messageInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    loadRooms();
    loadUsers();
    loadPrivateChats();
    
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
    const initialTheme = savedTheme || 'dark';
    setTheme(initialTheme);
    document.documentElement.setAttribute('data-theme', initialTheme);

    const pollInterval = setInterval(() => {
      loadPrivateChats();
    }, 5000);

    return () => {
      clearInterval(pollInterval);
    };
  }, []);

  // Add keyboard shortcut listener for Alt+M to toggle user modal and Escape to close it
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && e.key.toLowerCase() === 'm') {
        e.preventDefault();
        setShowUserModal(prev => !prev);
      } else if (e.key === 'Escape' && showUserModal) {
        e.preventDefault();
        setShowUserModal(false);
        // Focus chat input after closing modal
        setTimeout(() => {
          messageInputRef.current?.focus();
        }, 100);
      } else if (e.altKey && e.key.toLowerCase() === 'x' && showUserModal) {
        e.preventDefault();
        setShowFilters(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [showUserModal]);

  // Auto-focus search input when modal opens and reset selected index
  useEffect(() => {
    if (showUserModal) {
      setSelectedUserIndex(0);
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    }
  }, [showUserModal]);

  // Reset selected index when filter changes
  useEffect(() => {
    setSelectedUserIndex(0);
  }, [userSearchText, ageRange, selectedGenders]);

  // Scroll to selected user when index changes
  useEffect(() => {
    if (showUserModal && userItemsRef.current[selectedUserIndex]) {
      userItemsRef.current[selectedUserIndex]?.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
      });
    }
  }, [selectedUserIndex, showUserModal]);

  useEffect(() => {
    if (socket && connected && selectedRoom) {
      socket.emit('join_room', {
        roomId: selectedRoom.roomId,
        userId: user.userId,
        username: user.username
      });

      socket.emit('get_room_messages', {
        roomId: selectedRoom.roomId,
        limit: 50
      });
    }
  }, [socket, connected, selectedRoom]);

  useEffect(() => {
    if (socket) {
      setConnected(socket.connected);

      socket.on('connect', () => {
        setConnected(true);
        socket.emit('authenticate', {
          userId: user.userId,
          username: user.username
        });
      });

      socket.on('disconnect', () => {
        setConnected(false);
      });

      socket.on('room_message', (message: any) => {
        if (selectedRoom?.roomId === message.roomId) {
          setMessages(prev => [...prev, {
            messageId: message.messageId,
            senderId: message.senderId,
            senderName: message.senderName,
            content: message.content,
            timestamp: message.timestamp,
            messageType: message.messageType
          }]);
        }
      });

      socket.on('room_messages', (data: { roomId: string; messages: Message[] }) => {
        setMessages(data.messages);
        setRooms(prev => prev.map(room => 
          room.roomId === data.roomId 
            ? { ...room, messageCount: data.messages.length }
            : room
        ));
      });

      socket.on('user_joined', (data: { username: string }) => {
        console.log(`👋 ${data.username} joined`);
      });

      socket.on('user_left', (data: { username: string }) => {
        console.log(`👋 ${data.username} left`);
      });

      socket.on('user_typing', (data: { username: string }) => {
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
        if (chatType === 'private') {
          setTypingUsers(prev => prev.filter(u => u !== data.username));
        }
      });

      socket.on('room_message_notification', (data: { roomId: string; senderId: string; timestamp: Date }) => {
        if (selectedRoom?.roomId !== data.roomId && data.senderId !== user.userId) {
          setRooms(prev => prev.map(room => {
            if (room.roomId === data.roomId) {
              return {
                ...room,
                unreadCount: (room.unreadCount || 0) + 1,
                messageCount: (room.messageCount || 0) + 1
              };
            }
            return room;
          }));
        }
      });

      socket.on('private_message', async (message: any) => {
        const otherUserId = message.senderId === user.userId ? message.receiverId : message.senderId;
        const isCurrentChat = chatType === 'private' && selectedPrivateChat?.otherUser.userId === otherUserId;
        
        if (isCurrentChat) {
          setMessages(prev => {
            const messageExists = prev.some(m => 
              m.messageId === message.messageId || 
              (m.messageId.startsWith('temp_') && 
               m.senderId === message.senderId && 
               m.content === message.content &&
               Math.abs(new Date(m.timestamp).getTime() - new Date(message.timestamp).getTime()) < 2000)
            );
            
            if (messageExists) {
              return prev.map(m => 
                (m.messageId.startsWith('temp_') && 
                 m.senderId === message.senderId && 
                 m.content === message.content &&
                 Math.abs(new Date(m.timestamp).getTime() - new Date(message.timestamp).getTime()) < 2000)
                  ? {
                      messageId: message.messageId,
                      senderId: message.senderId,
                      senderName: message.senderName,
                      content: message.content,
                      timestamp: message.timestamp,
                      messageType: message.messageType
                    }
                  : m
              );
            }
            
            return [...prev, {
              messageId: message.messageId,
              senderId: message.senderId,
              senderName: message.senderName,
              content: message.content,
              timestamp: message.timestamp,
              messageType: message.messageType
            }];
          });
          
          if (message.senderId !== user.userId && socket) {
            socket.emit('mark_as_read', { messageId: message.messageId });
          }
        }
        
        // Refresh to get updated list from server
        loadPrivateChats();
      });

      socket.on('private_messages', (data: { otherUserId: string; messages: any[] }) => {
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
        socket.off('room_message_notification');
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
        
        const updatedRooms = data.rooms.map((room: Room) => {
          if (selectedRoom?.roomId === room.roomId) {
            return { ...room, unreadCount: 0 };
          }
          return room;
        });
        
        setRooms(updatedRooms);
        
        if (isInitialLoadRef.current && updatedRooms.length > 0) {
          selectRoom(updatedRooms[0]);
          isInitialLoadRef.current = false;
        } else if (selectedRoom) {
          setRooms(prev => prev.map(r =>
            r.roomId === selectedRoom.roomId ? { ...r, unreadCount: 0 } : r
          ));
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
        
        // Server decides what to show - no client filtering
        setPrivateChats(data.privateChats.map((chat: PrivateChat) => ({
          ...chat,
          unreadCount: selectedPrivateChat?.otherUser.userId === chat.otherUser.userId ? 0 : chat.unreadCount
        })));
      }
    } catch (error) {
      console.error('Failed to load private chats:', error);
    }
  };

  const selectRoom = async (room: Room) => {
    setRooms(prev => prev.map(r =>
      r.roomId === room.roomId ? { ...r, unreadCount: 0 } : r
    ));

    try {
      const token = localStorage.getItem('accessToken');
      await fetch(`${import.meta.env.VITE_API_URL}/rooms/mark-room-read`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ roomId: room.roomId })
      });
    } catch (error) {
      console.error('Failed to mark room as read:', error);
    }

    if (selectedRoom?.roomId === room.roomId) {
      return;
    }

    if (selectedRoom && selectedRoom.roomId !== room.roomId && socket) {
      socket.emit('leave_room', {
        roomId: selectedRoom.roomId,
        userId: user.userId,
        username: user.username
      });
    }

    setSelectedRoom(room);
    setSelectedPrivateChat(null);
    setChatType('room');
    setMessages([]);
    setTypingUsers([]);

    if (socket) {
      socket.emit('join_room', {
        roomId: room.roomId,
        userId: user.userId,
        username: user.username
      });

      socket.emit('get_room_messages', {
        roomId: room.roomId,
        limit: 50
      });
    }
    
    // Focus chat input after selecting room
    setTimeout(() => {
      messageInputRef.current?.focus();
    }, 100);
  };

  const startPrivateChat = (selectedUser: User) => {
    const existingChat = privateChats.find(c => c.otherUser.userId === selectedUser.userId);
    
    if (existingChat) {
      selectPrivateChat(existingChat);
    } else {
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
    setUserSearchText('');
    setAgeRange([18, 100]);
    setSelectedGenders(['Male', 'Female']);
    setShowFilters(false);
    
    // Focus chat input after selecting user
    setTimeout(() => {
      messageInputRef.current?.focus();
    }, 100);
  };

  const toggleGender = (gender: string) => {
    setSelectedGenders(prev => {
      if (prev.includes(gender)) {
        // Remove gender if already selected
        const newSelection = prev.filter(g => g !== gender);
        // If both are unchecked, keep at least one or show all
        return newSelection.length === 0 ? ['Male', 'Female'] : newSelection;
      } else {
        // Add gender
        return [...prev, gender];
      }
    });
  };

  const handleMinAgeChange = (value: number) => {
    // Ensure minimum stays at least 2 years below maximum
    const newMin = Math.min(value, ageRange[1] - 2);
    setAgeRange([newMin, ageRange[1]]);
  };

  const handleMaxAgeChange = (value: number) => {
    // Ensure maximum stays at least 2 years above minimum
    const newMax = Math.max(value, ageRange[0] + 2);
    setAgeRange([ageRange[0], newMax]);
  };

  const clearFilters = () => {
    setUserSearchText('');
    setAgeRange([18, 100]);
    setSelectedGenders(['Male', 'Female']);
    setShowFilters(false);
  };

  const getFilteredUsers = () => {
    return users
      .filter(u => u.userId !== user.userId)
      .filter(u => {
        // Text search filter
        if (userSearchText.trim()) {
          const searchLower = userSearchText.toLowerCase();
          return u.displayName.toLowerCase().includes(searchLower) ||
                 u.username.toLowerCase().includes(searchLower);
        }
        return true;
      })
      .filter(u => {
        // Age range filter - only show users within age range who have age data
        if (u.age) {
          return u.age >= ageRange[0] && u.age <= ageRange[1];
        }
        // Show users without age data if range is at maximum
        return ageRange[0] === 18 && ageRange[1] === 100;
      })
      .filter(u => {
        // Gender filter - show users matching selected genders
        // If both genders selected, show all (including users without gender)
        if (selectedGenders.length === 2) {
          return true;
        }
        // If one gender selected, only show users with that gender
        return u.gender && selectedGenders.includes(u.gender);
      })
      .sort((a, b) => {
        // First priority: Users with unread messages
        const aUnread = getUserUnreadCount(a.userId);
        const bUnread = getUserUnreadCount(b.userId);
        if (aUnread > 0 && bUnread === 0) return -1;
        if (aUnread === 0 && bUnread > 0) return 1;
        
        // Second priority: Online status
        if (a.status === 'online' && b.status !== 'online') return -1;
        if (a.status !== 'online' && b.status === 'online') return 1;
        
        // Third priority: Alphabetical by display name
        return a.displayName.localeCompare(b.displayName);
      });
  };

  const getUserUnreadCount = (userId: string): number => {
    const chat = privateChats.find(c => c.otherUser.userId === userId);
    return chat?.unreadCount || 0;
  };

  const selectPrivateChat = (chat: PrivateChat) => {
    if (selectedRoom && socket) {
      socket.emit('leave_room', {
        roomId: selectedRoom.roomId,
        userId: user.userId,
        username: user.username
      });
    }
    
    setPrivateChats(prev => prev.map(c =>
      c.chatId === chat.chatId ? { ...c, unreadCount: 0 } : c
    ));
    
    setSelectedRoom(null);
    setSelectedPrivateChat(chat);
    setChatType('private');
    setMessages([]);
    setTypingUsers([]);
    
    if (socket) {
      socket.emit('get_private_messages', {
        userId: user.userId,
        otherUserId: chat.otherUser.userId,
        limit: 50
      });
      
      socket.emit('mark_chat_as_read', {
        userId: user.userId,
        otherUserId: chat.otherUser.userId
      });
    }
  };

  const closePrivateChat = async (chat: PrivateChat) => {
    if (chat.unreadCount > 0) {
      return;
    }
    
    // Call server to mark as closed
    try {
      const token = localStorage.getItem('accessToken');
      await fetch(`${import.meta.env.VITE_API_URL}/rooms/close-private-chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ otherUserId: chat.otherUser.userId })
      });
      
      // Remove from local list
      setPrivateChats(prev => prev.filter(c => c.chatId !== chat.chatId));
      
      // If this was the selected chat, switch to first room
      if (selectedPrivateChat?.chatId === chat.chatId) {
        if (rooms.length > 0) {
          selectRoom(rooms[0]);
        } else {
          setSelectedPrivateChat(null);
          setChatType('room');
          setMessages([]);
        }
      }
    } catch (error) {
      console.error('Failed to close chat:', error);
    }
  };

  const sendMessage = () => {
    if (!messageInput.trim() || !socket) return;

    if (chatType === 'private' && selectedPrivateChat) {
      socket.emit('send_private_message', {
        receiverId: selectedPrivateChat.otherUser.userId,
        senderId: user.userId,
        senderName: user.fullName || user.username,
        content: messageInput.trim(),
        messageType: 'text'
      });
      
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
    
    if (chatType === 'private' && selectedPrivateChat && socket) {
      if (value.trim() === '') {
        if (isTyping) {
          stopTyping();
        }
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
          typingTimeoutRef.current = null;
        }
        return;
      }

      if (!isTyping) {
        setIsTyping(true);
        socket.emit('typing', {
          userId: user.userId,
          username: user.username,
          isPrivate: true,
          targetId: selectedPrivateChat.otherUser.userId
        });
      }

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      typingTimeoutRef.current = window.setTimeout(() => {
        stopTyping();
      }, 2000);
    }
  };

  const stopTyping = () => {
    if (isTyping && socket) {
      setIsTyping(false);
      
      if (chatType === 'private' && selectedPrivateChat) {
        socket.emit('stop_typing', {
          userId: user.userId,
          username: user.username,
          isPrivate: true,
          targetId: selectedPrivateChat.otherUser.userId
        });
      }
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
            className={`mobile-menu-button ${rooms.reduce((total, room) => total + (room.unreadCount || 0), 0) > 0 ? 'has-unread' : ''}`}
            onClick={() => setSidebarOpen(!sidebarOpen)}
            title="Toggle menu"
          >
            <span className="hamburger-line"></span>
            <span className="hamburger-line"></span>
            <span className="hamburger-line"></span>
            {rooms.reduce((total, room) => total + (room.unreadCount || 0), 0) > 0 && (
              <span className="hamburger-notification-dot"></span>
            )}
          </button>
          <h1>💬 {import.meta.env.VITE_APP_NAME || 'Chat App'}</h1>
        </div>
        <div className="header-center">
          <button 
            className="new-chat-button"
            onClick={() => setShowUserModal(true)}
            title="Start New Chat"
          >
            <span className="chat-icon">💬</span>
          </button>
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

              <div 
                className="messages-container"
                onClick={async () => {
                  if (selectedRoom) {
                    setRooms(prev => prev.map(r =>
                      r.roomId === selectedRoom.roomId ? { ...r, unreadCount: 0 } : r
                    ));
                    
                    try {
                      const token = localStorage.getItem('accessToken');
                      await fetch(`${import.meta.env.VITE_API_URL}/rooms/mark-room-read`, {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                          'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify({ roomId: selectedRoom.roomId })
                      });
                    } catch (error) {
                      console.error('Failed to mark room as read:', error);
                    }
                  }
                }}
              >
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
                  ref={messageInputRef}
                  type="text"
                  className="message-input"
                  placeholder="Type a message..."
                  value={messageInput}
                  onChange={handleInputChange}
                  onKeyPress={handleKeyPress}
                  onFocus={async () => {
                    if (selectedRoom) {
                      setRooms(prev => prev.map(r =>
                        r.roomId === selectedRoom.roomId ? { ...r, unreadCount: 0 } : r
                      ));
                      
                      try {
                        const token = localStorage.getItem('accessToken');
                        await fetch(`${import.meta.env.VITE_API_URL}/rooms/mark-room-read`, {
                          method: 'POST',
                          headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                          },
                          body: JSON.stringify({ roomId: selectedRoom.roomId })
                        });
                      } catch (error) {
                        console.error('Failed to mark room as read:', error);
                      }
                    }
                  }}
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

      {showUserModal && (
        <div className="modal-overlay" onClick={() => {
          setShowUserModal(false);
          setTimeout(() => {
            messageInputRef.current?.focus();
          }, 100);
        }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Select User</h2>
              <button className="modal-close" onClick={() => {
                setShowUserModal(false);
                setTimeout(() => {
                  messageInputRef.current?.focus();
                }, 100);
              }}>×</button>
            </div>
            <div className="modal-filters">
              <div className="filter-row">
                <input
                  ref={searchInputRef}
                  type="text"
                  className="search-input"
                  placeholder="🔍 Search users..."
                  value={userSearchText}
                  onChange={(e) => setUserSearchText(e.target.value)}
                  onKeyDown={(e) => {
                    const filteredUsers = getFilteredUsers();
                    if (e.key === 'ArrowDown') {
                      e.preventDefault();
                      setSelectedUserIndex(prev => 
                        prev < filteredUsers.length - 1 ? prev + 1 : prev
                      );
                    } else if (e.key === 'ArrowUp') {
                      e.preventDefault();
                      setSelectedUserIndex(prev => prev > 0 ? prev - 1 : 0);
                    } else if (e.key === 'Enter' && filteredUsers.length > 0) {
                      e.preventDefault();
                      startPrivateChat(filteredUsers[selectedUserIndex]);
                    }
                  }}
                />
                <button 
                  className="filter-toggle-btn"
                  onClick={() => setShowFilters(!showFilters)}
                  title="Toggle filters"
                >
                  🔧 Filters
                </button>
              </div>
              {showFilters && (
                <div className="filter-options">
                  <div className="filter-header">
                    <label className="filter-label">Age Range: {ageRange[0]} - {ageRange[1]}</label>
                    <button 
                      className="clear-filters-btn"
                      onClick={clearFilters}
                      title="Clear all filters"
                    >
                      Clear
                    </button>
                  </div>
                  <div className="age-filter">
                    <div className="age-slider-container">
                      <input
                        type="range"
                        min="18"
                        max="100"
                        value={ageRange[0]}
                        onChange={(e) => handleMinAgeChange(parseInt(e.target.value))}
                        className="age-slider"
                      />
                      <input
                        type="range"
                        min="18"
                        max="100"
                        value={ageRange[1]}
                        onChange={(e) => handleMaxAgeChange(parseInt(e.target.value))}
                        className="age-slider"
                      />
                    </div>
                  </div>
                  <div className="gender-filter">
                    <div className="gender-filter-row">
                      <label className="filter-label">Gender:</label>
                      <div className="gender-options">
                        <label className="filter-checkbox">
                          <input
                            type="checkbox"
                            checked={selectedGenders.includes('Male')}
                            onChange={() => toggleGender('Male')}
                          />
                          <span>Male</span>
                        </label>
                        <label className="filter-checkbox">
                          <input
                            type="checkbox"
                            checked={selectedGenders.includes('Female')}
                            onChange={() => toggleGender('Female')}
                          />
                          <span>Female</span>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className="modal-body">
              <div className="user-list">
                {getFilteredUsers().map((u, index) => {
                  const unreadCount = getUserUnreadCount(u.userId);
                  return (
                    <div 
                      key={u.userId}
                      ref={(el) => { userItemsRef.current[index] = el; }}
                      className={`user-item ${index === selectedUserIndex ? 'keyboard-selected' : ''}`}
                      onClick={() => startPrivateChat(u)}
                    >
                      <div className="user-avatar">{u.displayName.charAt(0).toUpperCase()}</div>
                      <div className="user-details">
                        <div className="user-line-1">
                          <span className={`user-name ${u.gender === 'Male' ? 'male' : u.gender === 'Female' ? 'female' : ''}`}>
                            {u.displayName}
                          </span>
                          <span className="user-status">
                            <span className={`status-dot ${u.status}`}></span>
                            {u.status}
                          </span>
                        </div>
                        <div className="user-line-2">
                          {u.age && (
                            <span className="user-demographics">
                              {u.age} years old
                            </span>
                          )}
                        </div>
                      </div>
                      {unreadCount > 0 && (
                        <span className="room-badge unread">{unreadCount}</span>
                      )}
                    </div>
                  );
                })}
                {getFilteredUsers().length === 0 && (
                  <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-tertiary)' }}>
                    No users found matching your filters
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Home;
