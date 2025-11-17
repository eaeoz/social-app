import React, { useEffect, useState } from 'react';
import { View, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { Text, Card, Badge, ActivityIndicator, FAB } from 'react-native-paper';
import { useTheme } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { useChatStore } from '../store';
import { apiService } from '../services';
import { Room } from '../types';
import { RootNavigationProp } from '../navigation/types';

export default function RoomsScreen() {
  const theme = useTheme();
  const navigation = useNavigation<RootNavigationProp>();
  const { rooms, setRooms } = useChatStore();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadRooms = async () => {
    try {
      const roomsData = await apiService.getPublicRooms();
      console.log('📊 Rooms data received:', roomsData);
      if (roomsData.length > 0) {
        console.log('📊 First room structure:', roomsData[0]);
        console.log('📊 First room keys:', Object.keys(roomsData[0]));
      }
      setRooms(roomsData);
    } catch (error) {
      console.error('Error loading rooms:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadRooms();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadRooms();
  };

  const handleRoomPress = (room: Room) => {
    // @ts-ignore - navigation types are correct
    navigation.navigate('ChatRoom', { room });
  };

  const renderRoom = ({ item }: { item: Room }) => (
    <Card
      style={[styles.roomCard, { backgroundColor: theme.colors.surface }]}
      onPress={() => handleRoomPress(item)}
    >
      <Card.Content>
        <View style={styles.roomHeader}>
          <Text variant="titleMedium">{item.name}</Text>
          {(item.unreadCount || 0) > 0 && (
            <Badge style={styles.badge}>{item.unreadCount}</Badge>
          )}
        </View>
        {item.description && (
          <Text
            variant="bodySmall"
            style={{ color: theme.colors.onSurfaceVariant, marginTop: 4 }}
          >
            {item.description}
          </Text>
        )}
        <View style={styles.roomFooter}>
          <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
            👥 {item.participantCount || 0} online
          </Text>
        </View>
      </Card.Content>
    </Card>
  );

  if (loading) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={{ marginTop: 16 }}>Loading rooms...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <FlatList
        data={rooms}
        renderItem={renderRoom}
        keyExtractor={(item, index) => item.roomId || index.toString()}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text variant="bodyLarge">No rooms available</Text>
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
              Pull down to refresh
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
  listContent: {
    padding: 16,
  },
  roomCard: {
    marginBottom: 12,
    elevation: 2,
  },
  roomHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  roomFooter: {
    marginTop: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  badge: {
    backgroundColor: '#FF3B30',
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 100,
  },
});
