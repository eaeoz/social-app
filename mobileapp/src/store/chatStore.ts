import { create } from 'zustand';
import { Room, PrivateChat, Message } from '../types';

interface ChatState {
  rooms: Room[];
  privateChats: PrivateChat[];
  currentRoomId: string | null;
  currentChatId: string | null;
  messages: { [key: string]: Message[] };
  unreadCounts: { [key: string]: number };
  
  setRooms: (rooms: Room[]) => void;
  setPrivateChats: (chats: PrivateChat[]) => void;
  setCurrentRoom: (roomId: string | null) => void;
  setCurrentChat: (chatId: string | null) => void;
  addMessage: (roomOrChatId: string, message: Message) => void;
  setMessages: (roomOrChatId: string, messages: Message[]) => void;
  updateUnreadCount: (roomOrChatId: string, count: number) => void;
  clearUnreadCount: (roomOrChatId: string) => void;
  updateRoomUnreadCount: (roomId: string, count: number) => void;
  updateChatUnreadCount: (chatId: string, count: number) => void;
}

export const useChatStore = create<ChatState>((set) => ({
  rooms: [],
  privateChats: [],
  currentRoomId: null,
  currentChatId: null,
  messages: {},
  unreadCounts: {},

  setRooms: (rooms) => set({ rooms }),

  setPrivateChats: (privateChats) => set({ privateChats }),

  setCurrentRoom: (currentRoomId) => set({ currentRoomId, currentChatId: null }),

  setCurrentChat: (currentChatId) => set({ currentChatId, currentRoomId: null }),

  addMessage: (roomOrChatId, message) =>
    set((state) => ({
      messages: {
        ...state.messages,
        [roomOrChatId]: [...(state.messages[roomOrChatId] || []), message],
      },
    })),

  setMessages: (roomOrChatId, messages) =>
    set((state) => ({
      messages: {
        ...state.messages,
        [roomOrChatId]: messages,
      },
    })),

  updateUnreadCount: (roomOrChatId, count) =>
    set((state) => ({
      unreadCounts: {
        ...state.unreadCounts,
        [roomOrChatId]: count,
      },
    })),

  clearUnreadCount: (roomOrChatId) =>
    set((state) => ({
      unreadCounts: {
        ...state.unreadCounts,
        [roomOrChatId]: 0,
      },
    })),

  updateRoomUnreadCount: (roomId, count) =>
    set((state) => ({
      rooms: state.rooms.map((room) =>
        room.roomId === roomId ? { ...room, unreadCount: count } : room
      ),
    })),

  updateChatUnreadCount: (chatId, count) =>
    set((state) => ({
      privateChats: state.privateChats.map((chat) =>
        chat._id === chatId ? { ...chat, unreadCount: count } : chat
      ),
    })),
}));
