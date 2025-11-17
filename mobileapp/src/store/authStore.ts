import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthUser } from '../types';

interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setUser: (user: AuthUser | null) => void;
  setLoading: (loading: boolean) => void;
  login: (user: AuthUser) => Promise<void>;
  logout: () => Promise<void>;
  loadUser: () => Promise<void>;
  updateUser: (userData: Partial<AuthUser>) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  setUser: (user) => set({ user, isAuthenticated: !!user }),

  setLoading: (isLoading) => set({ isLoading }),

  login: async (user) => {
    try {
      await AsyncStorage.setItem('user', JSON.stringify(user));
      await AsyncStorage.setItem('accessToken', user.accessToken);
      await AsyncStorage.setItem('refreshToken', user.refreshToken);
      set({ user, isAuthenticated: true, isLoading: false });
    } catch (error) {
      console.error('Error saving user to storage:', error);
      throw error;
    }
  },

  logout: async () => {
    try {
      await AsyncStorage.multiRemove(['user', 'accessToken', 'refreshToken']);
      set({ user: null, isAuthenticated: false });
    } catch (error) {
      console.error('Error removing user from storage:', error);
      throw error;
    }
  },

  loadUser: async () => {
    try {
      set({ isLoading: true });
      const userJson = await AsyncStorage.getItem('user');
      const accessToken = await AsyncStorage.getItem('accessToken');
      const refreshToken = await AsyncStorage.getItem('refreshToken');

      if (userJson && accessToken && refreshToken) {
        const user = JSON.parse(userJson);
        set({ 
          user: { ...user, accessToken, refreshToken }, 
          isAuthenticated: true,
          isLoading: false 
        });
      } else {
        set({ user: null, isAuthenticated: false, isLoading: false });
      }
    } catch (error) {
      console.error('Error loading user from storage:', error);
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },

  updateUser: (userData) => {
    set((state) => {
      if (!state.user) return state;
      const updatedUser = { ...state.user, ...userData };
      AsyncStorage.setItem('user', JSON.stringify(updatedUser));
      return { user: updatedUser };
    });
  },
}));
