import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

// Load environment variables from the root .env file
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const envPath = resolve(__dirname, '../../.env');

dotenv.config({ path: envPath });

console.log('🔍 Checking environment variables...');
if (!process.env.MONGODB_URI) {
  console.error('❌ MONGODB_URI not found in environment variables');
  process.exit(1);
}
console.log('✅ MONGODB_URI found\n');

async function cleanAllUsers() {
  let client;
  try {
    const uri = process.env.MONGODB_URI;
    const dbName = process.env.MONGODB_DB_NAME || 'social-app';
    
    // Connect to MongoDB
    console.log('🔌 Connecting to MongoDB...');
    client = new MongoClient(uri);
    await client.connect();
    console.log('✅ Connected to MongoDB\n');
    
    const db = client.db(dbName);
    
    console.log('🧹 Starting cleanup of all users and related data...\n');
    
    // Count existing data
    const userCount = await db.collection('users').countDocuments();
    const messageCount = await db.collection('messages').countDocuments();
    const privateChatCount = await db.collection('privatechats').countDocuments();
    
    console.log(`📊 Current database state:`);
    console.log(`   Users: ${userCount}`);
    console.log(`   Messages: ${messageCount}`);
    console.log(`   Private Chats: ${privateChatCount}\n`);
    
    if (userCount === 0 && messageCount === 0 && privateChatCount === 0) {
      console.log('✅ Database is already clean!');
      process.exit(0);
    }
    
    // Delete all messages
    console.log('🗑️  Deleting all messages...');
    const messagesResult = await db.collection('messages').deleteMany({});
    console.log(`   ✅ Deleted ${messagesResult.deletedCount} messages\n`);
    
    // Delete all private chats
    console.log('🗑️  Deleting all private chats...');
    const privateChatsResult = await db.collection('privatechats').deleteMany({});
    console.log(`   ✅ Deleted ${privateChatsResult.deletedCount} private chats\n`);
    
    // Delete all users
    console.log('🗑️  Deleting all users...');
    const usersResult = await db.collection('users').deleteMany({});
    console.log(`   ✅ Deleted ${usersResult.deletedCount} users\n`);
    
    // Verify cleanup
    const remainingUsers = await db.collection('users').countDocuments();
    const remainingMessages = await db.collection('messages').countDocuments();
    const remainingChats = await db.collection('privatechats').countDocuments();
    
    console.log('📊 Final database state:');
    console.log(`   Users: ${remainingUsers}`);
    console.log(`   Messages: ${remainingMessages}`);
    console.log(`   Private Chats: ${remainingChats}\n`);
    
    if (remainingUsers === 0 && remainingMessages === 0 && remainingChats === 0) {
      console.log('🎉 Successfully cleaned all users and related data!');
      console.log('💡 You can now create new users with fresh data.');
    } else {
      console.log('⚠️  Warning: Some data may still remain in the database.');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error cleaning database:', error);
    process.exit(1);
  }
}

// Confirm before executing
console.log('⚠️  WARNING: This will delete ALL users and related data from the database!');
console.log('This action cannot be undone.\n');

cleanAllUsers();
