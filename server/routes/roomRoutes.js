import express from 'express';
import { getDatabase } from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';
import { ObjectId } from 'mongodb';
import { getSiteSettings } from '../utils/initializeSiteSettings.js';

const router = express.Router();

// Get all public rooms with unread counts
router.get('/public', authenticateToken, async (req, res) => {
  try {
    const db = getDatabase();
    const userId = new ObjectId(req.user.userId);
    
    const rooms = await db.collection('publicrooms')
      .find({ isActive: true, isPrivate: false })
      .sort({ createdAt: 1 })
      .toArray();

    // Get unread counts for all rooms
    const roomsWithUnread = await Promise.all(
      rooms.map(async (room) => {
        // Get user's last seen time for this room
        const activity = await db.collection('userroomactivity').findOne({
          userId: userId,
          roomId: room._id
        });

        const lastSeenAt = activity?.lastSeenAt || new Date(0); // If never visited, use epoch

        // Count messages after last seen time (excluding user's own messages)
        const unreadCount = await db.collection('messages').countDocuments({
          roomId: room._id,
          isPrivate: false,
          timestamp: { $gt: lastSeenAt },
          senderId: { $ne: userId }
        });

        // Get total message count for the room
        const messageCount = await db.collection('messages').countDocuments({
          roomId: room._id,
          isPrivate: false
        });

        return {
          roomId: room._id.toString(),
          name: room.name,
          description: room.description,
          icon: room.icon,
          participantCount: room.participants?.length || 0,
          maxParticipants: room.maxParticipants,
          unreadCount: unreadCount,
          messageCount: messageCount,
          createdAt: room.createdAt
        };
      })
    );

    res.json({ rooms: roomsWithUnread });
  } catch (error) {
    console.error('Error getting public rooms:', error);
    res.status(500).json({ error: 'Failed to get rooms' });
  }
});

// Get single user profile (always includes profile picture)
router.get('/user-profile/:userId', authenticateToken, async (req, res) => {
  try {
    const db = getDatabase();
    const { userId } = req.params;

    const user = await db.collection('users').findOne(
      { _id: new ObjectId(userId) },
      { 
        projection: { 
          username: 1, 
          displayName: 1, 
          nickName: 1,
          status: 1,
          bio: 1,
          age: 1,
          gender: 1,
          profilePictureId: 1
        }
      }
    );

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Always include profile picture for individual user profile (with cache-busting timestamp)
    let profilePictureUrl = null;
    if (user.profilePictureId) {
      profilePictureUrl = `${process.env.APPWRITE_ENDPOINT}/storage/buckets/${process.env.APPWRITE_BUCKET_ID}/files/${user.profilePictureId}/view?project=${process.env.APPWRITE_PROJECT_ID}&t=${Date.now()}`;
    }

    const userResponse = {
      userId: user._id.toString(),
      username: user.username,
      displayName: user.displayName || user.nickName || user.username,
      nickName: user.nickName || user.username,
      status: user.status || 'offline',
      bio: user.bio || '',
      age: user.age,
      gender: user.gender,
      profilePicture: profilePictureUrl
    };

    res.json({ user: userResponse });
  } catch (error) {
    console.error('Error getting user profile:', error);
    res.status(500).json({ error: 'Failed to get user profile' });
  }
});

