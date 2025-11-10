import express from 'express';
import { getDatabase } from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';
import { ObjectId } from 'mongodb';

const router = express.Router();

// Submit a report
router.post('/submit', authenticateToken, async (req, res) => {
  try {
    const reporterId = req.user.userId;
    const { reportedUserId, reason } = req.body;

    if (!reportedUserId || !reason) {
      return res.status(400).json({ error: 'Reported user ID and reason are required' });
    }

    // Prevent self-reporting
    if (reporterId === reportedUserId) {
      return res.status(400).json({ error: 'You cannot report yourself' });
    }

    const db = getDatabase();
    const usersCollection = db.collection('users');
    const siteSettingsCollection = db.collection('siteSettings');

    // Check if reported user exists
    const reportedUser = await usersCollection.findOne({ _id: new ObjectId(reportedUserId) });
    if (!reportedUser) {
      return res.status(404).json({ error: 'Reported user not found' });
    }

    // Get reporter info
    const reporter = await usersCollection.findOne({ _id: new ObjectId(reporterId) });
    if (!reporter) {
      return res.status(404).json({ error: 'Reporter user not found' });
    }

    // Check if user already reported this person (prevent spam)
    const existingReport = reportedUser.reports?.find(
      report => report.reporterId === reporterId
    );

    if (existingReport) {
      return res.status(400).json({ 
        error: 'You have already reported this user',
        message: 'You can only report a user once. Our team will review your previous report.'
      });
    }

    // Create report object
    const report = {
      reporterId,
      reporterEmail: reporter.email,
      reason,
      timestamp: new Date()
    };

    // Add report to user's reports array
    await usersCollection.updateOne(
      { _id: new ObjectId(reportedUserId) },
      { 
        $push: { reports: report },
        $set: { updatedAt: new Date() }
      }
    );

    // Get updated user to check report count
    const updatedUser = await usersCollection.findOne({ _id: new ObjectId(reportedUserId) });
    const reportCount = updatedUser.reports?.length || 0;

    // Get max report count from site settings
    const siteSettings = await siteSettingsCollection.findOne({ settingType: 'global' });
    const maxReportCount = siteSettings?.maxReportCount || 5;

    // Check if user should be suspended
    if (reportCount >= maxReportCount && !updatedUser.userSuspended) {
      await usersCollection.updateOne(
        { _id: new ObjectId(reportedUserId) },
        { 
          $set: { 
            userSuspended: true,
            suspendedAt: new Date(),
            updatedAt: new Date()
          }
        }
      );

      console.log(`🚫 User ${reportedUser.username} has been suspended (${reportCount} reports)`);

      // Force logout the suspended user if they're online
      const { io } = await import('../server.js');
      const userSockets = new Map();
      
      // Find all sockets for this user and disconnect them
      const sockets = await io.fetchSockets();
      for (const socket of sockets) {
        if (socket.userId === reportedUserId) {
          socket.emit('force_logout', { 
            reason: 'Your account has been suspended due to multiple reports from users.' 
          });
          socket.disconnect(true);
        }
      }

      return res.json({
        message: 'Report submitted successfully. User has been suspended due to multiple reports.',
        suspended: true,
        reportCount
      });
    }

    console.log(`📝 Report submitted: ${reporter.username} reported ${reportedUser.username} for ${reason}`);

    res.json({
      message: 'Report submitted successfully. Our team will review it.',
      success: true,
      reportCount,
      maxReportCount
    });

  } catch (error) {
    console.error('Submit report error:', error);
    res.status(500).json({ error: 'Failed to submit report' });
  }
});

// Check if user is suspended (public endpoint, no auth required)
router.post('/check-suspension', async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    const db = getDatabase();
    const usersCollection = db.collection('users');

    const user = await usersCollection.findOne(
      { _id: new ObjectId(userId) },
      { projection: { userSuspended: 1, suspendedAt: 1, reports: 1 } }
    );

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      suspended: user.userSuspended || false,
      suspendedAt: user.suspendedAt || null,
      reportCount: user.reports?.length || 0
    });

  } catch (error) {
    console.error('Check suspension error:', error);
    res.status(500).json({ error: 'Failed to check suspension status' });
  }
});

export default router;
