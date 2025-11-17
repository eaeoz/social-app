import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, FlatList, KeyboardAvoidingView, Platform, RefreshControl, Modal, Alert, Linking, TouchableOpacity } from 'react-native';
import { Text, TextInput, IconButton, Avatar, ActivityIndicator, Button, Dialog, Portal } from 'react-native-paper';
import { useTheme } from 'react-native-paper';
import { useRoute, useNavigation } from '@react-navigation/native';
import EmojiSelector from 'react-native-emoji-selector';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import { ChatRoomRouteProp, RootNavigationProp } from '../navigation/types';
import { apiService } from '../services';
import { socketService } from '../services';
import { useAuthStore } from '../store';
import { Message } from '../types';

export default function ChatRoomScreen() {
  const theme = useTheme();
  const route = useRoute<ChatRoomRouteProp>();
  const navigation = useNavigation<RootNavigationProp>();
  const { room } = route.params;
  const { user } = useAuthStore();
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sending, setSending] = useState(false);
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
  const [showLocationDialog, setShowLocationDialog] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    loadMessages();
    joinRoom();

    // Listen for new messages with detailed logging
    const handleNewMessage = (message: any) => {
      console.log('📨 Received new room_message event:', {
        fullMessage: message,
        messageRoomId: message.roomId,
        messageRoom: message.room,
        currentRoomId: room.roomId,
        content: message.content,
        sender: message.senderUsername,
        allKeys: Object.keys(message)
      });
      
      // Accept the message - don't check roomId since it might be undefined
      console.log('✅ Adding message to UI (accepting all messages for now)');
      setMessages((prev) => {
        // Avoid duplicates
        const messageId = message._id || message.messageId || `${Date.now()}-${Math.random()}`;
        const exists = prev.some(m => m._id === messageId);
        if (exists) {
          console.log('⚠️ Message already exists, skipping');
          return prev;
        }
        
        // Add roomId to message if missing
        const messageWithRoomId = {
          ...message,
          roomId: message.roomId || room.roomId,
          _id: messageId
        };
        
        return [...prev, messageWithRoomId];
      });
      scrollToBottom();
    };

    console.log('👂 Setting up room_message listener');
    socketService.onRoomMessage(handleNewMessage);

    return () => {
      console.log('🧹 Cleaning up room_message listener');
      socketService.off('room_message', handleNewMessage);
      leaveRoom();
    };
  }, [room.roomId]);

  const loadMessages = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      }
      
      console.log(`📥 Requesting messages for room: ${room.roomId}`);
      
      // Listen for the response BEFORE requesting
      const handleRoomMessages = (data: any) => {
        console.log('📨 Received room messages response:', {
          hasData: !!data,
          hasRoomId: !!data?.roomId,
          roomIdMatch: data?.roomId === room.roomId,
          messagesCount: data?.messages?.length || 0,
          roomId: data?.roomId,
          expectedRoomId: room.roomId
        });
        
        // Remove the roomId check - just load all messages we receive
        if (data && data.messages) {
          console.log(`✅ Loading ${data.messages.length} messages`);
          setMessages(data.messages);
          setLoading(false);
          setRefreshing(false);
          // Remove listener after successful load
          socketService.off('room_messages', handleRoomMessages);
        }
      };
      
      socketService.onRoomMessages(handleRoomMessages);
      
      // Request messages via Socket.IO
      socketService.getRoomMessages(room.roomId);
      
      // Cleanup timeout
      setTimeout(() => {
        socketService.off('room_messages', handleRoomMessages);
        if (loading || refreshing) {
          console.log('⏱️ Message load timeout - no response received');
          setLoading(false);
          setRefreshing(false);
        }
      }, 10000); // Increased to 10 seconds
    } catch (error) {
      console.error('Error loading messages:', error);
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    loadMessages(true);
  };

  const joinRoom = () => {
    if (user) {
      console.log(`🚪 Joining room ${room.name} (${room.roomId})`);
      socketService.joinRoom(room.roomId, user.userId, user.username);
    }
  };

  const leaveRoom = () => {
    socketService.leaveRoom(room.roomId);
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

  const handleLocationShare = async () => {
    setShowLocationDialog(true);
  };

  const confirmLocationShare = async () => {
    setIsGettingLocation(true);
    
    try {
      // Request permission
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

      // Get current location
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const { latitude, longitude } = location.coords;
      const googleMapsUrl = `https://www.google.com/maps?q=${latitude},${longitude}`;
      const locationMessage = `📍 Location: ${googleMapsUrl}`;

      // Send location message
      if (user) {
        socketService.sendRoomMessage(
          room.roomId,
          locationMessage,
          user.userId,
          user.displayName || user.username
        );

        // Add optimistic message
        const optimisticMessage: Message = {
          _id: `temp-${Date.now()}`,
          messageId: `temp-${Date.now()}`,
          senderId: user.userId,
          senderUsername: user.username,
          senderName: user.displayName || user.username,
          content: locationMessage,
          timestamp: new Date(),
          roomId: room.roomId,
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
    // Check if message contains a location URL
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
    if (!newMessage.trim() || sending || !user) return;

    setSending(true);
    const messageContent = newMessage.trim();
    console.log(`📤 Sending message to room ${room.roomId}`);
    
    // Create optimistic message to show immediately
    const optimisticMessage: Message = {
      _id: `temp-${Date.now()}`,
      messageId: `temp-${Date.now()}`,
      senderId: user.userId,
      senderUsername: user.username,
      senderName: user.displayName || user.username,
      content: messageContent,
      timestamp: new Date(),
      roomId: room.roomId,
    } as Message;
    
    // Add message to UI immediately (optimistic update)
    setMessages((prev) => [...prev, optimisticMessage]);
    console.log('✅ Message added to UI optimistically');
    
    // Send via Socket.IO
    socketService.sendRoomMessage(
      room.roomId,
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
    const displayName = item.senderName || item.senderDisplayName || item.senderUsername || 'User';
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
          {!isOwnMessage && (
            <Text
              variant="labelSmall"
              style={{
                color: theme.colors.onSurfaceVariant,
                marginBottom: 4,
              }}
            >
              {displayName}
            </Text>
          )}
          
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
        keyExtractor={(item, index) => item.messageId || item._id || index.toString()}
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
              Be the first to send a message!
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
              📍 Do you want to share your current location with this chat?
            </Text>
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
              Your location will be sent as a Google Maps link that others can view.
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
