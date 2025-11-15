import { connectToDatabase, getDatabase } from '../config/database.js';

/**
 * Add sound settings fields to existing siteSettings document
 * Run this script once to add the new fields to your existing database
 */
async function addSoundSettings() {
  try {
    console.log('🔧 Starting to add sound settings fields...');
    
    // Connect to database first
    console.log('📡 Connecting to database...');
    await connectToDatabase();
    console.log('✅ Connected to database');
    
    const db = getDatabase();
    const settingsCollection = db.collection('siteSettings');

    // Check current settings
    const currentSettings = await settingsCollection.findOne({ settingType: 'global' });
    
    if (!currentSettings) {
      console.log('❌ No settings found. Please run server first to initialize settings.');
      process.exit(1);
    }

    console.log('📋 Current settings:', JSON.stringify(currentSettings, null, 2));

    // Check if sound settings already exist
    if (currentSettings.messageNotificationSound && 
        currentSettings.voiceCallSound && 
        currentSettings.videoCallSound) {
      console.log('✅ Sound settings already exist in database!');
      console.log(`   - messageNotificationSound: ${currentSettings.messageNotificationSound}`);
      console.log(`   - voiceCallSound: ${currentSettings.voiceCallSound}`);
      console.log(`   - videoCallSound: ${currentSettings.videoCallSound}`);
      process.exit(0);
    }

    // Add sound settings fields
    const result = await settingsCollection.updateOne(
      { settingType: 'global' },
      {
        $set: {
          messageNotificationSound: currentSettings.messageNotificationSound || 'default',
          voiceCallSound: currentSettings.voiceCallSound || 'default',
          videoCallSound: currentSettings.videoCallSound || 'default',
          updatedAt: new Date()
        }
      }
    );

    if (result.modifiedCount > 0) {
      console.log('✅ Successfully added sound settings fields to database!');
      console.log('   - messageNotificationSound: default');
      console.log('   - voiceCallSound: default');
      console.log('   - videoCallSound: default');
      
      // Verify the update
      const updatedSettings = await settingsCollection.findOne({ settingType: 'global' });
      console.log('📋 Updated settings:', JSON.stringify(updatedSettings, null, 2));
    } else {
      console.log('ℹ️ No changes made (fields may already exist)');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error adding sound settings:', error);
    process.exit(1);
  }
}

// Run the script
addSoundSettings();
