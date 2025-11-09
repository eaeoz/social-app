import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { forceDisconnectUser } from './forceDisconnectUser.js';
import { storage, BUCKET_ID } from '../config/appwrite.js';

// Load environment variables from the root .env file
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const envPath = resolve(__dirname, '../../.env');

dotenv.config({ path: envPath });

async function deleteUser(username) {
  let client;
  try {
    const uri = process.env.MONGODB_URI;
    const dbName = process.env.MONGODB_DB_NAME || 'social-app';
    
    // Connect to MongoDB
    client = new MongoClient(uri);
    await client.connect();
    const db = client.db(dbName);
    
    console.log(`🔍 Looking for user: ${username}`);
    
    // Find the user first
    const user = await db.collection('users').findOne({ username });
    
    if (!user) {
      console.log(`❌ User "${username}" not found`);
      process.exit(1);
    }
    
    console.log(`✅ Found user: ${user.username} (${user._id})`);
    console.log('🗑️  Starting comprehensive deletion process...\n');
    
    const userId = user._id;
    let deletionStats = {
      users: 0,
      userpresence: 0,
      settings: 0,
      messages: 0,
      privatechats: 0,
      publicrooms: 0,
      notifications: 0,
      typing: 0,
      passwordresets: 0
    };
    
    // 0. Delete profile picture from Appwrite (if exists)
    if (user.profilePictureId) {
      console.log('0️⃣  Deleting profile picture from Appwrite...');
      try {
        await storage.deleteFile(BUCKET_ID, user.profilePictureId);
        console.log(`   ✅ Deleted profile picture: ${user.profilePictureId}`);
      } catch (error) {
        if (error.code === 404) {
          console.log(`   ⚠️  Profile picture not found (may have been deleted already)`);
        } else {
          console.log(`   ⚠️  Could not delete profile picture: ${error.message}`);
        }
      }
    } else {
      console.log('0️⃣  No profile picture to delete');
    }
    
    // 1. Delete from users collection
    console.log('1️⃣  Deleting user account...');
    const userResult = await db.collection('users').deleteOne({ _id: userId });
    deletionStats.users = userResult.deletedCount;
    console.log(`   ✅ Deleted ${deletionStats.users} user account`);
    
    // 2. Delete user presence
    console.log('2️⃣  Deleting user presence...');
    const presenceResult = await db.collection('userpresence').deleteMany({ userId });
    deletionStats.userpresence = presenceResult.deletedCount;
    console.log(`   ✅ Deleted ${deletionStats.userpresence} presence records`);
    
    // 3. Delete user settings
    console.log('3️⃣  Deleting user settings...');
    const settingsResult = await db.collection('settings').deleteMany({ userId });
    deletionStats.settings = settingsResult.deletedCount;
    console.log(`   ✅ Deleted ${deletionStats.settings} settings`);
    
    // 4. Delete all messages (sent and received)
    console.log('4️⃣  Deleting messages...');
    const messagesResult = await db.collection('messages').deleteMany({
      $or: [
        { senderId: userId },
        { receiverId: userId }
      ]
    });
    deletionStats.messages = messagesResult.deletedCount;
    console.log(`   ✅ Deleted ${deletionStats.messages} messages`);
    
    // 5. Delete private chats
    console.log('5️⃣  Deleting private chats...');
    const privateChatsResult = await db.collection('privatechats').deleteMany({
      participants: userId
    });
    deletionStats.privatechats = privateChatsResult.deletedCount;
    console.log(`   ✅ Deleted ${deletionStats.privatechats} private chats`);
    
    // 6. Remove user from public rooms
    console.log('6️⃣  Removing from public rooms...');
    const roomsResult = await db.collection('publicrooms').updateMany(
      { participants: userId },
      { 
        $pull: { participants: userId },
        $set: { updatedAt: new Date() }
      }
    );
    deletionStats.publicrooms = roomsResult.modifiedCount;
    console.log(`   ✅ Removed from ${deletionStats.publicrooms} public rooms`);
    
    // 7. Delete notifications
    console.log('7️⃣  Deleting notifications...');
    const notificationsResult = await db.collection('notifications').deleteMany({ userId });
    deletionStats.notifications = notificationsResult.deletedCount;
    console.log(`   ✅ Deleted ${deletionStats.notifications} notifications`);
    
    // 8. Delete typing indicators
    console.log('8️⃣  Deleting typing indicators...');
    const typingResult = await db.collection('typing').deleteMany({ userId });
    deletionStats.typing = typingResult.deletedCount;
    console.log(`   ✅ Deleted ${deletionStats.typing} typing indicators`);
    
    // 9. Delete password reset tokens
    console.log('9️⃣  Deleting password reset tokens...');
    const passwordResetsResult = await db.collection('passwordresets').deleteMany({ userId });
    deletionStats.passwordresets = passwordResetsResult.deletedCount;
    console.log(`   ✅ Deleted ${deletionStats.passwordresets} password reset tokens`);
    
    // 10. Force disconnect any active sessions
    console.log('🔌 Forcing disconnect of active sessions...');
    try {
      await forceDisconnectUser(userId.toString(), 'Your account has been deleted');
      console.log('   ✅ Active sessions disconnected');
    } catch (error) {
      console.log(`   ⚠️  Could not force disconnect (server may not be running): ${error.message}`);
    }
    
    // Print summary
    console.log('\n' + '='.repeat(60));
    console.log('🎉 DELETION COMPLETE - Summary:');
    console.log('='.repeat(60));
    console.log(`👤 User: ${username} (${userId})`);
    console.log(`📊 Statistics:`);
    console.log(`   - Users deleted: ${deletionStats.users}`);
    console.log(`   - Presence records: ${deletionStats.userpresence}`);
    console.log(`   - Settings: ${deletionStats.settings}`);
    console.log(`   - Messages: ${deletionStats.messages}`);
    console.log(`   - Private chats: ${deletionStats.privatechats}`);
    console.log(`   - Public rooms updated: ${deletionStats.publicrooms}`);
    console.log(`   - Notifications: ${deletionStats.notifications}`);
    console.log(`   - Typing indicators: ${deletionStats.typing}`);
    console.log(`   - Password resets: ${deletionStats.passwordresets}`);
    console.log('='.repeat(60));
    console.log('✅ All user data has been permanently deleted!');
    console.log('='.repeat(60) + '\n');
    
    process.exit(0);
  } catch (error) {
    console.error('Error deleting user:', error);
    process.exit(1);
  }
}

// Get username from command line argument
const username = process.argv[2];

if (!username) {
  console.error('Usage: node deleteUser.js <username>');
  process.exit(1);
}

deleteUser(username);
