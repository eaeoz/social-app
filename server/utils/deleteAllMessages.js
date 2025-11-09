import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

// Load environment variables from the root .env file
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const envPath = resolve(__dirname, '../../.env');

dotenv.config({ path: envPath });

async function deleteAllMessages() {
  let client;
  try {
    const uri = process.env.MONGODB_URI;
    const dbName = process.env.MONGODB_DB_NAME || 'social-app';
    
    // Connect to MongoDB
    client = new MongoClient(uri);
    await client.connect();
    const db = client.db(dbName);
    
    console.log('\n' + '⚠️'.repeat(35));
    console.log('⚠️  DANGER: MESSAGE DELETION UTILITY  ⚠️');
    console.log('⚠️'.repeat(35));
    console.log('\nThis will DELETE ALL MESSAGES in the system!');
    console.log('\nThis includes:');
    console.log('  • All public room messages');
    console.log('  • All private chat messages');
    console.log('  • All message history\n');
    console.log('⚠️  This action is IRREVERSIBLE!\n');
    console.log('⏳ Starting in 5 seconds... Press Ctrl+C to cancel\n');
    
    // Give user time to cancel
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    console.log('🔍 Counting messages...\n');
    
    // Count messages before deletion
    const totalMessages = await db.collection('messages').countDocuments();
    const publicMessages = await db.collection('messages').countDocuments({ isPrivate: false });
    const privateMessages = await db.collection('messages').countDocuments({ isPrivate: true });
    
    console.log('📊 Message Statistics:');
    console.log(`   - Total messages: ${totalMessages}`);
    console.log(`   - Public messages: ${publicMessages}`);
    console.log(`   - Private messages: ${privateMessages}\n`);
    
    if (totalMessages === 0) {
      console.log('✅ No messages to delete');
      process.exit(0);
    }
    
    console.log('🗑️  Starting deletion process...\n');
    
    // Delete all messages
    console.log('1️⃣  Deleting all messages from database...');
    const messageResult = await db.collection('messages').deleteMany({});
    console.log(`   ✅ Deleted ${messageResult.deletedCount} messages`);
    
    // Optional: Reset message-related fields in private chats
    console.log('2️⃣  Resetting private chat references...');
    const chatUpdateResult = await db.collection('privatechats').updateMany(
      {},
      {
        $unset: { 
          lastMessageId: "",
          lastMessageAt: ""
        },
        $set: {
          updatedAt: new Date()
        }
      }
    );
    console.log(`   ✅ Updated ${chatUpdateResult.modifiedCount} private chats`);
    
    // Print final summary
    console.log('\n' + '='.repeat(70));
    console.log('🎉 MESSAGE DELETION COMPLETE - Summary:');
    console.log('='.repeat(70));
    console.log(`📊 Deletion Statistics:`);
    console.log(`   - Messages deleted: ${messageResult.deletedCount}`);
    console.log(`   - Private chats updated: ${chatUpdateResult.modifiedCount}`);
    console.log('='.repeat(70));
    console.log('✅ All messages have been permanently deleted!');
    console.log('💬 Chat system is now empty and ready for fresh messages.');
    console.log('='.repeat(70) + '\n');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during message deletion:', error);
    process.exit(1);
  } finally {
    if (client) {
      await client.close();
    }
  }
}

// Execute the deletion
deleteAllMessages();
