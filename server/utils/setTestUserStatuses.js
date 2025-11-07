import { getDatabase } from '../config/database.js';

/**
 * Set 25 users to online and 25 to offline for testing
 */
async function setTestUserStatuses() {
  try {
    const db = getDatabase();
    const usersCollection = db.collection('users');

    // Get all non-system users
    const allUsers = await usersCollection
      .find({ username: { $ne: 'system' } })
      .sort({ displayName: 1 })
      .toArray();

    console.log(`📊 Found ${allUsers.length} total users\n`);

    if (allUsers.length < 50) {
      console.log(`⚠️  You have less than 50 users. Setting status for all ${allUsers.length} users...`);
    }

    // Set first 25 to online
    const onlineCount = Math.min(25, allUsers.length);
    const onlineUsers = allUsers.slice(0, onlineCount);

    for (const user of onlineUsers) {
      await usersCollection.updateOne(
        { _id: user._id },
        { 
          $set: { 
            status: 'online',
            lastSeen: new Date()
          } 
        }
      );
    }

    console.log(`✅ Set ${onlineCount} users to ONLINE`);
    onlineUsers.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.displayName} (${user.username})`);
    });

    // Set next 25 (or remaining) to offline
    if (allUsers.length > 25) {
      const offlineCount = Math.min(25, allUsers.length - 25);
      const offlineUsers = allUsers.slice(25, 25 + offlineCount);

      for (const user of offlineUsers) {
        await usersCollection.updateOne(
          { _id: user._id },
          { 
            $set: { 
              status: 'offline',
              lastSeen: new Date(Date.now() - 60000) // 1 minute ago
            } 
          }
        );
      }

      console.log(`\n✅ Set ${offlineCount} users to OFFLINE`);
      offlineUsers.forEach((user, index) => {
        console.log(`   ${index + 1}. ${user.displayName} (${user.username})`);
      });
    }

    // Summary
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 Summary:');
    console.log(`   • Total users: ${allUsers.length}`);
    console.log(`   • Online users: ${onlineCount}`);
    console.log(`   • Offline users: ${allUsers.length > 25 ? Math.min(25, allUsers.length - 25) : 0}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n💡 Testing Tips:');
    console.log('   1. Open user modal WITHOUT typing in search → Should show ~20 online users');
    console.log('   2. Type in search box → Should show ALL users (online + offline) matching search');
    console.log('   3. These users will become offline in 5 minutes automatically');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error setting user statuses:', error);
    process.exit(1);
  }
}

// Run the script
import('../config/database.js').then(({ connectToDatabase }) => {
  connectToDatabase().then(() => {
    setTestUserStatuses();
  });
});
