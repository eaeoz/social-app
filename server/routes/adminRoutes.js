import express from 'express';
import { ObjectId } from 'mongodb';
import { getDatabase } from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';
import { transferUserReportsToCollection, getUserReportsFromCollection } from '../utils/transferUserReportsToCollection.js';
import { manualCleanup } from '../utils/backupAndCleanup.js';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

// Get repeated words analysis
router.get('/repeated-words-analysis', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const db = getDatabase();
    
    console.log('🔍 Starting repeated words analysis...');
    
    // Get all messages
    const messages = await db.collection('messages')
      .find({})
      .project({ senderId: 1, content: 1, isPrivate: 1 })
      .toArray();
    
    console.log(`📊 Found ${messages.length} total messages`);
    
    // Analyze words by user
    const userWordAnalysis = {};
    
    for (const message of messages) {
      const userId = message.senderId.toString();
      
      if (!userWordAnalysis[userId]) {
        userWordAnalysis[userId] = {
          publicWords: {},
          privateWords: {},
          publicMessageCount: 0,
          privateMessageCount: 0
        };
      }
      
      // Extract words (10+ characters) from message
      const words = message.content
        .toLowerCase()
        .match(/\b\w{10,}\b/g) || []; // Words with 10 or more characters
      
      // Count word occurrences
      const messageType = message.isPrivate ? 'privateWords' : 'publicWords';
      const messageCountKey = message.isPrivate ? 'privateMessageCount' : 'publicMessageCount';
      
      userWordAnalysis[userId][messageCountKey]++;
      
      for (const word of words) {
        if (!userWordAnalysis[userId][messageType][word]) {
          userWordAnalysis[userId][messageType][word] = 0;
        }
        userWordAnalysis[userId][messageType][word]++;
      }
    }
    
    // Get top 10 users with most repeated words
    const userStats = [];
    
    for (const [userId, analysis] of Object.entries(userWordAnalysis)) {
      // Find repeated words (count > 1) for both public and private
      const publicRepeatedWords = Object.entries(analysis.publicWords)
        .filter(([_, count]) => count > 1);
      
      const privateRepeatedWords = Object.entries(analysis.privateWords)
        .filter(([_, count]) => count > 1);
      
      const totalRepeatedWords = publicRepeatedWords.length + privateRepeatedWords.length;
      
      if (totalRepeatedWords > 0) {
        userStats.push({
          userId,
          totalRepeatedWords,
          publicRepeatedWords: publicRepeatedWords.length,
          privateRepeatedWords: privateRepeatedWords.length,
          publicMessageCount: analysis.publicMessageCount,
          privateMessageCount: analysis.privateMessageCount,
          topPublicWords: publicRepeatedWords
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([word, count]) => ({ word, count })),
          topPrivateWords: privateRepeatedWords
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([word, count]) => ({ word, count }))
        });
      }
    }
    
    // Sort by total repeated words and get top 10
    const top10Users = userStats
      .sort((a, b) => b.totalRepeatedWords - a.totalRepeatedWords)
      .slice(0, 10);
    
    // Get user details for top 10
    const userIds = top10Users.map(u => new ObjectId(u.userId));
    const users = await db.collection('users')
      .find({ _id: { $in: userIds } })
      .project({ username: 1, email: 1, nickName: 1 })
      .toArray();
    
    // Map user details to stats
    const result = top10Users.map(stat => {
      const user = users.find(u => u._id.toString() === stat.userId);
      return {
        ...stat,
        username: user?.username || 'Unknown',
        email: user?.email || 'Unknown',
        nickName: user?.nickName || user?.username || 'Unknown'
      };
    });
    
    console.log(`✅ Analysis complete: Found ${userStats.length} users with repeated words, returning top 10`);
    
    res.json({
      topUsers: result,
      totalAnalyzedUsers: userStats.length,
      totalMessages: messages.length
    });
  } catch (error) {
    console.error('Repeated words analysis error:', error);
    res.status(500).json({ error: 'Failed to analyze repeated words' });
  }
});

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

