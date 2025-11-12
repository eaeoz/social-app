import { getDatabase } from '../config/database.js';
import { connectToDatabase } from '../config/database.js';

/**
 * Restore sessionTimeout to 7 days (default)
 */
async function restoreSessionTimeout() {
  try {
    console.log('🔧 Restoring session timeout to 7 days...\n');

    // Connect to database
    await connectToDatabase();
    const db = getDatabase();
    const settingsCollection = db.collection('siteSettings');

    // Check current value
    const currentSettings = await settingsCollection.findOne({ settingType: 'global' });
    console.log(`📊 Current sessionTimeout: ${currentSettings.sessionTimeout} days\n`);

    // Update sessionTimeout to 7 days
    const result = await settingsCollection.updateOne(
      { settingType: 'global' },
      { 
        $set: { 
          sessionTimeout: 7,
          updatedAt: new Date()
        }
      }
    );

    if (result.modifiedCount === 1) {
      console.log('✅ Successfully restored sessionTimeout to 7 days!\n');
      
      // Verify the update
      const updatedSettings = await settingsCollection.findOne({ settingType: 'global' });
      console.log('📋 Updated settings:');
      console.log(`   sessionTimeout: ${updatedSettings.sessionTimeout} days`);
      console.log(`   Updated at: ${updatedSettings.updatedAt}\n`);
      
      console.log('🎉 Session timeout is back to normal (7 days)');
      console.log('   New logins will now stay logged in for 7 days.');
    } else {
      console.log('ℹ️  sessionTimeout was already set to 7 days.');
    }

    process.exit(0);

  } catch (error) {
    console.error('❌ Error restoring sessionTimeout:', error);
    console.error('Error details:', error.message);
    process.exit(1);
  }
}

// Run the function
restoreSessionTimeout();
