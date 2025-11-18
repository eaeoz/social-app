import React, { useEffect, useState } from 'react';
import { View, StyleSheet, FlatList, RefreshControl, TouchableOpacity } from 'react-native';
import { Text, Card, Badge, ActivityIndicator, Avatar, Appbar, Checkbox } from 'react-native-paper';
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
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedChats, setSelectedChats] = useState<Set<string>>(new Set());
  const [deleting, setDeleting] = useState(false);

  const loadChats = async () => {
    try {
      const chatsData = await apiService.getPrivateChats();
      // Ensure we always have an array
      const chatsArray = Array.isArray(chatsData) ? chatsData : [];
      
      console.log('💬 Chats loaded:', {
        totalChats: chatsArray.length,
        chatsWithUnread: chatsArray.filter((c: any) => c.unreadCount > 0).length,
        unreadBreakdown: chatsArray.map((c: any) => ({
          user: c.otherUser?.username,
          unreadCount: c.unreadCount
        }))
      });
      
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

    // Listen for incoming private messages to update chat list in real-time
    const handlePrivateMessage = (message: any) => {
      console.log('📨 ChatsScreen received new private message:', message);
      
      // Use functional update to access latest state without dependency
      setPrivateChats(prevChats => {
        const chatsArray = Array.isArray(prevChats) ? prevChats : [];
        const senderId = message.senderId || message.sender?._id;
        
        // Find existing chat with this user
        const existingChatIndex = chatsArray.findIndex((chat: any) => 
          chat.otherUser?.userId === senderId || chat.otherUser?._id === senderId
        );
        
        if (existingChatIndex >= 0) {
          // Update existing chat
          const updatedChats = [...chatsArray];
          const existingChat = updatedChats[existingChatIndex];
          
          updatedChats[existingChatIndex] = {
            ...existingChat,
            lastMessage: message.content || message.text,
            lastMessageAt: message.timestamp || new Date().toISOString(),
            unreadCount: (existingChat.unreadCount || 0) + 1,
          };
          
          // Move updated chat to top
          const [movedChat] = updatedChats.splice(existingChatIndex, 1);
          updatedChats.unshift(movedChat);
          
          console.log('✅ Updated existing chat in list');
          return updatedChats;
        } else {
          // New chat - reload from server to get complete chat object
          console.log('🆕 New chat detected - reloading from server');
          loadChats();
          return chatsArray;
        }
      });
    };

    // Listen for chat state changes (when chats are opened/closed from other devices)
    const handleChatStateChange = (data: any) => {
      console.log('💬 Chat state changed:', data);
      // Reload chats to reflect the changes
      loadChats();
    };

    // Listen for messages being marked as read
    const handleChatReadStatus = (data: any) => {
      console.log('✅ Chat read status updated:', data);
      // Use functional update to access latest state without dependency
      setPrivateChats(prevChats => {
        const chatsArray = Array.isArray(prevChats) ? prevChats : [];
        return chatsArray.map((chat: any) => {
          if (chat._id === data.chatId || chat.otherUser?.userId === data.userId) {
            return { ...chat, unreadCount: 0 };
          }
          return chat;
        });
      });
    };

    socketService.onPrivateMessage(handlePrivateMessage);
    socketService.onChatStateChange(handleChatStateChange);
    socketService.onChatReadStatus(handleChatReadStatus);

    // Cleanup socket listeners on unmount
    return () => {
      socketService.off('private_message', handlePrivateMessage);
      socketService.offChatStateChange(handleChatStateChange);
      socketService.offChatReadStatus(handleChatReadStatus);
    };
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
    if (selectionMode) {
      const chatKey = chat.otherUser?.userId || chat._id || '';
      toggleChatSelection(chatKey);
    } else {
      navigation.navigate('PrivateChat', { chat });
    }
  };

  const handleChatLongPress = (chatId: string) => {
    setSelectionMode(true);
    toggleChatSelection(chatId);
  };

  const toggleChatSelection = (chatId: string) => {
    setSelectedChats(prev => {
      const newSet = new Set(prev);
      if (newSet.has(chatId)) {
        newSet.delete(chatId);
      } else {
        newSet.add(chatId);
      }
      return newSet;
    });
  };

  const exitSelectionMode = () => {
    setSelectionMode(false);
    setSelectedChats(new Set());
  };

  const handleDeleteSelected = async () => {
    try {
      setDeleting(true);
      
      // Get selected chats data using chatKey (otherUser.userId)
      const chatsToDelete = chatsList.filter((chat: any) => {
        const chatKey = chat.otherUser?.userId || chat._id || '';
        return selectedChats.has(chatKey);
      });
      
      console.log('�️ Selected chat keys:', Array.from(selectedChats));
      console.log('🗑️ Chats to delete:', chatsToDelete.map(c => ({
        chatId: c._id,
        username: c.otherUser?.username,
        userId: c.otherUser?.userId,
        chatKey: c.otherUser?.userId || c._id
      })));
      
      // Immediately update UI - remove deleted chats from local state for instant feedback
      const remainingChats = chatsList.filter((chat: any) => {
        const chatKey = chat.otherUser?.userId || chat._id || '';
        return !selectedChats.has(chatKey);
      });
      setPrivateChats(remainingChats);
      
      // Exit selection mode immediately
      exitSelectionMode();
      
      // Process deletions SEQUENTIALLY to avoid race conditions on the backend
      // The backend reads/writes openChats array, so parallel updates cause overwrites
      for (const chat of chatsToDelete) {
        const otherUserId = chat?.otherUser?.userId;
        if (otherUserId) {
          try {
            console.log(`🗑️ Closing chat ${chatsToDelete.indexOf(chat) + 1}/${chatsToDelete.length} with user:`, otherUserId);
            await apiService.closePrivateChat(otherUserId);
            console.log('✅ Successfully closed chat with user:', otherUserId);
            // Add small delay between requests to ensure backend processes them properly
            await new Promise(resolve => setTimeout(resolve, 100));
          } catch (err) {
            console.error('❌ Error closing chat with user:', otherUserId, err);
          }
        }
      }
      
      // Refresh from server to ensure consistency
      console.log('🔄 Refreshing chat list after deletion...');
      await loadChats();
    } catch (error) {
      console.error('Error deleting selected chats:', error);
      // On error, reload to show correct state
      loadChats();
    } finally {
      setDeleting(false);
    }
  };

  const formatTime = (date: any) => {
    if (!date) return '';
    
    try {
      const now = new Date();
      const messageDate = new Date(date);
      
      // Check if date is valid
      if (isNaN(messageDate.getTime())) {
        return '';
      }
      
      const diffMs = now.getTime() - messageDate.getTime();
      
      // Handle negative time differences (future dates)
      if (diffMs < 0) {
        return messageDate.toLocaleDateString();
      }
      
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays < 7) return `${diffDays}d ago`;
      return messageDate.toLocaleDateString();
    } catch (error) {
      console.error('Error formatting time:', error);
      return '';
    }
  };

  const renderChat = ({ item }: { item: any }) => {
    // Safely extract values with defaults
    const otherUser = item?.otherUser || {};
    
    // Debug log to see what data we're receiving
    if (otherUser?.username) {
      console.log('👤 User data:', {
        username: otherUser.username,
        nickname: otherUser.nickname,
        displayName: otherUser.displayName,
        gender: otherUser.gender,
        age: otherUser.age
      });
    }
    
    const displayName = otherUser?.nickName || otherUser?.nickname || otherUser?.displayName || otherUser?.username || 'Unknown User';
    const username = otherUser?.username || '';
    const profilePicture = otherUser?.profilePicture;
    const isOnline = otherUser?.isOnline || false;
    const lastMessageAt = item?.lastMessageAt;
    const unreadCount = item?.unreadCount || 0;
    const age = otherUser?.age;
    const gender = otherUser?.gender;
    // Use otherUser.userId as unique key since _id might not be unique
    const chatKey = otherUser?.userId || item._id || '';
    const isSelected = selectedChats.has(chatKey);
    
    // Determine username color based on gender
    const getUsernameColor = () => {
      const genderLower = gender?.toLowerCase();
      if (genderLower === 'male') return '#3B82F6'; // Blue
      if (genderLower === 'female') return '#EF4444'; // Red
      return theme.colors.onSurface; // Default color
    };
    
    // Safely extract last message text
    let lastMessageText = '';
    if (item?.lastMessage) {
      if (typeof item.lastMessage === 'string') {
        lastMessageText = item.lastMessage;
      } else if (typeof item.lastMessage === 'object' && item.lastMessage.content) {
        lastMessageText = String(item.lastMessage.content);
      } else {
        lastMessageText = 'New message';
      }
    }
    
    return (
      <Card
        style={[styles.chatCard, { backgroundColor: theme.colors.surface }]}
        onPress={() => handleChatPress(item)}
        onLongPress={() => handleChatLongPress(chatKey)}
      >
        <Card.Content style={styles.chatContent}>
          {selectionMode && (
            <Checkbox
              status={isSelected ? 'checked' : 'unchecked'}
              onPress={() => toggleChatSelection(chatKey)}
            />
          )}
          
          <View style={styles.avatarContainer}>
            {profilePicture ? (
              <Avatar.Image size={48} source={{ uri: profilePicture }} />
            ) : (
              <Avatar.Text 
                size={48} 
                label={username ? username.substring(0, 2).toUpperCase() : '??'} 
              />
            )}
            {isOnline && (
              <View style={[styles.onlineIndicator, { borderColor: theme.colors.surface }]} />
            )}
          </View>
          
          <View style={styles.chatInfo}>
            <View style={styles.chatHeader}>
              <View style={styles.usernameContainer}>
                <Text 
                  variant="titleMedium" 
                  numberOfLines={1}
                  style={{ color: getUsernameColor() }}
                >
                  {displayName}
                </Text>
                {age && (
                  <Text 
                    variant="bodySmall" 
                    style={{ color: getUsernameColor(), marginLeft: 4 }}
                  >
                    ({age})
                  </Text>
                )}
              </View>
              {lastMessageAt && (
                <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                  {formatTime(lastMessageAt)}
                </Text>
              )}
            </View>
            
            {lastMessageText && (
              <View style={styles.lastMessageRow}>
                <Text 
                  variant="bodyMedium" 
                  numberOfLines={1}
                  style={{ 
                    color: unreadCount > 0 ? theme.colors.onSurface : theme.colors.onSurfaceVariant,
                    fontWeight: unreadCount > 0 ? 'bold' : 'normal',
                    flex: 1,
                  }}
                >
                  {lastMessageText}
                </Text>
                {item?.chattedToday && !selectionMode && (
                  <Text 
                    variant="bodySmall" 
                    style={{ 
                      color: theme.colors.primary,
                      fontStyle: 'italic',
                      marginRight: 4
                    }}
                  >
                    📅
                  </Text>
                )}
                {unreadCount > 0 && !selectionMode && (
                  <Badge style={styles.badge}>{unreadCount}</Badge>
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
      {selectionMode && (
        <Appbar.Header>
          <Appbar.BackAction onPress={exitSelectionMode} />
          <Appbar.Content title={`${selectedChats.size} selected`} />
          {selectedChats.size > 0 && (
            <Appbar.Action icon="delete" onPress={handleDeleteSelected} />
          )}
        </Appbar.Header>
      )}
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
  usernameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
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
