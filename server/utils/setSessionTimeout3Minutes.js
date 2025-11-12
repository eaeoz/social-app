import { getDatabase } from '../config/database.js';
import { connectToDatabase } from '../config/database.js';

/**
 * Set sessionTimeout to 3 minutes for testing
 * 3 minutes = 0.00208333 days (3 / 60 / 24)
 */
async function setSessionTimeout3Minutes() {
  try {
    console.log('🔧 Setting session timeout to 3 minutes...\n');

    // Connect to database
    await connectToDatabase();
    const db = getDatabase();
    const settingsCollection = db.collection('siteSettings');

    // Calculate 3 minutes in days
    const threeMinutesInDays = 3 / 60 / 24; // 0.00208333 days
    
    console.log(`📊 Converting 3 minutes to days: ${threeMinutesInDays}`);
    console.log('   (JWT will expire in 3 minutes after login)\n');

    // Update sessionTimeout
    const result = await settingsCollection.updateOne(
      { settingType: 'global' },
      { 
        $set: { 
          sessionTimeout: threeMinutesInDays,
          updatedAt: new Date()
        }
      }
    );

    if (result.modifiedCount === 1) {
      console.log('✅ Successfully set sessionTimeout to 3 minutes!\n');
      
      // Verify the update
      const updatedSettings = await settingsCollection.findOne({ settingType: 'global' });
      console.log('📋 Updated settings:');
      console.log(`   sessionTimeout: ${updatedSettings.sessionTimeout} days (3 minutes)`);
      console.log(`   Updated at: ${updatedSettings.updatedAt}\n`);
      
      console.log('🎯 Testing instructions:');
      console.log('   1. Log in to your app');
      console.log('   2. Wait 3 minutes');
      console.log('   3. Try to access something (should auto-logout)');
      console.log('   4. Check browser console for "Token has expired" message\n');
      
      console.log('⚠️  IMPORTANT: Remember to change this back to 7 days after testing!');
      console.log('   Run: node utils/restoreSessionTimeout.js');
    } else {
      console.log('⚠️  No documents were modified.');
    }

    process.exit(0);

  } catch (error) {
    console.error('❌ Error setting sessionTimeout:', error);
    console.error('Error details:', error.message);
    process.exit(1);
  }
}

// Run the function
setSessionTimeout3Minutes();
