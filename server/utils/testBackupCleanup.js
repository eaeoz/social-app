import { connectToDatabase, getDatabase } from '../config/database.js';
import { manualCleanup } from './backupAndCleanup.js';

async function testBackupCleanup() {
  try {
    await connectToDatabase();
    const db = getDatabase();
    
    console.log('🔍 Checking database for messages...');
    
    // Count messages
    const messagesCount = await db.collection('messages').countDocuments();
    console.log(`📊 Total messages: ${messagesCount}`);
    
    // Count private chats
    const privatechatsCount = await db.collection('privatechats').countDocuments();
    console.log(`📊 Total private chats: ${privatechatsCount}`);
    
    if (messagesCount === 0 && privatechatsCount === 0) {
      console.log('\n⚠️ No messages or private chats found in database');
      console.log('💡 Create some test messages first to test the backup functionality');
      process.exit(0);
      return;
    }
    
    // Check age of messages
    const cleanCycle = 90; // days
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - cleanCycle);
    
    const oldMessagesCount = await db.collection('messages').countDocuments({
      timestamp: { $lt: cutoffDate }
    });
    
    const oldPrivateChatsCount = await db.collection('privatechats').countDocuments({
      createdAt: { $lt: cutoffDate }
    });
    
    console.log(`\n📅 Messages older than ${cleanCycle} days (${cutoffDate.toLocaleDateString()}):`);
    console.log(`   - Old messages: ${oldMessagesCount}`);
    console.log(`   - Old private chats: ${oldPrivateChatsCount}`);
    
    if (oldMessagesCount === 0 && oldPrivateChatsCount === 0) {
      console.log('\n✅ No old messages to backup (all messages are newer than 90 days)');
      console.log('💡 This is expected for a new system. The cleanup will run when messages are older.');
      process.exit(0);
      return;
    }
    
    console.log('\n🧹 Testing backup and cleanup...');
    const result = await manualCleanup();
    
    console.log('\n✅ Backup and cleanup test completed!');
    console.log('📋 Results:');
    console.log(JSON.stringify(result, null, 2));
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error testing backup:', error);
    process.exit(1);
  }
}

testBackupCleanup();
