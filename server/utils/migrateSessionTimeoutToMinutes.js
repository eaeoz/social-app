import { getDatabase } from '../config/database.js';
import { connectToDatabase } from '../config/database.js';

/**
 * Migrate sessionTimeout from days to minutes
 * This converts existing sessionTimeout values to the new minute-based system
 */
async function migrateSessionTimeoutToMinutes() {
  try {
    console.log('🔧 Starting sessionTimeout migration (days → minutes)...\n');

    // Connect to database
    await connectToDatabase();
    const db = getDatabase();
    const settingsCollection = db.collection('siteSettings');

    // Get current settings
    const settings = await settingsCollection.findOne({ settingType: 'global' });
    
    if (!settings) {
      console.log('❌ No settings found!');
      process.exit(1);
    }

    const currentValue = settings.sessionTimeout;
    console.log(`📊 Current sessionTimeout value: ${currentValue}`);

    // Check if value needs migration
    // If value is less than 1440 (24 hours in minutes), it's likely already in minutes
    // If value is between 1 and 365, it's likely in days
    let newValue;
    let needsMigration = false;

    if (currentValue >= 1 && currentValue <= 365) {
      // Likely in days, convert to minutes
      newValue = Math.round(currentValue * 24 * 60); // days to minutes
      needsMigration = true;
      console.log(`📝 Detected value in DAYS format`);
      console.log(`   Converting ${currentValue} days → ${newValue} minutes`);
    } else if (currentValue < 1 && currentValue > 0) {
      // Fractional days (like 0.00208333 for 3 minutes)
      newValue = Math.round(currentValue * 24 * 60); // days to minutes
      needsMigration = true;
      console.log(`📝 Detected fractional days`);
      console.log(`   Converting ${currentValue} days → ${newValue} minutes`);
    } else if (currentValue >= 1440) {
      // Already in minutes
      newValue = currentValue;
      console.log(`✅ Value already in MINUTES format (${currentValue} minutes = ${Math.round(currentValue / 60 / 24 * 10) / 10} days)`);
      console.log(`   No migration needed.`);
    } else {
      console.log(`⚠️  Unexpected value: ${currentValue}`);
      console.log(`   Please check manually and update if needed.`);
      process.exit(1);
    }

    if (needsMigration) {
      // Update the value
      const result = await settingsCollection.updateOne(
        { settingType: 'global' },
        { 
          $set: { 
            sessionTimeout: newValue,
            updatedAt: new Date()
          }
        }
      );

      if (result.modifiedCount === 1) {
        console.log(`\n✅ Successfully migrated sessionTimeout!`);
        console.log(`   Old value: ${currentValue} days`);
        console.log(`   New value: ${newValue} minutes (${Math.round(newValue / 60 / 24 * 10) / 10} days)`);
        
        // Verify
        const updated = await settingsCollection.findOne({ settingType: 'global' });
        console.log(`\n📋 Verified updated value: ${updated.sessionTimeout} minutes\n`);
      } else {
        console.log(`\n⚠️  No documents were modified.`);
      }
    }

    console.log('\n🎉 Migration complete!');
    console.log('   The system now uses MINUTES for session timeout.');
    console.log('   Examples:');
    console.log('   - 3 minutes   = 3');
    console.log('   - 1 hour      = 60');
    console.log('   - 1 day       = 1440');
    console.log('   - 7 days      = 10080');
    console.log('   - 30 days     = 43200');

    process.exit(0);

  } catch (error) {
    console.error('❌ Error during migration:', error);
    console.error('Error details:', error.message);
    process.exit(1);
  }
}

// Run the function
migrateSessionTimeoutToMinutes();
