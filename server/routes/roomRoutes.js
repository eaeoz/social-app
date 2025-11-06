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
            bio: 1 
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
      bio: user.bio || ''
    }));

    res.json({ users: usersResponse });
  } catch (error) {
    console.error('Error getting users:', error);
    res.status(500).json({ error: 'Failed to get users' });
  }
});

export default router;
