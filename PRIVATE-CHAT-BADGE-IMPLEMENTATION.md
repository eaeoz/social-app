# Private Chat Badge Count Implementation

## Overview
This document explains how the private chat badge count system works in the mobile app, showing unread message counts on the Messages tab.

## Architecture

### 1. Data Flow
```
Socket Message → ChatsScreen → Store Update → Badge Recalculation
```

### 2. Components Involved

#### ChatsScreen (`mobileapp/src/screens/ChatsScreen.tsx`)
- **Purpose**: Lists all private conversations
- **Socket Listener**: Listens for incoming `private_message` events
- **Behavior**: When a new message arrives, it automatically reloads the chat list
- **Key Code**:
```typescript
useEffect(() => {
  loadChats();

  const handlePrivateMessage = (message: any) => {
    console.log('📨 ChatsScreen received new private message:', message);
    loadChats(); // Reload to update unread counts
  };

  socketService.onPrivateMessage(handlePrivateMessage);

  return () => {
    socketService.off('private_message', handlePrivateMessage);
  };
}, []);
```

#### MainTabNavigator (`mobileapp/src/navigation/MainTabNavigator.tsx`)
- **Purpose**: Bottom tab navigation with badge count
- **Reactive Calculation**: Uses `useMemo` to recalculate badge when `privateChats` changes
- **Key Code**:
```typescript
const totalUnreadCount = useMemo(() => {
  if (!Array.isArray(privateChats)) return 0;
  const count = privateChats.reduce((total, chat) => {
    const unread = chat.unreadCount || 0;
    return total + unread;
  }, 0);
  return count;
}, [privateChats]);
```

#### Chat Store (`mobileapp/src/store/chatStore.ts`)
- **Purpose**: Centralized state management for chats
- **State**: Stores `privateChats` array with unread counts
- **Updates**: Triggered by ChatsScreen's `loadChats()` function

### 3. Backend Integration

#### API Endpoint (`server/routes/roomRoutes.js`)
- **Endpoint**: `GET /api/rooms/private-chats`
- **Purpose**: Returns list of private chats with unread counts
- **Key Features**:
  - Aggregates messages from `privatemessages` collection
  - Calculates unread count per conversation
  - Includes last message details
  - Populates other user information

#### Socket Events (`server/socket/privateChat.js`)
- **Event**: `private_message`
- **Purpose**: Broadcasts new messages to recipients in real-time
- **Triggers**: ChatsScreen to reload and update badge

## How It Works

### Initial Load
1. User opens app → ChatsScreen mounts
2. ChatsScreen calls `loadChats()` → API request
3. API returns chats with unread counts
4. Store updates → Badge recalculates
5. Badge displays on Messages tab

### Real-Time Updates
1. User A sends message to User B
2. Socket emits `private_message` event to User B
3. ChatsScreen receives event → calls `loadChats()`
4. API returns updated chats (new unread count)
5. Store updates → Badge recalculates automatically
6. Badge updates instantly (no manual refresh needed)

### Reading Messages
1. User opens PrivateChatScreen
2. Messages are marked as read via socket
3. Backend updates unread count in database
4. When ChatsScreen reloads, badge decreases

## Key Features

### ✅ Automatic Updates
- Badge updates in real-time when new messages arrive
- No manual refresh required
- Works even when on different tabs

### ✅ Persistent State
- Unread counts stored in database
- Survives app restarts
- Synced across devices

### ✅ Performance Optimized
- `useMemo` prevents unnecessary recalculations
- Socket listeners cleaned up on unmount
- Efficient array operations

### ✅ Error Handling
- Safe array checks (ensures privateChats is array)
- Default values for missing data
- Console logging for debugging

## Debug Logging

### ChatsScreen Logs
```
💬 Chats loaded: { totalChats: 2, chatsWithUnread: 1, ... }
📨 ChatsScreen received new private message: { ... }
```

### MainTabNavigator Logs
```
📊 Badge count calculation: {
  totalChats: 2,
  totalUnread: 5,
  chatsWithUnread: 1,
  breakdown: [
    { user: "john", unread: 5 },
    { user: "jane", unread: 0 }
  ]
}
```

## Implementation Summary

### What Was Changed

1. **ChatsScreen**:
   - Added socket listener for `private_message` events
   - Automatically reloads chats when new message arrives
   - Proper cleanup of socket listeners

2. **MainTabNavigator** (already implemented):
   - Uses `useMemo` for reactive badge calculation
   - Automatically recalculates when `privateChats` changes
   - Shows badge only when count > 0

3. **Backend** (already implemented):
   - Aggregates unread counts correctly
   - Emits socket events for new messages
   - Provides API endpoint for chat list

## Testing

### Test Scenarios
1. **New Message**: Send message from another user → Badge should increment immediately
2. **Multiple Chats**: Have unread in multiple chats → Badge shows total count
3. **Read Message**: Open chat → Badge should decrement
4. **App Background**: Receive message while on another tab → Badge updates when switching back
5. **App Restart**: Close and reopen app → Badge shows correct count from database

## Future Enhancements

Possible improvements:
- Push notifications for new messages
- Badge animation on update
- Separate badge per chat in list
- Sound notification when message arrives
- Vibration on new message

## Troubleshooting

### Badge Not Updating
- Check socket connection: `socketService.isConnected()`
- Verify socket listener is attached in ChatsScreen
- Check console logs for errors
- Ensure backend is emitting events correctly

### Wrong Badge Count
- Check database unread counts
- Verify API response includes correct data
- Check array operations in badge calculation
- Ensure `privateChats` is updating in store

### Performance Issues
- Monitor number of socket listeners
- Check if cleanup is working properly
- Verify `useMemo` dependencies are correct
- Check for memory leaks in listeners
