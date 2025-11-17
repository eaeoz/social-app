import React, { useEffect, useState } from 'react';
import { View, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { Text, Card, Badge, ActivityIndicator, Avatar } from 'react-native-paper';
import { useTheme } from 'react-native-paper';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useChatStore } from '../store';
import { apiService, socketService } from '../services';
import { PrivateChat } from '../types';
import { RootNavigationProp } from '../navigation/types';

export default function ChatsScreen() {
  const theme = useTheme();
  const navigation = useNavigation<RootNavigationProp>();
  const { privateChats, setPrivateChats } = useChatStore();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadChats = async () => {
    try {
      const chatsData = await apiService.getPrivateChats();
      // Ensure we always have an array
      const chatsArray = Array.isArray(chatsData) ? chatsData : [];
      setPrivateChats(chatsArray);
    } catch (error) {
      console.error('Error loading chats:', error);
      setPrivateChats([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    // Load chats when component mounts
    loadChats();
  }, []);

  // Reload chats when user focuses on this tab
  useFocusEffect(
    React.useCallback(() => {
      console.log('📱 Messages tab focused - reloading chats');
      loadChats();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadChats();
  };

  const handleChatPress = (chat: PrivateChat) => {
    navigation.navigate('PrivateChat', { chat });
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const messageDate = new Date(date);
    const diffMs = now.getTime() - messageDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return messageDate.toLocaleDateString();
  };

  const renderChat = ({ item }: { item: PrivateChat }) => {
    const otherUser = item.otherUser;
    
    return (
      <Card
        style={[styles.chatCard, { backgroundColor: theme.colors.surface }]}
        onPress={() => handleChatPress(item)}
      >
        <Card.Content style={styles.chatContent}>
          <View style={styles.avatarContainer}>
            {otherUser?.profilePicture ? (
              <Avatar.Image size={48} source={{ uri: otherUser.profilePicture }} />
            ) : (
              <Avatar.Text 
                size={48} 
                label={otherUser?.username.substring(0, 2).toUpperCase() || '??'} 
              />
            )}
            {otherUser?.isOnline && (
              <View style={[styles.onlineIndicator, { borderColor: theme.colors.surface }]} />
            )}
          </View>
          
          <View style={styles.chatInfo}>
            <View style={styles.chatHeader}>
              <Text variant="titleMedium" numberOfLines={1}>
                {otherUser?.displayName || otherUser?.username || 'Unknown User'}
              </Text>
              {item.lastMessage && (
                <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                  {formatTime(item.lastMessage.timestamp)}
                </Text>
              )}
            </View>
            
            {item.lastMessage && (
              <View style={styles.lastMessageRow}>
                <Text 
                  variant="bodyMedium" 
                  numberOfLines={1}
                  style={{ 
                    color: item.unreadCount ? theme.colors.onSurface : theme.colors.onSurfaceVariant,
                    fontWeight: item.unreadCount ? 'bold' : 'normal',
                    flex: 1,
                  }}
                >
                  {item.lastMessage.content}
                </Text>
                {item.unreadCount && item.unreadCount > 0 && (
                  <Badge style={styles.badge}>{item.unreadCount}</Badge>
                )}
              </View>
            )}
          </View>
        </Card.Content>
      </Card>
    );
  };

  if (loading) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={{ marginTop: 16 }}>Loading chats...</Text>
      </View>
    );
  }

  // Ensure privateChats is always an array
  const chatsList = Array.isArray(privateChats) ? privateChats : [];

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <FlatList
        data={chatsList}
        renderItem={renderChat}
        keyExtractor={(item, index) => item._id || `chat-${index}`}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text variant="bodyLarge">No conversations yet</Text>
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginTop: 8 }}>
              Go to Users tab to start a conversation
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
  chatCard: {
    marginBottom: 12,
    elevation: 2,
  },
  chatContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#4CAF50',
    borderWidth: 2,
  },
  chatInfo: {
    flex: 1,
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  lastMessageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  badge: {
    backgroundColor: '#DC2626',
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 100,
  },
});
