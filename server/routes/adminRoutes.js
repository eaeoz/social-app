import express from 'express';
import { ObjectId } from 'mongodb';
import { getDatabase } from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Middleware to check if user is admin
const requireAdmin = async (req, res, next) => {
  try {
    const db = getDatabase();
    const user = await db.collection('users').findOne({ _id: new ObjectId(req.user.userId) });
    
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin privileges required' });
    }
    
    next();
  } catch (error) {
    console.error('Admin check error:', error);
    res.status(500).json({ error: 'Failed to verify admin privileges' });
  }
};

// Get statistics
router.get('/statistics', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const db = getDatabase();
    
    // Get total users
    const totalUsers = await db.collection('users').countDocuments({});
    
    // Get online users
    const onlineUsers = await db.collection('users').countDocuments({ status: 'online' });
    
    // Get total messages (approximate)
    const totalMessages = await db.collection('messages').countDocuments({});
    
    // Get pending reports
    const pendingReports = await db.collection('reports').countDocuments({ status: 'pending' });
    
    // Get users registered today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const newUsersToday = await db.collection('users').countDocuments({
      createdAt: { $gte: today }
    });
    
    res.json({
      totalUsers,
      onlineUsers,
      totalMessages,
      pendingReports,
      newUsersToday
    });
  } catch (error) {
    console.error('Get statistics error:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

// Get all users with pagination
router.get('/users', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const db = getDatabase();
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const search = req.query.search || '';
    const skip = (page - 1) * limit;
    
    // Build search query
    const searchQuery = search ? {
      $or: [
        { username: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { displayName: { $regex: search, $options: 'i' } }
      ]
    } : {};
    
    // Get users
    const users = await db.collection('users')
      .find(searchQuery)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .project({ passwordHash: 0 })
      .toArray();
    
    // Get total count
    const total = await db.collection('users').countDocuments(searchQuery);
    
    res.json({
      users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Get all reports
router.get('/reports', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const db = getDatabase();
    const status = req.query.status; // 'pending', 'resolved', or undefined for all
    
    const query = status ? { status } : {};
    
    const reports = await db.collection('reports')
      .find(query)
      .sort({ createdAt: -1 })
      .toArray();
    
    // Populate reporter and reported user details
    const reportsWithDetails = await Promise.all(reports.map(async (report) => {
      const reporter = await db.collection('users').findOne(
        { _id: report.reporterId },
        { projection: { username: 1, email: 1 } }
      );
      
      const reportedUser = await db.collection('users').findOne(
        { _id: report.reportedUserId },
        { projection: { username: 1, email: 1, userSuspended: 1 } }
      );
      
      return {
        ...report,
        reporter,
        reportedUser
      };
    }));
    
    res.json({ reports: reportsWithDetails });
  } catch (error) {
    console.error('Get reports error:', error);
    res.status(500).json({ error: 'Failed to fetch reports' });
  }
});

// Update report status
router.put('/reports/:reportId', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { reportId } = req.params;
    const { status, adminNotes } = req.body;
    
    if (!['pending', 'resolved', 'dismissed'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    
    const db = getDatabase();
    
    const updateData = {
      status,
      resolvedAt: status === 'resolved' ? new Date() : null,
      resolvedBy: status === 'resolved' ? req.user.userId : null
    };
    
    if (adminNotes) {
      updateData.adminNotes = adminNotes;
    }
    
    await db.collection('reports').updateOne(
      { _id: new ObjectId(reportId) },
      { $set: updateData }
    );
    
    res.json({ message: 'Report updated successfully' });
  } catch (error) {
    console.error('Update report error:', error);
    res.status(500).json({ error: 'Failed to update report' });
  }
});

// Suspend/unsuspend user
router.put('/users/:userId/suspend', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const { suspend } = req.body; // true to suspend, false to unsuspend
    
    const db = getDatabase();
    
    await db.collection('users').updateOne(
      { _id: new ObjectId(userId) },
      {
        $set: {
          userSuspended: suspend,
          suspendedAt: suspend ? new Date() : null,
          suspendedBy: suspend ? req.user.userId : null
        }
      }
    );
    
    res.json({ message: suspend ? 'User suspended' : 'User unsuspended' });
  } catch (error) {
    console.error('Suspend user error:', error);
    res.status(500).json({ error: 'Failed to update user status' });
  }
});

// Delete user
router.delete('/users/:userId', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const db = getDatabase();
    
    // Delete user's messages
    await db.collection('messages').deleteMany({
      $or: [{ senderId: new ObjectId(userId) }, { receiverId: new ObjectId(userId) }]
    });
    
    // Delete user's reports
    await db.collection('reports').deleteMany({
      $or: [{ reporterId: new ObjectId(userId) }, { reportedUserId: new ObjectId(userId) }]
    });
    
    // Delete user's settings
    await db.collection('settings').deleteOne({ userId: new ObjectId(userId) });
    
    // Delete user's presence
    await db.collection('userpresence').deleteOne({ userId: new ObjectId(userId) });
    
    // Delete user
    await db.collection('users').deleteOne({ _id: new ObjectId(userId) });
    
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// Get site settings
router.get('/settings', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const db = getDatabase();
    const settings = await db.collection('siteSettings').findOne({ settingType: 'global' });
    
    res.json({ settings: settings || {} });
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

// Update site settings
router.put('/settings', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const db = getDatabase();
    const settings = req.body;
    
    await db.collection('siteSettings').updateOne(
      { settingType: 'global' },
      { $set: { ...settings, updatedAt: new Date() } },
      { upsert: true }
    );
    
    res.json({ message: 'Settings updated successfully' });
  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

// Rooms Management

// Get all rooms
router.get('/rooms', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const db = getDatabase();
    const rooms = await db.collection('publicrooms')
      .find({})
      .sort({ createdAt: 1 })
      .toArray();
    
    // Get message count for each room
    const roomsWithDetails = await Promise.all(rooms.map(async (room) => {
      const messageCount = await db.collection('messages').countDocuments({ 
        roomId: room._id,
        isPrivate: false
      });
      
      const participantCount = room.participants?.length || 0;
      
      return { 
        ...room, 
        userCount: participantCount,
        messageCount 
      };
    }));
    
    res.json({ rooms: roomsWithDetails });
  } catch (error) {
    console.error('Get rooms error:', error);
    res.status(500).json({ error: 'Failed to fetch rooms' });
  }
});

// Create new room
router.post('/rooms', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { name, description, isPrivate } = req.body;
    
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Room name is required' });
    }
    
    const db = getDatabase();
    
    // Check if room name already exists
    const existingRoom = await db.collection('publicrooms').findOne({ name: name.trim() });
    if (existingRoom) {
      return res.status(400).json({ error: 'Room name already exists' });
    }
    
    const newRoom = {
      name: name.trim(),
      description: description?.trim() || '',
      isPrivate: Boolean(isPrivate),
      isActive: true,
      participants: [],
      maxParticipants: 100,
      createdAt: new Date(),
      createdBy: req.user.userId
    };
    
    const result = await db.collection('publicrooms').insertOne(newRoom);
    
    res.json({ 
      message: 'Room created successfully',
      room: { _id: result.insertedId, ...newRoom }
    });
  } catch (error) {
    console.error('Create room error:', error);
    res.status(500).json({ error: 'Failed to create room' });
  }
});

