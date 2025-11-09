import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { storage, BUCKET_ID } from '../config/appwrite.js';

// Load environment variables from the root .env file
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const envPath = resolve(__dirname, '../../.env');

dotenv.config({ path: envPath });

async function deleteAllUsersExcept(protectedUsername) {
  let client;
  try {
    const uri = process.env.MONGODB_URI;
    const dbName = process.env.MONGODB_DB_NAME || 'social-app';
    
    // Connect to MongoDB
    client = new MongoClient(uri);
    await client.connect();
    const db = client.db(dbName);
    
    console.log('🔍 Finding all users except:', protectedUsername);
    console.log('⚠️  WARNING: This will delete ALL users except the protected one!');
    console.log('⏳ Starting in 5 seconds... Press Ctrl+C to cancel\n');
    
    // Give user time to cancel
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Find all users except the protected one
    const usersToDelete = await db.collection('users').find({
      username: { $ne: protectedUsername }
    }).toArray();
    
    if (usersToDelete.length === 0) {
      console.log('✅ No users to delete');
      process.exit(0);
    }
    
    console.log(`📊 Found ${usersToDelete.length} users to delete:\n`);
    usersToDelete.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.username} (${user._id})`);
    });
    
    console.log('\n🗑️  Starting deletion process...\n');
    
    let totalStats = {
      usersDeleted: 0,
      profilePicturesDeleted: 0,
      presenceDeleted: 0,
      settingsDeleted: 0,
      messagesDeleted: 0,
      privateChatsDeleted: 0,
      roomsUpdated: 0,
      notificationsDeleted: 0,
      typingDeleted: 0,
      passwordResetsDeleted: 0
    };
    
    // Delete each user
    for (let i = 0; i < usersToDelete.length; i++) {
      const user = usersToDelete[i];
      const userId = user._id;
      
      console.log(`\n[${i + 1}/${usersToDelete.length}] Deleting user: ${user.username}`);
      console.log('─'.repeat(60));
      
      // 0. Delete profile picture from Appwrite
      if (user.profilePictureId) {
        try {
          await storage.deleteFile(BUCKET_ID, user.profilePictureId);
          totalStats.profilePicturesDeleted++;
          console.log(`   📸 Deleted profile picture`);
        } catch (error) {
          if (error.code !== 404) {
            console.log(`   ⚠️  Could not delete profile picture: ${error.message}`);
          }
        }
      }
      
      // 1. Delete user account
      const userResult = await db.collection('users').deleteOne({ _id: userId });
      totalStats.usersDeleted += userResult.deletedCount;
      
      // 2. Delete user presence
      const presenceResult = await db.collection('userpresence').deleteMany({ userId });
      totalStats.presenceDeleted += presenceResult.deletedCount;
      
      // 3. Delete user settings
      const settingsResult = await db.collection('settings').deleteMany({ userId });
      totalStats.settingsDeleted += settingsResult.deletedCount;
      
      // 4. Delete messages
      const messagesResult = await db.collection('messages').deleteMany({
        $or: [{ senderId: userId }, { receiverId: userId }]
      });
      totalStats.messagesDeleted += messagesResult.deletedCount;
      
      // 5. Delete private chats
      const privateChatsResult = await db.collection('privatechats').deleteMany({
        participants: userId
      });
      totalStats.privateChatsDeleted += privateChatsResult.deletedCount;
      
      // 6. Remove from public rooms
      const roomsResult = await db.collection('publicrooms').updateMany(
        { participants: userId },
        { 
          $pull: { participants: userId },
          $set: { updatedAt: new Date() }
        }
      );
      totalStats.roomsUpdated += roomsResult.modifiedCount;
      
      // 7. Delete notifications
      const notificationsResult = await db.collection('notifications').deleteMany({ userId });
      totalStats.notificationsDeleted += notificationsResult.deletedCount;
      
      // 8. Delete typing indicators
      const typingResult = await db.collection('typing').deleteMany({ userId });
      totalStats.typingDeleted += typingResult.deletedCount;
      
      // 9. Delete password resets
      const passwordResetsResult = await db.collection('passwordresets').deleteMany({ userId });
      totalStats.passwordResetsDeleted += passwordResetsResult.deletedCount;
      
      console.log(`   ✅ ${user.username} deleted`);
    }
    
    // Print final summary
    console.log('\n' + '='.repeat(70));
    console.log('🎉 BULK DELETION COMPLETE - Final Summary:');
    console.log('='.repeat(70));
    console.log(`🔒 Protected user: ${protectedUsername}`);
    console.log(`📊 Total Statistics:`);
    console.log(`   - Users deleted: ${totalStats.usersDeleted}`);
    console.log(`   - Profile pictures deleted: ${totalStats.profilePicturesDeleted}`);
    console.log(`   - Presence records: ${totalStats.presenceDeleted}`);
    console.log(`   - Settings: ${totalStats.settingsDeleted}`);
    console.log(`   - Messages: ${totalStats.messagesDeleted}`);
    console.log(`   - Private chats: ${totalStats.privateChatsDeleted}`);
    console.log(`   - Public rooms updated: ${totalStats.roomsUpdated}`);
    console.log(`   - Notifications: ${totalStats.notificationsDeleted}`);
    console.log(`   - Typing indicators: ${totalStats.typingDeleted}`);
    console.log(`   - Password resets: ${totalStats.passwordResetsDeleted}`);
    console.log('='.repeat(70));
    console.log('✅ All users (except protected) have been permanently deleted!');
    console.log('='.repeat(70) + '\n');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during bulk deletion:', error);
    process.exit(1);
  } finally {
    if (client) {
      await client.close();
    }
  }
}

// Get protected username from command line argument (default: 'sedat')
const protectedUsername = process.argv[2] || 'sedat';

console.log('\n' + '⚠️'.repeat(35));
console.log('⚠️  DANGER: BULK USER DELETION UTILITY  ⚠️');
console.log('⚠️'.repeat(35));
console.log(`\nThis will DELETE ALL USERS except: "${protectedUsername}"`);
console.log('\nThis action is IRREVERSIBLE and will remove:');
console.log('  • User accounts');
console.log('  • Profile pictures from Appwrite');
console.log('  • All messages');
console.log('  • All private chats');
console.log('  • All user data from database\n');

deleteAllUsersExcept(protectedUsername);
