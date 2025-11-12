import { getDatabase } from '../config/database.js';
import { connectToDatabase } from '../config/database.js';

/**
 * Add sessionTimeout field to siteSettings collection
 * This script updates the existing global site settings document
 */
async function addSessionTimeout() {
  try {
    console.log('🔧 Starting sessionTimeout field addition...\n');

    // Connect to database
    await connectToDatabase();
    const db = getDatabase();
    const settingsCollection = db.collection('siteSettings');

    // Check current settings
    console.log('📋 Checking existing siteSettings...');
    const existingSettings = await settingsCollection.findOne({ settingType: 'global' });
    
    if (!existingSettings) {
      console.log('❌ No global settings found! Please run initializeSiteSettings first.');
      process.exit(1);
    }

    console.log('✅ Found existing settings:');
    console.log(JSON.stringify(existingSettings, null, 2));
    console.log('\n');

    // Check if sessionTimeout already exists
    if (existingSettings.sessionTimeout !== undefined) {
      console.log(`ℹ️  sessionTimeout field already exists with value: ${existingSettings.sessionTimeout} days`);
      console.log('   No update needed.');
      process.exit(0);
    }

    // Add sessionTimeout field
    console.log('➕ Adding sessionTimeout field with default value: 7 days...');
    const result = await settingsCollection.updateOne(
      { settingType: 'global' },
      { 
        $set: { 
          sessionTimeout: 7,  // Default: 7 days
          updatedAt: new Date()
        }
      }
    );

    if (result.modifiedCount === 1) {
      console.log('✅ Successfully added sessionTimeout field!\n');
      
      // Verify the update
      const updatedSettings = await settingsCollection.findOne({ settingType: 'global' });
      console.log('📋 Updated settings:');
      console.log(JSON.stringify(updatedSettings, null, 2));
      console.log('\n');
      console.log('🎉 Done! Session timeout is now set to 7 days.');
      console.log('   You can change this value from the admin dashboard.');
    } else {
      console.log('⚠️  No documents were modified. This might mean:');
      console.log('   - The field already exists');
      console.log('   - The document was not found');
    }

    process.exit(0);

  } catch (error) {
    console.error('❌ Error adding sessionTimeout field:', error);
    console.error('Error details:', error.message);
    process.exit(1);
  }
}

// Run the function
addSessionTimeout();
