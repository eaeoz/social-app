import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Socket } from 'socket.io-client';
import EmojiPicker, { Theme, type EmojiClickData } from 'emoji-picker-react';
import Call from '../Call/Call';
import PrivacyPolicy from '../Legal/PrivacyPolicy';
import TermsConditions from '../Legal/TermsConditions';
import Contact from '../Legal/Contact';
import About from '../Legal/About';
import Blog from '../Legal/Blog';
import ImageCropper from '../Auth/ImageCropper';
import NSFWWarningModal from '../Auth/NSFWWarningModal';
import ReportModal from './ReportModal';
import { canSendMessage, recordMessageSent, getSecondsUntilReset } from '../../utils/rateLimiter';
import { nsfwDetector } from '../../utils/nsfwDetector';
import { handleNewMessageNotification, resetNotifications, playSendMessageSound } from '../../utils/notificationUtils';
import { ringtoneManager } from '../../utils/ringtoneUtils';
import { profanityFilter } from '../../utils/profanityFilter';
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
  icon?: string;
  participantCount: number;
  unreadCount?: number;
  messageCount?: number;
}

interface User {
  userId: string;
  username: string;
  nickName: string;
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
  const location = useLocation();
  const navigate = useNavigate();
  const [connected, setConnected] = useState(false);
  const [reconnecting, setReconnecting] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
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
  const [profileNickName, setProfileNickName] = useState(user.nickName || user.username);
  const [profilePicture, setProfilePicture] = useState(user.profilePicture);
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [nickNameError, setNickNameError] = useState('');
  const [inCall, setInCall] = useState(false);
  const [callType, setCallType] = useState<'voice' | 'video' | null>(null);
  const [isCallInitiator, setIsCallInitiator] = useState(false);
  const [callPartner, setCallPartner] = useState<{
    userId: string;
    username: string;
    nickName: string;
    profilePicture?: string | null;
  } | null>(null);
  const [incomingCall, setIncomingCall] = useState<{
    from: string;
    fromName: string;
    fromPicture?: string;
    callType: 'voice' | 'video';
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<number | null>(null);
  const isInitialLoadRef = useRef(true);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const userItemsRef = useRef<(HTMLDivElement | null)[]>([]);
  const messageInputRef = useRef<HTMLInputElement>(null);
  const footerRef = useRef<HTMLElement | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [showPrivacyPolicy, setShowPrivacyPolicy] = useState(false);
  const [showTermsConditions, setShowTermsConditions] = useState(false);
  const [showContact, setShowContact] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const [showBlog, setShowBlog] = useState(false);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [showImageCropper, setShowImageCropper] = useState(false);
  const [tempImageUrl, setTempImageUrl] = useState<string>('');
  const [croppedImageFile, setCroppedImageFile] = useState<File | null>(null);
  const [showNSFWWarning, setShowNSFWWarning] = useState(false);
  const [nsfwWarnings, setNsfwWarnings] = useState<string[]>([]);
  const [pendingCroppedBlob, setPendingCroppedBlob] = useState<Blob | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportedUserId, setReportedUserId] = useState<string | null>(null);
  const reconnectAttemptRef = useRef(0);
  const maxReconnectAttempts = 5;
  const [maxMessageLength, setMaxMessageLength] = useState(30);
  const [rateLimit, setRateLimit] = useState(10);
  const [showRateLimitWarning, setShowRateLimitWarning] = useState(false);
  const messageInputContainerRef = useRef<HTMLDivElement>(null);
  const [doNotDisturb, setDoNotDisturb] = useState(() => {
    // Initialize from user data from database
    return user.doNotDisturb === true;
  });
  const [allowUserPictures, setAllowUserPictures] = useState(true);

