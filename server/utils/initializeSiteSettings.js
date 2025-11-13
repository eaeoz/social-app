import { getDatabase } from '../config/database.js';

/**
 * Initialize site settings collection with default values
 */
export async function initializeSiteSettings() {
  try {
    const db = getDatabase();
    const settingsCollection = db.collection('siteSettings');

    console.log('🔍 [INIT] Checking for existing settings...');
    
    // First, let's see ALL documents in the collection
    const allSettings = await settingsCollection.find({}).toArray();
    console.log('🔍 [INIT] Total documents in sitesettings:', allSettings.length);
    console.log('🔍 [INIT] All documents:', JSON.stringify(allSettings, null, 2));

    // Check if settings already exist
    const existingSettings = await settingsCollection.findOne({ settingType: 'global' });
    console.log('🔍 [INIT] Found existing settings with settingType=global:', existingSettings ? 'YES' : 'NO');

    if (!existingSettings) {
      console.log('⚠️ [INIT] No existing settings found, creating new one...');
      // Create default settings
      const defaultSettings = {
        settingType: 'global',
        showuserlistpicture: 1, // 1 = show pictures, 0 = hide pictures
        searchUserCount: 50, // Maximum number of users to show in search
        defaultUsersDisplayCount: 20, // Maximum number of users to show by default (online users only)
        siteEmail: '', // Email address to receive contact form submissions
        verificationEmailResendCount: 4, // Maximum number of verification email resend attempts
        maxMessageLength: 30, // Maximum message length (default: 30 characters)
        rateLimit: 10, // Maximum messages per minute (default: 10)
        sessionTimeout: 10080, // Session timeout in MINUTES (default: 10080 = 7 days)
        cleanMinSize: 512000, // Storage size in KB that triggers automatic cleanup (default: 512000 KB = 500 MB)
        cleanCycle: 129600, // Number of minutes - only messages older than this will be cleaned (default: 129600 minutes = 90 days)
        cleanCheck: 'every_12_hours', // Cleanup check schedule: every_minute, every_5_minutes, every_hour, every_12_hours, every_day, every_week, every_2_weeks, every_month
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await settingsCollection.insertOne(defaultSettings);
      console.log('✅ Site settings initialized with default values');
      console.log('   - showuserlistpicture: 1 (enabled)');
      console.log('   - searchUserCount: 50');
      console.log('   - defaultUsersDisplayCount: 20');
      console.log('   - siteEmail: (not set)');
      console.log('   - verificationEmailResendCount: 4');
      console.log('   - maxMessageLength: 30');
      console.log('   - rateLimit: 10');
      console.log('   - sessionTimeout: 10080 minutes (7 days)');
    } else {
      console.log('✅ Site settings already exist, skipping creation');
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
    const settingsCollection = db.collection('siteSettings');

    console.log('🔍 Querying sitesettings collection...');
    const settings = await settingsCollection.findOne({ settingType: 'global' });
    console.log('🔍 Raw settings from DB:', JSON.stringify(settings, null, 2));

    if (!settings) {
      console.log('⚠️ No settings found in DB, creating defaults...');
      // If no settings found, create default and return
      await initializeSiteSettings();
      return {
        showuserlistpicture: 1,
        searchUserCount: 50,
        defaultUsersDisplayCount: 20,
        siteEmail: '',
        verificationEmailResendCount: 4,
        maxMessageLength: 30,
        rateLimit: 10,
        sessionTimeout: 10080, // 7 days in minutes
        maintenanceMode: false,
        maintenanceReason: '',
        maintenanceEstimatedTime: ''
      };
    }

    const result = {
      showuserlistpicture: settings.showuserlistpicture !== undefined ? settings.showuserlistpicture : 1,
      searchUserCount: settings.searchUserCount !== undefined ? settings.searchUserCount : 50,
      defaultUsersDisplayCount: settings.defaultUsersDisplayCount !== undefined ? settings.defaultUsersDisplayCount : 20,
      siteEmail: settings.siteEmail || '',
      verificationEmailResendCount: settings.verificationEmailResendCount !== undefined ? settings.verificationEmailResendCount : 4,
      maxMessageLength: settings.maxMessageLength !== undefined ? settings.maxMessageLength : 30,
      rateLimit: settings.rateLimit !== undefined ? settings.rateLimit : 10,
      sessionTimeout: settings.sessionTimeout !== undefined ? settings.sessionTimeout : 10080, // Default 7 days in minutes
      maintenanceMode: settings.maintenanceMode !== undefined ? settings.maintenanceMode : false,
      maintenanceReason: settings.maintenanceReason || '',
      maintenanceEstimatedTime: settings.maintenanceEstimatedTime || '',
      cleanMinSize: settings.cleanMinSize !== undefined ? settings.cleanMinSize : 512000, // Default 512000 KB (500 MB)
      cleanCycle: settings.cleanCycle !== undefined ? settings.cleanCycle : 129600, // Default 129600 minutes (90 days)
      cleanCheck: settings.cleanCheck || 'every_12_hours' // Default: every 12 hours
    };
    
    console.log('🔍 Processed settings result:', JSON.stringify(result, null, 2));
    return result;
  } catch (error) {
    console.error('❌ Error getting site settings:', error);
    // Return default on error
    return {
      showuserlistpicture: 1,
      searchUserCount: 50,
      defaultUsersDisplayCount: 20,
      verificationEmailResendCount: 4,
      maxMessageLength: 30,
      rateLimit: 10,
      sessionTimeout: 10080, // 7 days in minutes
      maintenanceMode: false,
      maintenanceReason: '',
      maintenanceEstimatedTime: ''
    };
  }
}

/**
 * Update site settings
 */
export async function updateSiteSettings(settings) {
  try {
    const db = getDatabase();
    const settingsCollection = db.collection('siteSettings');

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
