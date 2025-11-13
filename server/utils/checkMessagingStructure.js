import { connectToDatabase, getDatabase } from '../config/database.js';

async function checkMessagingStructure() {
  try {
    await connectToDatabase();
    const db = getDatabase();
    
    console.log('🔍 Analyzing messaging structure...\n');
    
    // Check messages collection
    console.log('📨 MESSAGES COLLECTION:');
    const messagesCount = await db.collection('messages').countDocuments();
    console.log(`Total messages: ${messagesCount}`);
    
    const sampleMessages = await db.collection('messages').find({}).limit(3).toArray();
    console.log('\nSample messages:');
    sampleMessages.forEach((msg, i) => {
      console.log(`\nMessage ${i + 1}:`);
      console.log(JSON.stringify(msg, null, 2));
    });
    
    // Check privatechats collection
    console.log('\n\n💬 PRIVATECHATS COLLECTION:');
    const privatechatsCount = await db.collection('privatechats').countDocuments();
    console.log(`Total private chats: ${privatechatsCount}`);
    
    const samplePrivateChats = await db.collection('privatechats').find({}).limit(2).toArray();
    console.log('\nSample private chats:');
    samplePrivateChats.forEach((chat, i) => {
      console.log(`\nPrivate Chat ${i + 1}:`);
      console.log(JSON.stringify(chat, null, 2));
    });
    
    // Check how messages are linked
    console.log('\n\n🔗 CHECKING MESSAGE LINKAGE:');
    const privateMessages = await db.collection('messages').find({ isPrivate: true }).limit(3).toArray();
    console.log(`\nPrivate messages (${privateMessages.length}):`);
    privateMessages.forEach((msg, i) => {
      console.log(`\nPrivate Message ${i + 1}:`);
      console.log(JSON.stringify(msg, null, 2));
    });
    
    const publicMessages = await db.collection('messages').find({ isPrivate: false }).limit(3).toArray();
    console.log(`\nPublic messages (${publicMessages.length}):`);
    publicMessages.forEach((msg, i) => {
      console.log(`\nPublic Message ${i + 1}:`);
      console.log(JSON.stringify(msg, null, 2));
    });
    
    console.log('\n\n📊 SUMMARY:');
    console.log(`- Messages are stored in the "messages" collection`);
    console.log(`- Private chat rooms are stored in the "privatechats" collection`);
    console.log(`- Messages have an "isPrivate" field to indicate private vs public`);
    console.log(`- Private messages have senderId and receiverId fields`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkMessagingStructure();
