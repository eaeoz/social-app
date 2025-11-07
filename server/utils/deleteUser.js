import { getDatabase } from '../config/database.js';
import { connectToDatabase } from '../config/database.js';

async function deleteUser(username) {
  try {
    await connectToDatabase();
    const db = getDatabase();
    
    console.log(`🔍 Looking for user: ${username}`);
    
    // Find the user first
    const user = await db.collection('users').findOne({ username });
    
    if (!user) {
      console.log(`❌ User "${username}" not found`);
      process.exit(1);
    }
    
    console.log(`✅ Found user: ${user.username} (${user._id})`);
    
    // Delete the user
    const result = await db.collection('users').deleteOne({ username });
    
    if (result.deletedCount === 1) {
      console.log(`✅ Successfully deleted user "${username}"`);
      
      // Also delete related data
      const messagesDeleted = await db.collection('messages').deleteMany({
        $or: [
          { senderId: user._id },
          { receiverId: user._id }
        ]
      });
      console.log(`📧 Deleted ${messagesDeleted.deletedCount} messages`);
      
      const privateChatsDeleted = await db.collection('privatechats').deleteMany({
        participants: user._id
      });
      console.log(`💬 Deleted ${privateChatsDeleted.deletedCount} private chats`);
      
      console.log(`🎉 User "${username}" and all related data deleted successfully!`);
    } else {
      console.log(`❌ Failed to delete user "${username}"`);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error deleting user:', error);
    process.exit(1);
  }
}

// Get username from command line argument
const username = process.argv[2];

if (!username) {
  console.error('Usage: node deleteUser.js <username>');
  process.exit(1);
}

deleteUser(username);