// Get all users (for private chat selection)
router.get('/users', authenticateToken, async (req, res) => {
  try {
    const db = getDatabase();
    const currentUserId = new ObjectId(req.user.userId);
    const { search } = req.query; // Check if this is a search request

    // Get site settings to check if we should show profile pictures and user limit
    const siteSettings = await getSiteSettings();
    console.log('📸 Site Settings:', siteSettings);
    console.log('📸 showuserlistpicture value:', siteSettings.showuserlistpicture, 'type:', typeof siteSettings.showuserlistpicture);
    // Convert to number and compare - handles string "1" or number 1
    const showPictures = Number(siteSettings.showuserlistpicture) === 1;
    console.log('📸 showPictures result:', showPictures);
    const searchUserCount = siteSettings.searchUserCount || 50;
    const defaultUsersDisplayCount = siteSettings.defaultUsersDisplayCount || 20;

    // Determine filter and limit based on whether it's a search or default view
    // Search requires at least 3 characters
    const isSearching = search && search.trim().length >= 3;
    const filter = {
      _id: { $ne: currentUserId },
      username: { $ne: 'system' }
    };

    // If not searching, show only online users
    if (!isSearching) {
      filter.status = 'online';
    }

    // If searching (3+ characters), add search filter
    if (isSearching) {
      filter.$or = [
        { username: { $regex: search, $options: 'i' } },
        { displayName: { $regex: search, $options: 'i' } }
      ];
    }

    // Choose limit based on mode
    const limit = isSearching ? searchUserCount : defaultUsersDisplayCount;

    // Build projection dynamically based on settings
    const projection = { 
      username: 1, 
      displayName: 1,
      nickName: 1,
      status: 1,
      bio: 1,
      age: 1,
      gender: 1,
      lastSeen: 1,
      lastActiveAt: 1
    };

    // Only include profilePictureId if pictures should be shown
    if (showPictures) {
      projection.profilePictureId = 1;
    }

    // Fetch more users than the limit to allow proper sorting
    const users = await db.collection('users')
      .find(filter, { projection })
      .toArray();

    // Sort by activity: online first, then by lastActiveAt (most recent first)
    users.sort((a, b) => {
      // First priority: Online users come first
      if (a.status === 'online' && b.status !== 'online') return -1;
      if (a.status !== 'online' && b.status === 'online') return 1;
      
      // Second priority: For offline users, sort by lastActiveAt (most recent first)
      if (a.status !== 'online' && b.status !== 'online') {
        const aTime = a.lastActiveAt ? new Date(a.lastActiveAt).getTime() : 0;
        const bTime = b.lastActiveAt ? new Date(b.lastActiveAt).getTime() : 0;
        return bTime - aTime; // Most recent first
      }
      
      // Third priority: For online users, sort by lastActiveAt (most recent first)
      if (a.status === 'online' && b.status === 'online') {
        const aTime = a.lastActiveAt ? new Date(a.lastActiveAt).getTime() : 0;
        const bTime = b.lastActiveAt ? new Date(b.lastActiveAt).getTime() : 0;
        return bTime - aTime; // Most recent first
      }
      
      return 0;
    });

    // Apply limit after sorting
    const limitedUsers = users.slice(0, limit);

    const usersResponse = limitedUsers.map(user => {
      const userObj = {
        userId: user._id.toString(),
        username: user.username,
        displayName: user.displayName || user.nickName || user.username,
        nickName: user.nickName || user.username,
        status: user.status || 'offline',
        bio: user.bio || '',
        age: user.age,
        gender: user.gender,
        lastSeen: user.lastSeen // Include lastSeen for offline users
      };

      // Only add profilePicture field if pictures should be shown (with cache-busting timestamp)
      if (showPictures) {
        let profilePictureUrl = null;
        if (user.profilePictureId) {
          profilePictureUrl = `${process.env.APPWRITE_ENDPOINT}/storage/buckets/${process.env.APPWRITE_BUCKET_ID}/files/${user.profilePictureId}/view?project=${process.env.APPWRITE_PROJECT_ID}&t=${Date.now()}`;
        }
        userObj.profilePicture = profilePictureUrl;
      }
      
      return userObj;
    });

    res.json({ 
      users: usersResponse,
      showPictures // Send this info to frontend so it knows whether to display picture areas
    });
  } catch (error) {
    console.error('Error getting users:', error);
    res.status(500).json({ error: 'Failed to get users' });
  }
});

// Mark room as read (update lastSeenAt)
router.post('/mark-room-read', authenticateToken, async (req, res) => {
  try {
    const db = getDatabase();
    const userId = new ObjectId(req.user.userId);
    const { roomId } = req.body;

    if (!roomId) {
      return res.status(400).json({ error: 'Room ID is required' });
    }

    const roomObjectId = new ObjectId(roomId);

    // Update or create user room activity with current timestamp
    await db.collection('userroomactivity').updateOne(
      {
        userId: userId,
        roomId: roomObjectId
      },
      {
        $set: {
          lastSeenAt: new Date()
        }
      },
      { upsert: true }
    );

    res.json({ success: true });
  } catch (error) {
    console.error('Error marking room as read:', error);
    res.status(500).json({ error: 'Failed to mark room as read' });
  }
});

