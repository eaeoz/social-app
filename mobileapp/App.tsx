import React, { useEffect, useState } from 'react';
import { StyleSheet, View, ActivityIndicator } from 'react-native';
import { PaperProvider, Text, Button } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useAuthStore, useThemeStore, useChatStore } from './src/store';
import { lightTheme, darkTheme } from './src/theme';
import { apiService, socketService } from './src/services';
import RootNavigator from './src/navigation/RootNavigator';
import { LoginScreen, RegisterScreen } from './src/screens';

export default function App() {
  const { user, isLoading, loadUser } = useAuthStore();
  const { isDarkMode, loadTheme, setDarkMode } = useThemeStore();
  const { setPrivateChats } = useChatStore();
  
  // Auth screen toggle
  const [showLogin, setShowLogin] = useState(true);

  useEffect(() => {
    loadUser();
    loadTheme();
  }, []);

  // Reset to login screen when user logs out
  useEffect(() => {
    if (!user && !isLoading) {
      setShowLogin(true);
    }
  }, [user, isLoading]);

  // Connect socket when user is logged in
  useEffect(() => {
    if (user && user.userId && user.username) {
      console.log('🔌 Attempting Socket.IO connection...');
      console.log('👤 User ID:', user.userId);
      console.log('👤 Username:', user.username);
      
      socketService.connect(user.userId, user.username)
        .then(() => {
          console.log('✅ Socket.IO connected and authenticated!');
          
          // Set up global listener for private messages to update chat list
          const handlePrivateMessage = async (message: any) => {
            console.log('📨 Global: Received private message:', message);
            
            // Reload chats to update the list with new message and unread count
            try {
              const chatsData = await apiService.getPrivateChats();
              const chatsArray = Array.isArray(chatsData) ? chatsData : [];
              setPrivateChats(chatsArray);
              console.log('✅ Global: Chat list updated with new message');
            } catch (error) {
              console.error('❌ Global: Error updating chat list:', error);
            }
          };

          // Listen for chat read status updates
          const handleChatRead = async (data: any) => {
            console.log('✅ Global: Chat marked as read:', data);
            
            // Reload chats to update unread counts
            try {
              const chatsData = await apiService.getPrivateChats();
              const chatsArray = Array.isArray(chatsData) ? chatsData : [];
              setPrivateChats(chatsArray);
              console.log('✅ Global: Chat list updated after marking as read');
            } catch (error) {
              console.error('❌ Global: Error updating chat list:', error);
            }
          };

          socketService.onPrivateMessage(handlePrivateMessage);
          socketService.onChatReadStatus(handleChatRead);
        })
        .catch((error) => {
          console.warn('⚠️ Socket.IO connection failed');
          console.warn('📊 Error:', error.message);
          console.warn('💡 App will work without real-time features');
        });

      return () => {
        if (socketService.isConnected()) {
          console.log('🔌 Disconnecting Socket.IO');
          // Clean up the global listeners
          socketService.off('private_message');
          socketService.offChatReadStatus();
          socketService.disconnect();
        }
      };
    } else if (user) {
      console.warn('⚠️ User object missing userId or username:', user);
    }
  }, [user]);

  const theme = isDarkMode ? darkTheme : lightTheme;

  if (isLoading) {
    return (
      <PaperProvider theme={theme}>
        <SafeAreaProvider>
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={{ marginTop: 16 }}>Loading...</Text>
          </View>
          <StatusBar style={isDarkMode ? 'light' : 'dark'} />
        </SafeAreaProvider>
      </PaperProvider>
    );
  }

  return (
    <PaperProvider theme={theme}>
      <SafeAreaProvider>
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
          <StatusBar style={isDarkMode ? 'light' : 'dark'} />
          
          {user ? (
            // User is logged in - show main navigation
            <RootNavigator />
          ) : (
            // User is not logged in - show auth screens
            <>
              {showLogin ? (
                <LoginScreen onSwitchToRegister={() => setShowLogin(false)} />
              ) : (
                <RegisterScreen onSwitchToLogin={() => setShowLogin(true)} />
              )}
              
              {/* Theme Toggle Button - Fixed position */}
              <View style={styles.themeToggleContainer}>
                <Button
                  mode="outlined"
                  onPress={() => setDarkMode(!isDarkMode)}
                  icon={isDarkMode ? 'white-balance-sunny' : 'moon-waning-crescent'}
                  compact
                >
                  {isDarkMode ? 'Light' : 'Dark'} Mode
                </Button>
              </View>
            </>
          )}
        </View>
      </SafeAreaProvider>
    </PaperProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  themeToggleContainer: {
    position: 'absolute',
    top: 20,
    right: 20,
    zIndex: 1000,
  },
});
