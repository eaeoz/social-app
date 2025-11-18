import express from 'express';
import { getDatabase } from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';
import { ObjectId } from 'mongodb';

const router = express.Router();

/**
 * Get user's sound settings
 */
router.get('/user-sounds', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const db = getDatabase();
    const usersCollection = db.collection('users');

    const user = await usersCollection.findOne(
      { _id: new ObjectId(userId) },
      { projection: { sounds: 1 } }
    );

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Return user's sound settings or empty object if not set
    res.json({
      success: true,
      sounds: user.sounds || {}
    });

  } catch (error) {
    console.error('Get user sounds error:', error);
    res.status(500).json({ error: 'Failed to get sound settings' });
  }
});

/**
 * Update user's sound settings
 */
router.put('/update-user-sounds', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { sounds } = req.body;

    // Validate that sounds object is provided
    if (!sounds || typeof sounds !== 'object') {
      return res.status(400).json({ error: 'Sounds object is required' });
    }

    const db = getDatabase();
    const usersCollection = db.collection('users');

    // Update user's sound settings
    const result = await usersCollection.updateOne(
      { _id: new ObjectId(userId) },
      { 
        $set: {
          sounds: sounds,
          updatedAt: new Date()
        }
      }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    console.log(`✅ Sound settings updated for user: ${userId}`, sounds);

    res.json({
      success: true,
      message: 'Sound settings updated successfully',
      sounds: sounds
    });

  } catch (error) {
    console.error('Update user sounds error:', error);
    res.status(500).json({ error: 'Failed to update sound settings' });
  }
});

/**
 * Get available sound options (from site settings)
 */
router.get('/available-sounds', authenticateToken, async (req, res) => {
  try {
    const db = getDatabase();
    const siteSettingsCollection = db.collection('siteSettings');

    const settings = await siteSettingsCollection.findOne({ settingType: 'global' });

    // Define available sound options
    const availableSounds = {
      messageNotificationSounds: [
        { value: 'stwime_up', label: 'Stwime Up (Default)' },
        { value: 'pop', label: 'Pop' },
        { value: 'default', label: 'Default' },
        { value: 'none', label: 'None' }
      ],
      callSounds: [
        { value: 'default', label: 'Default' },
        { value: 'classic', label: 'Classic' },
        { value: 'modern', label: 'Modern' },
        { value: 'none', label: 'None' }
      ],
      senderSounds: [
        { value: 'pop', label: 'Pop (Default)' },
        { value: 'swoosh', label: 'Swoosh' },
        { value: 'ding', label: 'Ding' },
        { value: 'none', label: 'None' }
      ]
    };

    res.json({
      success: true,
      availableSounds,
      defaultSounds: {
        messageNotificationSound: settings?.messageNotificationSound || 'stwime_up',
        voiceCallSound: settings?.voiceCallSound || 'default',
        videoCallSound: settings?.videoCallSound || 'default',
        senderSound: settings?.senderNotificationSound || 'pop'
      }
    });

  } catch (error) {
    console.error('Get available sounds error:', error);
    res.status(500).json({ error: 'Failed to get available sounds' });
  }
});

export default router;
