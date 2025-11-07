import { getDatabase } from '../config/database.js';

/**
 * Migration script to add defaultUsersDisplayCount field to existing site settings
 */
async function addDefaultUsersDisplayCount() {
  try {
    const db = getDatabase();
    const settingsCollection = db.collection('sitesettings');

    // Check if settings exist
    const existingSettings = await settingsCollection.findOne({ settingType: 'global' });

    if (existingSettings) {
      // Check if defaultUsersDisplayCount already exists
      if (existingSettings.defaultUsersDisplayCount === undefined) {
        // Add defaultUsersDisplayCount field
        await settingsCollection.updateOne(
          { settingType: 'global' },
          {
            $set: {
              defaultUsersDisplayCount: 20,
              updatedAt: new Date()
            }
          }
        );
        console.log('✅ Added defaultUsersDisplayCount field to site settings with value: 20');
      } else {
        console.log('✅ defaultUsersDisplayCount field already exists in site settings');
      }
    } else {
      console.log('⚠️  No site settings found. Please run initializeSiteSettings first.');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error adding defaultUsersDisplayCount field:', error);
    process.exit(1);
  }
}

// Run the migration
import('../config/database.js').then(({ connectToDatabase }) => {
  connectToDatabase().then(() => {
    addDefaultUsersDisplayCount();
  });
});
