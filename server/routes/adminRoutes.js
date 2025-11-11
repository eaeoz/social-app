import express from 'express';
import { ObjectId } from 'mongodb';
import { getDatabase } from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';
import { transferUserReportsToCollection, getUserReportsFromCollection } from '../utils/transferUserReportsToCollection.js';
import crypto from 'crypto';

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
    
    // Get pending reports from reports collection
    const pendingReportsFromCollection = await db.collection('reports').countDocuments({ status: 'pending' });
    
    // Get pending reports from users' reports arrays
    const usersWithReports = await db.collection('users')
      .find({ reports: { $exists: true, $ne: [] } })
      .project({ reports: 1 })
      .toArray();
    
    const pendingReportsFromUsers = usersWithReports.reduce((count, user) => {
      return count + (user.reports?.length || 0);
    }, 0);
    
    // Total pending reports
    const pendingReports = pendingReportsFromCollection + pendingReportsFromUsers;
    
    // Get users registered today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const newUsersToday = await db.collection('users').countDocuments({
      createdAt: { $gte: today }
    });
    
    console.log(`📊 Statistics: ${pendingReportsFromCollection} reports in collection, ${pendingReportsFromUsers} in user arrays, ${pendingReports} total`);
    
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
    
    // Add report count for each user
    const usersWithReportCount = await Promise.all(users.map(async (user) => {
      // Count reports from reports collection
      const reportsCollectionCount = await db.collection('reports').countDocuments({
        reportedUserId: user._id,
        status: 'pending' // Only count pending reports
      });
      
      // Count reports from user's reports array (if exists)
      const userReportsCount = user.reports?.length || 0;
      
      // Use whichever is greater (or combine them if needed)
      const reportCount = Math.max(reportsCollectionCount, userReportsCount);
      
      return { ...user, reportCount };
    }));
    
    // Get total count
    const total = await db.collection('users').countDocuments(searchQuery);
    
    res.json({
      users: usersWithReportCount,
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
    
    // Fetch reports from reports collection
    const query = status ? { status } : {};
    const reportsFromCollection = await db.collection('reports')
      .find(query)
      .sort({ createdAt: -1 })
      .toArray();
    
    // Fetch reports from users' reports arrays
    const usersWithReports = await db.collection('users')
      .find({ 
        reports: { $exists: true, $ne: [] }
      })
      .project({ _id: 1, username: 1, email: 1, reports: 1, userSuspended: 1 })
      .toArray();
    
    // Transform user reports into the same format as collection reports
    const reportsFromUsers = [];
    for (const user of usersWithReports) {
      if (user.reports && user.reports.length > 0) {
        for (const report of user.reports) {
          // Find the reporter details
          const reporterId = report.reporterId || report.userId;
          const reporter = reporterId ? await db.collection('users').findOne(
            { _id: new ObjectId(reporterId) },
            { projection: { username: 1, email: 1 } }
          ) : null;
          
          reportsFromUsers.push({
            _id: report._id || new ObjectId(),
            reportedUserId: user._id,
            reporterId: reporterId || null,
            reason: report.reason || 'Unknown',
            description: report.description || '',
            status: 'pending', // Reports in user arrays are always pending
            createdAt: report.timestamp || report.createdAt || new Date(),
            reporter: reporter,
            reportedUser: {
              _id: user._id,
              username: user.username,
              email: user.email,
              userSuspended: user.userSuspended
            },
            source: 'user_array' // Mark source for debugging
          });
        }
      }
    }
    
    // Populate details for collection reports
    const reportsWithDetails = await Promise.all(reportsFromCollection.map(async (report) => {
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
        reportedUser,
        source: 'collection' // Mark source for debugging
      };
    }));
    
    // Combine both sources and sort by date
    const allReports = [...reportsWithDetails, ...reportsFromUsers]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    // Filter by status if needed (for user reports which are always pending)
    const filteredReports = status ? allReports.filter(r => r.status === status) : allReports;
    
    console.log(`📊 Reports fetched: ${reportsFromCollection.length} from collection, ${reportsFromUsers.length} from user arrays, ${filteredReports.length} total after filter`);
    
    res.json({ reports: filteredReports });
  } catch (error) {
    console.error('Get reports error:', error);
    res.status(500).json({ error: 'Failed to fetch reports' });
  }
});

