import express from 'express';
import { getSiteSettings, updateSiteSettings } from '../utils/initializeSiteSettings.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Get site settings (public endpoint - no auth required)
router.get('/site', async (req, res) => {
  try {
    const settings = await getSiteSettings();
    res.json({ settings });
  } catch (error) {
    console.error('Error getting site settings:', error);
    res.status(500).json({ error: 'Failed to get site settings' });
  }
});

// Update site settings (protected endpoint - requires auth)
router.put('/site', authenticateToken, async (req, res) => {
  try {
    const { showuserlistpicture } = req.body;

    // Validate input
    if (showuserlistpicture !== undefined && showuserlistpicture !== 0 && showuserlistpicture !== 1) {
      return res.status(400).json({ error: 'showuserlistpicture must be 0 or 1' });
    }

    const settings = {};
    if (showuserlistpicture !== undefined) {
      settings.showuserlistpicture = showuserlistpicture;
    }

    await updateSiteSettings(settings);
    const updatedSettings = await getSiteSettings();

    res.json({ 
      message: 'Settings updated successfully',
      settings: updatedSettings 
    });
  } catch (error) {
    console.error('Error updating site settings:', error);
    res.status(500).json({ error: 'Failed to update site settings' });
  }
});

export default router;
