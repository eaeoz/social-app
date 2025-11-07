import { getDatabase } from '../config/database.js';

/**
 * Initialize site settings collection with default values
 */
export async function initializeSiteSettings() {
  try {
    const db = getDatabase();
    const settingsCollection = db.collection('sitesettings');

    // Check if settings already exist
    const existingSettings = await settingsCollection.findOne({ settingType: 'global' });

    if (!existingSettings) {
      // Create default settings
      const defaultSettings = {
        settingType: 'global',
        showuserlistpicture: 1, // 1 = show pictures, 0 = hide pictures
        searchUserCount: 50, // Maximum number of users to show in search
        defaultUsersDisplayCount: 20, // Maximum number of users to show by default (online users only)
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await settingsCollection.insertOne(defaultSettings);
      console.log('✅ Site settings initialized with default values');
      console.log('   - showuserlistpicture: 1 (enabled)');
      console.log('   - searchUserCount: 50');
      console.log('   - defaultUsersDisplayCount: 20');
    } else {
      console.log('✅ Site settings already exist');
    }

    return true;
  } catch (error) {
    console.error('❌ Error initializing site settings:', error);
    throw error;
  }
}

/**
 * Get site settings
 */
export async function getSiteSettings() {
  try {
    const db = getDatabase();
    const settingsCollection = db.collection('sitesettings');

    const settings = await settingsCollection.findOne({ settingType: 'global' });

    if (!settings) {
      // If no settings found, create default and return
      await initializeSiteSettings();
      return {
        showuserlistpicture: 1,
        searchUserCount: 50,
        defaultUsersDisplayCount: 20
      };
    }

    return {
      showuserlistpicture: settings.showuserlistpicture || 0,
      searchUserCount: settings.searchUserCount || 50,
      defaultUsersDisplayCount: settings.defaultUsersDisplayCount || 20
    };
  } catch (error) {
    console.error('❌ Error getting site settings:', error);
    // Return default on error
    return {
      showuserlistpicture: 1,
      searchUserCount: 50,
      defaultUsersDisplayCount: 20
    };
  }
}

/**
 * Update site settings
 */
export async function updateSiteSettings(settings) {
  try {
    const db = getDatabase();
    const settingsCollection = db.collection('sitesettings');

    const updateData = {
      ...settings,
      updatedAt: new Date()
    };

    await settingsCollection.updateOne(
      { settingType: 'global' },
      { $set: updateData },
      { upsert: true }
    );

    console.log('✅ Site settings updated successfully');
    return true;
  } catch (error) {
    console.error('❌ Error updating site settings:', error);
    throw error;
  }
}
