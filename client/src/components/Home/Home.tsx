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
  profilePicture?: string | null;
  lastSeen?: Date;
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
  const [showUserPictures, setShowUserPictures] = useState(true);
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
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileAge, setProfileAge] = useState(user.age || 18);
  const [profileGender, setProfileGender] = useState(user.gender || 'Male');
  const [profilePicture, setProfilePicture] = useState(user.profilePicture);
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
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
        setShowUserModal(prev => {
          const newValue = !prev;
          // If closing the modal, focus message input
          if (prev === true) {
            setTimeout(() => {
              messageInputRef.current?.focus();
            }, 100);
          }
          return newValue;
        });
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

  // Reload users from backend when search text changes
  useEffect(() => {
    if (showUserModal) {
      loadUsers(userSearchText);
    }
  }, [userSearchText, showUserModal]);

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

      // Send activity heartbeat every 2 minutes to keep user online
      const activityInterval = setInterval(() => {
        if (socket.connected) {
          socket.emit('activity', { userId: user.userId });
        }
      }, 120000); // 2 minutes

      // Track user activity (mouse movement, keyboard, clicks)
      const sendActivity = () => {
        if (socket.connected) {
          socket.emit('activity', { userId: user.userId });
        }
      };

      // Throttle activity updates to once per minute
      let lastActivitySent = 0;
      const throttledActivity = () => {
        const now = Date.now();
        if (now - lastActivitySent > 60000) { // 1 minute
          sendActivity();
          lastActivitySent = now;
        }
      };

      window.addEventListener('mousemove', throttledActivity);
      window.addEventListener('keydown', throttledActivity);
      window.addEventListener('click', throttledActivity);

      socket.on('disconnect', () => {
        setConnected(false);
      });

      socket.on('room_message', (message: any) => {
        console.log('🔔 Received room_message:', {
          messageRoomId: message.roomId,
          content: message.content,
          timestamp: new Date()
        });
        
        // Always add the message if it's for a room chat, let React state handle filtering
        setMessages(prev => [...prev, {
          messageId: message.messageId,
          senderId: message.senderId,
          senderName: message.senderName,
          content: message.content,
          timestamp: message.timestamp,
          messageType: message.messageType,
          roomId: message.roomId
        }]);
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
        clearInterval(activityInterval);
        window.removeEventListener('mousemove', throttledActivity);
        window.removeEventListener('keydown', throttledActivity);
        window.removeEventListener('click', throttledActivity);
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

  const loadUsers = async (searchText: string = '') => {
    try {
      const token = localStorage.getItem('accessToken');
      const url = new URL(`${import.meta.env.VITE_API_URL}/rooms/users`);
      
      // Only add search parameter if there's actual search text
      if (searchText && searchText.trim()) {
        url.searchParams.append('search', searchText.trim());
      }
      
      const response = await fetch(url.toString(), {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setUsers(data.users);
        // Update showUserPictures based on backend response
        if (data.showPictures !== undefined) {
          setShowUserPictures(data.showPictures);
        }
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

  const startPrivateChat = async (selectedUser: User) => {
    const existingChat = privateChats.find(c => c.otherUser.userId === selectedUser.userId);
    
    if (existingChat) {
      selectPrivateChat(existingChat);
    } else {
      // Fetch complete user info including profile picture
      try {
        const token = localStorage.getItem('accessToken');
        const response = await fetch(`${import.meta.env.VITE_API_URL}/rooms/user-profile/${selectedUser.userId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          const completeUserData = data.user;
          
          const newChat: PrivateChat = {
            chatId: `temp_${Date.now()}`,
            otherUser: completeUserData,
            unreadCount: 0
          };
          setPrivateChats(prev => [...prev, newChat]);
          selectPrivateChat(newChat);
        } else {
          // Fallback: use the data we have
          const newChat: PrivateChat = {
            chatId: `temp_${Date.now()}`,
            otherUser: selectedUser,
            unreadCount: 0
          };
          setPrivateChats(prev => [...prev, newChat]);
          selectPrivateChat(newChat);
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
        // Fallback: use the data we have
        const newChat: PrivateChat = {
          chatId: `temp_${Date.now()}`,
          otherUser: selectedUser,
          unreadCount: 0
        };
        setPrivateChats(prev => [...prev, newChat]);
        selectPrivateChat(newChat);
      }
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
        // Text search filter - only apply if 3 or more characters
        if (userSearchText.trim() && userSearchText.trim().length >= 3) {
          const searchLower = userSearchText.toLowerCase();
          return u.displayName.toLowerCase().includes(searchLower) ||
                 u.username.toLowerCase().includes(searchLower);
        }
        // If less than 3 characters, show all users (no filtering)
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
        
        // Third priority: Most recently online (for offline users)
        if (a.status !== 'online' && b.status !== 'online') {
          if (a.lastSeen && b.lastSeen) {
            return new Date(b.lastSeen).getTime() - new Date(a.lastSeen).getTime();
          }
          if (a.lastSeen && !b.lastSeen) return -1;
          if (!a.lastSeen && b.lastSeen) return 1;
        }
        
        // Fourth priority: Alphabetical by display name
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
    
    if (socket && socket.connected) {
      // Request message history
      socket.emit('get_private_messages', {
        userId: user.userId,
        otherUserId: chat.otherUser.userId,
        limit: 50
      });
      
      // Mark chat as read
      socket.emit('mark_chat_as_read', {
        userId: user.userId,
        otherUserId: chat.otherUser.userId
      });
      
      // Subscribe to private chat updates immediately
      socket.emit('subscribe_private_chat', {
        userId: user.userId,
        otherUserId: chat.otherUser.userId
      });
    }
    
    // Focus input after a short delay to ensure chat is ready
    setTimeout(() => {
      messageInputRef.current?.focus();
    }, 100);
  };

  // Function to close private chat - currently not used but available for future use
  // const closePrivateChat = async (chat: PrivateChat) => {
  //   if (chat.unreadCount > 0) {
  //     return;
  //   }
  //   
  //   try {
  //     const token = localStorage.getItem('accessToken');
  //     await fetch(`${import.meta.env.VITE_API_URL}/rooms/close-private-chat`, {
  //       method: 'POST',
  //       headers: {
  //         'Content-Type': 'application/json',
  //         'Authorization': `Bearer ${token}`
  //       },
  //       body: JSON.stringify({ otherUserId: chat.otherUser.userId })
  //     });
  //     
  //     setPrivateChats(prev => prev.filter(c => c.chatId !== chat.chatId));
  //     
  //     if (selectedPrivateChat?.chatId === chat.chatId) {
  //       if (rooms.length > 0) {
  //         selectRoom(rooms[0]);
  //       } else {
  //         setSelectedPrivateChat(null);
  //         setChatType('room');
  //         setMessages([]);
  //       }
  //     }
  //   } catch (error) {
  //     console.error('Failed to close chat:', error);
  //   }
  // };

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
      console.log('📤 Sending room message:', {
        roomId: selectedRoom.roomId,
        roomName: selectedRoom.name,
        chatType,
        content: messageInput.trim()
      });
      
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
    
    if (socket) {
      if (chatType === 'private' && selectedPrivateChat) {
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
      } else if (chatType === 'room' && selectedRoom) {
        // Handle typing indicator for room chats
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
            roomId: selectedRoom.roomId,
            userId: user.userId,
            username: user.username,
            isPrivate: false
          });
        }

        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
        }

        typingTimeoutRef.current = window.setTimeout(() => {
          stopTyping();
        }, 2000);
      }
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
      } else if (chatType === 'room' && selectedRoom) {
        socket.emit('stop_typing', {
          roomId: selectedRoom.roomId,
          userId: user.userId,
          username: user.username,
          isPrivate: false
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

  const formatLastSeen = (lastSeen: Date | undefined) => {
    if (!lastSeen) return '';
    
    const now = new Date();
    const lastSeenDate = new Date(lastSeen);
    const diffMs = now.getTime() - lastSeenDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return lastSeenDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
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

  const handleProfilePictureChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const img = new Image();
    const reader = new FileReader();

    reader.onload = (event) => {
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = 80;
        canvas.height = 80;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, 80, 80);
          canvas.toBlob((blob) => {
            if (blob) {
              const previewUrl = URL.createObjectURL(blob);
              setProfilePicture(previewUrl);
            }
          }, 'image/jpeg', 0.9);
        }
      };
      img.src = event.target?.result as string;
    };

    reader.readAsDataURL(file);
  };

  const handleUpdateProfile = async () => {
    setIsUpdatingProfile(true);

    try {
      const token = localStorage.getItem('accessToken');
      const formData = new FormData();

      formData.append('age', profileAge.toString());
      formData.append('gender', profileGender);

      if (fileInputRef.current?.files?.[0]) {
        const file = fileInputRef.current.files[0];
        const img = new Image();
        const reader = new FileReader();

        await new Promise<void>((resolve) => {
          reader.onload = (event) => {
            img.onload = () => {
              const canvas = document.createElement('canvas');
              canvas.width = 80;
              canvas.height = 80;
              const ctx = canvas.getContext('2d');
              if (ctx) {
                ctx.drawImage(img, 0, 0, 80, 80);
                canvas.toBlob((blob) => {
                  if (blob) {
                    const resizedFile = new File([blob], file.name, { type: 'image/jpeg' });
                    formData.append('profilePicture', resizedFile);
                    resolve();
                  }
                }, 'image/jpeg', 0.9);
              }
            };
            img.src = event.target?.result as string;
          };
          reader.readAsDataURL(file);
        });
      }

      const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/update-profile`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (response.ok) {
        const data = await response.json();
        user.age = data.user.age;
        user.gender = data.user.gender;
        
        // Add cache-busting timestamp to force browser to reload the image
        const newProfilePicture = data.user.profilePicture 
          ? `${data.user.profilePicture}${data.user.profilePicture.includes('?') ? '&' : '?'}t=${Date.now()}`
          : null;
        
        user.profilePicture = newProfilePicture;
        
        // Update the profilePicture state to reflect in header immediately
        setProfilePicture(newProfilePicture);
        
        localStorage.setItem('user', JSON.stringify(user));

        await new Promise(resolve => setTimeout(resolve, 1000));
        
        setShowProfileModal(false);
        setIsUpdatingProfile(false);
      } else {
        console.error('Failed to update profile');
        setIsUpdatingProfile(false);
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      setIsUpdatingProfile(false);
    }
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
          <h1>💬 {import.meta.env.VITE_APP_NAME || 'netcify'}</h1>
        </div>
        <div className="header-center">
          <div className="new-chat-wrapper">
            <button 
              className="new-chat-button"
              onClick={() => setShowUserModal(true)}
              title="Start New Chat (Alt+M)"
            >
              <span className="chat-icon">💬</span>
              <span className="new-chat-hint">Alt+M</span>
            </button>
          </div>
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
            <div className="user-avatar" onClick={() => setShowProfileModal(true)} style={{ cursor: 'pointer' }} title="Click to edit profile">
              {user.profilePicture ? (
                <img src={user.profilePicture} alt={user.fullName || user.username} />
              ) : (
                user.fullName ? user.fullName.charAt(0).toUpperCase() : user.username.charAt(0).toUpperCase()
              )}
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
                        {selectedPrivateChat.otherUser.profilePicture ? (
                          <img src={selectedPrivateChat.otherUser.profilePicture} alt={selectedPrivateChat.otherUser.displayName} />
                        ) : (
                          selectedPrivateChat.otherUser.displayName.charAt(0).toUpperCase()
                        )}
                      </div>
                      <div>
                        <h2>{selectedPrivateChat.otherUser.username}</h2>
                        <p className="chat-description">
                          {selectedPrivateChat.otherUser.age && (
                            <span className="chat-header-info">{selectedPrivateChat.otherUser.age} years old</span>
                          )}
                          {selectedPrivateChat.otherUser.gender && (
                            <>
                              {selectedPrivateChat.otherUser.age && <span className="chat-header-separator"> • </span>}
                              <span className={`chat-header-info chat-header-gender ${selectedPrivateChat.otherUser.gender.toLowerCase()}`}>
                                {selectedPrivateChat.otherUser.gender}
                              </span>
                            </>
                          )}
                          {selectedPrivateChat.otherUser.status && (
                            <>
                              {(selectedPrivateChat.otherUser.age || selectedPrivateChat.otherUser.gender) && <span className="chat-header-separator"> • </span>}
                              <span className="chat-header-info chat-header-status">
                                <span className={`status-dot ${selectedPrivateChat.otherUser.status}`}></span>
                                {selectedPrivateChat.otherUser.status}
                              </span>
                            </>
                          )}
                        </p>
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
                          {msg.senderId === user.userId && user.profilePicture ? (
                            <img src={user.profilePicture} alt={msg.senderName} />
                          ) : msg.senderId !== user.userId && selectedPrivateChat?.otherUser.profilePicture ? (
                            <img src={selectedPrivateChat.otherUser.profilePicture} alt={msg.senderName} />
                          ) : (
                            msg.senderName.charAt(0).toUpperCase()
                          )}
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
              <div className="modal-header-left">
                <div className="modal-title-row">
                  <h2>Select User</h2>
                  <span className="hint esc-hint">Esc Close</span>
                </div>
                <div className="keyboard-hints">
                  <span className="hint">↑↓ Navigate</span>
                  <span className="hint">Enter Select</span>
                  <span className="hint">Alt+X Filters</span>
                </div>
              </div>
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
                      className={`user-item ${index === selectedUserIndex ? 'keyboard-selected' : ''} ${!showUserPictures ? 'no-picture' : ''}`}
                      onClick={() => startPrivateChat(u)}
                    >
                      {showUserPictures && (
                        <div className="user-avatar">
                          {u.profilePicture ? (
                            <img src={u.profilePicture} alt={u.displayName} />
                          ) : (
                            u.displayName.charAt(0).toUpperCase()
                          )}
                        </div>
                      )}
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
                          {u.status !== 'online' && u.lastSeen && (
                            <>
                              {u.age && <span className="user-demographics-separator"> • </span>}
                              <span className="user-last-seen">
                                {formatLastSeen(u.lastSeen)}
                              </span>
                            </>
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

      {showProfileModal && (
        <div className="modal-overlay" onClick={() => setShowProfileModal(false)}>
          <div className="modal-content profile-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-header-left">
                <h2>Edit Profile</h2>
              </div>
              <button className="modal-close" onClick={() => setShowProfileModal(false)}>×</button>
            </div>
            <div className="modal-body profile-modal-body">
              <div className="profile-picture-section">
                <div className={`profile-picture-preview ${isUpdatingProfile ? 'updating' : ''}`}>
                  {profilePicture ? (
                    <img src={profilePicture} alt="Profile" />
                  ) : (
                    <span>{user.fullName ? user.fullName.charAt(0).toUpperCase() : user.username.charAt(0).toUpperCase()}</span>
                  )}
                  {isUpdatingProfile && (
                    <div className="update-overlay">
                      <div className="spinner"></div>
                    </div>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleProfilePictureChange}
                  style={{ display: 'none' }}
                />
                <button
                  className="upload-button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUpdatingProfile}
                >
                  📷 Change Picture
                </button>
              </div>

              <div className="profile-form-section">
                <div className="form-group">
                  <label htmlFor="age">Age</label>
                  <select
                    id="age"
                    value={profileAge}
                    onChange={(e) => setProfileAge(parseInt(e.target.value))}
                    disabled={isUpdatingProfile}
                    className="age-select"
                  >
                    {Array.from({ length: 83 }, (_, i) => i + 18).map((age) => (
                      <option key={age} value={age}>
                        {age} years old
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Gender</label>
                  <div className="radio-group">
                    <label className="radio-label">
                      <input
                        type="radio"
                        name="gender"
                        value="Male"
                        checked={profileGender === 'Male'}
                        onChange={(e) => setProfileGender(e.target.value)}
                        disabled={isUpdatingProfile}
                      />
                      <span>Male</span>
                    </label>
                    <label className="radio-label">
                      <input
                        type="radio"
                        name="gender"
                        value="Female"
                        checked={profileGender === 'Female'}
                        onChange={(e) => setProfileGender(e.target.value)}
                        disabled={isUpdatingProfile}
                      />
                      <span>Female</span>
                    </label>
                  </div>
                </div>

                <button
                  className="update-profile-button"
                  onClick={handleUpdateProfile}
                  disabled={isUpdatingProfile}
                >
                  {isUpdatingProfile ? 'Updating...' : 'Update Profile'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Home;