// Get all archived reports with search functionality
router.get('/archived-reports', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { search } = req.query;
    const db = getDatabase();
    
    // Build search query
    const searchQuery = search ? {
      $or: [
        { reportedUserEmail: { $regex: search, $options: 'i' } },
        { reportedUsername: { $regex: search, $options: 'i' } }
      ]
    } : {};
    
    // Get all archived report batches
    const reportBatches = await db.collection('userreports')
      .find(searchQuery)
      .sort({ transferredAt: -1 })
      .toArray();
    
    // Transform data for frontend
    const archivedReports = reportBatches.map(batch => ({
      reportedUserId: batch.reportedUserId,
      reportedUserEmail: batch.reportedUserEmail,
      reportedUsername: batch.reportedUsername,
      totalReports: batch.reports.length,
      firstReportDate: batch.reports[0]?.timestamp,
      lastReportDate: batch.reports[batch.reports.length - 1]?.timestamp,
      transferredAt: batch.transferredAt,
      batchNumber: batch.batchNumber,
      totalBatches: batch.totalBatches,
      reports: batch.reports
    }));
    
    res.json({ archivedReports });
  } catch (error) {
    console.error('Get archived reports error:', error);
    res.status(500).json({ error: 'Failed to fetch archived reports' });
  }
});

// Get archived reports for a specific user by email
router.get('/users/archived-reports/:email', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { email } = req.params;
    
    const result = await getUserReportsFromCollection(email);
    
    if (!result.success) {
      return res.status(500).json({ error: result.error || 'Failed to fetch archived reports' });
    }
    
    res.json({
      email,
      reports: result.reports || [],
      total: result.total || 0,
      batches: result.batches || 0
    });
  } catch (error) {
    console.error('Get archived reports error:', error);
    res.status(500).json({ error: 'Failed to fetch archived reports' });
  }
});