// Get MongoDB storage statistics
router.get('/storage-stats', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const db = getDatabase();
    
    // Get database stats
    const stats = await db.stats();
    
    // MongoDB stats explanation:
    // - dataSize: uncompressed size of data in collections
    // - storageSize: compressed/allocated storage for data
    // - indexSize: size of all indexes
    // - fsUsedSize & fsTotalSize: file system level stats (if available)
    
    const dataSize = stats.dataSize || 0;
    const indexSize = stats.indexSize || 0;
    
    // Calculate total used space
    const totalUsed = dataSize + indexSize;
    
    // MongoDB Atlas Free Tier quota: 512 MB
    const MONGODB_FREE_TIER_QUOTA = 512 * 1024 * 1024; // 512 MB in bytes
    
    // Use filesystem stats if available, otherwise use free tier quota
    let totalStorage = MONGODB_FREE_TIER_QUOTA;
    let freeStorageSize = MONGODB_FREE_TIER_QUOTA - totalUsed;
    
    if (stats.fsUsedSize && stats.fsTotalSize) {
      // File system level stats (most accurate if available)
      totalStorage = stats.fsTotalSize;
      freeStorageSize = stats.fsTotalSize - stats.fsUsedSize;
    }
    
    console.log(`💾 Storage Stats: Total=${totalStorage}, Data=${dataSize}, Index=${indexSize}, Used=${totalUsed}, Free=${freeStorageSize}`);
    
    res.json({
      storageSize: totalStorage,
      dataSize,
      indexSize,
      freeStorageSize,
      collections: stats.collections || 0,
      objects: stats.objects || 0
    });
  } catch (error) {
    console.error('Get storage stats error:', error);
    res.status(500).json({ error: 'Failed to fetch storage statistics' });
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
    
    // Get users with explicit field selection to ensure isEmailVerified is included
    const users = await db.collection('users')
      .find(searchQuery)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .project({ 
        passwordHash: 0,
        passwordRecoveryToken: 0,
        emailVerificationToken: 0
      })
      .toArray();
    
    // Ensure isEmailVerified field exists (default to false if not present)
    const usersWithVerification = users.map(user => ({
      ...user,
      isEmailVerified: user.isEmailVerified ?? false
    }));
    
    // Add report count for each user
    const usersWithReportCount = await Promise.all(usersWithVerification.map(async (user) => {
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
    const { suspended } = req.body; // true to suspend, false to unsuspend
    
    const db = getDatabase();
    
    // Get user details before updating
    const user = await db.collection('users').findOne({ _id: new ObjectId(userId) });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // If unsuspending and user has reports, transfer them to collection
    let reportsCleared = false;
    if (!suspended && user.reports && user.reports.length > 0) {
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
      userSuspended: suspended,
      suspendedAt: suspended ? new Date() : null,
      suspendedBy: suspended ? req.user.userId : null,
      unsuspendedAt: !suspended ? new Date() : null,
      unsuspendedBy: !suspended ? req.user.userId : null
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
    if (suspended) {
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
      message: suspended ? 'User suspended' : 'User unsuspended',
      reportsTransferred: !suspended && user.reports ? user.reports.length : 0,
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
    const oldSettings = await db.collection('siteSettings').findOne({ settingType: 'global' });
    
    console.log('📝 Updating site settings:', settings);
    
    const result = await db.collection('siteSettings').updateOne(
      { settingType: 'global' },
      { $set: { ...settings, updatedAt: new Date() } },
      { upsert: true }
    );
    
    console.log(`✅ Settings update result: matched=${result.matchedCount}, modified=${result.modifiedCount}, upserted=${result.upsertedCount}`);
    
    // If cleanCheck schedule was changed, restart the cron job
    if (settings.cleanCheck && settings.cleanCheck !== oldSettings?.cleanCheck) {
      console.log(`🔄 Cleanup schedule changed from '${oldSettings?.cleanCheck}' to '${settings.cleanCheck}', restarting cron job...`);
      
      try {
        // Import cron and necessary functions
        const cron = await import('node-cron');
        
        // Stop the old cron task
        if (global.cleanupCronTask) {
          global.cleanupCronTask.stop();
          console.log('⏹️ Stopped old cleanup cron task');
        }
        
        // Map schedule options to cron patterns
        const scheduleMap = {
          'every_minute': '* * * * *',
          'every_5_minutes': '*/5 * * * *',
          'every_hour': '0 * * * *',
          'every_12_hours': '0 3,15 * * *',
          'every_day': '0 3 * * *',
          'every_week': '0 3 * * 0',
          'every_2_weeks': '0 3 1,15 * *',
          'every_month': '0 3 1 * *'
        };
        
        const scheduleDescriptions = {
          'every_minute': 'Every minute',
          'every_5_minutes': 'Every 5 minutes',
          'every_hour': 'Every hour',
          'every_12_hours': 'Twice daily at 3:00 AM and 3:00 PM',
          'every_day': 'Daily at 3:00 AM',
          'every_week': 'Weekly on Sunday at 3:00 AM',
          'every_2_weeks': 'Twice monthly on 1st and 15th at 3:00 AM',
          'every_month': 'Monthly on 1st at 3:00 AM'
        };
        
        const cronPattern = scheduleMap[settings.cleanCheck] || scheduleMap['every_12_hours'];
        const scheduleDescription = scheduleDescriptions[settings.cleanCheck] || scheduleDescriptions['every_12_hours'];
        
        // Create new cron task
        const newCleanupTask = cron.schedule(cronPattern, async () => {
          console.log('🤖 Running scheduled automatic backup & cleanup...');
          try {
            const { checkAndRunAutoCleanup } = await import('../utils/backupAndCleanup.js');
            const result = await checkAndRunAutoCleanup();
            
            if (result.cleanupPerformed) {
              console.log('✅ Scheduled cleanup completed successfully!');
              console.log(`📦 Backed up: ${result.messagesBackup?.count || 0} messages, ${result.privatechatsBackup?.count || 0} private chats`);
              console.log(`🗑️ Deleted: ${result.deleted?.total || 0} total items`);
              console.log(`💾 Storage after cleanup: ${result.storageAfter?.toFixed(2) || 'N/A'} MB`);
            } else {
              console.log('ℹ️ Cleanup not needed - storage below threshold or no old data found');
            }
          } catch (error) {
            console.error('❌ Scheduled cleanup failed:', error);
          }
        }, {
          timezone: "Europe/Istanbul"
        });
        
        // Store the new task globally
        global.cleanupCronTask = newCleanupTask;
        
        console.log(`✅ New cleanup schedule activated: ${scheduleDescription} (Europe/Istanbul)`);
        console.log(`📋 New schedule pattern: ${cronPattern}`);
        
      } catch (error) {
        console.error('❌ Failed to restart cleanup cron job:', error);
        // Don't fail the settings update if cron restart fails
      }
    }
    
    // If articleCheck schedule was changed, restart the article sync cron job
    if (settings.articleCheck && settings.articleCheck !== oldSettings?.articleCheck) {
      console.log(`🔄 Article sync schedule changed from '${oldSettings?.articleCheck}' to '${settings.articleCheck}', restarting cron job...`);
      
      try {
        const cron = await import('node-cron');
        const { syncBlogData } = await import('../utils/syncBlogData.js');
        
        // Stop the old cron task
        if (global.blogSyncCronTask) {
          global.blogSyncCronTask.stop();
          console.log('⏹️ Stopped old article sync cron task');
        }
        
        // Map schedule options to cron patterns (reuse from above)
        const scheduleMap = {
          'every_minute': '* * * * *',
          'every_5_minutes': '*/5 * * * *',
          'every_hour': '0 * * * *',
          'every_12_hours': '0 3,15 * * *',
          'every_day': '0 3 * * *',
          'every_week': '0 3 * * 0',
          'every_2_weeks': '0 3 1,15 * *',
          'every_month': '0 3 1 * *'
        };
        
        const scheduleDescriptions = {
          'every_minute': 'Every minute',
          'every_5_minutes': 'Every 5 minutes',
          'every_hour': 'Every hour',
          'every_12_hours': 'Twice daily at 3:00 AM and 3:00 PM',
          'every_day': 'Daily at 3:00 AM',
          'every_week': 'Weekly on Sunday at 3:00 AM',
          'every_2_weeks': 'Twice monthly on 1st and 15th at 3:00 AM',
          'every_month': 'Monthly on 1st at 3:00 AM'
        };
        
        const articleCronPattern = scheduleMap[settings.articleCheck] || scheduleMap['every_minute'];
        const articleScheduleDescription = scheduleDescriptions[settings.articleCheck] || scheduleDescriptions['every_minute'];
        
        // Create new article sync cron task
        const newBlogSyncTask = cron.schedule(articleCronPattern, async () => {
          console.log('📝 Running scheduled blog data sync...');
          try {
            const result = await syncBlogData();
            if (result.success) {
              console.log('✅ Blog sync completed successfully!');
              console.log(`📊 Created: ${result.created}, Updated: ${result.updated}, Skipped: ${result.skipped}`);
            } else {
              console.error('❌ Blog sync failed:', result.error);
            }
          } catch (error) {
            console.error('❌ Blog sync error:', error);
          }
        }, {
          timezone: "Europe/Istanbul"
        });
        
        // Store the new task globally
        global.blogSyncCronTask = newBlogSyncTask;
        
        console.log(`✅ New article sync schedule activated: ${articleScheduleDescription} (Europe/Istanbul)`);
        console.log(`📋 New article sync pattern: ${articleCronPattern}`);
        
      } catch (error) {
        console.error('❌ Failed to restart article sync cron job:', error);
        // Don't fail the settings update if cron restart fails
      }
    }
    
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

// Clear private message content for a specific user (empties content instead of deleting)
router.delete('/cleanup/private-messages/:userId', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const db = getDatabase();
    
    // Verify user exists
    const user = await db.collection('users').findOne({ _id: new ObjectId(userId) });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Update (empty) all private messages sent by this user - keep conversation structure
    const result = await db.collection('messages').updateMany(
      {
        senderId: new ObjectId(userId),
        isPrivate: true
      },
      {
        $set: {
          content: '[Message content removed by admin]',
          isDeleted: true,
          deletedAt: new Date(),
          deletedBy: 'admin'
        }
      }
    );
    
    console.log(`🧹 Cleared content of ${result.modifiedCount} private messages for user: ${user.username}`);
    
    res.json({ 
      message: 'Private message contents cleared successfully',
      deletedCount: result.modifiedCount
    });
  } catch (error) {
    console.error('Clear private messages error:', error);
    res.status(500).json({ error: 'Failed to clear private messages' });
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

// Delete all users except the protected admin user (dangerous operation)
router.delete('/cleanup/all-users-except-admin', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const db = getDatabase();
    
    // Hardcoded protected username - NEVER delete this user
    const protectedUsername = 'sedat';
    
    console.log('🚨 DANGER ZONE: Deleting all users except:', protectedUsername);
    
    // Find the protected user to ensure they exist
    const protectedUser = await db.collection('users').findOne({ username: protectedUsername });
    if (!protectedUser) {
      return res.status(400).json({ error: `Protected user '${protectedUsername}' not found. Operation aborted.` });
    }
    
    // Find all users except the protected one
    const usersToDelete = await db.collection('users').find({
      username: { $ne: protectedUsername }
    }).toArray();
    
    if (usersToDelete.length === 0) {
      return res.json({ 
        message: 'No users to delete',
        stats: { usersDeleted: 0 }
      });
    }
    
    console.log(`📊 Found ${usersToDelete.length} users to delete`);
    
    let stats = {
      usersDeleted: 0,
      profilePicturesDeleted: 0,
      presenceDeleted: 0,
      settingsDeleted: 0,
      messagesDeleted: 0,
      privateChatsDeleted: 0,
      roomsUpdated: 0,
      reportsDeleted: 0,
      roomActivityDeleted: 0
    };
    
    // Delete each user and their data
    for (const user of usersToDelete) {
      const userId = user._id;
      
      // 1. Delete profile picture from Appwrite (if exists)
      if (user.profilePictureId) {
        try {
          const { storage, BUCKET_ID } = await import('../config/appwrite.js');
          await storage.deleteFile(BUCKET_ID, user.profilePictureId);
          stats.profilePicturesDeleted++;
        } catch (error) {
          if (error.code !== 404) {
            console.log(`⚠️ Could not delete profile picture for ${user.username}`);
          }
        }
      }
      
      // 2. Delete user presence
      const presenceResult = await db.collection('userpresence').deleteMany({ userId });
      stats.presenceDeleted += presenceResult.deletedCount;
      
      // 3. Delete user settings
      const settingsResult = await db.collection('settings').deleteMany({ userId });
      stats.settingsDeleted += settingsResult.deletedCount;
      
      // 4. Delete messages
      const messagesResult = await db.collection('messages').deleteMany({
        $or: [{ senderId: userId }, { receiverId: userId }]
      });
      stats.messagesDeleted += messagesResult.deletedCount;
      
      // 5. Delete private chats
      const privateChatsResult = await db.collection('privatechats').deleteMany({
        $or: [{ user1Id: userId }, { user2Id: userId }]
      });
      stats.privateChatsDeleted += privateChatsResult.deletedCount;
      
      // 6. Remove from public rooms
      const roomsResult = await db.collection('publicrooms').updateMany(
        { participants: userId },
        { 
          $pull: { participants: userId },
          $set: { updatedAt: new Date() }
        }
      );
      stats.roomsUpdated += roomsResult.modifiedCount;
      
      // 7. Delete user room activity
      const roomActivityResult = await db.collection('userroomactivity').deleteMany({ userId });
      stats.roomActivityDeleted += roomActivityResult.deletedCount;
      
      // 8. Delete reports
      const reportsResult = await db.collection('reports').deleteMany({
        $or: [{ reporterId: userId }, { reportedUserId: userId }]
      });
      stats.reportsDeleted += reportsResult.deletedCount;
      
      // 9. Delete user account
      const userResult = await db.collection('users').deleteOne({ _id: userId });
      stats.usersDeleted += userResult.deletedCount;
      
      console.log(`✅ Deleted user: ${user.username}`);
    }
    
    console.log('🎉 Bulk deletion complete:', stats);
    
    // Force disconnect all deleted users via socket
    const io = req.app.get('io');
    if (io) {
      io.emit('bulk_users_deleted', { 
        message: 'System maintenance completed. Please refresh.',
        count: stats.usersDeleted
      });
    }
    
    res.json({ 
      message: `Successfully deleted ${stats.usersDeleted} users and all their data`,
      protectedUser: protectedUsername,
      stats
    });
  } catch (error) {
    console.error('Delete all users error:', error);
    res.status(500).json({ error: 'Failed to delete users' });
  }
});

// Delete inactive users and old data by date
router.delete('/cleanup/inactive-users-and-old-data', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { inactiveDays } = req.body;
    
    if (!inactiveDays || inactiveDays <= 0) {
      return res.status(400).json({ error: 'Valid number of inactive days is required' });
    }
    
    const db = getDatabase();
    const protectedUsername = 'sedat';
    
    // Calculate the cutoff date for inactive users
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - parseInt(inactiveDays));
    
    console.log(`🔍 Finding inactive users (not active since ${cutoffDate.toISOString()})`);
    
    // Find inactive users (except protected user)
    // Users must meet ONE of these criteria:
    // 1. Have lastSeen and it's before cutoff date
    // 2. Don't have lastSeen BUT were created before cutoff date (old users who never logged in)
    const usersToDelete = await db.collection('users').find({
      username: { $ne: protectedUsername },
      $or: [
        { lastSeen: { $lt: cutoffDate } },
        { 
          lastSeen: { $exists: false },
          createdAt: { $lt: cutoffDate }
        }
      ]
    }).toArray();
    
    if (usersToDelete.length === 0) {
      return res.json({ 
        message: 'No inactive users found',
        stats: { 
          usersDeleted: 0,
          messagesDeleted: 0,
          reportsDeleted: 0
        }
      });
    }
    
    console.log(`📊 Found ${usersToDelete.length} inactive users to delete`);
    
    let stats = {
      usersDeleted: 0,
      profilePicturesDeleted: 0,
      presenceDeleted: 0,
      settingsDeleted: 0,
      messagesDeleted: 0,
      privateChatsDeleted: 0,
      roomsUpdated: 0,
      reportsDeleted: 0,
      archivedReportsDeleted: 0,
      roomActivityDeleted: 0
    };
    
    // Delete each inactive user and their data
    for (const user of usersToDelete) {
      const userId = user._id;
      const userEmail = user.email;
      
      // 1. Delete profile picture from Appwrite (if exists)
      if (user.profilePictureId) {
        try {
          const { storage, BUCKET_ID } = await import('../config/appwrite.js');
          await storage.deleteFile(BUCKET_ID, user.profilePictureId);
          stats.profilePicturesDeleted++;
        } catch (error) {
          if (error.code !== 404) {
            console.log(`⚠️ Could not delete profile picture for ${user.username}`);
          }
        }
      }
      
      // 2. Delete archived reports from userreports collection by email
      const archivedReportsResult = await db.collection('userreports').deleteMany({
        reportedUserEmail: userEmail
      });
      stats.archivedReportsDeleted += archivedReportsResult.deletedCount;
      
      // 3. Delete user presence
      const presenceResult = await db.collection('userpresence').deleteMany({ userId });
      stats.presenceDeleted += presenceResult.deletedCount;
      
      // 4. Delete user settings
      const settingsResult = await db.collection('settings').deleteMany({ userId });
      stats.settingsDeleted += settingsResult.deletedCount;
      
      // 5. Delete messages
      const messagesResult = await db.collection('messages').deleteMany({
        $or: [{ senderId: userId }, { receiverId: userId }]
      });
      stats.messagesDeleted += messagesResult.deletedCount;
      
      // 6. Delete private chats
      const privateChatsResult = await db.collection('privatechats').deleteMany({
        $or: [{ user1Id: userId }, { user2Id: userId }]
      });
      stats.privateChatsDeleted += privateChatsResult.deletedCount;
      
      // 7. Remove from public rooms
      const roomsResult = await db.collection('publicrooms').updateMany(
        { participants: userId },
        { 
          $pull: { participants: userId },
          $set: { updatedAt: new Date()

 }
        }
      );
      stats.roomsUpdated += roomsResult.modifiedCount;
      
      // 8. Delete user room activity
      const roomActivityResult = await db.collection('userroomactivity').deleteMany({ userId });
      stats.roomActivityDeleted += roomActivityResult.deletedCount;
      
      // 9. Delete reports
      const reportsResult = await db.collection('reports').deleteMany({
        $or: [{ reporterId: userId }, { reportedUserId: userId }]
      });
      stats.reportsDeleted += reportsResult.deletedCount;
      
      // 10. Delete user account
      const userResult = await db.collection('users').deleteOne({ _id: userId });
      stats.usersDeleted += userResult.deletedCount;
      
      console.log(`✅ Deleted inactive user: ${user.username} (${user.email})`);
    }
    
    console.log('🎉 Inactive users deletion complete:', stats);
    
    // Force disconnect deleted users via socket
    const io = req.app.get('io');
    if (io) {
      io.emit('bulk_users_deleted', { 
        message: 'Your account has been removed due to inactivity.',
        count: stats.usersDeleted
      });
    }
    
    res.json({ 
      message: `Successfully deleted ${stats.usersDeleted} inactive users and their data`,
      inactiveDays: parseInt(inactiveDays),
      cutoffDate: cutoffDate.toISOString(),
      stats
    });
  } catch (error) {
    console.error('Delete inactive users error:', error);
    res.status(500).json({ error: 'Failed to delete inactive users' });
  }
});

// Manual cleanup with backup - backup and delete old messages based on cleanCycle setting
router.post('/cleanup/manual-backup-cleanup', authenticateToken, requireAdmin, async (req, res) => {
  try {
    console.log('🧹 Manual backup and cleanup requested by admin');
    
    const result = await manualCleanup();
    
    res.json({
      message: 'Cleanup completed successfully',
      ...result
    });
  } catch (error) {
    console.error('Manual cleanup error:', error);
    res.status(500).json({ error: 'Failed to perform cleanup' });
  }
});

// Get backup folder statistics
router.get('/cleanup/backup-stats', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const backupDir = path.join(__dirname, '..', 'backups');
    
    // Check if backup directory exists using async fs
    try {
      await fs.promises.access(backupDir);
    } catch (error) {
      console.log('❌ Backup directory does not exist:', backupDir);
      return res.json({ 
        totalSize: 0,
        totalSizeKB: '0.00',
        fileCount: 0,
        organizedFolderCount: 0
      });
    }
    
    let totalSize = 0;
    let fileCount = 0;
    let organizedFolderCount = 0;
    
    // Function to recursively calculate directory size using async fs
    const getDirectorySize = async (dirPath) => {
      try {
        const items = await fs.promises.readdir(dirPath, { withFileTypes: true });
        
        for (const item of items) {
          const itemPath = path.join(dirPath, item.name);
          
          try {
            if (item.isDirectory()) {
              // Count organized folders
              if (item.name.startsWith('organized_')) {
                organizedFolderCount++;
              }
              await getDirectorySize(itemPath);
            } else {
              const stats = await fs.promises.stat(itemPath);
              totalSize += stats.size;
              fileCount++;
              console.log(`📄 ${item.name}: ${stats.size} bytes`);
            }
          } catch (itemError) {
            console.error(`⚠️ Error processing ${itemPath}:`, itemError.message);
          }
        }
      } catch (dirError) {
        console.error(`⚠️ Error reading directory ${dirPath}:`, dirError.message);
      }
    };
    
    await getDirectorySize(backupDir);
    
    const sizeInKB = (totalSize / 1024).toFixed(2);
    console.log(`📊 Backup stats: ${fileCount} files, ${totalSize} bytes (${sizeInKB} KB), ${organizedFolderCount} organized folders`);
    
    res.json({
      totalSize,
      totalSizeKB: sizeInKB,
      fileCount,
      organizedFolderCount
    });
  } catch (error) {
    console.error('Get backup stats error:', error);
    res.status(500).json({ error: 'Failed to get backup statistics' });
  }
});

