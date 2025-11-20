import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Card, Button, Avatar, Switch, Divider } from 'react-native-paper';
import { useTheme } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { useAuthStore, useThemeStore } from '../store';
import { apiService } from '../services';
import { RootNavigationProp } from '../navigation/types';

export default function ProfileScreen() {
  const theme = useTheme();
  const navigation = useNavigation<RootNavigationProp>();
  const { user, logout } = useAuthStore();
  const { isDarkMode, setDarkMode } = useThemeStore();
  const [statistics, setStatistics] = React.useState({ reportCount: 0, totalMessages: 0 });
  const [loadingStats, setLoadingStats] = React.useState(true);

  React.useEffect(() => {
    loadStatistics();
  }, []);

  const loadStatistics = async () => {
    try {
      setLoadingStats(true);
      const stats = await apiService.getUserStatistics();
      setStatistics(stats);
    } catch (error) {
      console.error('Failed to load statistics:', error);
    } finally {
      setLoadingStats(false);
    }
  };

  const handleLogout = async () => {
    try {
      await apiService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
    await logout();
  };

  if (!user) {
    return null;
  }

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={styles.content}
    >
      {/* Profile Header */}
      <Card style={styles.card}>
        <Card.Content style={styles.profileHeader}>
          {user.profilePicture ? (
            <Avatar.Image size={80} source={{ uri: user.profilePicture }} />
          ) : (
            <Avatar.Text 
              size={80} 
              label={(user.nickName || user.username || 'U').substring(0, 2).toUpperCase()} 
            />
          )}
          <View style={styles.profileInfo}>
            <Text 
              variant="headlineSmall" 
              style={{ 
                color: user.gender === 'Male' ? '#2196F3' : user.gender === 'Female' ? '#F44336' : theme.colors.onSurface,
                fontWeight: 'bold'
              }}
            >
              {user.nickName || user.username}
            </Text>
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
              @{user.username}
            </Text>
            <Text 
              variant="bodySmall" 
              style={{ 
                color: user.isOnline ? '#4CAF50' : theme.colors.onSurfaceVariant,
                marginTop: 8,
              }}
            >
              {user.isOnline ? '● Online' : 'Offline'}
            </Text>
          </View>
        </Card.Content>
      </Card>

      {/* Account Info */}
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Account Information
          </Text>
          <View style={styles.infoRow}>
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
              Email
            </Text>
            <Text variant="bodyMedium">{user.email}</Text>
          </View>
          <Divider style={styles.divider} />
          <View style={styles.infoRow}>
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
              Age
            </Text>
            <Text variant="bodyMedium">
              {user.age ? `${user.age} years old` : 'Not specified'}
            </Text>
          </View>
          <Divider style={styles.divider} />
          <View style={styles.infoRow}>
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
              Gender
            </Text>
            <Text 
              variant="bodyMedium"
              style={{ 
                color: user.gender === 'Male' ? '#2196F3' : user.gender === 'Female' ? '#F44336' : theme.colors.onSurface 
              }}
            >
              {user.gender || 'Not specified'}
            </Text>
          </View>
          <Divider style={styles.divider} />
          <View style={styles.infoRow}>
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
              Account Type
            </Text>
            <Text variant="bodyMedium">
              {user.isPremium ? '⭐ Premium' : 'Free'}
            </Text>
          </View>
        </Card.Content>
      </Card>

      {/* Settings */}
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Settings
          </Text>
          <View style={styles.settingRow}>
            <View>
              <Text variant="bodyMedium">Dark Mode</Text>
              <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                Use dark theme
              </Text>
            </View>
            <Switch value={isDarkMode} onValueChange={setDarkMode} />
          </View>
          <Divider style={styles.divider} />
          <View style={styles.settingRow}>
            <View>
              <Text variant="bodyMedium">Notifications</Text>
              <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                Message notifications
              </Text>
            </View>
            <Switch value={true} disabled />
          </View>
          <Divider style={styles.divider} />
          <View style={styles.settingRow}>
            <View>
              <Text variant="bodyMedium">Sound</Text>
              <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                Message sound effects
              </Text>
            </View>
            <Switch value={true} disabled />
          </View>
        </Card.Content>
      </Card>

      {/* Stats */}
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Statistics
          </Text>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text variant="headlineSmall">
                {loadingStats ? '...' : statistics.totalMessages}
              </Text>
              <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                Total Messages
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text variant="headlineSmall">
                {loadingStats ? '...' : statistics.reportCount}
              </Text>
              <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                Reports
              </Text>
            </View>
          </View>
        </Card.Content>
      </Card>

      {/* Actions */}
      <View style={styles.actionsContainer}>
        <Button
          mode="outlined"
          onPress={() => navigation.navigate('EditProfile')}
          style={styles.button}
          icon="account-edit"
        >
          Edit Profile
        </Button>
        <Button
          mode="outlined"
          onPress={() => navigation.navigate('ChangePassword')}
          style={styles.button}
          icon="lock"
        >
          Change Password
        </Button>
        <Button
          mode="contained"
          onPress={handleLogout}
          style={styles.button}
          icon="logout"
          buttonColor={theme.colors.error}
        >
          Logout
        </Button>
      </View>

      {/* App Info */}
      <View style={styles.appInfo}>
        <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, textAlign: 'center' }}>
          Netcify Mobile v1.0.0
        </Text>
        <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, textAlign: 'center', marginTop: 4 }}>
          Made with ❤️ for seamless communication
        </Text>
      </View>
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
  profileHeader: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  profileInfo: {
    alignItems: 'center',
    marginTop: 16,
  },
  sectionTitle: {
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  divider: {
    marginVertical: 8,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  actionsContainer: {
    marginBottom: 16,
  },
  button: {
    marginBottom: 12,
  },
  appInfo: {
    paddingVertical: 24,
    paddingBottom: 40,
  },
});
