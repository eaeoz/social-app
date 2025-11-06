import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { connectToDatabase, getDatabase } from '../config/database.js';

// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from root directory (up two levels from utils)
dotenv.config({ path: join(__dirname, '../../.env') });

export async function cleanupDuplicateRooms() {
  try {
    // Connect to database first
    await connectToDatabase();
    
    const db = getDatabase();
    const roomsCollection = db.collection('publicrooms');
    
    console.log('🧹 Starting duplicate room cleanup...');
    
    // Get all rooms grouped by name
    const rooms = await roomsCollection.find({}).toArray();
    console.log(`Found ${rooms.length} total rooms`);
    
    // Group rooms by name
    const roomsByName = {};
    for (const room of rooms) {
      if (!roomsByName[room.name]) {
        roomsByName[room.name] = [];
      }
      roomsByName[room.name].push(room);
    }
    
    // For each room name, keep the first one (by _id) and delete the rest
    let deletedCount = 0;
    for (const [name, duplicates] of Object.entries(roomsByName)) {
      if (duplicates.length > 1) {
        console.log(`\n📋 Found ${duplicates.length} duplicates of "${name}"`);
        
        // Sort by _id to ensure consistent ordering, keep the first
        duplicates.sort((a, b) => a._id.toString().localeCompare(b._id.toString()));
        const toKeep = duplicates[0];
        const toDelete = duplicates.slice(1);
        
        console.log(`   ✅ Keeping room with ID: ${toKeep._id}`);
        console.log(`   🗑️  Deleting ${toDelete.length} duplicate(s)...`);
        
        for (const room of toDelete) {
          const result = await roomsCollection.deleteOne({ _id: room._id });
          if (result.deletedCount > 0) {
            deletedCount++;
            console.log(`      ✓ Deleted: ${room._id}`);
          } else {
            console.log(`      ✗ Failed to delete: ${room._id}`);
          }
        }
      }
    }
    
    console.log(`\n✅ Cleanup complete! Deleted ${deletedCount} duplicate room(s)`);
    
    // Show final room list
    const finalRooms = await roomsCollection.find({}).toArray();
    console.log(`\n📊 Final room count: ${finalRooms.length}`);
    console.log('📝 Rooms:');
    for (const room of finalRooms) {
      console.log(`   - ${room.name}: ${room.description}`);
    }
    
  } catch (error) {
    console.error('❌ Error cleaning up duplicate rooms:', error);
    throw error;
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  cleanupDuplicateRooms()
    .then(() => {
      console.log('\n✅ Done!');
      process.exit(0);
    })
    .catch(err => {
      console.error('❌ Failed:', err);
      process.exit(1);
    });
}