// Delete organized backup folders
router.delete('/cleanup/organized-backups', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { cleanOrganizedBackups } = await import('../utils/cleanOrganizedBackups.js');
    
    console.log('🧹 Admin requested cleanup of organized backup folders');
    
    const result = await cleanOrganizedBackups();
    
    res.json({
      message: 'Organized backup folders deleted successfully',
      ...result
    });
  } catch (error) {
    console.error('Delete organized backups error:', error);
    res.status(500).json({ error: 'Failed to delete organized backups' });
  }
});

// Delete ALL backup files
router.delete('/cleanup/all-backups', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const backupDir = path.join(__dirname, '..', 'backups');
    
    console.log('🚨 Admin requested deletion of ALL backups in:', backupDir);
    
    // Check if backup directory exists
    try {
      await fs.promises.access(backupDir);
    } catch (error) {
      console.log('❌ Backup directory does not exist:', backupDir);
      return res.json({ 
        message: 'Backup directory does not exist',
        filesDeleted: 0,
        foldersDeleted: 0
      });
    }
    
    let filesDeleted = 0;
    let foldersDeleted = 0;
    
    // Function to recursively delete directory contents
    const deleteDirectoryContents = async (dirPath) => {
      try {
        const items = await fs.promises.readdir(dirPath, { withFileTypes: true });
        
        for (const item of items) {
          const itemPath = path.join(dirPath, item.name);
          
          try {
            if (item.isDirectory()) {
              // Recursively delete folder contents first
              await deleteDirectoryContents(itemPath);
              // Then delete the folder itself
              await fs.promises.rmdir(itemPath);
              foldersDeleted++;
              console.log(`📂 Deleted folder: ${item.name}`);
            } else {
              // Delete file
              await fs.promises.unlink(itemPath);
              filesDeleted++;
              console.log(`📄 Deleted file: ${item.name}`);
            }
          } catch (itemError) {
            console.error(`⚠️ Error deleting ${itemPath}:`, itemError.message);
          }
        }
      } catch (dirError) {
        console.error(`⚠️ Error reading directory ${dirPath}:`, dirError.message);
        throw dirError;
      }
    };
    
    // Delete all contents of backup directory
    await deleteDirectoryContents(backupDir);
    
    console.log(`✅ Deleted all backups: ${filesDeleted} files, ${foldersDeleted} folders`);
    
    res.json({
      message: 'All backups deleted successfully',
      filesDeleted,
      foldersDeleted
    });
  } catch (error) {
    console.error('Delete all backups error:', error);
    res.status(500).json({ error: 'Failed to delete all backups' });
  }
});

