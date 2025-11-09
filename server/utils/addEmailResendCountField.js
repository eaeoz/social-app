import { connectToDatabase, getDatabase } from '../config/database.js';

/**
 * Add emailResendCount field to existing users
 * This utility ensures all users have the emailResendCount field initialized to 0
 */
async function addEmailResendCountField() {
  try {
    // Connect to database first
    await connectToDatabase();
    const db = getDatabase();
    const usersCollection = db.collection('users');
    const siteSettingsCollection = db.collection('siteSettings');

    console.log('🔄 Starting to add emailResendCount field to users...');

    // Get all users who don't have the emailResendCount field
    const usersWithoutField = await usersCollection.find({
      emailResendCount: { $exists: false }
    }).toArray();

    console.log(`📊 Found ${usersWithoutField.length} users without emailResendCount field`);

    if (usersWithoutField.length > 0) {
      // Update all users without the field
      const result = await usersCollection.updateMany(
        { emailResendCount: { $exists: false } },
        { $set: { emailResendCount: 0 } }
      );

      console.log(`✅ Updated ${result.modifiedCount} users with emailResendCount field`);
    } else {
      console.log('✅ All users already have emailResendCount field');
    }

    // Check and update siteSettings
    console.log('\n🔄 Checking siteSettings for verificationEmailResendCount...');
    const siteSettings = await siteSettingsCollection.findOne({ settingType: 'global' });

    if (siteSettings) {
      if (siteSettings.verificationEmailResendCount === undefined) {
        await siteSettingsCollection.updateOne(
          { settingType: 'global' },
          { $set: { verificationEmailResendCount: 4, updatedAt: new Date() } }
        );
        console.log('✅ Added verificationEmailResendCount to siteSettings (default: 4)');
      } else {
        console.log(`✅ siteSettings already has verificationEmailResendCount: ${siteSettings.verificationEmailResendCount}`);
      }
    } else {
      console.log('⚠️ No siteSettings found. Please run initializeSiteSettings first.');
    }

    console.log('\n✨ Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error adding emailResendCount field:', error);
    process.exit(1);
  }
}

// Run the migration
addEmailResendCountField();
