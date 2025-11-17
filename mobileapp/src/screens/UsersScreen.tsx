import React, { useEffect, useState } from 'react';
import { View, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { Text, Card, ActivityIndicator, Avatar, Searchbar, Button, Checkbox } from 'react-native-paper';
import { useTheme } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import MultiSlider from '@ptomasroos/react-native-multi-slider';
import { apiService, socketService } from '../services';
import { User } from '../types';
import { RootNavigationProp } from '../navigation/types';

export default function UsersScreen() {
  const theme = useTheme();
  const navigation = useNavigation<RootNavigationProp>();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [ageRange, setAgeRange] = useState<[number, number]>([18, 100]);
  const [selectedGenders, setSelectedGenders] = useState<string[]>(['Male', 'Female']);
  const [showFilters, setShowFilters] = useState(false);

  const loadUsers = async (searchText: string = '') => {
    try {
      // Match web frontend behavior:
      // - No search = only online users (default backend behavior)
      // - Search with 3+ chars = all users (backend search mode)
      const params: any = {};
      if (searchText && searchText.trim().length >= 3) {
        params.search = searchText.trim();
      }
      
      const usersData = await apiService.getUsers(params);
      const userArray = Array.isArray(usersData) ? usersData : [];
      console.log('📥 Loaded users:', userArray.length, searchText ? `(search: "${searchText}")` : '(online only)');
      setUsers(userArray);
    } catch (error: any) {
      console.error('❌ Error loading users:', error);
      setUsers([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    // Initial load without search - shows only online users
    loadUsers('');

    // Listen for user status changes via socket
    const handleUserStatusChanged = (data: { userId: string; status: string; lastActiveAt?: Date }) => {
      console.log('👤 User status changed:', data);
      setUsers(prevUsers => 
        prevUsers.map(u => 
          u.userId === data.userId 
            ? { ...u, isOnline: data.status === 'online', lastSeen: data.lastActiveAt }
            : u
        )
      );
    };

    socketService.onUserStatusChanged(handleUserStatusChanged as any);

    return () => {
      // Cleanup listener when component unmounts
      socketService.off('user_status_changed', handleUserStatusChanged);
    };
  }, []);

  // Reload users when search text changes (debounced)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      loadUsers(searchQuery);
    }, 300); // 300ms debounce

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const onRefresh = () => {
    setRefreshing(true);
    loadUsers(searchQuery);
  };

  const handleUserPress = (user: User) => {
    navigation.navigate('UserProfile', { user });
  };

  const toggleGender = (gender: string) => {
    setSelectedGenders(prev => {
      if (prev.includes(gender)) {
        const newSelection = prev.filter(g => g !== gender);
        return newSelection.length === 0 ? ['Male', 'Female'] : newSelection;
      } else {
        return [...prev, gender];
      }
    });
  };

  const clearFilters = () => {
    setSearchQuery('');
    setAgeRange([18, 100]);
    setSelectedGenders(['Male', 'Female']);
  };

  const getFilteredUsers = () => {
    return users
      .filter(u => {
        // Search filter
        if (searchQuery.trim() && searchQuery.trim().length >= 3) {
          const searchLower = searchQuery.toLowerCase();
          const displayName = u.displayName || u.username;
          return displayName.toLowerCase().includes(searchLower) ||
                 u.username.toLowerCase().includes(searchLower);
        }
        return true;
      })
      .filter(u => {
        // Age filter
        if (u.age) {
          return u.age >= ageRange[0] && u.age <= ageRange[1];
        }
        return ageRange[0] === 18 && ageRange[1] === 100;
      })
      .filter(u => {
        // Gender filter
        if (selectedGenders.length === 2) {
          return true;
        }
        return u.gender && selectedGenders.includes(u.gender);
      })
      .sort((a, b) => {
        // PRIORITY: Online users first
        if (a.isOnline && !b.isOnline) return -1;
        if (!a.isOnline && b.isOnline) return 1;
        // Then alphabetically by display name
        const nameA = (a.displayName || a.username).toLowerCase();
        const nameB = (b.displayName || b.username).toLowerCase();
        return nameA.localeCompare(nameB);
      });
  };

  const filteredUsers = getFilteredUsers();

  const renderUser = ({ item }: { item: User }) => (
    <Card
      style={[styles.userCard, { backgroundColor: theme.colors.surface }]}
      onPress={() => handleUserPress(item)}
    >
      <Card.Content style={styles.userContent}>
        <View style={styles.avatarContainer}>
          {item.profilePicture ? (
            <Avatar.Image size={56} source={{ uri: item.profilePicture }} />
          ) : (
            <Avatar.Text 
              size={56} 
              label={(item.displayName || item.username).substring(0, 2).toUpperCase()} 
            />
          )}
          {item.isOnline && (
            <View style={[styles.onlineIndicator, { borderColor: theme.colors.surface }]} />
          )}
        </View>
        
        <View style={styles.userInfo}>
          <Text variant="titleMedium">{item.displayName || item.username}</Text>
          <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
            @{item.username}
          </Text>
          <View style={styles.statusRow}>
            {item.age && (
              <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                {item.age} years • 
              </Text>
            )}
            {item.gender && (
              <Text 
                variant="bodySmall" 
                style={{ 
                  color: item.gender.toLowerCase() === 'male' ? '#3b82f6' : '#ec4899',
                  marginLeft: 4,
                }}
              >
                {item.gender} • 
              </Text>
            )}
            <Text 
              variant="bodySmall" 
              style={{ 
                color: item.isOnline ? '#4CAF50' : theme.colors.onSurfaceVariant,
                marginLeft: 4,
              }}
            >
              {item.isOnline ? '● Online' : 'Offline'}
            </Text>
          </View>
        </View>
      </Card.Content>
    </Card>
  );

  if (loading) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={{ marginTop: 16 }}>Loading users...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <Searchbar
          placeholder="Search users..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchBar}
        />
        
        <View style={styles.filterHeader}>
          <Button
            mode="text"
            onPress={() => setShowFilters(!showFilters)}
            icon={showFilters ? 'chevron-up' : 'chevron-down'}
          >
            Filters
          </Button>
          {(searchQuery || ageRange[0] !== 18 || ageRange[1] !== 100 || selectedGenders.length !== 2) && (
            <Button mode="text" onPress={clearFilters}>
              Clear
            </Button>
          )}
        </View>

        {showFilters && (
          <View style={[styles.filterContainer, { backgroundColor: theme.colors.surfaceVariant }]}>
            {/* Age Range Section */}
            <View style={styles.filterSection}>
              <Text variant="titleSmall" style={styles.sectionTitle}>
                Age: {ageRange[0]} - {ageRange[1]}
              </Text>
              <View style={styles.sliderWrapper}>
                <MultiSlider
                  values={[ageRange[0], ageRange[1]]}
                  onValuesChange={(values) => setAgeRange([values[0], values[1]])}
                  min={18}
                  max={100}
                  step={1}
                  sliderLength={260}
                  selectedStyle={{
                    backgroundColor: theme.colors.primary,
                    height: 4,
                  }}
                  unselectedStyle={{
                    backgroundColor: theme.colors.outline,
                    height: 4,
                  }}
                  markerStyle={{
                    backgroundColor: theme.colors.primary,
                    height: 20,
                    width: 20,
                    borderRadius: 10,
                    borderWidth: 2,
                    borderColor: theme.colors.surface,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.2,
                    shadowRadius: 1.5,
                    elevation: 2,
                  }}
                  pressedMarkerStyle={{
                    backgroundColor: theme.colors.primary,
                    height: 24,
                    width: 24,
                    borderRadius: 12,
                  }}
                  containerStyle={styles.sliderContainer}
                  trackStyle={styles.track}
                />
              </View>
            </View>

            {/* Gender Section */}
            <View style={[styles.filterSection, { marginTop: 12 }]}>
              <Text variant="titleSmall" style={styles.sectionTitle}>
                Gender
              </Text>
              <View style={styles.genderRow}>
                <View style={styles.genderOption}>
                  <Checkbox
                    status={selectedGenders.includes('Male') ? 'checked' : 'unchecked'}
                    onPress={() => toggleGender('Male')}
                  />
                  <Text variant="bodyMedium">Male</Text>
                </View>
                <View style={styles.genderOption}>
                  <Checkbox
                    status={selectedGenders.includes('Female') ? 'checked' : 'unchecked'}
                    onPress={() => toggleGender('Female')}
                  />
                  <Text variant="bodyMedium">Female</Text>
                </View>
              </View>
            </View>
          </View>
        )}
      </View>
      
      <FlatList
        data={filteredUsers}
        renderItem={renderUser}
        keyExtractor={(item) => item.userId}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text variant="bodyLarge">No users found</Text>
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginTop: 8 }}>
              Try adjusting your search or filters
            </Text>
          </View>
        }
      />
    </View>
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
  header: {
    padding: 16,
    paddingBottom: 8,
  },
  searchBar: {
    marginBottom: 8,
  },
  filterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  filterContainer: {
    padding: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginTop: 8,
  },
  filterSection: {
    marginBottom: 4,
  },
  sectionTitle: {
    marginBottom: 8,
    fontWeight: '600',
  },
  sliderWrapper: {
    paddingVertical: 4,
  },
  sliderContainer: {
    alignSelf: 'center',
  },
  track: {
    height: 4,
    borderRadius: 2,
  },
  genderRow: {
    flexDirection: 'row',
    gap: 16,
    paddingTop: 4,
  },
  genderOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  listContent: {
    padding: 16,
    paddingTop: 8,
  },
  userCard: {
    marginBottom: 12,
    elevation: 2,
  },
  userContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 16,
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#4CAF50',
    borderWidth: 2,
  },
  userInfo: {
    flex: 1,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 100,
  },
});
