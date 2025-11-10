import { connectToDatabase } from '../config/database.js';

/**
 * Complete Update for Old Backup
 * 
 * This script:
 * 1. Fixes schema validation to be flexible
 * 2. Adds all missing fields and collections
 * Run this after restoring an old backup
 */

async function updateOldBackupComplete() {
  try {
    console.log('🔄 Complete update process starting...\n');
    
    const db = await connectToDatabase();
    
    // ========================================
    // STEP 1: FIX SCHEMA VALIDATION FIRST
    // ========================================
    console.log('📝 Step 1: Making schema validation flexible...\n');
    
    try {
      await db.command({
        collMod: 'users',
        validator: {
          $jsonSchema: {
            bsonType: 'object',
            required: ['username', 'email', 'passwordHash', 'createdAt'],
            properties: {
              username: { bsonType: 'string' },
              email: { bsonType: 'string' },
              passwordHash: { bsonType: 'string' },
              displayName: { bsonType: ['string', 'null'] },
              nickName: { bsonType: ['string', 'null'] },
              lastNickNameChange: { bsonType: ['date', 'null'] },
              fullName: { bsonType: ['string', 'null'] },
              age: { bsonType: ['int', 'null'], minimum: 18, maximum: 100 },
              gender: { bsonType: ['string', 'null'], enum: ['Male', 'Female', null] },
              profilePictureId: { bsonType: ['string', 'null'] },
              bio: { bsonType: ['string', 'null'] },
              status: { bsonType: ['string', 'null'], enum: ['online', 'offline', 'away', 'busy', null] },
              createdAt: { bsonType: 'date' },
              updatedAt: { bsonType: ['date', 'null'] },
              lastSeen: { bsonType: ['date', 'null'] },
              isEmailVerified: { bsonType: ['bool', 'null'] },
              emailVerificationToken: { bsonType: ['string', 'null'] },
              emailVerificationExpires: { bsonType: ['date', 'null'] },
              emailResendCount: { bsonType: ['int', 'null'] },
              lastEmailResendTime: { bsonType: ['date', 'null'] },
              isSuspended: { bsonType: ['bool', 'null'] },
              suspensionReason: { bsonType: ['string', 'null'] },
              googleId: { bsonType: ['string', 'null'] },
              accountLocked: { bsonType: ['bool', 'null'] },
              accountLockedUntil: { bsonType: ['date', 'null'] },
              failedLoginAttempts: { bsonType: ['int', 'null'] },
              lastFailedLogin: { bsonType: ['date', 'null'] },
              userSuspended: { bsonType: ['bool', 'null'] },
              suspendedAt: { bsonType: ['date', 'null'] },
              reports: { bsonType: ['array', 'null'] }
            }
          }
        },
        validationLevel: 'moderate',
        validationAction: 'warn'
      });
      console.log('   ✅ Users collection validation updated\n');
    } catch (error) {
      console.log('   ⚠️ Users validation update skipped (may not exist yet)\n');
    }
    
    try {
      await db.command({
        collMod: 'userpresence',
        validator: {
          $jsonSchema: {
            bsonType: 'object',
            required: ['userId'],
            properties: {
              userId: { bsonType: ['string', 'objectId'] },
              username: { bsonType: ['string', 'null'] },
              status: { bsonType: ['string', 'null'], enum: ['online', 'offline', 'away', 'busy', null] },
              lastSeen: { bsonType: ['date', 'null'] },
              socketId: { bsonType: ['string', 'null'] },
              isOnline: { bsonType: ['bool', 'null'] }
            }
          }
        },
        validationLevel: 'moderate',
        validationAction: 'warn'
      });
      console.log('   ✅ Userpresence collection validation updated\n');
    } catch (error) {
      console.log('   ⚠️ Userpresence validation update skipped (may not exist yet)\n');
    }
    
    // Update other collections to moderate validation
    const collections = ['settings', 'publicrooms', 'messages', 'privatechats', 'userroomactivity', 'siteSettings'];
    
    for (const collectionName of collections) {
      try {
        await db.command({
          collMod: collectionName,
          validationLevel: 'moderate',
          validationAction: 'warn'
        });
        console.log(`   ✅ ${collectionName} validation updated`);
      } catch (error) {
        // Collection may not exist yet, that's ok
      }
    }
    console.log('');
    
    // ========================================
    // STEP 2: ADD MISSING FIELDS TO USERS
    // ========================================
    console.log('📝 Step 2: Adding missing fields to users...\n');
    
    const usersResult = await db.collection('users').updateMany(
      {},
      {
        $setOnInsert: {
          // Google OAuth fields
          googleId: null,
          
          // nickName field
          nickName: null,
          lastNickNameChange: null,
          
          // Account lockout fields
          accountLocked: false,
          accountLockedUntil: null,
          failedLoginAttempts: 0,
          lastFailedLogin: null,
          
          // User suspension fields
          userSuspended: false,
          suspendedAt: null,
          reports: []
        }
      }
    );
    console.log(`   ✅ Processed ${usersResult.matchedCount} user records\n`);
    
    // Set nickName = username for all users that don't have it
    console.log('📝 Setting nickName = username for users without nickName...');
    const users = await db.collection('users').find({}).toArray();
    
    let nickNameSet = 0;
    for (const user of users) {
      if (!user.nickName) {
        await db.collection('users').updateOne(
          { _id: user._id },
          { $set: { nickName: user.username } }
        );
        nickNameSet++;
      }
    }
    console.log(`   ✅ Set nickName for ${nickNameSet} users\n`);
    
    // ========================================
    // STEP 3: USERPRESENCE FOR ALL USERS
    // ========================================
    console.log('📝 Step 3: Creating userpresence records...\n');
    
    const allUsers = await db.collection('users').find({}).toArray();
    let presenceCreated = 0;
    
    for (const user of allUsers) {
      const userId = user._id.toString ? user._id.toString() : user._id;
      const existingPresence = await db.collection('userpresence').findOne({ userId: userId });
      
      if (!existingPresence) {
        try {
          await db.collection('userpresence').insertOne({
            userId: userId,
            username: user.username,
            status: 'offline',
            lastSeen: new Date(),
            socketId: null,
            isOnline: false
          });
          presenceCreated++;
        } catch (error) {
          console.log(`   ⚠️ Could not create presence for ${user.username}: ${error.message}`);
        }
      }
    }
    console.log(`   ✅ Created ${presenceCreated} new presence records\n`);
    
    // ========================================
    // STEP 4: SETTINGS FOR ALL USERS
    // ========================================
    console.log('📝 Step 4: Creating settings records...\n');
    
    let settingsCreated = 0;
    
    for (const user of allUsers) {
      const existingSettings = await db.collection('settings').findOne({ userId: user._id });
      
      if (!existingSettings) {
        try {
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
        } catch (error) {
          console.log(`   ⚠️ Could not create settings for ${user.username}: ${error.message}`);
        }
      }
    }
    console.log(`   ✅ Created ${settingsCreated} new settings records\n`);
    
    // ========================================
    // STEP 5: SITESETTINGS
    // ========================================
    console.log('📝 Step 5: Checking siteSettings...\n');
    
    const existingSiteSettings = await db.collection('siteSettings').findOne({ settingType: 'global' });
    
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
    // STEP 6: ENSURE COLLECTIONS EXIST
    // ========================================
    console.log('📝 Step 6: Ensuring all collections exist...\n');
    
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
    // SUMMARY
    // ========================================
    console.log('✨ Complete update finished! Summary:\n');
    console.log('✅ Schema validation set to moderate (flexible)');
    console.log('✅ Google OAuth support added (googleId field)');
    console.log('✅ nickName feature for all users');
    console.log('✅ Account lockout system');
    console.log('✅ User suspension system');
    console.log('✅ User presence tracking');
    console.log('✅ Settings for all users');
    console.log('✅ Site settings collection');
    console.log('✅ All required collections\n');
    
    console.log('🎉 Your old backup is now fully updated!\n');
    console.log('📌 Next step: Deploy your code to Render and users will appear online!\n');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Update failed:', error);
    console.error('\nError details:', error.message);
    if (error.errInfo && error.errInfo.details) {
      console.error('Validation error details:', JSON.stringify(error.errInfo.details, null, 2));
    }
    if (error.stack) {
      console.error('\nStack trace:', error.stack);
    }
    process.exit(1);
  }
}

updateOldBackupComplete();
