import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, FlatList, KeyboardAvoidingView, Platform, RefreshControl, Modal, Alert, Linking, TouchableOpacity } from 'react-native';
import { Text, TextInput, IconButton, Avatar, ActivityIndicator, Button, Dialog, Portal } from 'react-native-paper';
import { useTheme } from 'react-native-paper';
import { useRoute, useNavigation } from '@react-navigation/native';
import EmojiSelector from 'react-native-emoji-selector';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import { PrivateChatRouteProp, RootNavigationProp } from '../navigation/types';
import { apiService } from '../services';
import { socketService } from '../services';
import { useAuthStore, useChatStore } from '../store';
import { Message } from '../types';

export default function PrivateChatScreen() {
  const theme = useTheme();
  const route = useRoute<PrivateChatRouteProp>();
  const navigation = useNavigation<RootNavigationProp>();
  const { chat } = route.params;
  const { user } = useAuthStore();

  // Set header with call buttons
  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <View style={{ flexDirection: 'row', marginRight: 8 }}>
          <IconButton
            icon="phone"
            size={24}
            iconColor="#10b981"
            onPress={handleVoiceCall}
          />
          <IconButton
            icon="video"
            size={24}
            iconColor="#3b82f6"
            onPress={handleVideoCall}
          />
        </View>
      ),
    });
  }, [navigation]);
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sending, setSending] = useState(false);
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
  const [showLocationDialog, setShowLocationDialog] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [incomingCall, setIncomingCall] = useState<{
    from: string;
    fromName: string;
    callType: 'voice' | 'video';
  } | null>(null);
  const flatListRef = useRef<FlatList>(null);

  const otherUser = chat.otherUser;
  const otherUserId = otherUser?.userId;

  useEffect(() => {
    if (!otherUserId || !user?.userId) return;
    
    loadMessages();

    // Mark chat as read when opening the conversation
    markChatAsRead();

    // Listen for message history (from get_private_messages)
    const handleMessageHistory = (data: any) => {
      console.log('📜 Received private_messages history:', data);
      if (data.otherUserId === otherUserId && data.messages) {
        setMessages(data.messages);
        setLoading(false);
        setRefreshing(false);
        scrollToBottom();
        
        // Mark as read again after loading messages
        markChatAsRead();
      }
    };

    // Listen for new private messages
    const handleNewMessage = (message: any) => {
      console.log('📨 Received new private_message event:', message);
      
      // Check if message is for this conversation
      const isForThisChat = 
        (message.senderId === otherUserId && message.receiverId === user?.userId) ||
        (message.senderId === user?.userId && message.receiverId === otherUserId);

      if (isForThisChat) {
        console.log('✅ Adding private message to UI');
        setMessages((prev) => {
          // Avoid duplicates
          const messageId = message._id || `${Date.now()}-${Math.random()}`;
          const exists = prev.some(m => m._id === messageId);
          if (exists) {
            console.log('⚠️ Message already exists, skipping');
            return prev;
          }
          
          return [...prev, { ...message, _id: messageId }];
        });
        scrollToBottom();
        
        // Mark chat as read when receiving new messages in this active conversation
        markChatAsRead();
      }
    };

    socketService.onPrivateMessages(handleMessageHistory);
    socketService.onPrivateMessage(handleNewMessage);

    return () => {
      socketService.off('private_messages', handleMessageHistory);
      socketService.off('private_message', handleNewMessage);
    };
  }, [otherUserId, user?.userId]);

  const markChatAsRead = async () => {
    if (!user?.userId || !otherUserId) return;
    
    console.log('✅ Marking messages as read between', user.userId, 'and', otherUserId);
    
    // Send mark as read with correct parameters (userId and otherUserId)
    socketService.markChatAsReadByUsers(user.userId, otherUserId);
    
    // Force reload chat list after a short delay to update unread counts
    setTimeout(async () => {
      try {
        const chatsData = await apiService.getPrivateChats();
        const chatsArray = Array.isArray(chatsData) ? chatsData : [];
        useChatStore.getState().setPrivateChats(chatsArray);
        console.log('✅ Chat list refreshed after marking as read');
      } catch (error) {
        console.error('❌ Error refreshing chat list:', error);
      }
    }, 500);
  };

  const loadMessages = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      }
      
      if (!otherUserId || !user?.userId) {
        console.error('No user IDs available');
        setLoading(false);
        setRefreshing(false);
        return;
      }
      
      console.log(`📥 Loading messages with user: ${otherUserId}`);
      
      // Use socket to get messages (like web frontend)
      socketService.getPrivateMessages(user.userId, otherUserId, 50);
      
      // Messages will be received via 'private_messages' event listener
      // Set a timeout to handle loading state
      setTimeout(() => {
        setLoading(false);
        setRefreshing(false);
      }, 2000);
    } catch (error) {
      console.error('Error loading private messages:', error);
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    loadMessages(true);
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const handleEmojiPick = (emoji: string) => {
    setNewMessage((prev) => prev + emoji);
    setIsEmojiPickerOpen(false);
  };

  // Call handlers
  const handleVoiceCall = async () => {
    if (!user || !otherUserId || !otherUser) return;
    
    try {
      // Navigate to Call screen
      navigation.navigate('Call', {
        callType: 'voice',
        otherUser: {
          userId: otherUserId,
          username: otherUser.username,
          displayName: otherUser.displayName,
          profilePicture: otherUser.profilePicture,
        },
        isIncoming: false,
      });
    } catch (error) {
      console.error('Error initiating voice call:', error);
      Alert.alert('Error', 'Failed to initiate voice call');
    }
  };

  const handleVideoCall = async () => {
    if (!user || !otherUserId || !otherUser) return;
    
    try {
      // Navigate to Call screen
      navigation.navigate('Call', {
        callType: 'video',
        otherUser: {
          userId: otherUserId,
          username: otherUser.username,
          displayName: otherUser.displayName,
          profilePicture: otherUser.profilePicture,
        },
        isIncoming: false,
      });
    } catch (error) {
      console.error('Error initiating video call:', error);
      Alert.alert('Error', 'Failed to initiate video call');
    }
  };

  const acceptIncomingCall = () => {
    if (!incomingCall) return;
    
    // Navigate to Call screen
    navigation.navigate('Call', {
      callType: incomingCall.callType,
      otherUser: {
        userId: incomingCall.from,
        username: incomingCall.fromName,
        displayName: incomingCall.fromName,
        profilePicture: null,
      },
      isIncoming: true,
    });
    
    setIncomingCall(null);
  };

  const declineIncomingCall = () => {
    if (incomingCall && user) {
      // Send call-rejected event
      if (socketService.isConnected()) {
        const socket = (socketService as any).socket;
        if (socket) {
          socket.emit('call-rejected', { to: incomingCall.from });
        }
      }
    }
    setIncomingCall(null);
  };

  const handleLocationShare = async () => {
    setShowLocationDialog(true);
  };

  const confirmLocationShare = async () => {
    setIsGettingLocation(true);
    
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          'Permission Denied',
          'Location permission is required to share your location. Please enable it in your device settings.',
          [{ text: 'OK' }]
        );
        setShowLocationDialog(false);
        setIsGettingLocation(false);
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const { latitude, longitude } = location.coords;
      const googleMapsUrl = `https://www.google.com/maps?q=${latitude},${longitude}`;
      const locationMessage = `📍 Location: ${googleMapsUrl}`;

      if (user && otherUserId) {
        // Send with all required parameters
        socketService.sendPrivateMessage(
          otherUserId, 
          locationMessage,
          user.userId,
          user.displayName || user.username
        );

        const optimisticMessage: Message = {
          _id: `temp-${Date.now()}`,
          messageId: `temp-${Date.now()}`,
          senderId: user.userId,
          receiverId: otherUserId,
          senderUsername: user.username,
          senderName: user.displayName || user.username,
          content: locationMessage,
          timestamp: new Date(),
        } as Message;

        setMessages((prev) => [...prev, optimisticMessage]);
        scrollToBottom();
      }

      setShowLocationDialog(false);
      setIsGettingLocation(false);
    } catch (error) {
      console.error('Error getting location:', error);
      Alert.alert(
        'Location Error',
        'Unable to retrieve your location. Please try again.',
        [{ text: 'OK' }]
      );
      setShowLocationDialog(false);
      setIsGettingLocation(false);
    }
  };

  const cancelLocationShare = () => {
    setShowLocationDialog(false);
    setIsGettingLocation(false);
  };

  const renderMessageContent = (content: string) => {
    const locationUrlRegex = /📍\s*Location:\s*(https:\/\/www\.google\.com\/maps\?q=([-0-9.]+),([-0-9.]+))/;
    const match = content.match(locationUrlRegex);

    if (match) {
      const mapsUrl = match[1];
      const latitude = parseFloat(match[2]);
      const longitude = parseFloat(match[3]);
      
      return (
        <View style={styles.locationContainer}>
          <Text variant="bodyMedium" style={{ marginBottom: 8 }}>
            📍 Shared Location
          </Text>
          <TouchableOpacity 
            onPress={() => Linking.openURL(mapsUrl)}
            activeOpacity={0.8}
          >
            <View style={styles.mapPreview}>
              <MapView
                style={styles.map}
                initialRegion={{
                  latitude,
                  longitude,
                  latitudeDelta: 0.01,
                  longitudeDelta: 0.01,
                }}
                scrollEnabled={false}
                zoomEnabled={false}
                rotateEnabled={false}
                pitchEnabled={false}
              >
                <Marker
                  coordinate={{ latitude, longitude }}
                  title="Shared Location"
                />
              </MapView>
            </View>
          </TouchableOpacity>
          <Button
            mode="contained"
            onPress={() => Linking.openURL(mapsUrl)}
            icon="map-marker"
            compact
            style={{ marginTop: 8 }}
          >
            Open in Maps
          </Button>
        </View>
      );
    }

    return <Text variant="bodyMedium">{content}</Text>;
  };

  const handleSend = () => {
    if (!newMessage.trim() || sending || !user || !otherUserId) return;

    setSending(true);
    const messageContent = newMessage.trim();
    console.log(`📤 Sending private message to ${otherUserId}`);
    
    const optimisticMessage: Message = {
      _id: `temp-${Date.now()}`,
      messageId: `temp-${Date.now()}`,
      senderId: user.userId,
      receiverId: otherUserId,
      senderUsername: user.username,
      senderName: user.displayName || user.username,
      content: messageContent,
      timestamp: new Date(),
    } as Message;
    
    setMessages((prev) => [...prev, optimisticMessage]);
    console.log('✅ Message added to UI optimistically');
    
    // Send with all required parameters
    socketService.sendPrivateMessage(
      otherUserId, 
      messageContent, 
      user.userId, 
      user.displayName || user.username
    );
    
    setNewMessage('');
    setSending(false);
    scrollToBottom();
  };

  const renderMessage = ({ item }: { item: any }) => {
    const isOwnMessage = item.senderId === user?.userId;
    const displayName = isOwnMessage 
      ? (user?.displayName || user?.username || 'You')
      : (otherUser?.displayName || otherUser?.username || 'User');
    const initials = displayName.substring(0, 2).toUpperCase();
    
    return (
      <View
        style={[
          styles.messageContainer,
          isOwnMessage ? styles.ownMessage : styles.otherMessage,
        ]}
      >
        {!isOwnMessage && (
          <Avatar.Text
            size={32}
            label={initials}
            style={styles.avatar}
          />
        )}
        
        <View
          style={[
            styles.messageBubble,
            isOwnMessage
              ? { backgroundColor: theme.colors.primary }
              : { backgroundColor: theme.colors.surfaceVariant },
          ]}
        >
          {renderMessageContent(item.content)}
          
          <Text
            variant="labelSmall"
            style={{
              color: isOwnMessage
                ? 'rgba(255, 255, 255, 0.7)'
                : theme.colors.onSurfaceVariant,
              marginTop: 4,
              alignSelf: 'flex-end',
            }}
          >
            {new Date(item.timestamp).toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>
        </View>

        {isOwnMessage && (
          <Avatar.Text
            size={32}
            label={(user?.username || 'U').substring(0, 2).toUpperCase()}
            style={styles.avatar}
          />
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={{ marginTop: 16 }}>Loading messages...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item, index) => item._id || `message-${index}`}
        contentContainerStyle={styles.messagesList}
        onContentSizeChange={scrollToBottom}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[theme.colors.primary]}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text variant="bodyLarge">No messages yet</Text>
            <Text
              variant="bodySmall"
              style={{ color: theme.colors.onSurfaceVariant, marginTop: 8 }}
            >
              Start a conversation with {otherUser?.displayName || otherUser?.username}!
            </Text>
            <Button
              mode="contained"
              onPress={onRefresh}
              style={{ marginTop: 16 }}
            >
              Refresh Messages
            </Button>
          </View>
        }
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <View style={[styles.inputContainer, { backgroundColor: theme.colors.surface }]}>
          <IconButton
            icon="map-marker"
            size={24}
            onPress={handleLocationShare}
            style={styles.emojiButton}
          />
          <IconButton
            icon="emoticon-happy-outline"
            size={24}
            onPress={() => setIsEmojiPickerOpen(true)}
            style={styles.emojiButton}
          />
          <TextInput
            mode="outlined"
            placeholder="Type a message..."
            value={newMessage}
            onChangeText={setNewMessage}
            style={styles.input}
            multiline
            maxLength={1000}
            right={
              <TextInput.Icon
                icon="send"
                onPress={handleSend}
                disabled={!newMessage.trim() || sending}
                color={
                  newMessage.trim() && !sending
                    ? theme.colors.primary
                    : theme.colors.onSurfaceVariant
                }
              />
            }
          />
        </View>
      </KeyboardAvoidingView>

      <Modal
        visible={isEmojiPickerOpen}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsEmojiPickerOpen(false)}
      >
        <View style={styles.emojiModalOverlay}>
          <View 
            style={styles.overlayTouchable}
            onTouchEnd={() => setIsEmojiPickerOpen(false)}
          />
          <View style={[styles.emojiBottomSheet, { backgroundColor: theme.colors.background }]}>
            <View style={[styles.emojiHeader, { backgroundColor: theme.colors.surface }]}>
              <Text variant="titleMedium" style={{ color: theme.colors.onSurface }}>
                Select Emoji
              </Text>
              <IconButton
                icon="close"
                onPress={() => setIsEmojiPickerOpen(false)}
              />
            </View>
            <EmojiSelector
              onEmojiSelected={handleEmojiPick}
              showSearchBar={false}
              showTabs={true}
              showHistory={false}
              showSectionTitles={false}
              category={undefined}
              columns={8}
            />
          </View>
        </View>
      </Modal>

      <Portal>
        <Dialog visible={showLocationDialog} onDismiss={cancelLocationShare}>
          <Dialog.Title>Share Your Location</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium" style={{ marginBottom: 8 }}>
              📍 Do you want to share your current location with {otherUser?.displayName || otherUser?.username}?
            </Text>
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
              Your location will be sent as a Google Maps link.
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={cancelLocationShare} disabled={isGettingLocation}>
              Cancel
            </Button>
            <Button
              onPress={confirmLocationShare}
              disabled={isGettingLocation}
              loading={isGettingLocation}
            >
              {isGettingLocation ? 'Getting Location...' : 'Share Location'}
            </Button>
          </Dialog.Actions>
        </Dialog>

        <Dialog visible={!!incomingCall} onDismiss={declineIncomingCall}>
          <Dialog.Title>
            {incomingCall?.callType === 'video' ? '📹' : '📞'} Incoming Call
          </Dialog.Title>
          <Dialog.Content>
            <View style={{ alignItems: 'center', paddingVertical: 20 }}>
              <Avatar.Text
                size={80}
                label={incomingCall?.fromName?.substring(0, 2).toUpperCase() || 'U'}
                style={{ marginBottom: 16 }}
              />
              <Text variant="headlineSmall" style={{ marginBottom: 8 }}>
                {incomingCall?.fromName}
              </Text>
              <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                {incomingCall?.callType === 'video' ? 'Video' : 'Voice'} call incoming...
              </Text>
            </View>
          </Dialog.Content>
          <Dialog.Actions style={{ justifyContent: 'space-around', paddingHorizontal: 16 }}>
            <Button
              mode="contained"
              onPress={declineIncomingCall}
              buttonColor="#ef4444"
              style={{ flex: 1, marginRight: 8 }}
              icon="phone-hangup"
            >
              Decline
            </Button>
            <Button
              mode="contained"
              onPress={acceptIncomingCall}
              buttonColor="#10b981"
              style={{ flex: 1, marginLeft: 8 }}
              icon="phone"
            >
              Accept
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
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
  messagesList: {
    padding: 16,
    paddingBottom: 8,
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: 12,
    alignItems: 'flex-end',
  },
  ownMessage: {
    justifyContent: 'flex-end',
  },
  otherMessage: {
    justifyContent: 'flex-start',
  },
  avatar: {
    marginHorizontal: 8,
  },
  messageBubble: {
    maxWidth: '70%',
    padding: 12,
    borderRadius: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.12)',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  emojiButton: {
    margin: 0,
  },
  input: {
    flex: 1,
    maxHeight: 100,
    backgroundColor: 'transparent',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emojiModalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  overlayTouchable: {
    flex: 1,
  },
  emojiBottomSheet: {
    height: '50%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  emojiHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  locationContainer: {
    width: '100%',
  },
  mapPreview: {
    width: '100%',
    height: 150,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#e0e0e0',
  },
  map: {
    width: '100%',
    height: '100%',
  },
});
