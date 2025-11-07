import { getDatabase } from '../config/database.js';

/**
 * Update test users with realistic lastActiveAt timestamps
 * Set 50 users as recently active (online) and 50 as inactive (offline)
 */
async function updateTestUsersActivity() {
  try {
    const db = getDatabase();
    const usersCollection = db.collection('users');

    // Get all non-system users
    const allUsers = await usersCollection
      .find({ username: { $ne: 'system' } })
      .toArray();

    console.log(`📊 Found ${allUsers.length} users to update\n`);

    const now = new Date();
    let onlineCount = 0;
    let offlineCount = 0;

    // Update each user
    for (const user of allUsers) {
      const isOnline = user.status === 'online';
      
      let lastActiveAt;
      if (isOnline) {
        // Online users: set lastActiveAt to within last 2 minutes
        const randomSeconds = Math.floor(Math.random() * 120); // 0-120 seconds ago
        lastActiveAt = new Date(now.getTime() - (randomSeconds * 1000));
        onlineCount++;
      } else {
        // Offline users: set lastActiveAt to 6+ minutes ago (beyond the 5-minute timeout)
        const randomMinutes = Math.floor(Math.random() * 300) + 6; // 6-306 minutes ago
        lastActiveAt = new Date(now.getTime() - (randomMinutes * 60 * 1000));
        offlineCount++;
      }

      // Update user with lastActiveAt and lastSeen
      await usersCollection.updateOne(
        { _id: user._id },
        {
          $set: {
            lastActiveAt: lastActiveAt,
            lastSeen: isOnline ? now : lastActiveAt,
            updatedAt: now
          }
        }
      );
    }

    console.log('✅ Successfully updated all users!\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 SUMMARY:');
    console.log(`   • Total users updated: ${allUsers.length}`);
    console.log(`   • Online users (active in last 2 min): ${onlineCount}`);
    console.log(`   • Offline users (inactive 6+ min): ${offlineCount}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    console.log('\n💡 How it works:');
    console.log('   • Online users: lastActiveAt set to 0-2 minutes ago');
    console.log('   • Offline users: lastActiveAt set to 6-306 minutes ago');
    console.log('   • System has 5-minute timeout for inactivity');
    console.log('   • Users will show "Last seen" timestamps correctly now');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error updating users:', error);
    process.exit(1);
  }
}

// Run the script
import('../config/database.js').then(({ connectToDatabase }) => {
  connectToDatabase().then(() => {
    updateTestUsersActivity();
  });
});
