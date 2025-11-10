import { connectToDatabase } from '../config/database.js';

/**
 * Update Old Backup with New Features
 * 
 * This script adds missing fields and collections that were added after your backup
 * Run this after restoring an old backup to add new features like Google OAuth
 */

async function updateOldBackup() {
  try {
    console.log('🔄 Updating old backup with new features...\n');
    
    const db = await connectToDatabase();
    
    // ========================================
    // 1. ADD MISSING FIELDS TO USERS
    // ========================================
    console.log('📝 Adding missing fields to users collection...');
    
    const usersResult = await db.collection('users').updateMany(
      {},
      {
        $set: {
          // Google OAuth fields (if not exists)
          googleId: null,
          
          // nickName field (if not exists)
          nickName: null,
          lastNickNameChange: null,
          
          // Account lockout fields (if not exists)
          accountLocked: false,
          accountLockedUntil: null,
          failedLoginAttempts: 0,
          lastFailedLogin: null,
          
          // User suspension fields (if not exists)
          userSuspended: false,
          suspendedAt: null,
          reports: []
        }
      }
    );
    console.log(`   ✅ Updated ${usersResult.modifiedCount} user records\n`);
    
    // Set nickName = username for all users that don't have it
    console.log('📝 Setting nickName = username for users without nickName...');
    const users = await db.collection('users').find({ 
      $or: [{ nickName: null }, { nickName: { $exists: false } }] 
    }).toArray();
    
    for (const user of users) {
      await db.collection('users').updateOne(
        { _id: user._id },
        { $set: { nickName: user.username } }
      );
    }
    console.log(`   ✅ Set nickName for ${users.length} users\n`);
    
    // ========================================
    // 2. ENSURE USERPRESENCE EXISTS FOR ALL USERS
    // ========================================
    console.log('📝 Creating userpresence records for all users...');
    
    const allUsers = await db.collection('users').find({}).toArray();
    let presenceCreated = 0;
    
    for (const user of allUsers) {
      const existingPresence = await db.collection('userpresence').findOne({ 
        userId: user._id.toString() 
      });
      
      if (!existingPresence) {
        await db.collection('userpresence').insertOne({
          userId: user._id.toString(),
          username: user.username,
          status: 'offline',
          lastSeen: new Date(),
          socketId: null
        });
        presenceCreated++;
      }
    }
    console.log(`   ✅ Created ${presenceCreated} new presence records\n`);
    
    // ========================================
    // 3. ENSURE SETTINGS EXISTS FOR ALL USERS
    // ========================================
    console.log('📝 Creating settings records for all users...');
    
    let settingsCreated = 0;
    
    for (const user of allUsers) {
      const existingSettings = await db.collection('settings').findOne({ 
        userId: user._id 
      });
      
      if (!existingSettings) {
        await db.collection('settings').insertOne({
          userId: user._id,
          theme: 'light',
          notifications: true,
          notificationSettings: {
            messageSound: true,
            privateChatNotifications: true,
            publicRoomNotifications: true,
            emailNotifications: false
          },
          language: 'en',
          privacy: {
            showOnlineStatus: true,
            showLastSeen: true,
            allowPrivateMessages: true
          },
          updatedAt: new Date()
        });
        settingsCreated++;
      }
    }
    console.log(`   ✅ Created ${settingsCreated} new settings records\n`);
    
    // ========================================
    // 4. ENSURE SITESETTINGS COLLECTION EXISTS
    // ========================================
    console.log('📝 Checking siteSettings collection...');
    
    const existingSiteSettings = await db.collection('siteSettings').findOne({ 
      settingType: 'global' 
    });
    
    if (!existingSiteSettings) {
      await db.collection('siteSettings').insertOne({
        settingType: 'global',
        verificationEmailResendCount: 4,
        siteEmail: process.env.SMTP_FROM || 'noreply@example.com',
        maxUsersDisplayCount: 50,
        maxSearchUserCount: 10,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      console.log('   ✅ Created siteSettings record\n');
    } else {
      console.log('   ✅ siteSettings already exists\n');
    }
    
    // ========================================
    // 5. ENSURE REQUIRED COLLECTIONS EXIST
    // ========================================
    console.log('📝 Ensuring all required collections exist...');
    
    const requiredCollections = [
      'users',
      'userpresence', 
      'settings',
      'publicrooms',
      'messages',
      'privatechats',
      'userroomactivity',
      'siteSettings',
      'passwordresets',
      'notifications',
      'typing'
    ];
    
    const existingCollections = await db.listCollections().toArray();
    const existingNames = existingCollections.map(c => c.name);
    
    for (const collectionName of requiredCollections) {
      if (!existingNames.includes(collectionName)) {
        await db.createCollection(collectionName);
        console.log(`   ✅ Created collection: ${collectionName}`);
      }
    }
    console.log('');
    
    // ========================================
    // 6. SUMMARY
    // ========================================
    console.log('✨ Update complete! Summary:\n');
    console.log('Added/Updated features:');
    console.log('   ✅ Google OAuth support (googleId field)');
    console.log('   ✅ nickName feature for all users');
    console.log('   ✅ Account lockout system');
    console.log('   ✅ User suspension system');
    console.log('   ✅ User presence tracking');
    console.log('   ✅ Settings for all users');
    console.log('   ✅ Site settings collection');
    console.log('   ✅ All required collections\n');
    
    console.log('🎉 Your old backup is now updated with all new features!\n');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Update failed:', error);
    console.error('\nError details:', error.message);
    if (error.stack) {
      console.error('\nStack trace:', error.stack);
    }
    process.exit(1);
  }
}

updateOldBackup();
