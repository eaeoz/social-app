import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

async function clearPrivateChats() {
  const client = new MongoClient(process.env.MONGODB_URI);
  
  try {
    console.log('🔌 Connecting to MongoDB...');
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db();
    
    console.log('🗑️  Clearing all private chats and messages...');
    
    // Delete all private messages
    const messagesResult = await db.collection('messages').deleteMany({
      isPrivate: true
    });
    console.log(`✅ Deleted ${messagesResult.deletedCount} private messages`);
    
    // Delete all private chat documents
    const chatsResult = await db.collection('privatechats').deleteMany({});
    console.log(`✅ Deleted ${chatsResult.deletedCount} private chats`);
    
    console.log('✅ All private chats cleared successfully!');
    console.log('💡 Note: Public room messages were NOT affected');
    
  } catch (error) {
    console.error('❌ Error clearing private chats:', error);
  } finally {
    await client.close();
    console.log('🔌 Database connection closed');
  }
}

// Run the cleanup
clearPrivateChats().then(() => process.exit(0));