// Delete messages created before a specific date
router.delete('/cleanup/messages-by-date', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { date } = req.body;
    
    if (!date) {
      return res.status(400).json({ error: 'Date is required' });
    }
    
    const db = getDatabase();
    const cutoffDate = new Date(date);
    
    // Validate date
    if (isNaN(cutoffDate.getTime())) {
      return res.status(400).json({ error: 'Invalid date format' });
    }
    
    console.log(`🗓️ Deleting all messages created before: ${cutoffDate.toISOString()}`);
    
    // Delete all messages created before the specified date
    const messageResult = await db.collection('messages').deleteMany({
      timestamp: { $lt: cutoffDate }
    });
    
    console.log(`🧹 Deleted ${messageResult.deletedCount} messages created before ${cutoffDate.toLocaleDateString()}`);
    
    // Update private chats that had their last message deleted
    // Find chats where the lastMessageAt is before the cutoff date
    const chatsToUpdate = await db.collection('privatechats').find({
      lastMessageAt: { $lt: cutoffDate }
    }).toArray();
    
    // For each affected chat, find the newest remaining message
    for (const chat of chatsToUpdate) {
      const newestMessage = await db.collection('messages').findOne(
        {
          $or: [
            { senderId: chat.user1Id, receiverId: chat.user2Id },
            { senderId: chat.user2Id, receiverId: chat.user1Id }
          ],
          isPrivate: true
        },
        { sort: { timestamp: -1 } }
      );
      
      if (newestMessage) {
        // Update chat with new last message
        await db.collection('privatechats').updateOne(
          { _id: chat._id },
          {
            $set: {
              lastMessageId: newestMessage._id,
              lastMessageAt: newestMessage.timestamp,
              updatedAt: new Date()
            }
          }
        );
      } else {
        // No messages left, remove last message references
        await db.collection('privatechats').updateOne(
          { _id: chat._id },
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
      }
    }
    
    console.log(`🔄 Updated ${chatsToUpdate.length} private chats affected by deletion`);
    
    res.json({ 
      message: `Messages deleted successfully`,
      deletedCount: messageResult.deletedCount,
      chatsUpdated: chatsToUpdate.length,
      cutoffDate: cutoffDate.toISOString()
    });
  } catch (error) {
    console.error('Delete messages by date error:', error);
    res.status(500).json({ error: 'Failed to delete messages by date' });
  }
});

export default router;
