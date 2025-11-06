import express from 'express';
import { getDatabase } from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';
import { ObjectId } from 'mongodb';

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

// Get all users (for private chat selection)
router.get('/users', authenticateToken, async (req, res) => {
  try {
    const db = getDatabase();
    const currentUserId = req.user.userId;

    const users = await db.collection('users')
      .find(
        { 
          _id: { $ne: currentUserId },
          username: { $ne: 'system' }
        },
        { 
          projection: { 
            username: 1, 
            displayName: 1, 
            status: 1,
            bio: 1,
            age: 1,
            gender: 1
          } 
        }
      )
      .sort({ displayName: 1 })
      .toArray();

    const usersResponse = users.map(user => ({
      userId: user._id.toString(),
      username: user.username,
      displayName: user.displayName,
      status: user.status || 'offline',
      bio: user.bio || '',
      age: user.age,
      gender: user.gender
    }));

    res.json({ users: usersResponse });
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

        // Get other user's info
        const otherUser = await db.collection('users').findOne(
          { _id: otherUserId },
          { projection: { username: 1, displayName: 1, status: 1 } }
        );

        if (!otherUser) return null;

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
            displayName: otherUser.displayName,
            status: otherUser.status || 'offline'
          },
          unreadCount,
          lastMessage: lastMessage ? lastMessage.content : null,
          lastMessageAt: chat.lastMessageAt
        };
      })
    );

    // Filter out null values (in case some users were deleted)
    const validChats = chatsWithDetails.filter(chat => chat !== null);

    res.json({ privateChats: validChats });
  } catch (error) {
    console.error('Error getting private chats:', error);
    res.status(500).json({ error: 'Failed to get private chats' });
  }
});

export default router;