// Update report status and remove from user's reports array
router.put('/reports/:reportId', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { reportId } = req.params;
    const { status, adminNotes, resolutionDescription, reportedUserId, reporterId } = req.body;
    
    // Use resolutionDescription if provided, otherwise fall back to adminNotes
    const description = resolutionDescription || adminNotes;
    
    console.log('🔧 Report resolution request:', {
      reportId,
      status,
      reportedUserId,
      reporterId,
      hasDescription: !!description,
      descriptionLength: description?.length || 0
    });
    
    if (!['pending', 'resolved', 'dismissed'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    
    const db = getDatabase();
    
    // First, try to update report in the reports collection
    const updateData = {
      status,
      resolvedAt: status === 'resolved' ? new Date() : null,
      resolvedBy: status === 'resolved' ? req.user.userId : null
    };
    
    // Add resolution description if provided
    if (description) {
      updateData.resolutionDescription = description;
      console.log(`💾 Saving resolution description: "${description}"`);
    }
    
    const collectionUpdate = await db.collection('reports').updateOne(
      { _id: new ObjectId(reportId) },
      { $set: updateData }
    );
    
    // If report exists in collection, we're done
    if (collectionUpdate.matchedCount > 0) {
      console.log(`✅ Report ${reportId} updated in reports collection (this report was already in collection, not in user array)`);
      return res.json({ 
        message: 'Report updated successfully',
        source: 'collection'
      });
    }
    
    console.log(`🔍 Report ${reportId} not found in collection, checking user's reports array...`);
    
    // If not found in collection, it's in a user's reports array
    // Find and remove the specific report from the user's reports array
    if (reportedUserId && reporterId) {
      console.log(`🔍 Looking for user with ID: ${reportedUserId}`);
      const reportedUser = await db.collection('users').findOne({ 
        _id: new ObjectId(reportedUserId) 
      });
      
      if (!reportedUser) {
        console.log(`❌ User ${reportedUserId} not found`);
        return res.status(404).json({ error: 'Reported user not found' });
      }
      
      console.log(`✅ Found user: ${reportedUser.username}, reports count: ${reportedUser.reports?.length || 0}`);
      
      if (reportedUser && reportedUser.reports && reportedUser.reports.length > 0) {
        // Find the report by reporterId and remove it
        const updatedReports = reportedUser.reports.filter(report => {
          const currentReporterId = report.reporterId || report.userId;
          return currentReporterId !== reporterId;
        });
        
        console.log(`📝 Removing report from user array: Original count = ${reportedUser.reports.length}, New count = ${updatedReports.length}`);
        
        // Update the user with the filtered reports array
        const userUpdate = await db.collection('users').updateOne(
          { _id: new ObjectId(reportedUserId) },
          { 
            $set: { 
              reports: updatedReports,
              updatedAt: new Date()
            }
          }
        );
        
        if (userUpdate.modifiedCount > 0) {
          console.log(`✅ Successfully removed report from user ${reportedUser.username}'s reports array`);
          
          // Archive the resolved report to reports collection
          const reporter = await db.collection('users').findOne(
            { _id: new ObjectId(reporterId) },
            { projection: { username: 1, email: 1 } }
          );
          
          // Find the original report data
          const originalReport = reportedUser.reports.find(report => {
            const currentReporterId = report.reporterId || report.userId;
            return currentReporterId === reporterId;
          });
          
          if (originalReport) {
            const archivedReport = {
              _id: new ObjectId(reportId),
              reportedUserId: new ObjectId(reportedUserId),
              reporterId: new ObjectId(reporterId),
              reason: originalReport.reason || 'Unknown',
              description: originalReport.description || '',
              status: 'resolved',
              createdAt: originalReport.timestamp || originalReport.createdAt || new Date(),
              resolvedAt: new Date(),
              resolvedBy: req.user.userId,
              reporterEmail: originalReport.reporterEmail || reporter?.email,
              source: 'user_array_resolved'
            };
            
            // Add resolution description if provided
            if (description) {
              archivedReport.resolutionDescription = description;
              console.log(`💾 Archiving with resolution description: "${description}"`);
            }
            
            await db.collection('reports').insertOne(archivedReport);
            console.log(`✅ Archived resolved report to reports collection`);
          }
          
          return res.json({ 
            message: 'Report resolved and removed from user successfully',
            source: 'user_array',
            remainingReports: updatedReports.length
          });
        }
      }
    }
    
    // If we get here, report wasn't found anywhere
    return res.status(404).json({ 
      error: 'Report not found in reports collection or user reports array' 
    });
    
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
    
    // Get user details before updating
    const user = await db.collection('users').findOne({ _id: new ObjectId(userId) });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // If unsuspending and user has reports, transfer them to collection
    let reportsCleared = false;
    if (!suspend && user.reports && user.reports.length > 0) {
      console.log(`Transferring ${user.reports.length} reports to collection for user: ${user.email}`);
      const transferResult = await transferUserReportsToCollection(
        userId, 
        user.email, 
        user.username, 
        user.reports
      );
      
      if (transferResult.success) {
        console.log(`Successfully transferred ${transferResult.transferred} reports in ${transferResult.batches} batch(es)`);
        reportsCleared = true;
      } else {
        console.error('Failed to transfer reports:', transferResult.error);
        // Continue with unsuspension even if transfer fails
      }
    }
    
    // Update user suspension status and clear reports if transferred
    const updateData = {
      userSuspended: suspend,
      suspendedAt: suspend ? new Date() : null,
      suspendedBy: suspend ? req.user.userId : null,
      unsuspendedAt: !suspend ? new Date() : null,
      unsuspendedBy: !suspend ? req.user.userId : null
    };
    
    // Clear reports array if they were successfully archived
    if (reportsCleared) {
      updateData.reports = [];
      console.log('✅ Clearing reports array - users can now report this user again');
    }
    
    console.log('Updating user with data:', JSON.stringify(updateData, null, 2));
    
    const updateResult = await db.collection('users').updateOne(
      { _id: new ObjectId(userId) },
      { $set: updateData }
    );
    
    console.log(`Update result: matched ${updateResult.matchedCount}, modified ${updateResult.modifiedCount}`);
    
    // Verify the update
    const updatedUser = await db.collection('users').findOne(
      { _id: new ObjectId(userId) },
      { projection: { reports: 1, userSuspended: 1 } }
    );
    
    console.log(`Verified user state: reports count = ${updatedUser?.reports?.length || 0}, suspended = ${updatedUser?.userSuspended}`);
    
    // If suspending user, force logout via socket event
    if (suspend) {
      const io = req.app.get('io');
      if (io) {
        io.emit('user_suspended', { 
          userId: userId,
          message: 'Your account has been suspended by an administrator'
        });
        console.log(`📡 Sent user_suspended event for user: ${userId}`);
      }
    }
    
    res.json({ 
      message: suspend ? 'User suspended' : 'User unsuspended',
      reportsTransferred: !suspend && user.reports ? user.reports.length : 0,
      reportsCleared: reportsCleared,
      currentReportCount: updatedUser?.reports?.length || 0
    });
  } catch (error) {
    console.error('Suspend user error:', error);
    res.status(500).json({ error: 'Failed to update user status' });
  }
});

// Generate password recovery link for user
router.post('/users/:userId/password-recovery', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    
    const db = getDatabase();
    
    // Get user details
    const user = await db.collection('users').findOne({ _id: new ObjectId(userId) });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Generate password recovery token (valid for 1 hour)
    const passwordRecoveryToken = crypto.randomBytes(32).toString('hex');
    const passwordRecoveryExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    
    // Update user with recovery token
    await db.collection('users').updateOne(
      { _id: new ObjectId(userId) },
      { 
        $set: { 
          passwordRecoveryToken,
          passwordRecoveryExpires,
          updatedAt: new Date()
        }
      }
    );
    
    // Generate recovery URL
    const frontendUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    const recoveryUrl = `${frontendUrl}/reset-password?token=${passwordRecoveryToken}`;
    
    console.log(`✅ Password recovery token generated for user: ${user.email}`);
    
    res.json({ 
      message: 'Password recovery token generated successfully',
      recoveryUrl,
      expiresIn: '1 hour'
    });
  } catch (error) {
    console.error('Generate password recovery link error:', error);
    res.status(500).json({ error: 'Failed to generate recovery link' });
  }
});

