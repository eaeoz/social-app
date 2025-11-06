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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<number | null>(null);
  const isInitialLoadRef = useRef(true);
  const closedChatIdsRef = useRef<Set<string>>(new Set());

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
    
    // Load private chats from localStorage first (instant load)
    const savedChats = localStorage.getItem(`privateChats_${user.userId}`);
    if (savedChats) {
      try {
        const parsedChats = JSON.parse(savedChats);
        setPrivateChats(parsedChats);
      } catch (error) {
        console.error('Failed to parse saved chats:', error);
      }
    }
    
    // Then load from server to get any updates
    loadPrivateChats();
    
    // Load saved theme (default to dark)
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
    const initialTheme = savedTheme || 'dark';
    setTheme(initialTheme);
    document.documentElement.setAttribute('data-theme', initialTheme);

    // Poll for private chats only (rooms use real-time events)
    const pollInterval = setInterval(() => {
      loadPrivateChats();
    }, 5000);

    // Cleanup interval on unmount
    return () => {
      clearInterval(pollInterval);
    };
  }, []);

  // Save private chats to localStorage whenever they change
  useEffect(() => {
    if (privateChats.length > 0) {
      localStorage.setItem(`privateChats_${user.userId}`, JSON.stringify(privateChats));
    }
  }, [privateChats, user.userId]);

  // Re-join room when socket reconnects
  useEffect(() => {
    if (socket && connected && selectedRoom) {
      console.log('🔄 Socket connected, re-joining room:', selectedRoom.name);
      socket.emit('join_room', {
        roomId: selectedRoom.roomId,
        userId: user.userId,
        username: user.username
      });

      // Reload messages
      socket.emit('get_room_messages', {
        roomId: selectedRoom.roomId,
        limit: 50
      });
    }
  }, [socket, connected, selectedRoom]);

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
      socket.on('room_message', (message: any) => {
        console.log('📨 New room message:', message);
        
        // Only update if this message is for the current room
        if (selectedRoom?.roomId === message.roomId) {
          // Add message to current view
          setMessages(prev => [...prev, {
            messageId: message.messageId,
            senderId: message.senderId,
            senderName: message.senderName,
            content: message.content,
            timestamp: message.timestamp,
            messageType: message.messageType
          }]);
        }
        
        // Don't update room counts here - let polling handle it from server
        // This prevents the "all rooms show 1" bug
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

      // Real-time room notification for unread counts
      socket.on('room_message_notification', (data: { roomId: string; senderId: string; timestamp: Date }) => {
        console.log('🔔 Room notification received:', data);
        
        // Only increment unread if:
        // 1. Not currently in this room
        // 2. Message is not from current user
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
        
        // If we're currently viewing this chat, add message to the list (but avoid duplicates)
        if (isCurrentChat) {
          setMessages(prev => {
            // Check if this message already exists (avoid duplicates from temp messages)
            const messageExists = prev.some(m => 
              m.messageId === message.messageId || 
              (m.messageId.startsWith('temp_') && 
               m.senderId === message.senderId && 
               m.content === message.content &&
               Math.abs(new Date(m.timestamp).getTime() - new Date(message.timestamp).getTime()) < 2000)
            );
            
            if (messageExists) {
              // Replace temp message with real one
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
            
            // Add new message
            return [...prev, {
              messageId: message.messageId,
              senderId: message.senderId,
              senderName: message.senderName,
              content: message.content,
              timestamp: message.timestamp,
              messageType: message.messageType
            }];
          });
          
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
          } else {
            // Auto-create new chat for any message (both incoming and outgoing)
            const otherUserInfo = users.find(u => u.userId === otherUserId);
            console.log('🆕 Creating new chat:', {
              otherUserInfo: !!otherUserInfo,
              otherUserId: otherUserId,
              availableUsers: users.length
            });
            
            if (otherUserInfo) {
              // Remove from closed list when new message arrives
              closedChatIdsRef.current.delete(otherUserId);
              
              const newChat: PrivateChat = {
                chatId: message.chatId || `temp_${Date.now()}`,
                otherUser: otherUserInfo,
                lastMessage: message.content,
                lastMessageAt: message.timestamp,
                unreadCount: isCurrentChat ? 0 : (message.senderId !== user.userId ? 1 : 0)
              };
              console.log('✅ New chat created with unread count:', newChat.unreadCount);
              return [...prev, newChat];
            } else {
              console.warn('⚠️ Other user info not found for userId:', otherUserId);
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
        
        // Update rooms but preserve unreadCount=0 for currently selected room
        const updatedRooms = data.rooms.map((room: Room) => {
          // If this is the currently selected room, keep unreadCount at 0
          if (selectedRoom?.roomId === room.roomId) {
            return { ...room, unreadCount: 0 };
          }
          return room;
        });
        
        setRooms(updatedRooms);
        
        // Auto-select first room ONLY on initial load
        if (isInitialLoadRef.current && updatedRooms.length > 0) {
          selectRoom(updatedRooms[0]);
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
        
        // Clear closed chats list if chats come from server with new messages
        // This allows chats to reappear if new messages arrive after being closed
        const serverChatUserIds = new Set(data.privateChats.map((c: PrivateChat) => c.otherUser.userId));
        const closedChatsArray = Array.from(closedChatIdsRef.current);
        closedChatsArray.forEach(closedUserId => {
          const serverChat = data.privateChats.find((c: PrivateChat) => c.otherUser.userId === closedUserId);
          // If there's a new unread message, remove from closed list
          if (serverChat && serverChat.unreadCount > 0) {
            closedChatIdsRef.current.delete(closedUserId);
          }
        });
        
        // Filter out manually closed chats (only those without new messages)
        const filteredChats = data.privateChats.filter(
          (chat: PrivateChat) => !closedChatIdsRef.current.has(chat.otherUser.userId)
        );
        
        // Merge with existing chats - preserve ALL existing chats and update with server data
        setPrivateChats(prev => {
          const serverChatsByUserId = new Map<string, PrivateChat>(
            filteredChats.map((c: PrivateChat) => [c.otherUser.userId, c])
          );
          
          // Start with all existing chats
          const merged: PrivateChat[] = [];
          
          // Update existing chats with server data if available
          for (const existingChat of prev) {
            const serverChat = serverChatsByUserId.get(existingChat.otherUser.userId);
            
            if (serverChat) {
              // Update with server data, but preserve unreadCount if viewing this chat
              merged.push({
                ...serverChat,
                unreadCount: selectedPrivateChat?.otherUser.userId === serverChat.otherUser.userId 
                  ? 0 
                  : serverChat.unreadCount
              });
              // Remove from map so we know we've processed it
              serverChatsByUserId.delete(existingChat.otherUser.userId);
            } else {
              // Keep existing chat even if not in server response yet
              // This handles the case where a chat was just created and server hasn't caught up
              merged.push(existingChat);
            }
          }
          
          // Add any new chats from server that we didn't have before
          for (const serverChat of serverChatsByUserId.values()) {
            merged.push(serverChat);
          }
          
          return merged;
        });
      }
    } catch (error) {
      console.error('Failed to load private chats:', error);
    }
  };

  const selectRoom = (room: Room) => {
    // Clear unread count for this room immediately
    setRooms(prev => prev.map(r =>
      r.roomId === room.roomId ? { ...r, unreadCount: 0 } : r
    ));

    // If we're already in this room, just return (no need to rejoin)
    if (selectedRoom?.roomId === room.roomId) {
      return;
    }

    // Leave previous room if switching rooms (this updates lastSeenAt in DB)
    if (selectedRoom && selectedRoom.roomId !== room.roomId && socket) {
      socket.emit('leave_room', {
        roomId: selectedRoom.roomId,
        userId: user.userId,
        username: user.username
      });
    }

    // Update state
    setSelectedRoom(room);
    setSelectedPrivateChat(null);
    setChatType('room');
    setMessages([]);
    setTypingUsers([]);

    // Join new room and load messages
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

  const closePrivateChat = (chat: PrivateChat) => {
    // Don't allow closing if there are unread messages
    if (chat.unreadCount > 0) {
      return;
    }
    
    // Add to closed list (prevents it from reappearing on poll)
    closedChatIdsRef.current.add(chat.otherUser.userId);
    
    // Remove chat from the list
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
                  >
                    <div 
                      style={{ display: 'flex', flex: 1, alignItems: 'center', minWidth: 0, cursor: 'pointer' }}
                      onClick={() => {
                        selectPrivateChat(chat);
                        setSidebarOpen(false);
                      }}
                    >
                      <div className="user-avatar" style={{ width: '35px', height: '35px', fontSize: '0.9rem', marginRight: '10px' }}>
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
                    {chat.unreadCount === 0 && (
                      <button
                        className="close-chat-button"
                        onClick={(e) => {
                          e.stopPropagation();
                          closePrivateChat(chat);
                        }}
                        title="Close chat"
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--text-tertiary)',
                          cursor: 'pointer',
                          fontSize: '1.2rem',
                          padding: '0 8px',
                          marginLeft: '4px'
                        }}
                      >
                        ×
                      </button>
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
                  onFocus={() => {
                    // Clear notification when focusing input
                    if (selectedRoom) {
                      setRooms(prev => prev.map(r =>
                        r.roomId === selectedRoom.roomId ? { ...r, unreadCount: 0 } : r
                      ));
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
                      <div className={`user-name ${u.gender === 'Male' ? 'male' : u.gender === 'Female' ? 'female' : ''}`}>
                        {u.displayName}
                      </div>
                      <div className="user-info-row">
                        {u.age && u.gender && (
                          <span className="user-demographics">
                            {u.age} years old • {u.gender}
                          </span>
                        )}
                      </div>
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