  // Toggle Do Not Disturb mode
  const toggleDoNotDisturb = async () => {
    const newValue = !doNotDisturb;
    setDoNotDisturb(newValue);
    
    // Sync with database
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/update-dnd`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ doNotDisturb: newValue })
      });
      
      if (response.ok) {
        // Update user object
        user.doNotDisturb = newValue;
        localStorage.setItem('user', JSON.stringify(user));
      } else {
        // Revert on error
        setDoNotDisturb(!newValue);
        console.error('Failed to update DND setting');
      }
    } catch (error) {
      // Revert on error
      setDoNotDisturb(!newValue);
      console.error('Failed to update DND setting:', error);
    }
  };

  // Handle footer visibility on mobile when input is focused
  useEffect(() => {
    footerRef.current = document.querySelector('.app-footer');
  }, []);

  const handleInputFocus = () => {
    // Only hide footer on mobile/tablet devices
    if (window.innerWidth <= 1024 && footerRef.current) {
      footerRef.current.classList.add('hidden');
    }
  };

  const handleInputBlur = () => {
    // Show footer again when input loses focus
    if (footerRef.current) {
      footerRef.current.classList.remove('hidden');
    }
  };

  const scrollToBottom = (behavior: 'smooth' | 'auto' = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  const handleScroll = () => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const { scrollTop, scrollHeight, clientHeight } = container;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
    
    setShowScrollButton(!isNearBottom);
  };

  // Handle direct URL access to modal pages
  useEffect(() => {
    const path = location.pathname;
    
    // Open corresponding modal based on URL path
    if (path === '/about') {
      setShowAbout(true);
      navigate('/', { replace: true }); // Reset URL to home
    } else if (path === '/contact') {
      setShowContact(true);
      navigate('/', { replace: true });
    } else if (path === '/privacy') {
      setShowPrivacyPolicy(true);
      navigate('/', { replace: true });
    } else if (path === '/terms') {
      setShowTermsConditions(true);
      navigate('/', { replace: true });
    } else if (path === '/blog') {
      // Open blog modal for /blog URL only (articles now have dedicated routes)
      setShowBlog(true);
      navigate('/', { replace: true });
    }
  }, [location.pathname, navigate]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Close emoji picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node)) {
        setShowEmojiPicker(false);
      }
    };

    if (showEmojiPicker) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [showEmojiPicker]);

  useEffect(() => {
    loadRooms();
    loadUsers();
    loadPrivateChats();
    loadSiteSettings();
    
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
    const initialTheme = savedTheme || 'dark';
    setTheme(initialTheme);
    document.documentElement.setAttribute('data-theme', initialTheme);

    const pollInterval = setInterval(() => {
      loadPrivateChats();
    }, 5000);

    // Add visibility change listener to reset notifications when user returns
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        resetNotifications();
      }
    };

    const handleFocus = () => {
      resetNotifications();
    };

    // Initialize audio context early with user interaction for mobile compatibility
    const initAudio = () => {
      ringtoneManager.initAudioContext();
      // Remove listeners after first interaction
      document.removeEventListener('click', initAudio);
      document.removeEventListener('touchstart', initAudio);
      document.removeEventListener('keydown', initAudio);
    };

    // Listen for any user interaction to initialize audio
    document.addEventListener('click', initAudio);
    document.addEventListener('touchstart', initAudio);
    document.addEventListener('keydown', initAudio);

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    // Auto-focus message input on mount (login or page reload)
    setTimeout(() => {
      messageInputRef.current?.focus();
    }, 500);

    return () => {
      clearInterval(pollInterval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('click', initAudio);
      document.removeEventListener('touchstart', initAudio);
      document.removeEventListener('keydown', initAudio);
    };
  }, []);

  // Load site settings from backend
  const loadSiteSettings = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/settings/site`);
      if (response.ok) {
        const data = await response.json();
        console.log('📋 Loaded site settings:', data.settings);
        if (data.settings) {
          const newMaxLength = data.settings.maxMessageLength || 500;
          const newRateLimit = data.settings.rateLimit || 10;
          const allowPictures = data.settings.allowUserPictures !== false;
          console.log(`✅ Max message length: ${newMaxLength}, Rate limit: ${newRateLimit}, Allow pictures: ${allowPictures}`);
          setMaxMessageLength(newMaxLength);
          setRateLimit(newRateLimit);
          setAllowUserPictures(allowPictures);
        }
      } else {
        console.error('Failed to fetch settings:', response.status);
      }
    } catch (error) {
      console.error('Failed to load site settings:', error);
    }
  };

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
      } else if (e.key === 'Escape') {
        e.preventDefault();
        // Close legal modals first
        if (showAbout) {
          setShowAbout(false);
        }
        else if (showPrivacyPolicy) {
          setShowPrivacyPolicy(false);
        }
        else if (showTermsConditions) {
          setShowTermsConditions(false);
        }
        else if (showContact) {
          setShowContact(false);
        }
        // Close sidebar if open
        else if (sidebarOpen) {
          setSidebarOpen(false);
        }
        // Close profile modal if open
        else if (showProfileModal) {
          setShowProfileModal(false);
        }
        // Close user modal if open
        else if (showUserModal) {
          setShowUserModal(false);
          // Focus chat input after closing modal
          setTimeout(() => {
            messageInputRef.current?.focus();
          }, 100);
        }
      } else if (e.altKey && e.key.toLowerCase() === 'x' && showUserModal) {
        e.preventDefault();
        setShowFilters(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [showUserModal, sidebarOpen, showProfileModal, showAbout, showPrivacyPolicy, showTermsConditions, showContact]);

  // Auto-focus search input when modal opens, reset selected index, and reload users
  useEffect(() => {
    if (showUserModal) {
      setSelectedUserIndex(0);
      // Reload users to get fresh data including showPictures setting
      loadUsers(userSearchText);
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

  // Reconnection handler
  const handleReconnection = () => {
    if (!socket || reconnecting) return;
    
    console.log('🔄 Attempting to reconnect...');
    setReconnecting(true);
    setConnectionError(null);
    reconnectAttemptRef.current++;
    
    // Force socket to reconnect
    if (socket.disconnected) {
      socket.connect();
    }
  };

  useEffect(() => {
    if (socket) {
      setConnected(socket.connected);

      socket.on('connect', () => {
        console.log('✅ Socket connected successfully');
        setConnected(true);
        setReconnecting(false);
        setConnectionError(null);
        reconnectAttemptRef.current = 0;
        
        // Re-authenticate after reconnection
        socket.emit('authenticate', {
          userId: user.userId,
          username: user.username,
          fullName: user.fullName || user.username
        });
        
        // Reload data after reconnection
        loadRooms();
        loadUsers();
        loadPrivateChats();
        
        // Rejoin current room/chat if any
        if (selectedRoom) {
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
        
        if (selectedPrivateChat) {
          socket.emit('get_private_messages', {
            userId: user.userId,
            otherUserId: selectedPrivateChat.otherUser.userId,
            limit: 50
          });
        }
      });

      socket.on('connect_error', (error) => {
        console.error('❌ Connection error:', error.message);
        setConnected(false);
        setConnectionError('Connection failed. Retrying...');
        
        // Auto-retry with exponential backoff
        if (reconnectAttemptRef.current < maxReconnectAttempts) {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttemptRef.current), 30000);
          setTimeout(() => {
            handleReconnection();
          }, delay);
        } else {
          setConnectionError('Unable to connect. Please refresh the page.');
          setReconnecting(false);
        }
      });

      // Send activity heartbeat every 90 seconds (1.5 minutes) to keep user online
      const activityInterval = setInterval(() => {
        if (socket.connected) {
          socket.emit('activity', { userId: user.userId });
        }
      }, 90000); // 90 seconds - well before the 5-minute server timeout

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

      socket.on('disconnect', (reason) => {
        console.warn('⚠️ Socket disconnected:', reason);
        setConnected(false);
        
        if (reason === 'io server disconnect') {
          // Server forcibly disconnected - don't auto-reconnect
          setConnectionError('You have been disconnected by the server.');
        } else {
          // Transport error or client disconnect - attempt reconnection
          setConnectionError('Connection lost. Reconnecting...');
          setReconnecting(true);
          
          // Socket.IO will auto-reconnect, but we can force it if needed
          setTimeout(() => {
            if (socket.disconnected) {
              handleReconnection();
            }
          }, 1000);
        }
      });

      socket.on('room_message', (message: any) => {
        console.log('🔔 Received room_message:', {
          messageRoomId: message.roomId,
          content: message.content,
          timestamp: new Date()
        });
        
        // Trigger notification for new room message (but not for system messages)
        if (message.senderId !== user.userId && message.messageType !== 'system') {
          handleNewMessageNotification('New message', message.senderId, user.userId, doNotDisturb);
        }
        
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
        
        // Trigger notification for new private message (but not for system messages)
        if (message.senderId !== user.userId && message.messageType !== 'system') {
          handleNewMessageNotification(`New message from ${message.senderName}`, message.senderId, user.userId, doNotDisturb);
        }
        
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

      socket.on('incoming-call', (data: {
        from: string;
        fromName: string;
        fromPicture?: string;
        callType: 'voice' | 'video';
      }) => {
        // If in Do Not Disturb mode, automatically reject the call
        if (doNotDisturb) {
          socket.emit('call-rejected', { to: data.from });
          return;
        }
        
        setIncomingCall(data);
        // Start playing ringtone for incoming call (only if not in DND)
        // Pass the call type so the appropriate ringtone is played
        ringtoneManager.startRingtone(data.callType);
      });

      socket.on('call-cancelled', () => {
        setIncomingCall(null);
        // Stop ringtone when call is cancelled
        ringtoneManager.stopRingtone();
      });

      socket.on('call-rejected', () => {
        setInCall(false);
        setCallType(null);
        setIsCallInitiator(false);
        setCallPartner(null);
      });

      socket.on('call-ended', () => {
        setInCall(false);
        setCallType(null);
        setIsCallInitiator(false);
        setCallPartner(null);
        setIncomingCall(null);
      });

      socket.on('force_logout', (data: { reason: string }) => {
        console.warn('⚠️ Force logout received:', data.reason);
        alert(data.reason || 'Your session has been terminated. You will be logged out.');
        handleLogout();
      });

      socket.on('user_deleted', (data: { userId: string; message: string }) => {
        console.warn('⚠️ User deletion notification:', data);
        // Check if the deleted user is the current user
        if (data.userId === user.userId) {
          alert(data.message || 'Your account has been deleted by an administrator. You will be logged out.');
          handleLogout();
        }
      });

      socket.on('user_suspended', (data: { userId: string; message: string }) => {
        console.warn('⚠️ User suspension notification:', data);
        // Check if the suspended user is the current user
        if (data.userId === user.userId) {
          alert(data.message || 'Your account has been suspended by an administrator. You will be logged out.');
          handleLogout();
        }
      });

      socket.on('user_status_changed', (data: { userId: string; status: string; lastActiveAt: Date }) => {
        console.log('👤 User status changed:', data);
        
        // Update user status in the users list
        setUsers(prev => prev.map(u => 
          u.userId === data.userId 
            ? { ...u, status: data.status, lastSeen: data.lastActiveAt }
            : u
        ));
        
        // Update status in private chats list
        setPrivateChats(prev => prev.map(chat =>
          chat.otherUser.userId === data.userId
            ? { ...chat, otherUser: { ...chat.otherUser, status: data.status, lastSeen: data.lastActiveAt } }
            : chat
        ));
        
        // Update status in selected private chat
        if (selectedPrivateChat && selectedPrivateChat.otherUser.userId === data.userId) {
          setSelectedPrivateChat(prev => prev ? {
            ...prev,
            otherUser: { ...prev.otherUser, status: data.status, lastSeen: data.lastActiveAt }
          } : null);
        }
      });

      socket.on('error', (error: { message: string }) => {
        console.error('Socket error:', error.message);
        setConnectionError(error.message);
      });

      return () => {
        clearInterval(activityInterval);
        window.removeEventListener('mousemove', throttledActivity);
        window.removeEventListener('keydown', throttledActivity);
        window.removeEventListener('click', throttledActivity);
        socket.off('connect');
        socket.off('connect_error');
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
        socket.off('incoming-call');
        socket.off('call-cancelled');
        socket.off('call-rejected');
        socket.off('call-ended');
        socket.off('force_logout');
        socket.off('user_deleted');
        socket.off('user_suspended');
        socket.off('user_status_changed');
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

      // Check for authentication errors (token expired)
      if (response.status === 401 || response.status === 403) {
        const data = await response.json();
        
        // Check if it's a suspension
        if (data.suspended) {
          alert(data.message || 'Your account has been suspended.');
          handleLogout();
          return;
        }
        
        // Check if it's an expired/invalid token
        if (data.error && (data.error.includes('expired') || data.error.includes('Invalid'))) {
          console.warn('⚠️ Token expired during API call - logging out');
          alert('Your session has expired. Please log in again.');
          handleLogout();
          return;
        }
      }

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

      // Check for authentication errors (token expired)
      if (response.status === 401 || response.status === 403) {
        const data = await response.json();
        
        // Check if it's a suspension
        if (data.suspended) {
          alert(data.message || 'Your account has been suspended.');
          handleLogout();
          return;
        }
        
        // Check if it's an expired/invalid token
        if (data.error && (data.error.includes('expired') || data.error.includes('Invalid'))) {
          console.warn('⚠️ Token expired during API call - logging out');
          alert('Your session has expired. Please log in again.');
          handleLogout();
          return;
        }
      }

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

      // Check for authentication errors (token expired)
      if (response.status === 401 || response.status === 403) {
        const data = await response.json();
        
        // Check if it's a suspension
        if (data.suspended) {
          alert(data.message || 'Your account has been suspended.');
          handleLogout();
          return;
        }
        
        // Check if it's an expired/invalid token
        if (data.error && (data.error.includes('expired') || data.error.includes('Invalid'))) {
          console.warn('⚠️ Token expired during API call - logging out');
          alert('Your session has expired. Please log in again.');
          handleLogout();
          return;
        }
      }

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
    
    // Mark this chat as open in the backend
    try {
      const token = localStorage.getItem('accessToken');
      await fetch(`${import.meta.env.VITE_API_URL}/rooms/open-private-chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ otherUserId: selectedUser.userId })
      });
    } catch (error) {
      console.error('Error marking chat as open:', error);
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
    // Backend already provides users sorted properly by activity
    // We only need to apply client-side filters and unread message priority
    return users
      .filter(u => u.userId !== user.userId)
      .filter(u => {
        // Text search filter - only apply if 3 or more characters
        if (userSearchText.trim() && userSearchText.trim().length >= 3) {
          const searchLower = userSearchText.toLowerCase();
          return u.nickName.toLowerCase().includes(searchLower) ||
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
        // Only priority: Users with unread messages come first
        // Backend already sorted by online status and recent activity
        const aUnread = getUserUnreadCount(a.userId);
        const bUnread = getUserUnreadCount(b.userId);
        if (aUnread > 0 && bUnread === 0) return -1;
        if (aUnread === 0 && bUnread > 0) return 1;
        
        // Otherwise maintain backend's sorting order (which is by online status and lastActiveAt)
        return 0;
      });
  };

  const getUserUnreadCount = (userId: string): number => {
    const chat = privateChats.find(c => c.otherUser.userId === userId);
    return chat?.unreadCount || 0;
  };

  const closePrivateChat = async (chat: PrivateChat, e?: React.MouseEvent) => {
    // Prevent click from bubbling to parent (chat selection)
    if (e) {
      e.stopPropagation();
    }
    
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
      
      // If this is the currently selected chat, clear the selection
      if (selectedPrivateChat?.otherUser.userId === chat.otherUser.userId) {
        setSelectedPrivateChat(null);
        setChatType('room');
        setMessages([]);
        
        // Select first room if available
        if (rooms.length > 0) {
          selectRoom(rooms[0]);
        }
      }
      
      // Reload private chats to update the list
      loadPrivateChats();
    } catch (error) {
      console.error('Error closing private chat:', error);
    }
  };

  const selectPrivateChat = async (chat: PrivateChat) => {
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
    
    // Mark this chat as open in the backend
    try {
      const token = localStorage.getItem('accessToken');
      await fetch(`${import.meta.env.VITE_API_URL}/rooms/open-private-chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ otherUserId: chat.otherUser.userId })
      });
    } catch (error) {
      console.error('Error marking chat as open:', error);
    }
    
    // Focus input after a short delay to ensure chat is ready
    setTimeout(() => {
      messageInputRef.current?.focus();
    }, 100);
  };

  const sendMessage = (messageContent?: string) => {
    const content = messageContent || messageInput.trim();
    if (!content || !socket) return;

    // Check rate limit before sending
    if (!canSendMessage(rateLimit)) {
      const secondsLeft = getSecondsUntilReset();
      setShowRateLimitWarning(true);
      
      // Add flash effect to input container
      if (messageInputContainerRef.current) {
        messageInputContainerRef.current.classList.add('rate-limit-flash');
        setTimeout(() => {
          messageInputContainerRef.current?.classList.remove('rate-limit-flash');
        }, 600);
      }
      
      // Hide warning after 3 seconds
      setTimeout(() => {
        setShowRateLimitWarning(false);
      }, 3000);
      
      console.log(`⚠️ Rate limit exceeded. Wait ${secondsLeft} seconds.`);
      return;
    }

    // Filter profanity from the message
    const cleanedContent = profanityFilter.clean(content);
    
    // Optional: Log if profanity was detected
    if (cleanedContent !== content) {
      console.log('🚫 Profanity detected and filtered');
    }

    // Record the message sent
    recordMessageSent();

    // Play send message sound
    playSendMessageSound(doNotDisturb);

    if (chatType === 'private' && selectedPrivateChat) {
      socket.emit('send_private_message', {
        receiverId: selectedPrivateChat.otherUser.userId,
        senderId: user.userId,
        senderName: user.nickName || user.username,
        content: cleanedContent,
        messageType: 'text'
      });
      
      const tempMessage: Message = {
        messageId: `temp_${Date.now()}`,
        senderId: user.userId,
        senderName: user.nickName || user.username,
        content: cleanedContent,
        timestamp: new Date(),
        messageType: 'text'
      };
      setMessages(prev => [...prev, tempMessage]);
    } else if (selectedRoom) {
      console.log('📤 Sending room message:', {
        roomId: selectedRoom.roomId,
        roomName: selectedRoom.name,
        chatType,
        content: cleanedContent
      });
      
      socket.emit('send_room_message', {
        roomId: selectedRoom.roomId,
        senderId: user.userId,
        senderName: user.nickName || user.username,
        content: cleanedContent,
        messageType: 'text'
      });
    }

    setMessageInput('');
    setShowEmojiPicker(false);
    stopTyping();
    
    // Refocus the input after sending message
    setTimeout(() => {
      messageInputRef.current?.focus();
    }, 50);
  };

  const handleEmojiClick = (emojiData: EmojiClickData) => {
    setMessageInput(prev => prev + emojiData.emoji);
    messageInputRef.current?.focus();
  };

  const handleLocationShare = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }
    setShowLocationModal(true);
  };

  const confirmLocationShare = () => {
    setIsGettingLocation(true);
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const googleMapsUrl = `https://www.google.com/maps?q=${latitude},${longitude}`;
        const locationMessage = `📍 Location: ${googleMapsUrl}`;
        sendMessage(locationMessage);
        setShowLocationModal(false);
        setIsGettingLocation(false);
      },
      (error) => {
        let errorMessage = 'Unable to retrieve your location';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location permission denied. Please enable location access in your browser settings.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information is currently unavailable.';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out. Please try again.';
            break;
        }
        alert(errorMessage);
        setShowLocationModal(false);
        setIsGettingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  const cancelLocationShare = () => {
    setShowLocationModal(false);
    setIsGettingLocation(false);
  };

  const renderMessageContent = (content: string) => {
    // Check if message contains a location URL
    const locationUrlRegex = /📍\s*Location:\s*(https:\/\/www\.google\.com\/maps\?q=[-0-9.]+,[-0-9.]+)/;
    const match = content.match(locationUrlRegex);
    
    if (match) {
      const url = match[1];
      const coords = url.match(/q=([-0-9.]+),([-0-9.]+)/);
      
      if (coords) {
        const [, lat, lng] = coords;
        return (
          <div className="location-message">
            <div className="location-text">📍 Shared Location</div>
            <div className="location-map-preview">
              <iframe
                src={`https://www.google.com/maps?q=${lat},${lng}&output=embed`}
                width="100%"
                height="200"
                style={{ border: 0, borderRadius: '8px' }}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Location Map"
              />
            </div>
            <a 
              href={url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="location-link"
              onClick={(e) => e.stopPropagation()}
            >
              Open in Google Maps →
            </a>
          </div>
        );
      }
    }
    
    return content;
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

  const handleLogout = async () => {
    // Close all modals before logout
    setShowUserModal(false);
    setShowProfileModal(false);
    setSidebarOpen(false);
    
    if (socket && selectedRoom) {
      socket.emit('leave_room', {
        roomId: selectedRoom.roomId,
        userId: user.userId,
        username: user.username
      });
    }
    
    try {
      // Call logout endpoint to update user status in database
      const token = localStorage.getItem('accessToken');
      if (token) {
        await fetch(`${import.meta.env.VITE_API_URL}/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
      }
    } catch (error) {
      console.error('Error calling logout endpoint:', error);
      // Continue with logout even if API call fails
    }
    
    // Emit logout event to notify other users
    if (socket) {
      socket.emit('user-logout', { reason: 'manual-logout' });
    }
    
    // Clear ALL localStorage items related to auth
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    
    // Clear any session storage as well
    sessionStorage.clear();
    
    // Disconnect socket completely
    if (socket) {
      socket.disconnect();
    }
    
    onLogout();
  };

  const handleProfilePictureChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image size must be less than 5MB');
      return;
    }

    // Create preview and show cropper
    const reader = new FileReader();
    reader.onloadend = () => {
      setTempImageUrl(reader.result as string);
      setShowImageCropper(true);
    };
    reader.readAsDataURL(file);
  };

  const handleCropComplete = async (croppedBlob: Blob) => {
    setShowImageCropper(false);
    setTempImageUrl('');
    setIsAnalyzing(true);
    setNickNameError('');

    try {
      // Analyze the image for NSFW content
      const result = await nsfwDetector.analyzeImage(croppedBlob);
      
      if (result.isNSFW) {
        // Show warning modal
        setPendingCroppedBlob(croppedBlob);
        setNsfwWarnings(result.warnings);
        setShowNSFWWarning(true);
      } else {
        // Safe image - proceed with upload
        proceedWithProfileImageUpload(croppedBlob);
      }
    } catch (err: any) {
      console.error('NSFW detection error:', err);
      // If detection fails, allow upload but log the error
      setNickNameError('Content detection unavailable. Proceeding with upload.');
      proceedWithProfileImageUpload(croppedBlob);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const proceedWithProfileImageUpload = (croppedBlob: Blob) => {
    // Convert blob to File
    const file = new File([croppedBlob], 'profile.jpg', { type: 'image/jpeg' });
    setCroppedImageFile(file);
    
    // Create preview from blob
    const url = URL.createObjectURL(croppedBlob);
    setProfilePicture(url);
  };

  const handleNSFWCancel = () => {
    setShowNSFWWarning(false);
    setPendingCroppedBlob(null);
    setNsfwWarnings([]);
    // User can select a different image
  };

  const handleCropCancel = () => {
    setShowImageCropper(false);
    setTempImageUrl('');
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const startCall = (type: 'voice' | 'video') => {
    if (!selectedPrivateChat) return;
    
    // Store call partner info separately to prevent unmounting issues
    setCallPartner({
      userId: selectedPrivateChat.otherUser.userId,
      username: selectedPrivateChat.otherUser.username,
      nickName: selectedPrivateChat.otherUser.nickName,
      profilePicture: selectedPrivateChat.otherUser.profilePicture
    });
    
    setCallType(type);
    setIsCallInitiator(true);
    setInCall(true);
    
    if (socket) {
      socket.emit('initiate-call', {
        to: selectedPrivateChat.otherUser.userId,
        callType: type,
        from: user.userId,
        fromName: user.nickName || user.username,
        fromPicture: user.profilePicture
      });
    }
  };

  const handleCallEnd = () => {
    setInCall(false);
    setCallType(null);
    setIsCallInitiator(false);
    setCallPartner(null);
    setIncomingCall(null);
  };

  const acceptIncomingCall = async () => {
    if (!incomingCall) return;
    
    // Stop ringtone when call is accepted
    ringtoneManager.stopRingtone();
    
    // Find or create private chat with the caller
    let chat = privateChats.find(c => c.otherUser.userId === incomingCall.from);
    
    if (!chat) {
      // Fetch user info if not in chat list
      try {
        const token = localStorage.getItem('accessToken');
        const response = await fetch(`${import.meta.env.VITE_API_URL}/rooms/user-profile/${incomingCall.from}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          chat = {
            chatId: `temp_${Date.now()}`,
            otherUser: data.user,
            unreadCount: 0
          };
          setPrivateChats(prev => [...prev, chat!]);
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
      }
    }
    
    // Set the private chat as selected
    if (chat) {
      setSelectedPrivateChat(chat);
      setChatType('private');
      setSelectedRoom(null);
      
      // Store call partner info separately
      setCallPartner({
        userId: chat.otherUser.userId,
        username: chat.otherUser.username,
        nickName: chat.otherUser.nickName,
        profilePicture: chat.otherUser.profilePicture
      });
    }
    
    // Start the call - this will mount the Call component
    setCallType(incomingCall.callType);
    setIsCallInitiator(false);
    setInCall(true);
    
    const callFrom = incomingCall.from;
    setIncomingCall(null);
    
    // CRITICAL: Wait for Call component to mount and initialize before accepting
    // This ensures the Call component is listening for the call-offer that will be sent
    setTimeout(() => {
      if (socket) {
        console.log('📞 Sending call-accepted to initiator after Call component mounted');
        socket.emit('call-accepted', {
          to: callFrom
        });
      }
    }, 500); // 500ms delay to ensure Call component is mounted and listening
  };

  const declineIncomingCall = () => {
    if (!incomingCall || !socket) return;
    
    // Stop ringtone when call is declined
    ringtoneManager.stopRingtone();
    
    socket.emit('call-rejected', {
      to: incomingCall.from
    });
    
    setIncomingCall(null);
  };

  const handleUpdateProfile = async () => {
    // Validate nickName before submitting
    if (!profileNickName || profileNickName.trim().length === 0) {
      setNickNameError('Display name cannot be empty');
      return;
    }

    if (profileNickName.trim().length < 3) {
      setNickNameError('Display name must be at least 3 characters');
      return;
    }

    if (profileNickName.trim().length > 20) {
      setNickNameError('Display name must be at most 20 characters');
      return;
    }

    // Check if nickname contains only allowed characters (letters, numbers, spaces, underscores, hyphens)
    const nickNameRegex = /^[a-zA-Z0-9\s_-]+$/;
    if (!nickNameRegex.test(profileNickName.trim())) {
      setNickNameError('Display name can only contain letters, numbers, spaces, underscores, and hyphens');
      return;
    }

    setIsUpdatingProfile(true);
    setNickNameError('');

    try {
      const token = localStorage.getItem('accessToken');
      const formData = new FormData();

      formData.append('age', profileAge.toString());
      formData.append('gender', profileGender);
      formData.append('nickName', profileNickName.trim());

      // Use the cropped image file if available
      if (croppedImageFile) {
        formData.append('profilePicture', croppedImageFile);
      }

      const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/update-profile`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const data = await response.json();

      if (response.ok) {
        user.age = data.user.age;
        user.gender = data.user.gender;
        user.nickName = data.user.nickName;
        user.nickName = data.user.nickName;
        
        // Add cache-busting timestamp to force browser to reload the image
        const newProfilePicture = data.user.profilePicture 
          ? `${data.user.profilePicture}${data.user.profilePicture.includes('?') ? '&' : '?'}t=${Date.now()}`
          : null;
        
        user.profilePicture = newProfilePicture;
        
        // Update states
        setProfilePicture(newProfilePicture);
        setProfileNickName(data.user.nickName);
        
        localStorage.setItem('user', JSON.stringify(user));

        await new Promise(resolve => setTimeout(resolve, 1000));
        
        setShowProfileModal(false);
        setIsUpdatingProfile(false);
      } else {
        // Handle errors
        setNickNameError(data.error || 'Failed to update profile');
        setIsUpdatingProfile(false);
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      setNickNameError('An error occurred while updating profile');
      setIsUpdatingProfile(false);
    }
  };

  const handleChangePassword = async () => {
    // Clear previous messages
    setPasswordError('');
    setPasswordSuccess('');

    // Validation
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError('All password fields are required');
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }

    if (currentPassword === newPassword) {
      setPasswordError('New password must be different from current password');
      return;
    }

    setIsChangingPassword(true);

    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/change-password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          currentPassword,
          newPassword
        })
      });

      const data = await response.json();

      if (response.ok) {
        setPasswordSuccess('Password changed successfully!');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        
        // Auto-hide password change section after 2 seconds
        setTimeout(() => {
          setShowPasswordChange(false);
          setPasswordSuccess('');
        }, 2000);
      } else {
        setPasswordError(data.error || 'Failed to change password');
      }
    } catch (error) {
      console.error('Error changing password:', error);
      setPasswordError('An error occurred while changing password');
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <>
    <header className="app-header">
      <div className="wind-effect">
        <div className="wind-layer"></div>
        <div className="wind-layer"></div>
        <div className="wind-layer"></div>
      </div>
    </header>

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
          <div className={`new-chat-wrapper ${privateChats.reduce((total, chat) => total + chat.unreadCount, 0) > 0 ? 'has-unread' : ''}`}>
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
            onClick={toggleDoNotDisturb} 
            className={`dnd-toggle ${doNotDisturb ? 'active' : ''}`}
            title={doNotDisturb ? 'Disable Do Not Disturb' : 'Enable Do Not Disturb'}
          >
            {doNotDisturb ? '🔕' : '🔔'}
          </button>
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
              <span className="user-name">{user.nickName || user.nickName || user.username}</span>
              <span className={`connection-status ${connected ? 'connected' : reconnecting ? 'reconnecting' : 'disconnected'}`}>
                {connected ? '🟢 Online' : reconnecting ? '🟡 Reconnecting...' : '🔴 Offline'}
              </span>
            </div>
          </div>
          <button onClick={handleLogout} className="logout-button">
            Logout
          </button>
        </div>
      </header>

      {/* Connection Error Banner */}
      {connectionError && !connected && (
        <div className="connection-error-banner">
          <span>{connectionError}</span>
          {reconnectAttemptRef.current < maxReconnectAttempts && (
            <button onClick={handleReconnection} className="reconnect-button">
              Retry Now
            </button>
          )}
        </div>
      )}

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
                    {room.icon || '💬'}
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
              <h3>
                💬 Private Chats
                {privateChats.reduce((total, chat) => total + chat.unreadCount, 0) > 0 && (
                  <span className="section-unread-badge">
                    {privateChats.reduce((total, chat) => total + chat.unreadCount, 0)}
                  </span>
                )}
              </h3>
            </div>
            <div className="chat-list">
              {privateChats.length === 0 ? (
                <p className="empty-message">No private chats yet</p>
              ) : (
                privateChats.map(chat => (
                  <div
                    key={chat.chatId}
                    className={`room-item private-chat-item ${selectedPrivateChat?.chatId === chat.chatId ? 'active' : ''}`}
                    onClick={() => {
                      selectPrivateChat(chat);
                      setSidebarOpen(false);
                    }}
                  >
                    <div className="private-chat-card">
                      <div className="private-chat-info">
                        <div className="private-chat-avatar">
                          {chat.otherUser.profilePicture ? (
                            <img src={chat.otherUser.profilePicture} alt={chat.otherUser.nickName} />
                          ) : (
                            chat.otherUser.nickName.charAt(0).toUpperCase()
                          )}
                        </div>
                        <div className="private-chat-details">
                          <div className="private-chat-name">
                            <span className={`chat-username ${chat.otherUser.gender === 'Male' ? 'male-color' : chat.otherUser.gender === 'Female' ? 'female-color' : ''}`}>
                              {chat.otherUser.nickName}
                            </span>
                            {chat.otherUser.age && (
                              <span className="chat-user-age"> ({chat.otherUser.age})</span>
                            )}
                          </div>
                          {chat.lastMessage && (
                            <div className="private-chat-preview">{chat.lastMessage}</div>
                          )}
                        </div>
                      </div>
                      <button
                        className="close-chat-button"
                        onClick={(e) => closePrivateChat(chat, e)}
                        title="Close chat"
                        aria-label="Close chat"
                      >
                        ×
                      </button>
                    </div>
                    {chat.unreadCount > 0 && (
                      <span className="room-badge unread">{chat.unreadCount}</span>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="sidebar-footer">
            <button 
              className="sidebar-footer-link" 
              onClick={() => {
                setShowBlog(true);
                setSidebarOpen(false);
              }}
              aria-label="View Blog"
            >
              📝 Blog
            </button>
            <button 
              className="sidebar-footer-link" 
              onClick={() => {
                setShowAbout(true);
                setSidebarOpen(false);
              }}
              aria-label="About Netcify"
            >
              ℹ️ About
            </button>
            <button 
              className="sidebar-footer-link" 
              onClick={() => {
                setShowContact(true);
                setSidebarOpen(false);
              }}
              aria-label="Contact Us"
            >
              ✉️ Contact Us
            </button>
            <button 
              className="sidebar-footer-link" 
              onClick={() => {
                setShowPrivacyPolicy(true);
                setSidebarOpen(false);
              }}
              aria-label="View Privacy Policy"
            >
              🔒 Privacy Policy
            </button>
            <button 
              className="sidebar-footer-link" 
              onClick={() => {
                setShowTermsConditions(true);
                setSidebarOpen(false);
              }}
              aria-label="View Terms & Conditions"
            >
              📜 Terms & Conditions
            </button>
          </div>
          
          <div className="sidebar-copyright">
            <p className="copyright-text">© 2025 Netcify</p>
            <p className="copyright-rights">All rights reserved.</p>
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
                        {selectedRoom.icon || '💬'}
                      </span>
                      <div>
                        <h2>{selectedRoom.name}</h2>
                        <p className="chat-description">{selectedRoom.description}</p>
                      </div>
                    </>
                  ) : selectedPrivateChat ? (
                    <>
                      <div 
                        className="user-avatar" 
                        style={{ width: '45px', height: '45px', fontSize: '1.1rem', cursor: 'pointer' }}
                        onClick={() => {
                          setReportedUserId(selectedPrivateChat.otherUser.userId);
                          setShowReportModal(true);
                        }}
                        title="Click to report user"
                      >
                        {selectedPrivateChat.otherUser.profilePicture ? (
                          <img src={selectedPrivateChat.otherUser.profilePicture} alt={selectedPrivateChat.otherUser.nickName} />
                        ) : (
                          selectedPrivateChat.otherUser.nickName.charAt(0).toUpperCase()
                        )}
                      </div>
                      <div style={{ flex: 1 }}>
                        <h2>{selectedPrivateChat.otherUser.nickName}</h2>
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
                      <div className="call-buttons">
                        <button
                          className="call-action-button voice-call-button"
                          onClick={() => startCall('voice')}
                          title="Voice Call"
                          aria-label="Start voice call"
                          disabled={!connected}
                        >
                          📞
                        </button>
                        <button
                          className="call-action-button video-call-button"
                          onClick={() => startCall('video')}
                          title="Video Call"
                          aria-label="Start video call"
                          disabled={!connected}
                        >
                          🎥
                        </button>
                      </div>
                    </>
                  ) : null}
                </div>
              </div>

              <div 
                ref={messagesContainerRef}
                className="messages-container"
                onScroll={handleScroll}
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
                    <h2>👋 {selectedRoom ? `Welcome to ${selectedRoom.name}!` : `Chat with ${selectedPrivateChat?.otherUser.nickName}`}</h2>
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
                          <div className="message-text">{renderMessageContent(msg.content)}</div>
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
                
                {showScrollButton && (
                  <button
                    className="scroll-to-bottom-button"
                    onClick={() => scrollToBottom('smooth')}
                    title="Scroll to bottom"
                    aria-label="Scroll to bottom"
                  >
                    ↓
                  </button>
                )}
              </div>

              <div className="message-input-container" ref={messageInputContainerRef}>
                {showRateLimitWarning && (
                  <div className="rate-limit-warning">
                    Slow down! Wait {getSecondsUntilReset()}s
                  </div>
                )}
                <button
                  className="input-action-button location-button"
                  onClick={handleLocationShare}
                  disabled={!connected}
                  title="Share Location"
                  aria-label="Share location"
                >
                  📍
                </button>
                <button
                  className="input-action-button emoji-button"
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  disabled={!connected}
                  title="Add Emoji"
                  aria-label="Add emoji"
                >
                  😊
                </button>
                {showEmojiPicker && (
                  <div className="emoji-picker-container" ref={emojiPickerRef}>
                    <EmojiPicker
                      onEmojiClick={handleEmojiClick}
                      theme={theme === 'dark' ? Theme.DARK : Theme.LIGHT}
                      width={320}
                      height={400}
                      searchPlaceholder="Search emoji..."
                      previewConfig={{ showPreview: false }}
                      autoFocusSearch={false}
                    />
                  </div>
                )}
                <input
                  ref={messageInputRef}
                  type="text"
                  className="message-input"
                  placeholder="Type a message..."
                  value={messageInput}
                  onChange={handleInputChange}
                  onKeyPress={handleKeyPress}
                  maxLength={maxMessageLength}
                  key={`message-input-${maxMessageLength}`}
                  onFocus={async () => {
                    handleInputFocus();
                    
                    if (selectedRoom) {
                      setRooms(prev => prev.map(r=>
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
                  onBlur={handleInputBlur}
                  disabled={!connected}
                />
                <button 
                  className="send-button" 
                  onClick={() => sendMessage()}
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
                <p>You're now logged in as <strong>{user.nickName || user.nickName || user.username}</strong></p>
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
                            <img src={u.profilePicture} alt={u.nickName} />
                          ) : (
                            u.nickName.charAt(0).toUpperCase()
                          )}
                        </div>
                      )}
                      <div className="user-details">
                        <div className="user-line-1">
                          <span className={`user-name ${u.gender === 'Male' ? 'male' : u.gender === 'Female' ? 'female' : ''}`}>
                            {u.nickName}
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

      {inCall && socket && callType && callPartner && (
        <div className="call-overlay">
          <Call
            socket={socket}
            isInitiator={isCallInitiator}
            callType={callType}
            otherUser={callPartner}
            onCallEnd={handleCallEnd}
          />
        </div>
      )}

      {incomingCall && (
        <div className="modal-overlay incoming-call-overlay">
          <div className="modal-content incoming-call-modal" onClick={(e) => e.stopPropagation()}>
            <div className="incoming-call-content">
              <div className="incoming-call-avatar">
                {incomingCall.fromPicture ? (
                  <img src={incomingCall.fromPicture} alt={incomingCall.fromName} />
                ) : (
                  <span>{incomingCall.fromName.charAt(0).toUpperCase()}</span>
                )}
              </div>
              <h2 className="incoming-call-name">{incomingCall.fromName}</h2>
              <div className="incoming-call-type">
                <span className="call-type-icon">{incomingCall.callType === 'video' ? '🎥' : '📞'}</span>
                <span className="call-type-text">{incomingCall.callType === 'video' ? 'Video' : 'Voice'} Call</span>
              </div>
              <div className="incoming-call-actions">
                <button
                  className="call-action-button decline-button"
                  onClick={declineIncomingCall}
                  aria-label="Decline call"
                  title="Decline"
                >
                  <span className="button-icon">✕</span>
                </button>
                <button
                  className="call-action-button accept-button"
                  onClick={acceptIncomingCall}
                  aria-label="Accept call"
                  title="Answer"
                >
                  <span className="button-icon">✓</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showLocationModal && (
        <div className="modal-overlay" onClick={cancelLocationShare}>
          <div className="modal-content location-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-header-left">
                <h2>Share Your Location</h2>
              </div>
              <button className="modal-close" onClick={cancelLocationShare}>×</button>
            </div>
            <div className="modal-body location-modal-body">
              <div className="location-modal-icon">📍</div>
              <p className="location-modal-text">
                Do you want to share your current location with this chat?
              </p>
              <p className="location-modal-subtext">
                Your location will be sent as a Google Maps link that others can view.
              </p>
              <div className="location-modal-actions">
                <button
                  className="location-modal-button cancel-button"
                  onClick={cancelLocationShare}
                  disabled={isGettingLocation}
                >
                  Cancel
                </button>
                <button
                  className="location-modal-button share-button"
                  onClick={confirmLocationShare}
                  disabled={isGettingLocation}
                >
                  {isGettingLocation ? (
                    <>
                      <span className="button-spinner"></span>
                      Getting Location...
                    </>
                  ) : (
                    'Share Location'
                  )}
                </button>
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
                <div className="modal-title-row">
                  <h2>Edit Profile</h2>
                  <span className="esc-hint">ESC</span>
                </div>
              </div>
              <button className="modal-close" onClick={() => setShowProfileModal(false)}>×</button>
            </div>
            <div className="modal-body profile-modal-body">
              {allowUserPictures && (
                <div className="profile-picture-section">
                  <div 
                    className={`profile-picture-preview ${isUpdatingProfile ? 'updating' : ''}`}
                    onClick={() => !isUpdatingProfile && fileInputRef.current?.click()}
                    style={{ cursor: isUpdatingProfile ? 'default' : 'pointer' }}
                    title={isUpdatingProfile ? '' : 'Click to change picture'}
                  >
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
                    {!isUpdatingProfile && (
                      <div className="picture-hover-overlay">
                        <span className="hover-icon">📷</span>
                        <span className="hover-text">Change Picture</span>
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
                  <p className="picture-hint">Click on the picture to change it</p>
                </div>
              )}

              <div className="profile-form-section">
                <div className="form-group">
                  <label htmlFor="username">Username</label>
                  <input
                    type="text"
                    id="username"
                    value={user.username}
                    disabled
                    className="username-input blurred-username"
                    style={{
                      filter: 'blur(0.8px)',
                      cursor: 'not-allowed',
                      opacity: 0.7
                    }}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="email">Email Address</label>
                  <input
                    type="email"
                    id="email"
                    value={user.email}
                    disabled
                    className="email-input blurred-email"
                    style={{
                      filter: 'blur(0.8px)',
                      cursor: 'not-allowed',
                      opacity: 0.7
                    }}
                  />
                  <p className="field-hint">
                    Username and email address cannot be changed.
                  </p>
                </div>

                <div className="form-group">
                  <label htmlFor="nickName">Nick Name</label>
                  <input
                    type="text"
                    id="nickName"
                    value={profileNickName}
                    onChange={(e) => {
                      setProfileNickName(e.target.value);
                      setNickNameError('');
                    }}
                    disabled={isUpdatingProfile}
                    placeholder="Enter your nick name"
                    maxLength={20}
                    className="nickname-input"
                  />
                  {nickNameError && (
                    <p className="error-message">{nickNameError}</p>
                  )}
                  <p className="field-hint">
                    This name will be displayed in chats and can be changed anytime.
                  </p>
                </div>

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
                  <div className="gender-toggle-container">
                    <button
                      type="button"
                      className={`gender-toggle-button ${profileGender === 'Male' ? 'active' : ''}`}
                      onClick={() => !isUpdatingProfile && setProfileGender('Male')}
                      disabled={isUpdatingProfile}
                    >
                      <span className="gender-icon">♂️</span>
                      <span className="gender-label">Male</span>
                    </button>
                    <button
                      type="button"
                      className={`gender-toggle-button ${profileGender === 'Female' ? 'active' : ''}`}
                      onClick={() => !isUpdatingProfile && setProfileGender('Female')}
                      disabled={isUpdatingProfile}
                    >
                      <span className="gender-icon">♀️</span>
                      <span className="gender-label">Female</span>
                    </button>
                  </div>
                </div>

                <button
                  className="update-profile-button"
                  onClick={handleUpdateProfile}
                  disabled={isUpdatingProfile}
                >
                  {isUpdatingProfile ? 'Updating...' : 'Update Profile'}
                </button>

                <div className="password-change-section">
                  <button
                    className="toggle-password-change-button"
                    onClick={() => {
                      setShowPasswordChange(!showPasswordChange);
                      setPasswordError('');
                      setPasswordSuccess('');
                      if (showPasswordChange) {
                        setCurrentPassword('');
                        setNewPassword('');
                        setConfirmPassword('');
                      }
                    }}
                    disabled={isUpdatingProfile}
                  >
                    {showPasswordChange ? '🔒 Hide Password Change' : '🔑 Change Password'}
                  </button>

                  {showPasswordChange && (
                    <div className="password-change-form">
                      {passwordError && (
                        <div className="password-message error-message">
                          {passwordError}
                        </div>
                      )}
                      {passwordSuccess && (
                        <div className="password-message success-message">
                          {passwordSuccess}
                        </div>
                      )}

                      <div className="form-group">
                        <label htmlFor="currentPassword">Current Password</label>
                        <input
                          type="password"
                          id="currentPassword"
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          disabled={isChangingPassword}
                          placeholder="Enter current password"
                        />
                      </div>

                      <div className="form-group">
                        <label htmlFor="newPassword">New Password</label>
                        <input
                          type="password"
                          id="newPassword"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          disabled={isChangingPassword}
                          placeholder="Enter new password (min 6 characters)"
                        />
                      </div>

                      <div className="form-group">
                        <label htmlFor="confirmPassword">Confirm New Password</label>
                        <input
                          type="password"
                          id="confirmPassword"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          disabled={isChangingPassword}
                          placeholder="Confirm new password"
                        />
                      </div>

                      <button
                        className="change-password-button"
                        onClick={handleChangePassword}
                        disabled={isChangingPassword}
                      >
                        {isChangingPassword ? 'Changing...' : 'Change Password'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showAbout && (
        <About onClose={() => setShowAbout(false)} />
      )}

      {showContact && (
        <Contact onClose={() => setShowContact(false)} />
      )}

      {showBlog && (
        <Blog onClose={() => setShowBlog(false)} />
      )}

      {showPrivacyPolicy && (
        <PrivacyPolicy onClose={() => setShowPrivacyPolicy(false)} />
      )}

      {showTermsConditions && (
        <TermsConditions onClose={() => setShowTermsConditions(false)} />
      )}

      {showImageCropper && tempImageUrl && (
        <ImageCropper
          imageSrc={tempImageUrl}
          onCropComplete={handleCropComplete}
          onCancel={handleCropCancel}
        />
      )}

      {showReportModal && reportedUserId && selectedPrivateChat && (
        <ReportModal
          reportedUser={{
            userId: selectedPrivateChat.otherUser.userId,
            username: selectedPrivateChat.otherUser.username,
            nickName: selectedPrivateChat.otherUser.nickName
          }}
          onClose={() => {
            setShowReportModal(false);
            setReportedUserId(null);
          }}
        />
      )}

      {showNSFWWarning && nsfwWarnings.length > 0 && (
        <NSFWWarningModal
          warnings={nsfwWarnings}
          onContinue={() => {
            if (pendingCroppedBlob) {
              proceedWithProfileImageUpload(pendingCroppedBlob);
            }
            setShowNSFWWarning(false);
            setPendingCroppedBlob(null);
            setNsfwWarnings([]);
          }}
          onCancel={handleNSFWCancel}
        />
      )}

      {isAnalyzing && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ textAlign: 'center' }}>
            <div className="modal-icon">🔍</div>
            <h2>Analyzing Image...</h2>
            <p className="modal-message">
              Checking image content for community guidelines compliance.
            </p>
            <div style={{ margin: '20px 0' }}>
              <div className="loading-spinner"></div>
            </div>
          </div>
        </div>
      )}
    </div>

    <footer className="app-footer">
      <span className="footer-copyright">
        © 2025 Netcify. All rights reserved.
      </span>
    </footer>
    </>
  );
}

export default Home;
