import React, { useEffect, useState } from 'react';
import { StyleSheet, View, ActivityIndicator } from 'react-native';
import { PaperProvider, Text, Button, Card, TextInput } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useAuthStore, useThemeStore, useChatStore } from './src/store';
import { lightTheme, darkTheme } from './src/theme';
import { apiService, socketService } from './src/services';
import RootNavigator from './src/navigation/RootNavigator';

export default function App() {
  const { user, isLoading, loadUser, login, logout } = useAuthStore();
  const { isDarkMode, loadTheme, setDarkMode } = useThemeStore();
  const { setPrivateChats } = useChatStore();
  
  // Auth form states
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadUser();
    loadTheme();
  }, []);

  // Connect socket when user is logged in
  useEffect(() => {
    if (user && user.userId && user.username) {
      console.log('🔌 Attempting Socket.IO connection...');
      console.log('👤 User ID:', user.userId);
      console.log('👤 Username:', user.username);
      console.log('📡 Socket URL:', 'http://192.168.1.252:4000');
      
      socketService.connect(user.userId, user.username)
        .then(() => {
          console.log('✅ Socket.IO connected and authenticated!');
          
          // Set up global listener for private messages to update chat list
          // This ensures messages are received even when not on the Messages tab
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

          socketService.onPrivateMessage(handlePrivateMessage);
        })
        .catch((error) => {
          console.warn('⚠️ Socket.IO connection failed');
          console.warn('📊 Error:', error.message);
          console.warn('💡 App will work without real-time features');
        });

      return () => {
        if (socketService.isConnected()) {
          console.log('🔌 Disconnecting Socket.IO');
          // Clean up the global private message listener
          socketService.off('private_message');
          socketService.disconnect();
        }
      };
    } else if (user) {
      console.warn('⚠️ User object missing userId or username:', user);
    }
  }, [user]);

  const handleAuth = async () => {
    if (!username || !password) {
      setError('Please fill in all fields');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      console.log('🔐 Attempting login...');
      console.log('📡 API URL:', 'http://192.168.1.252:4000/api');
      console.log('👤 Username:', username);
      
      if (isLoginMode) {
        const userData = await apiService.login({ username, password });
        console.log('✅ Login successful!', userData);
        await login(userData);
      } else {
        const userData = await apiService.register({
          username,
          password,
          email: `${username}@example.com`, // Simple default
        });
        console.log('✅ Registration successful!', userData);
        await login(userData);
      }
    } catch (err: any) {
      console.error('❌ Auth error:', err);
      console.error('📊 Error details:', {
        message: err.message,
        code: err.code,
        response: err.response?.data,
        status: err.response?.status
      });
      
      let errorMessage = 'Authentication failed';
      
      if (err.code === 'ECONNABORTED') {
        errorMessage = 'Connection timeout. Please check if backend server is running on port 4000.';
      } else if (err.code === 'ERR_NETWORK' || err.message === 'Network Error') {
        errorMessage = 'Cannot reach server at http://192.168.1.252:4000. Please check:\n1. Backend server is running\n2. Server is on port 4000\n3. Both devices on same network';
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      }
      
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = async () => {
    try {
      await apiService.logout();
    } catch (err) {
      console.error('Logout error:', err);
    }
    await logout();
    setUsername('');
    setPassword('');
  };

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
            // Logged in - show navigation
            <RootNavigator />
          ) : (
            // Login/Register view
            <View style={styles.content}>
              <Card style={styles.card}>
                <Card.Content>
                  <Text variant="headlineMedium" style={{ marginBottom: 8, textAlign: 'center' }}>
                    Netcify Mobile
                  </Text>
                  <Text variant="bodyMedium" style={{ marginBottom: 24, textAlign: 'center', color: theme.colors.custom.textSecondary }}>
                    {isLoginMode ? 'Login to your account' : 'Create new account'}
                  </Text>

                  <TextInput
                    label="Username"
                    value={username}
                    onChangeText={setUsername}
                    mode="outlined"
                    style={styles.input}
                    autoCapitalize="none"
                    disabled={isSubmitting}
                  />

                  <TextInput
                    label="Password"
                    value={password}
                    onChangeText={setPassword}
                    mode="outlined"
                    secureTextEntry
                    style={styles.input}
                    autoCapitalize="none"
                    disabled={isSubmitting}
                  />

                  {error ? (
                    <Text style={{ color: theme.colors.error, marginBottom: 12 }}>
                      {error}
                    </Text>
                  ) : null}

                  <Button
                    mode="contained"
                    onPress={handleAuth}
                    loading={isSubmitting}
                    disabled={isSubmitting}
                    style={styles.button}
                  >
                    {isLoginMode ? 'Login' : 'Register'}
                  </Button>

                  <Button
                    mode="text"
                    onPress={() => {
                      setIsLoginMode(!isLoginMode);
                      setError('');
                    }}
                    disabled={isSubmitting}
                    style={{ marginTop: 8 }}
                  >
                    {isLoginMode ? "Don't have an account? Register" : 'Already have an account? Login'}
                  </Button>
                </Card.Content>
              </Card>

              <Card style={[styles.card, { marginTop: 16 }]}>
                <Card.Content>
                  <Text variant="titleSmall" style={{ marginBottom: 8 }}>
                    Test Account
                  </Text>
                  <Text variant="bodySmall" style={{ color: theme.colors.custom.textSecondary }}>
                    Username: testuser1
                  </Text>
                  <Text variant="bodySmall" style={{ color: theme.colors.custom.textSecondary }}>
                    Password: Test123!
                  </Text>
                </Card.Content>
              </Card>

              <View style={styles.buttonContainer}>
                <Button
                  mode="outlined"
                  onPress={() => setDarkMode(!isDarkMode)}
                  style={styles.button}
                  icon={isDarkMode ? 'white-balance-sunny' : 'moon-waning-crescent'}
                >
                  {isDarkMode ? 'Light' : 'Dark'} Mode
                </Button>
              </View>
            </View>
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
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  card: {
    elevation: 4,
  },
  input: {
    marginBottom: 12,
  },
  button: {
    marginTop: 8,
  },
  buttonContainer: {
    marginTop: 24,
  },
});
