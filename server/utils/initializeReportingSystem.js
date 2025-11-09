import { getDatabase } from '../config/database.js';

/**
 * Initialize the reporting system by adding required fields to database
 */
export async function initializeReportingSystem() {
  try {
    const db = getDatabase();
    const usersCollection = db.collection('users');
    const siteSettingsCollection = db.collection('siteSettings');

    console.log('🔧 Initializing reporting system...');

    // 1. Add reports array and suspension fields to all users that don't have them
    const usersResult = await usersCollection.updateMany(
      { 
        $or: [
          { reports: { $exists: false } },
          { userSuspended: { $exists: false } }
        ]
      },
      {
        $set: {
          reports: [],
          userSuspended: false
        }
      }
    );

    if (usersResult.modifiedCount > 0) {
      console.log(`✅ Added reporting fields to ${usersResult.modifiedCount} users`);
    } else {
      console.log('✅ All users already have reporting fields');
    }

    // 2. Add maxReportCount to siteSettings if it doesn't exist
    const siteSettings = await siteSettingsCollection.findOne({ settingType: 'global' });

    if (siteSettings && !siteSettings.maxReportCount) {
      await siteSettingsCollection.updateOne(
        { settingType: 'global' },
        {
          $set: {
            maxReportCount: 5, // Default: 5 reports before suspension
            updatedAt: new Date()
          }
        }
      );
      console.log('✅ Added maxReportCount (5) to siteSettings');
    } else if (siteSettings && siteSettings.maxReportCount) {
      console.log(`✅ maxReportCount already exists: ${siteSettings.maxReportCount}`);
    } else {
      // Create siteSettings if it doesn't exist
      await siteSettingsCollection.insertOne({
        settingType: 'global',
        maxReportCount: 5,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      console.log('✅ Created siteSettings with maxReportCount (5)');
    }

    console.log('✅ Reporting system initialized successfully!');

  } catch (error) {
    console.error('❌ Error initializing reporting system:', error);
    throw error;
  }
}

// Run this script directly if needed
if (import.meta.url === `file://${process.argv[1]}`) {
  const { connectToDatabase } = await import('../config/database.js');
  await connectToDatabase();
  await initializeReportingSystem();
  process.exit(0);
}
