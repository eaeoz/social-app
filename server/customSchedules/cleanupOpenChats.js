/**
 * Simple Test Script for OpenChats Cleanup
 * Loads environment variables from .env file
 */

import { MongoClient, ObjectId } from 'mongodb';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Get directory name for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from server/.env
dotenv.config({ path: path.join(__dirname, '..', '.env') });

// Get MongoDB connection details from environment
const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = process.env.MONGODB_DB_NAME || process.env.DB_NAME;

// Extract database name from MongoDB URI if DB_NAME is not set
function extractDbNameFromUri(uri) {
  if (!uri) return null;
  const match = uri.match(/\/([^/?]+)(\?|$)/);
  return match ? match[1] : null;
}

const DATABASE_NAME = DB_NAME || extractDbNameFromUri(MONGODB_URI);

// Validate configuration
if (!MONGODB_URI) {
  console.error('❌ Error: MONGODB_URI not found in environment variables');
  console.error('Please ensure your .env file exists in the server/ directory with MONGODB_URI set');
  process.exit(1);
}

if (!DATABASE_NAME) {
  console.error('❌ Error: Could not determine database name');
  console.error('Please set DB_NAME in your .env file or ensure your MONGODB_URI includes the database name');
  process.exit(1);
}

console.log('✅ Environment loaded');
console.log('📊 Using database:', DATABASE_NAME);

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
    
    const db = client.db(DATABASE_NAME);
    
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
