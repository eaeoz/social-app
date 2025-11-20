import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, TextInput, Button, Avatar, Card, useTheme } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { useAuthStore } from '../store';
import { apiService } from '../services';

export default function EditProfileScreen() {
  const theme = useTheme();
  const navigation = useNavigation();
  const { user, setUser } = useAuthStore();

  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSave = async () => {
    if (!displayName.trim()) {
      setError('Display name is required');
      return;
    }

    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      const updatedUser = await apiService.updateProfile({
        displayName: displayName.trim(),
        bio: bio.trim(),
      });

      // Update user in store - merge with existing user to keep accessToken
      if (user) {
        setUser({ 
          ...user, 
          displayName: updatedUser.displayName || displayName.trim(),
          bio: bio.trim(),
        });
      }
      
      setSuccess('Profile updated successfully!');
      
      // Navigate back after a short delay
      setTimeout(() => {
        navigation.goBack();
      }, 1500);
    } catch (err: any) {
      console.error('Update profile error:', err);
      setError(err.response?.data?.error || 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={styles.content}
    >
      {/* Profile Picture Section */}
      <Card style={styles.card}>
        <Card.Content style={styles.avatarSection}>
          {user.profilePicture ? (
            <Avatar.Image size={100} source={{ uri: user.profilePicture }} />
          ) : (
            <Avatar.Text 
              size={100} 
              label={(user.username || user.displayName || 'U').substring(0, 2).toUpperCase()} 
            />
          )}
          <Text variant="bodyMedium" style={[styles.avatarHint, { color: theme.colors.onSurfaceVariant }]}>
            @{user.username}
          </Text>
        </Card.Content>
      </Card>

      {/* Edit Form */}
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Profile Information
          </Text>

          <TextInput
            label="Display Name *"
            value={displayName}
            onChangeText={setDisplayName}
            mode="outlined"
            style={styles.input}
            autoCapitalize="words"
            disabled={isLoading}
          />

          <TextInput
            label="Bio"
            value={bio}
            onChangeText={setBio}
            mode="outlined"
            style={styles.input}
            multiline
            numberOfLines={4}
            placeholder="Tell us about yourself..."
            disabled={isLoading}
          />

          <TextInput
            label="Email"
            value={user.email}
            mode="outlined"
            style={styles.input}
            disabled
            editable={false}
            right={<TextInput.Icon icon="lock" />}
          />

          <Text variant="bodySmall" style={[styles.hint, { color: theme.colors.onSurfaceVariant }]}>
            * Required field
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

      {/* Action Buttons */}
      <View style={styles.buttonsContainer}>
        <Button
          mode="contained"
          onPress={handleSave}
          style={styles.button}
          loading={isLoading}
          disabled={isLoading}
          icon="content-save"
        >
          Save Changes
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

      {/* Info Card */}
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleSmall" style={styles.infoTitle}>
            💡 Profile Tips
          </Text>
          <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, lineHeight: 20 }}>
            • Choose a display name that represents you{'\n'}
            • Add a bio to let others know about you{'\n'}
            • Your username and email cannot be changed{'\n'}
            • Changes are saved immediately
          </Text>
        </Card.Content>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  card: {
    marginBottom: 16,
    elevation: 2,
  },
  avatarSection: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  avatarHint: {
    marginTop: 12,
  },
  sectionTitle: {
    marginBottom: 16,
    fontWeight: '600',
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
  buttonsContainer: {
    marginBottom: 16,
  },
  button: {
    marginBottom: 12,
  },
  infoTitle: {
    marginBottom: 12,
    fontWeight: '600',
  },
});
