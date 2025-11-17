import { io, Socket } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SOCKET_URL, SOCKET_CONFIG } from '../constants/config';
import { Message, TypingIndicator, UserPresence } from '../types';

class SocketService {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  async connect(userId: string, username: string): Promise<Socket> {
    if (this.socket?.connected) {
      console.log('✅ Socket already connected');
      return this.socket;
    }

    console.log('🔌 Creating Socket.IO instance...');
    console.log('📡 URL:', SOCKET_URL);
    console.log('⚙️ Config:', JSON.stringify(SOCKET_CONFIG, null, 2));

    const token = await AsyncStorage.getItem('accessToken');
    
    this.socket = io(SOCKET_URL, {
      ...SOCKET_CONFIG,
      auth: { token },
      extraHeaders: {
        'User-Agent': 'Netcify-Mobile-App',
      },
    });

    this.setupEventHandlers();

    return new Promise((resolve, reject) => {
      const connectTimeout = setTimeout(() => {
        console.error('⏰ Socket connection timeout');
        reject(new Error('Connection timeout'));
      }, 30000); // 30 second timeout

      this.socket!.on('connect', () => {
        clearTimeout(connectTimeout);
        console.log('✅ Socket connected:', this.socket!.id);
        console.log('📍 Transport:', this.socket!.io.engine.transport.name);
        this.reconnectAttempts = 0;
        
        // Authenticate immediately
        console.log('🔐 Sending authentication...');
        this.socket!.emit('authenticate', { userId, username });
        resolve(this.socket!);
      });

      this.socket!.on('connect_error', (error: any) => {
        console.error('❌ Socket connection error:', error.message);
        console.error('📊 Error details:', error);
        this.reconnectAttempts++;
        
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
          clearTimeout(connectTimeout);
          reject(new Error('Max reconnection attempts reached'));
        }
      });

      this.socket!.on('authenticated', () => {
        console.log('✅ Socket authenticated successfully!');
      });

      // Manually trigger connection since autoConnect is false
      console.log('🔌 Manually connecting socket...');
      this.socket!.connect();
    });
  }

  private setupEventHandlers(): void {
    if (!this.socket) return;

    this.socket.on('disconnect', (reason) => {
      console.log('❌ Socket disconnected:', reason);
    });

    this.socket.on('reconnect', (attemptNumber) => {
      console.log('🔄 Socket reconnected after', attemptNumber, 'attempts');
      this.reconnectAttempts = 0;
    });

    this.socket.on('error', (error) => {
      console.error('Socket error:', error);
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      console.log('Socket disconnected manually');
    }
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  // Room methods
  joinRoom(roomId: string, userId?: string, username?: string): void {
    this.socket?.emit('join_room', { roomId, userId, username });
  }

  leaveRoom(roomId: string): void {
    this.socket?.emit('leave_room', { roomId });
  }

  sendRoomMessage(roomId: string, content: string, senderId?: string, senderName?: string): void {
    this.socket?.emit('send_room_message', { 
      roomId, 
      content,
      senderId,
      senderName,
      messageType: 'text'
    });
  }

  getRoomMessages(roomId: string, page: number = 1): void {
    this.socket?.emit('get_room_messages', { roomId, page });
  }

  // Private chat methods
  sendPrivateMessage(receiverId: string, content: string, senderId?: string, senderName?: string): void {
    this.socket?.emit('send_private_message', { 
      receiverId, 
      senderId,
      senderName,
      content,
      messageType: 'text'
    });
  }

  getPrivateMessages(userId: string, otherUserId: string, limit: number = 50): void {
    console.log(`📥 Requesting private messages: userId=${userId}, otherUserId=${otherUserId}`);
    this.socket?.emit('get_private_messages', { userId, otherUserId, limit });
  }

  subscribePrivateChat(chatId: string): void {
    this.socket?.emit('subscribe_private_chat', { chatId });
  }

  // Message actions
  markAsRead(messageId: string): void {
    this.socket?.emit('mark_as_read', { messageId });
  }

  markChatAsRead(chatId: string): void {
    this.socket?.emit('mark_chat_as_read', { chatId });
  }

  markChatAsReadByUsers(userId: string, otherUserId: string): void {
    this.socket?.emit('mark_chat_as_read', { userId, otherUserId });
  }

  // Typing indicators
  startTyping(roomId?: string, chatId?: string): void {
    this.socket?.emit('typing', { roomId, chatId });
  }

  stopTyping(roomId?: string, chatId?: string): void {
    this.socket?.emit('stop_typing', { roomId, chatId });
  }

  // User activity
  sendActivity(): void {
    this.socket?.emit('activity');
  }

  // Event listeners
  onRoomMessage(callback: (message: Message) => void): void {
    this.socket?.on('room_message', callback);
  }

  onPrivateMessage(callback: (message: Message) => void): void {
    this.socket?.on('private_message', callback);
  }

  onRoomMessages(callback: (messages: Message[]) => void): void {
    this.socket?.on('room_messages', callback);
  }

  onPrivateMessages(callback: (messages: Message[]) => void): void {
    this.socket?.on('private_messages', callback);
  }

  onUserJoined(callback: (data: any) => void): void {
    this.socket?.on('user_joined', callback);
  }

  onUserLeft(callback: (data: any) => void): void {
    this.socket?.on('user_left', callback);
  }

  onUserTyping(callback: (data: TypingIndicator) => void): void {
    this.socket?.on('user_typing', callback);
  }

  onUserStopTyping(callback: (data: TypingIndicator) => void): void {
    this.socket?.on('user_stop_typing', callback);
  }

  onUserStatusChanged(callback: (data: UserPresence) => void): void {
    this.socket?.on('user_status_changed', callback);
  }

  onMessageNotification(callback: (data: any) => void): void {
    this.socket?.on('room_message_notification', callback);
  }

  onForceLogout(callback: () => void): void {
    this.socket?.on('force_logout', callback);
  }

  // Remove event listeners
  off(event: string, callback?: (...args: any[]) => void): void {
    this.socket?.off(event, callback);
  }

  // Remove all listeners for an event
  removeAllListeners(event?: string): void {
    if (event) {
      this.socket?.removeAllListeners(event);
    } else {
      this.socket?.removeAllListeners();
    }
  }

  // Listen for chat read status updates
  onChatReadStatus(callback: (data: any) => void): void {
    this.socket?.on('chat_read_status', callback);
    this.socket?.on('messages_marked_read', callback);
  }

  // Remove chat read status listeners
  offChatReadStatus(callback?: (data: any) => void): void {
    this.socket?.off('chat_read_status', callback);
    this.socket?.off('messages_marked_read', callback);
  }
}

export const socketService = new SocketService();
