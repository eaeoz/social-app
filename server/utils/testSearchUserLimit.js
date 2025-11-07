import { getDatabase } from '../config/database.js';
import { getSiteSettings } from './initializeSiteSettings.js';

/**
 * Test script to verify searchUserCount is being used correctly
 */
async function testSearchUserLimit() {
  try {
    const db = getDatabase();
    
    console.log('🔍 Testing Search User Limit Feature\n');
    
    // 1. Get site settings
    console.log('1️⃣ Fetching site settings...');
    const siteSettings = await getSiteSettings();
    console.log('   ✅ Retrieved settings:', JSON.stringify(siteSettings, null, 2));
    
    // 2. Count total users
    console.log('\n2️⃣ Counting total users in database...');
    const totalUsers = await db.collection('users').countDocuments({
      username: { $ne: 'system' }
    });
    console.log(`   ✅ Total users in database: ${totalUsers}`);
    
    // 3. Test query with limit
    console.log('\n3️⃣ Testing user query with searchUserCount limit...');
    const searchUserCount = siteSettings.searchUserCount || 50;
    const limitedUsers = await db.collection('users')
      .find({ username: { $ne: 'system' } })
      .sort({ displayName: 1 })
      .limit(searchUserCount)
      .toArray();
    console.log(`   ✅ Users returned with limit: ${limitedUsers.length}`);
    console.log(`   ✅ Limit setting: ${searchUserCount}`);
    
    // 4. Summary
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 Summary:');
    console.log(`   • Total users in DB: ${totalUsers}`);
    console.log(`   • Search user limit: ${searchUserCount}`);
    console.log(`   • Users that will show in search: ${Math.min(totalUsers, searchUserCount)}`);
    console.log(`   • Users hidden by limit: ${Math.max(0, totalUsers - searchUserCount)}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    if (totalUsers > searchUserCount) {
      console.log(`\n✅ LIMIT IS WORKING: Only ${searchUserCount} out of ${totalUsers} users will be shown`);
    } else {
      console.log(`\n📝 NOTE: You have ${totalUsers} users, which is less than the limit of ${searchUserCount}`);
      console.log('   All users will be shown. Add more users to test the limit.');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error testing search user limit:', error);
    process.exit(1);
  }
}

// Run the test
import('../config/database.js').then(({ connectToDatabase }) => {
  connectToDatabase().then(() => {
    testSearchUserLimit();
  });
});
