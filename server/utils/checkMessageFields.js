import { connectToDatabase, getDatabase } from '../config/database.js';

async function checkMessageFields() {
  try {
    await connectToDatabase();
    const db = getDatabase();
    
    console.log('🔍 Checking message document structure...');
    
    // Get a sample message
    const sampleMessage = await db.collection('messages').findOne({});
    
    if (sampleMessage) {
      console.log('\n📋 Sample message document:');
      console.log(JSON.stringify(sampleMessage, null, 2));
      console.log('\n📊 Available fields:', Object.keys(sampleMessage).join(', '));
    } else {
      console.log('⚠️ No messages found');
    }
    
    // Get a sample private chat
    const samplePrivateChat = await db.collection('privatechats').findOne({});
    
    if (samplePrivateChat) {
      console.log('\n📋 Sample private chat document:');
      console.log(JSON.stringify(samplePrivateChat, null, 2));
      console.log('\n📊 Available fields:', Object.keys(samplePrivateChat).join(', '));
    } else {
      console.log('⚠️ No private chats found');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkMessageFields();
