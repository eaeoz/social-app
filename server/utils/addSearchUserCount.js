import { getDatabase } from '../config/database.js';

/**
 * Migration script to add searchUserCount field to existing site settings
 */
async function addSearchUserCount() {
  try {
    const db = getDatabase();
    const settingsCollection = db.collection('sitesettings');

    // Check if settings exist
    const existingSettings = await settingsCollection.findOne({ settingType: 'global' });

    if (existingSettings) {
      // Check if searchUserCount already exists
      if (existingSettings.searchUserCount === undefined) {
        // Add searchUserCount field
        await settingsCollection.updateOne(
          { settingType: 'global' },
          {
            $set: {
              searchUserCount: 50,
              updatedAt: new Date()
            }
          }
        );
        console.log('✅ Added searchUserCount field to site settings with value: 50');
      } else {
        console.log('✅ searchUserCount field already exists in site settings');
      }
    } else {
      console.log('⚠️  No site settings found. Please run initializeSiteSettings first.');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error adding searchUserCount field:', error);
    process.exit(1);
  }
}

// Run the migration
import('../config/database.js').then(({ connectToDatabase }) => {
  connectToDatabase().then(() => {
    addSearchUserCount();
  });
});