// Delete user
router.delete('/users/:userId', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const db = getDatabase();
    
    // Get user details before deletion
    const user = await db.collection('users').findOne({ _id: new ObjectId(userId) });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    console.log(`🗑️ Admin ${req.user.userId} is deleting user: ${user.email} (${userId})`);
    
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
    
    // Delete user's room activity
    await db.collection('userroomactivity').deleteMany({ userId: new ObjectId(userId) });
    
    // Delete user
    await db.collection('users').deleteOne({ _id: new ObjectId(userId) });
    
    // Force logout the user by emitting socket event
    // The socket server will be accessed via req.app.get('io')
    const io = req.app.get('io');
    if (io) {
      // Emit to all sockets to check if they match this user
      io.emit('user_deleted', { 
        userId: userId,
        message: 'Your account has been deleted by an administrator'
      });
      console.log(`📡 Sent user_deleted event for user: ${userId}`);
    }
    
    console.log(`✅ User ${user.email} (${userId}) deleted successfully`);
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
    
    console.log('📝 Updating site settings:', settings);
    
    const result = await db.collection('siteSettings').updateOne(
      { settingType: 'global' },
      { $set: { ...settings, updatedAt: new Date() } },
      { upsert: true }
    );
    
    console.log(`✅ Settings update result: matched=${result.matchedCount}, modified=${result.modifiedCount}, upserted=${result.upsertedCount}`);
    
    res.json({ message: 'Settings updated successfully' });
  } catch (error) {
    console.error('❌ Update settings error:', error);
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
    const { name, description, icon, isPrivate } = req.body;
    
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
      icon: icon || '💬',
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
    const { name, description, icon, isPrivate } = req.body;
    
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
      icon: icon || '💬',
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

// Cleanup Operations

// Delete all public messages for a specific user
router.delete('/cleanup/public-messages/:userId', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const db = getDatabase();
    
    // Verify user exists
    const user = await db.collection('users').findOne({ _id: new ObjectId(userId) });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Delete all public messages from this user
    const result = await db.collection('messages').deleteMany({
      senderId: new ObjectId(userId),
      isPrivate: false
    });
    
    console.log(`🧹 Deleted ${result.deletedCount} public messages for user: ${user.username}`);
    
    res.json({ 
      message: 'Public messages deleted successfully',
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error('Delete public messages error:', error);
    res.status(500).json({ error: 'Failed to delete public messages' });
  }
});

// Delete all private messages for a specific user
router.delete('/cleanup/private-messages/:userId', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const db = getDatabase();
    
    // Verify user exists
    const user = await db.collection('users').findOne({ _id: new ObjectId(userId) });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Delete all private messages sent by or received by this user
    const result = await db.collection('messages').deleteMany({
      $or: [
        { senderId: new ObjectId(userId), isPrivate: true },
        { receiverId: new ObjectId(userId), isPrivate: true }
      ]
    });
    
    console.log(`🧹 Deleted ${result.deletedCount} private messages for user: ${user.username}`);
    
    res.json({ 
      message: 'Private messages deleted successfully',
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error('Delete private messages error:', error);
    res.status(500).json({ error: 'Failed to delete private messages' });
  }
});

// Delete ALL messages from ALL users (danger zone)
router.delete('/cleanup/all-messages', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const db = getDatabase();
    
    // Delete all messages
    const messageResult = await db.collection('messages').deleteMany({});
    
    console.log(`🧹 DANGER ZONE: Deleted ALL ${messageResult.deletedCount} messages from the system`);
    
    // Reset private chat references (lastMessageId, lastMessageAt)
    const chatUpdateResult = await db.collection('privatechats').updateMany(
      {},
      {
        $unset: { 
          lastMessageId: "",
          lastMessageAt: ""
        },
        $set: {
          updatedAt: new Date()
        }
      }
    );
    
    console.log(`🔄 Updated ${chatUpdateResult.modifiedCount} private chats (reset message references)`);
    
    res.json({ 
      message: 'All messages deleted successfully',
      deletedCount: messageResult.deletedCount,
      chatsUpdated: chatUpdateResult.modifiedCount
    });
  } catch (error) {
    console.error('Delete all messages error:', error);
    res.status(500).json({ error: 'Failed to delete all messages' });
  }
});

export default router;
