import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface ThemeState {
  isDarkMode: boolean;
  setDarkMode: (isDark: boolean) => Promise<void>;
  loadTheme: () => Promise<void>;
}

export const useThemeStore = create<ThemeState>((set) => ({
  isDarkMode: true, // Default to dark mode
  
  setDarkMode: async (isDark: boolean) => {
    try {
      await AsyncStorage.setItem('theme', isDark ? 'dark' : 'light');
      set({ isDarkMode: isDark });
    } catch (error) {
      console.error('Error saving theme preference:', error);
    }
  },
  
  loadTheme: async () => {
    try {
      const theme = await AsyncStorage.getItem('theme');
      if (theme) {
        set({ isDarkMode: theme === 'dark' });
      }
    } catch (error) {
      console.error('Error loading theme preference:', error);
    }
  },
}));