// Get private chats with unread counts
router.get('/private-chats', authenticateToken, async (req, res) => {
  try {
    const db = getDatabase();
    const userId = new ObjectId(req.user.userId);

    // Get user's openChats array to see which chats should be visible
    const currentUser = await db.collection('users').findOne(
      { _id: userId },
      { projection: { openChats: 1 } }
    );

    // Ensure openChats is an array
    const openChats = Array.isArray(currentUser?.openChats) ? currentUser.openChats : [];

    // Get site settings for message retention period (with error handling)
    let retentionDays = 1; // Default to 1 day
    try {
      const siteSettings = await getSiteSettings();
      retentionDays = siteSettings.messageRetentionDays || 1;
    } catch (error) {
      console.error('⚠️ Error getting site settings for retention period, using default (1 day):', error);
    }
    
    const retentionMs = retentionDays * 24 * 60 * 60 * 1000;
    const retentionDate = new Date(Date.now() - retentionMs);

    // Clean up old messages from closed chats
    const closedChatUserIds = openChats
      .filter(oc => oc && oc.state === false)
      .map(oc => oc.userId);

    if (closedChatUserIds.length > 0) {
      // Delete old messages from closed chats based on retention setting
      const deletedResult = await db.collection('messages').deleteMany({
        isPrivate: true,
        $or: [
          { senderId: userId, receiverId: { $in: closedChatUserIds.map(id => new ObjectId(id)) } },
          { receiverId: userId, senderId: { $in: closedChatUserIds.map(id => new ObjectId(id)) } }
        ],
        timestamp: { $lt: retentionDate }
      });
      
      if (deletedResult.deletedCount > 0) {
        console.log(`🗑️ Deleted ${deletedResult.deletedCount} old messages (>${retentionDays} days) from closed chats for user ${userId}`);
      }
    }

    // Find all private chats for this user
    const privateChats = await db.collection('privatechats')
      .find({
        participants: userId,
        isActive: true
      })
      .sort({ lastMessageAt: -1 })
      .toArray();

    // Get unread counts and other user info for each chat
    const chatsWithDetails = await Promise.all(
      privateChats.map(async (chat) => {
        // Get the other participant's ID
        const otherUserId = chat.participants.find(id => !id.equals(userId));

        // Check if this chat should be visible based on openChats state
        const openChatEntry = openChats.find(oc => oc && oc.userId === otherUserId.toString());
        
        // Chat visibility logic:
        // - Hide ONLY if explicitly closed (state === false)
        // - Show if: state === true OR state is undefined/null (not yet set) OR has unread messages
        const isExplicitlyClosed = openChatEntry?.state === false;
        
        // Check if user is in openChats array (chatted today indicator)
        const isInOpenChats = openChatEntry !== undefined;
        
        // If user explicitly closed this chat, don't show it
        if (isExplicitlyClosed) return null;

        // Get other user's info
        const otherUser = await db.collection('users').findOne(
          { _id: otherUserId },
          { projection: { username: 1, displayName: 1, nickName: 1, status: 1, profilePictureId: 1, age: 1, gender: 1, lastSeen: 1 } }
        );

        if (!otherUser) return null;

        // Get profile picture URL if available (with cache-busting timestamp)
        let profilePictureUrl = null;
        if (otherUser.profilePictureId) {
          profilePictureUrl = `${process.env.APPWRITE_ENDPOINT}/storage/buckets/${process.env.APPWRITE_BUCKET_ID}/files/${otherUser.profilePictureId}/view?project=${process.env.APPWRITE_PROJECT_ID}&t=${Date.now()}`;
        }

        // Count unread messages (messages sent by other user that we haven't read)
        const unreadCount = await db.collection('messages').countDocuments({
          isPrivate: true,
          receiverId: userId,
          senderId: otherUserId,
          isRead: false
        });

        // Get last message
        const lastMessage = await db.collection('messages')
          .findOne(
            {
              isPrivate: true,
              $or: [
                { senderId: userId, receiverId: otherUserId },
                { senderId: otherUserId, receiverId: userId }
              ]
            },
            { sort: { timestamp: -1 } }
          );

        return {
          chatId: chat._id.toString(),
          otherUser: {
            userId: otherUser._id.toString(),
            username: otherUser.username,
            displayName: otherUser.displayName || otherUser.nickName || otherUser.username,
            nickName: otherUser.nickName || otherUser.username,
            status: otherUser.status || 'offline',
            age: otherUser.age,
            gender: otherUser.gender,
            lastSeen: otherUser.lastSeen,
            profilePicture: profilePictureUrl
          },
          unreadCount,
          lastMessage: lastMessage ? lastMessage.content : null,
          lastMessageAt: chat.lastMessageAt,
          chattedToday: isInOpenChats // Indicate if user is in openChats array
        };
      })
    );

    // Filter out null values
    const validChats = chatsWithDetails.filter(chat => chat !== null);

    res.json({ privateChats: validChats });
  } catch (error) {
    console.error('Error getting private chats:', error);
    res.status(500).json({ error: 'Failed to get private chats' });
  }
});

