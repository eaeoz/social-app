import { getDatabase } from '../config/database.js';

/**
 * Verification script to check site settings
 */
async function verifySiteSettings() {
  try {
    const db = getDatabase();
    const settingsCollection = db.collection('sitesettings');

    // Get the site settings document
    const settings = await settingsCollection.findOne({ settingType: 'global' });

    if (!settings) {
      console.log('❌ No site settings found in database');
      process.exit(1);
    }

    console.log('✅ Site Settings Document:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(JSON.stringify(settings, null, 2));
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    console.log('\n📊 Field Check:');
    console.log(`   ✓ settingType: ${settings.settingType}`);
    console.log(`   ✓ showuserlistpicture: ${settings.showuserlistpicture}`);
    console.log(`   ${settings.searchUserCount !== undefined ? '✓' : '✗'} searchUserCount: ${settings.searchUserCount !== undefined ? settings.searchUserCount : 'MISSING'}`);
    
    if (settings.searchUserCount !== undefined) {
      console.log('\n✅ searchUserCount field exists with value:', settings.searchUserCount);
    } else {
      console.log('\n❌ searchUserCount field is MISSING');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error verifying site settings:', error);
    process.exit(1);
  }
}

// Run the verification
import('../config/database.js').then(({ connectToDatabase }) => {
  connectToDatabase().then(() => {
    verifySiteSettings();
  });
});
