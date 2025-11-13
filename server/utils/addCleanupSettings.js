import { connectToDatabase, getDatabase } from '../config/database.js';

async function addCleanupSettings() {
  try {
    await connectToDatabase();
    const db = getDatabase();
    
    console.log('🔧 Adding cleanup settings to site settings...');
    
    const result = await db.collection('sitesettings').updateOne(
      { settingType: 'global' },
      {
        $set: {
          cleanMinSize: 500,  // 500 MB
          cleanCycle: 90,     // 90 days
          updatedAt: new Date()
        }
      }
    );
    
    if (result.modifiedCount > 0) {
      console.log('✅ Successfully added cleanup settings to database');
      
      // Verify the update
      const settings = await db.collection('sitesettings').findOne({ settingType: 'global' });
      console.log('📋 Current settings:', JSON.stringify(settings, null, 2));
    } else {
      console.log('ℹ️ No changes made - settings may already exist');
      
      // Show current settings anyway
      const settings = await db.collection('sitesettings').findOne({ settingType: 'global' });
      console.log('📋 Current settings:', JSON.stringify(settings, null, 2));
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error adding cleanup settings:', error);
    process.exit(1);
  }
}

addCleanupSettings();
