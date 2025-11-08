import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

async function clearPublicMessages() {
  const dbName = process.env.MONGODB_DB_NAME || 'social-app';
  const client = new MongoClient(process.env.MONGODB_URI);
  
  try {
    console.log('🔌 Connecting to MongoDB...');
    console.log('🔗 URI:', process.env.MONGODB_URI?.replace(/:[^:@]+@/, ':****@')); // Hide password
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db(dbName);
    console.log('🗄️  Using database:', dbName);
    
    console.log('🗑️  Clearing all public room messages...');
    
    // First, count how many public messages exist (messages with roomId field)
    const publicMessagesCount = await db.collection('messages').countDocuments({
      roomId: { $exists: true }
    });
    console.log(`📊 Found ${publicMessagesCount} public room messages (with roomId)`);
    
    // Also check messages with isPrivate: false
    const isPrivateFalseCount = await db.collection('messages').countDocuments({
      isPrivate: false
    });
    console.log(`📊 Found ${isPrivateFalseCount} messages with isPrivate: false`);
    
    // Delete all public messages (messages that have a roomId field)
    const messagesResult = await db.collection('messages').deleteMany({
      roomId: { $exists: true }
    });
    console.log(`✅ Deleted ${messagesResult.deletedCount} public room messages`);
    
    console.log('✅ All public room messages cleared successfully!');
    console.log('💡 Note: Private messages were NOT affected');
    
  } catch (error) {
    console.error('❌ Error clearing public messages:', error);
  } finally {
    await client.close();
    console.log('🔌 Database connection closed');
  }
}

// Run the cleanup
clearPublicMessages().then(() => process.exit(0));
