import { connectToDatabase, getDatabase } from '../config/database.js';

async function updateDisplayNames() {
  try {
    console.log('✅ Connected to MongoDB Atlas');
    await connectToDatabase();
    console.log('✅ Database ping successful');

    const db = getDatabase();
    const usersCollection = db.collection('users');

    console.log('🔄 Starting to update displayName for all users...');

    // Find all users
    const users = await usersCollection.find({}).toArray();
    console.log(`📊 Found ${users.length} users to check`);

    let updatedCount = 0;
    let skippedCount = 0;

    for (const user of users) {
      // Set displayName = nickName (or username if nickName doesn't exist)
      const displayName = user.nickName || user.username;
      
      if (user.displayName !== displayName) {
        await usersCollection.updateOne(
          { _id: user._id },
          { $set: { displayName: displayName } }
        );
        console.log(`✅ Updated ${user.username}: displayName = "${displayName}"`);
        updatedCount++;
      } else {
        console.log(`⏭️  User ${user.username} already has correct displayName: ${displayName}`);
        skippedCount++;
      }
    }

    console.log('\n📈 Update Summary:');
    console.log(`   ✅ Updated: ${updatedCount} users`);
    console.log(`   ⏭️  Skipped: ${skippedCount} users (already correct)`);
    console.log(`   📊 Total: ${users.length} users`);

    console.log('\n✅ All operations completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

updateDisplayNames();