// Update room
router.put('/rooms/:roomId', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { roomId } = req.params;
    const { name, description, isPrivate } = req.body;
    
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Room name is required' });
    }
    
    const db = getDatabase();
    
    // Check if room exists
    const room = await db.collection('publicrooms').findOne({ _id: new ObjectId(roomId) });
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }
    
    // Check if new name conflicts with another room
    if (name.trim() !== room.name) {
      const existingRoom = await db.collection('publicrooms').findOne({ 
        name: name.trim(),
        _id: { $ne: new ObjectId(roomId) }
      });
      if (existingRoom) {
        return res.status(400).json({ error: 'Room name already exists' });
      }
    }
    
    const updateData = {
      name: name.trim(),
      description: description?.trim() || '',
      isPrivate: Boolean(isPrivate),
      updatedAt: new Date(),
      updatedBy: req.user.userId
    };
    
    await db.collection('publicrooms').updateOne(
      { _id: new ObjectId(roomId) },
      { $set: updateData }
    );
    
    res.json({ message: 'Room updated successfully' });
  } catch (error) {
    console.error('Update room error:', error);
    res.status(500).json({ error: 'Failed to update room' });
  }
});

// Delete room
router.delete('/rooms/:roomId', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { roomId } = req.params;
    const db = getDatabase();
    
    // Check if room exists
    const room = await db.collection('publicrooms').findOne({ _id: new ObjectId(roomId) });
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }
    
    // Delete user room activity records for this room
    await db.collection('userroomactivity').deleteMany({ roomId: new ObjectId(roomId) });
    
    // Delete room messages
    await db.collection('messages').deleteMany({ 
      roomId: new ObjectId(roomId),
      isPrivate: false
    });
    
    // Delete room
    await db.collection('publicrooms').deleteOne({ _id: new ObjectId(roomId) });
    
    res.json({ message: 'Room deleted successfully' });
  } catch (error) {
    console.error('Delete room error:', error);
    res.status(500).json({ error: 'Failed to delete room' });
  }
});

export default router;
