import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { Text, TextInput, Button, Card, useTheme, HelperText } from 'react-native-paper';
import { apiService } from '../services';
import { useAuthStore } from '../store';

interface LoginScreenProps {
  onSwitchToRegister: () => void;
}

export default function LoginScreen({ onSwitchToRegister }: LoginScreenProps) {
  const theme = useTheme();
  const { login } = useAuthStore();
  
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    if (!username || !password) {
      setError('Please fill in all fields');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      console.log('🔐 Attempting login...');
      console.log('👤 Username:', username);
      
      const userData = await apiService.login({ username, password });
      console.log('✅ Login successful!', userData);
      await login(userData);
    } catch (err: any) {
      console.error('❌ Login error:', err);
      
      let errorMessage = 'Login failed';
      
      if (err.code === 'ECONNABORTED') {
        errorMessage = 'Connection timeout. Please check if backend server is running.';
      } else if (err.code === 'ERR_NETWORK' || err.message === 'Network Error') {
        errorMessage = 'Cannot reach server. Please check your network connection and ensure the backend server is running.';
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.response?.data?.error) {
        errorMessage = err.response.data.error;
      }
      
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.content}>
          {/* Logo and Title */}
          <View style={styles.header}>
            <Text variant="displaySmall" style={styles.title}>
              💬 Netcify
            </Text>
            <Text variant="headlineSmall" style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}>
              Welcome Back!
            </Text>
            <Text variant="bodyMedium" style={[styles.description, { color: theme.colors.onSurfaceVariant }]}>
              Sign in to your account
            </Text>
          </View>

          {/* Login Form Card */}
          <Card style={styles.card}>
            <Card.Content>
              <TextInput
                label="Username or Email"
                value={username}
                onChangeText={(text) => {
                  setUsername(text);
                  setError('');
                }}
                mode="outlined"
                style={styles.input}
                autoCapitalize="none"
                disabled={isSubmitting}
                left={<TextInput.Icon icon="account" />}
              />

              <TextInput
                label="Password"
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  setError('');
                }}
                mode="outlined"
                secureTextEntry={!showPassword}
                style={styles.input}
                autoCapitalize="none"
                disabled={isSubmitting}
                left={<TextInput.Icon icon="lock" />}
                right={
                  <TextInput.Icon
                    icon={showPassword ? 'eye-off' : 'eye'}
                    onPress={() => setShowPassword(!showPassword)}
                  />
                }
              />

              {error ? (
                <HelperText type="error" visible={true} style={styles.errorText}>
                  {error}
                </HelperText>
              ) : null}

              <Button
                mode="contained"
                onPress={handleLogin}
                loading={isSubmitting}
                disabled={isSubmitting}
                style={styles.button}
              >
                Sign In
              </Button>

              <Button
                mode="text"
                onPress={onSwitchToRegister}
                disabled={isSubmitting}
                style={styles.linkButton}
              >
                Don't have an account? Sign Up
              </Button>
            </Card.Content>
          </Card>

          {/* Test Account Info */}
          <Card style={styles.infoCard}>
            <Card.Content>
              <Text variant="titleSmall" style={styles.infoTitle}>
                Test Account
              </Text>
              <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                Username: testuser1
              </Text>
              <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                Password: Test123!
              </Text>
            </Card.Content>
          </Card>

          {/* Safety Features Info */}
          <Card style={styles.infoCard}>
            <Card.Content>
              <View style={styles.safetyHeader}>
                <Text variant="titleSmall">🛡️ Safety & Protection</Text>
              </View>
              <View style={styles.safetyList}>
                <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                  ✓ Real-time content filtering{'\n'}
                  ✓ Automatic user protection{'\n'}
                  ✓ Spam prevention system{'\n'}
                  ✓ Secure authentication
                </Text>
              </View>
            </Card.Content>
          </Card>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontWeight: '600',
    marginBottom: 4,
  },
  description: {
    textAlign: 'center',
  },
  card: {
    elevation: 4,
    marginBottom: 16,
  },
  input: {
    marginBottom: 12,
  },
  button: {
    marginTop: 8,
    paddingVertical: 6,
  },
  linkButton: {
    marginTop: 8,
  },
  errorText: {
    fontSize: 14,
    marginBottom: 8,
  },
  infoCard: {
    elevation: 2,
    marginBottom: 16,
  },
  infoTitle: {
    marginBottom: 8,
    fontWeight: '600',
  },
  safetyHeader: {
    marginBottom: 8,
  },
  safetyList: {
    paddingLeft: 4,
  },
});
