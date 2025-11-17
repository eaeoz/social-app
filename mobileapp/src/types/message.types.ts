export interface Message {
  _id: string;
  roomId?: string;
  senderId: string;
  senderUsername: string;
  senderDisplayName?: string;
  senderProfilePicture?: string;
  content: string;
  timestamp: Date;
  isRead?: boolean;
  readBy?: string[];
  type?: 'text' | 'image' | 'location';
  metadata?: {
    latitude?: number;
    longitude?: number;
    imageUrl?: string;
  };
}

export interface PrivateChat {
  _id: string;
  participants: string[];
  lastMessage?: Message;
  unreadCount?: number;
  updatedAt: Date;
  otherUser?: {
    userId: string;
    username: string;
    displayName?: string;
    profilePicture?: string;
    isOnline: boolean;
    lastSeen?: Date;
  };
}

export interface Room {
  roomId: string;
  name: string;
  description?: string;
  icon?: string;
  type?: 'public' | 'private';
  participantCount?: number;
  maxParticipants?: number;
  messageCount?: number;
  unreadCount?: number;
  createdAt: Date;
  updatedAt?: Date;
}

export interface TypingIndicator {
  userId: string;
  username: string;
  roomId?: string;
  chatId?: string;
  isTyping: boolean;
}

export interface MessageNotification {
  messageId: string;
  senderId: string;
  senderUsername: string;
  content: string;
  roomId?: string;
  chatId?: string;
  timestamp: Date;
}
