import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { Text, TextInput, Button, Card, useTheme } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { apiService } from '../services';
import { useAuthStore } from '../store';

export default function ChangePasswordScreen() {
  const theme = useTheme();
  const navigation = useNavigation();
  const { logout } = useAuthStore();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleChangePassword = async () => {
    // Validation
    if (!currentPassword || !newPassword || !confirmPassword) {
      setError('All fields are required');
      return;
    }

    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    if (currentPassword === newPassword) {
      setError('New password must be different from current password');
      return;
    }

    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      await apiService.changePassword(currentPassword, newPassword);

      setSuccess('Password changed successfully!');
      
      // Clear fields
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      
      // Navigate back after a short delay
      setTimeout(() => {
        navigation.goBack();
      }, 2000);
    } catch (err: any) {
      console.error('Change password error:', err);
      console.error('Error response:', err.response?.data);
      console.error('Error status:', err.response?.status);
      
      // Handle different error cases
      if (err.response?.status === 404) {
        // Session expired - show alert and logout
        Alert.alert(
          'Session Expired',
          'Your session has expired. Please log in again to continue.',
          [
            {
              text: 'OK',
              onPress: async () => {
                await logout();
              }
            }
          ]
        );
      } else if (err.response?.status === 401) {
        setError('Current password is incorrect. Please try again.');
      } else {
        const errorMessage = err.response?.data?.error || err.response?.data?.message || 'Failed to change password';
        setError(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <ScrollView 
        style={[styles.container, { backgroundColor: theme.colors.background }]}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
      {/* Security Icon */}
      <View style={styles.iconContainer}>
        <Text style={styles.icon}>🔐</Text>
        <Text variant="headlineSmall" style={styles.title}>
          Change Password
        </Text>
        <Text variant="bodyMedium" style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}>
          Keep your account secure
        </Text>
      </View>

      {/* Password Form */}
      <Card style={styles.card}>
        <Card.Content>
          <TextInput
            label="Current Password *"
            value={currentPassword}
            onChangeText={setCurrentPassword}
            mode="outlined"
            style={styles.input}
            secureTextEntry={!showCurrentPassword}
            right={
              <TextInput.Icon
                icon={showCurrentPassword ? 'eye-off' : 'eye'}
                onPress={() => setShowCurrentPassword(!showCurrentPassword)}
              />
            }
            disabled={isLoading}
            autoCapitalize="none"
          />

          <TextInput
            label="New Password *"
            value={newPassword}
            onChangeText={setNewPassword}
            mode="outlined"
            style={styles.input}
            secureTextEntry={!showNewPassword}
            right={
              <TextInput.Icon
                icon={showNewPassword ? 'eye-off' : 'eye'}
                onPress={() => setShowNewPassword(!showNewPassword)}
              />
            }
            disabled={isLoading}
            autoCapitalize="none"
          />

          <TextInput
            label="Confirm New Password *"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            mode="outlined"
            style={styles.input}
            secureTextEntry={!showConfirmPassword}
            right={
              <TextInput.Icon
                icon={showConfirmPassword ? 'eye-off' : 'eye'}
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              />
            }
            disabled={isLoading}
            autoCapitalize="none"
          />

          <Text variant="bodySmall" style={[styles.hint, { color: theme.colors.onSurfaceVariant }]}>
            * Required fields
          </Text>

          {error ? (
            <Text variant="bodyMedium" style={[styles.errorText, { color: theme.colors.error }]}>
              {error}
            </Text>
          ) : null}

          {success ? (
            <Text variant="bodyMedium" style={[styles.successText, { color: '#4CAF50' }]}>
              ✅ {success}
            </Text>
          ) : null}
        </Card.Content>
      </Card>

      {/* Password Requirements */}
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleSmall" style={styles.requirementsTitle}>
            🔒 Password Requirements
          </Text>
          <View style={styles.requirementsList}>
            <Text 
              variant="bodySmall" 
              style={[
                styles.requirement,
                { color: newPassword.length >= 6 ? '#4CAF50' : theme.colors.onSurfaceVariant }
              ]}
            >
              {newPassword.length >= 6 ? '✓' : '○'} At least 6 characters
            </Text>
            <Text 
              variant="bodySmall" 
              style={[
                styles.requirement,
                { color: newPassword !== confirmPassword || !confirmPassword ? theme.colors.onSurfaceVariant : '#4CAF50' }
              ]}
            >
              {newPassword === confirmPassword && confirmPassword ? '✓' : '○'} Passwords match
            </Text>
            <Text 
              variant="bodySmall" 
              style={[
                styles.requirement,
                { color: currentPassword && newPassword !== currentPassword ? '#4CAF50' : theme.colors.onSurfaceVariant }
              ]}
            >
              {currentPassword && newPassword !== currentPassword ? '✓' : '○'} Different from current password
            </Text>
          </View>
        </Card.Content>
      </Card>

      {/* Action Buttons */}
      <View style={styles.buttonsContainer}>
        <Button
          mode="contained"
          onPress={handleChangePassword}
          style={styles.button}
          loading={isLoading}
          disabled={isLoading}
          icon="lock-reset"
        >
          Change Password
        </Button>
        <Button
          mode="outlined"
          onPress={() => navigation.goBack()}
          style={styles.button}
          disabled={isLoading}
          icon="close"
        >
          Cancel
        </Button>
      </View>

      {/* Security Tips */}
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleSmall" style={styles.tipsTitle}>
            💡 Security Tips
          </Text>
          <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, lineHeight: 20 }}>
            • Use a strong, unique password{'\n'}
            • Don't share your password with anyone{'\n'}
            • Change your password regularly{'\n'}
            • Use a combination of letters, numbers, and symbols
          </Text>
        </Card.Content>
      </Card>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  iconContainer: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  icon: {
    fontSize: 64,
    marginBottom: 16,
  },
  title: {
    fontWeight: '600',
    marginBottom: 8,
  },
  subtitle: {
    textAlign: 'center',
  },
  card: {
    marginBottom: 16,
    elevation: 2,
  },
  input: {
    marginBottom: 12,
  },
  hint: {
    marginTop: 4,
    marginBottom: 12,
  },
  errorText: {
    marginTop: 8,
    marginBottom: 8,
  },
  successText: {
    marginTop: 8,
    marginBottom: 8,
  },
  requirementsTitle: {
    marginBottom: 12,
    fontWeight: '600',
  },
  requirementsList: {
    gap: 8,
  },
  requirement: {
    lineHeight: 24,
    fontSize: 14,
  },
  buttonsContainer: {
    marginBottom: 16,
  },
  button: {
    marginBottom: 12,
  },
  tipsTitle: {
    marginBottom: 12,
    fontWeight: '600',
  },
});
