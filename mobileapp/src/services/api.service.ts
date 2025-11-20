import axios, { AxiosInstance, AxiosError } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../constants/config';
import { LoginCredentials, RegisterData, AuthUser, User, Room, PrivateChat, Message } from '../types';

class ApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: API_URL,
      timeout: 30000, // Increased to 30 seconds
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    console.log('🔧 API Service initialized');
    console.log('📡 Base URL:', API_URL);

    // Request interceptor to add token
    this.api.interceptors.request.use(
      async (config) => {
        const token = await AsyncStorage.getItem('accessToken');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor for error handling
    this.api.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        if (error.response?.status === 401) {
          // Token expired, try to refresh
          try {
            await this.refreshToken();
            // Retry the original request
            const originalRequest = error.config;
            if (originalRequest) {
              const token = await AsyncStorage.getItem('accessToken');
              originalRequest.headers.Authorization = `Bearer ${token}`;
              return this.api(originalRequest);
            }
          } catch (refreshError) {
            // Refresh failed, logout user
            await AsyncStorage.multiRemove(['user', 'accessToken', 'refreshToken']);
            throw refreshError;
          }
        }
        return Promise.reject(error);
      }
    );
  }

  // Auth endpoints
  async login(credentials: LoginCredentials): Promise<AuthUser> {
    const response = await this.api.post('/auth/login', credentials);
    // Backend returns { message, user, accessToken, refreshToken }
    // We need to flatten it to match AuthUser type
    return {
      ...response.data.user,
      accessToken: response.data.accessToken,
      refreshToken: response.data.refreshToken
    };
  }

  async register(data: RegisterData): Promise<AuthUser> {
    const response = await this.api.post('/auth/register', data);
    // Backend returns { message, user, accessToken, refreshToken }
    return {
      ...response.data.user,
      accessToken: response.data.accessToken,
      refreshToken: response.data.refreshToken
    };
  }

  async logout(): Promise<void> {
    await this.api.post('/auth/logout');
  }

  async refreshToken(): Promise<void> {
    const refreshToken = await AsyncStorage.getItem('refreshToken');
    const response = await this.api.post('/auth/refresh', { refreshToken });
    const { accessToken, refreshToken: newRefreshToken } = response.data;
    await AsyncStorage.setItem('accessToken', accessToken);
    await AsyncStorage.setItem('refreshToken', newRefreshToken);
  }

  async verifyToken(): Promise<boolean> {
    try {
      await this.api.get('/auth/verify-token');
      return true;
    } catch {
      return false;
    }
  }

  async updateProfile(data: Partial<User>): Promise<User> {
    const response = await this.api.put('/auth/update-profile', data);
    return response.data;
  }

  async changePassword(oldPassword: string, newPassword: string): Promise<void> {
    const payload = { currentPassword: oldPassword, newPassword };
    console.log('🔐 Change password request:', { 
      hasCurrentPassword: !!oldPassword, 
      hasNewPassword: !!newPassword,
      currentPasswordLength: oldPassword?.length,
      newPasswordLength: newPassword?.length
    });
    await this.api.put('/auth/change-password', payload);
  }

  // Room endpoints
  async getPublicRooms(): Promise<Room[]> {
    const response = await this.api.get('/rooms/public');
    // API returns { rooms: Room[] }
    return response.data.rooms || [];
  }

  async getRoomMessages(roomId: string, page: number = 1): Promise<Message[]> {
    const response = await this.api.get(`/rooms/${roomId}/messages?page=${page}`);
    return response.data;
  }

  async markRoomAsRead(roomId: string): Promise<void> {
    await this.api.post('/rooms/mark-room-read', { roomId });
  }

  // Private chat endpoints
  async getPrivateChats(): Promise<PrivateChat[]> {
    const response = await this.api.get('/rooms/private-chats');
    // API returns { privateChats: PrivateChat[] }
    return response.data.privateChats || [];
  }

  async getPrivateMessages(chatId: string, page: number = 1): Promise<Message[]> {
    const response = await this.api.get(`/rooms/private/${chatId}/messages?page=${page}`);
    return response.data;
  }

  async closePrivateChat(otherUserId: string): Promise<void> {
    await this.api.post('/rooms/close-private-chat', { otherUserId });
  }

  // User endpoints
  async getUsers(filters?: any): Promise<User[]> {
    const response = await this.api.get('/rooms/users', { params: filters });
    // API returns { showPictures: boolean, users: User[] }
    // Backend sends status: 'online'/'offline', we need to map to isOnline: boolean
    const users = response.data.users || [];
    return users.map((user: any) => ({
      ...user,
      isOnline: user.status === 'online'
    }));
  }

  async getUserProfile(userId: string): Promise<User> {
    const response = await this.api.get(`/rooms/user-profile/${userId}`);
    return response.data;
  }

  // Report endpoints
  async reportUser(data: {
    reportedUserId: string;
    category: string;
    description: string;
  }): Promise<void> {
    await this.api.post('/reports', data);
  }

  // Upload profile picture
  async uploadProfilePicture(file: any): Promise<string> {
    const formData = new FormData();
    formData.append('profilePicture', file);
    const response = await this.api.post('/auth/upload-profile-picture', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.profilePictureUrl;
  }

  // Update profile with FormData (for age, gender, nickName)
  async updateProfileWithForm(formData: FormData): Promise<{ user: User }> {
    const response = await this.api.put('/auth/update-profile', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }
}

export const apiService = new ApiService();