// Close a private chat (sets state to false in openChats array)
router.post('/close-private-chat', authenticateToken, async (req, res) => {
  try {
    const db = getDatabase();
    const userId = new ObjectId(req.user.userId);
    const { otherUserId } = req.body;

    if (!otherUserId) {
      return res.status(400).json({ error: 'Other user ID is required' });
    }

    // Get site settings to check if we should delete immediately
    let deleteImmediately = false;
    let retentionDays = 1;
    try {
      const siteSettings = await getSiteSettings();
      deleteImmediately = siteSettings.messageRetentionDays === 0;
      retentionDays = siteSettings.messageRetentionDays || 1;
    } catch (error) {
      console.error('⚠️ Error getting site settings, will not delete immediately:', error);
    }

    const otherUserObjectId = new ObjectId(otherUserId);

    // If set to delete immediately (0 days), delete all messages now
    if (deleteImmediately) {
      const deletedResult = await db.collection('messages').deleteMany({
        isPrivate: true,
        $or: [
          { senderId: userId, receiverId: otherUserObjectId },
          { receiverId: userId, senderId: otherUserObjectId }
        ]
      });
      
      if (deletedResult.deletedCount > 0) {
        console.log(`🗑️ Immediately deleted ${deletedResult.deletedCount} messages from closed chat for user ${userId}`);
      }
    }

    // Get current user's openChats array
    const currentUser = await db.collection('users').findOne(
      { _id: userId },
      { projection: { openChats: 1 } }
    );

    // Ensure openChats is an array
    let openChats = Array.isArray(currentUser?.openChats) ? currentUser.openChats : [];

    // Find existing entry for this user
    const existingIndex = openChats.findIndex(oc => oc && oc.userId === otherUserId);

    // Always set state to false when closing chat
    // The scheduled cleanup will remove it later
    if (existingIndex >= 0) {
      openChats[existingIndex].state = false;
    } else {
      openChats.push({ userId: otherUserId, state: false });
    }

    // Update user's openChats array
    await db.collection('users').updateOne(
      { _id: userId },
      { 
        $set: { 
          openChats: openChats,
          openChatsUpdatedAt: new Date()
        } 
      }
    );

    res.json({ success: true });
  } catch (error) {
    console.error('Error closing private chat:', error);
    res.status(500).json({ error: 'Failed to close private chat' });
  }
});

// Open/show a private chat (sets state to true in openChats array)
router.post('/open-private-chat', authenticateToken, async (req, res) => {
  try {
    const db = getDatabase();
    const userId = new ObjectId(req.user.userId);
    const { otherUserId } = req.body;

    if (!otherUserId) {
      return res.status(400).json({ error: 'Other user ID is required' });
    }

    // Get current user's openChats array
    const currentUser = await db.collection('users').findOne(
      { _id: userId },
      { projection: { openChats: 1 } }
    );

    // Ensure openChats is an array
    let openChats = Array.isArray(currentUser?.openChats) ? currentUser.openChats : [];

    // Find existing entry for this user
    const existingIndex = openChats.findIndex(oc => oc && oc.userId === otherUserId);

    if (existingIndex >= 0) {
      // Update existing entry to state: true
      openChats[existingIndex].state = true;
    } else {
      // Add new entry with state: true
      openChats.push({ userId: otherUserId, state: true });
    }

    // Update user's openChats array
    await db.collection('users').updateOne(
      { _id: userId },
      { $set: { openChats: openChats } }
    );

    res.json({ success: true });
  } catch (error) {
    console.error('Error opening private chat:', error);
    res.status(500).json({ error: 'Failed to open private chat' });
  }
});

export default router;
