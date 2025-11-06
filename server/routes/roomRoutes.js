import express from 'express';
import { getDatabase } from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';
import { ObjectId } from 'mongodb';

const router = express.Router();

// Get all public rooms
router.get('/public', authenticateToken, async (req, res) => {
  try {
    const db = getDatabase();
    const rooms = await db.collection('publicrooms')
      .find({ isActive: true, isPrivate: false })
      .sort({ createdAt: 1 })
      .toArray();

    const roomsResponse = rooms.map(room => ({
      roomId: room._id.toString(),
      name: room.name,
      description: room.description,
      participantCount: room.participants?.length || 0,
      maxParticipants: room.maxParticipants,
      createdAt: room.createdAt
    }));

    res.json({ rooms: roomsResponse });
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
