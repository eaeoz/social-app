/**
 * Simple Test Script for OpenChats Cleanup
 * This bypasses .env loading and uses direct connection
 */

import { MongoClient, ObjectId } from 'mongodb';

// Direct MongoDB URI (replace with your actual connection string)
const MONGODB_URI = 'mongodb+srv://sedat:Sedat_mongodb_12@cluster0.aqhcv7a.mongodb.net/social-app?retryWrites=true&w=majority';
const DB_NAME = 'social-app';

async function cleanupOpenChats() {
  let client;
  
  try {
    console.log('🧪 Running OpenChats cleanup test...\n');
    
    // Connect to MongoDB
    console.log('🔗 Connecting to MongoDB...');
    client = new MongoClient(MONGODB_URI, {
      ssl: true,
      tls: true,
      tlsAllowInvalidCertificates: true,
      tlsAllowInvalidHostnames: true,
      serverSelectionTimeoutMS: 30000
    });
    
    await client.connect();
    console.log('✅ Connected to MongoDB Atlas\n');
    
    const db = client.db(DB_NAME);
    
    // Test connection
    await db.command({ ping: 1 });
    console.log('✅ Database ping successful\n');
    
    // Get all users with openChats array
    const users = await db.collection('users').find({
      openChats: { $exists: true, $ne: [] }
    }).toArray();
    
    if (users.length === 0) {
      console.log('ℹ️ No users with openChats found');
      return;
    }
    
    console.log(`📊 Processing ${users.length} users with openChats\n`);
    
    let totalEntriesRemoved = 0;
    let usersUpdated = 0;
    
    for (const user of users) {
      if (!Array.isArray(user.openChats) || user.openChats.length === 0) {
        continue;
      }
      
      const userId = user._id;
      const originalLength = user.openChats.length;
      const cleanedOpenChats = [];
      
      // Process each entry in openChats
      for (const chatEntry of user.openChats) {
        if (!chatEntry || !chatEntry.userId) {
          continue;
        }
        
        const otherUserId = chatEntry.userId;
        const isClosedChat = chatEntry.state === false;
        
        // Remove all closed chats (state=false)
        if (isClosedChat) {
          console.log(`  🗑️ Removing closed chat entry for user ${userId.toString().slice(-6)} with ${otherUserId.slice(-6)} (state=false)`);
          continue; // Don't add to cleanedOpenChats
        }
        
        // Keep this entry
        cleanedOpenChats.push(chatEntry);
      }
      
      // Update user if openChats changed
      if (cleanedOpenChats.length !== originalLength) {
        await db.collection('users').updateOne(
          { _id: userId },
          { 
            $set: { 
              openChats: cleanedOpenChats,
              openChatsUpdatedAt: new Date()
            } 
          }
        );
        
        const removed = originalLength - cleanedOpenChats.length;
        totalEntriesRemoved += removed;
        usersUpdated++;
        
        console.log(`  ✅ User ...${userId.toString().slice(-6)}: Removed ${removed} entries (${originalLength} → ${cleanedOpenChats.length})`);
      }
    }
    
    console.log('\n✅ Cleanup completed successfully!');
    console.log('📊 Statistics:', {
      usersProcessed: users.length,
      usersUpdated: usersUpdated,
      entriesRemoved: totalEntriesRemoved
    });
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('Stack trace:', error.stack);
  } finally {
    if (client) {
      await client.close();
      console.log('\n🔌 MongoDB connection closed');
    }
  }
}

cleanupOpenChats();
