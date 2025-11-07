import { getDatabase } from '../config/database.js';

/**
 * Script to list all fields in the siteSettings collection
 */
async function listSiteSettingsFields() {
  try {
    const db = getDatabase();
    const settingsCollection = db.collection('sitesettings');

    // Get the site settings document
    const settings = await settingsCollection.findOne({ settingType: 'global' });

    if (!settings) {
      console.log('❌ No site settings found in database');
      process.exit(1);
    }

    console.log('📋 SITESETTINGS COLLECTION - ALL FIELDS\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    // Get all field names (keys) from the document
    const fields = Object.keys(settings);
    console.log(`Total number of fields: ${fields.length}\n`);
    
    // List each field with its value and type
    fields.forEach((field, index) => {
      const value = settings[field];
      const type = Array.isArray(value) ? 'Array' : typeof value;
      const displayValue = type === 'object' && value !== null && !Array.isArray(value)
        ? value.toISOString ? value.toISOString() : JSON.stringify(value)
        : value;
      
      console.log(`${index + 1}. ${field}`);
      console.log(`   Type: ${type}`);
      console.log(`   Value: ${displayValue}`);
      console.log('');
    });
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n📄 Complete Document (JSON format):');
    console.log(JSON.stringify(settings, null, 2));
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    // Check for searchUserCount specifically
    console.log('\n🔍 Searching for searchUserCount field:');
    if (settings.searchUserCount !== undefined) {
      console.log(`   ✅ FOUND: searchUserCount = ${settings.searchUserCount}`);
    } else {
      console.log('   ❌ NOT FOUND: searchUserCount field is missing');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error listing site settings fields:', error);
    process.exit(1);
  }
}

// Run the script
import('../config/database.js').then(({ connectToDatabase }) => {
  connectToDatabase().then(() => {
    listSiteSettingsFields();
  });
});
