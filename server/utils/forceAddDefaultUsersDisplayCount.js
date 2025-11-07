import { getDatabase } from '../config/database.js';

/**
 * Force add/update defaultUsersDisplayCount field to site settings
 */
async function forceAddDefaultUsersDisplayCount() {
  try {
    const db = getDatabase();
    const settingsCollection = db.collection('sitesettings');

    // Get current settings
    const existingSettings = await settingsCollection.findOne({ settingType: 'global' });

    if (!existingSettings) {
      console.log('❌ No site settings found!');
      process.exit(1);
    }

    console.log('📋 Current settings:');
    console.log(JSON.stringify(existingSettings, null, 2));

    // Force update/add the field
    const result = await settingsCollection.updateOne(
      { settingType: 'global' },
      {
        $set: {
          defaultUsersDisplayCount: 20,
          updatedAt: new Date()
        }
      }
    );

    console.log('\n✅ Update operation completed!');
    console.log(`   Matched: ${result.matchedCount}`);
    console.log(`   Modified: ${result.modifiedCount}`);

    // Fetch and display updated settings
    const updatedSettings = await settingsCollection.findOne({ settingType: 'global' });
    console.log('\n📋 Updated settings:');
    console.log(JSON.stringify(updatedSettings, null, 2));

    // Verify both fields exist
    if (updatedSettings.searchUserCount && updatedSettings.defaultUsersDisplayCount) {
      console.log('\n✅ SUCCESS! Both fields are now present:');
      console.log(`   • searchUserCount: ${updatedSettings.searchUserCount}`);
      console.log(`   • defaultUsersDisplayCount: ${updatedSettings.defaultUsersDisplayCount}`);
    } else {
      console.log('\n⚠️  WARNING: One or more fields are missing!');
      if (!updatedSettings.searchUserCount) {
        console.log('   ❌ searchUserCount is missing');
      }
      if (!updatedSettings.defaultUsersDisplayCount) {
        console.log('   ❌ defaultUsersDisplayCount is missing');
      }
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error updating settings:', error);
    process.exit(1);
  }
}

// Run the script
import('../config/database.js').then(({ connectToDatabase }) => {
  connectToDatabase().then(() => {
    forceAddDefaultUsersDisplayCount();
  });
});
