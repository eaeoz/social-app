import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { connectToDatabase, getDatabase } from '../config/database.js';
import { ObjectId } from 'mongodb';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '../../.env') });

async function deleteDuplicates() {
  try {
    await connectToDatabase();
    const db = getDatabase();
    const roomsCollection = db.collection('publicrooms');
    
    // These are the duplicate room IDs to delete
    const duplicateIds = [
      '690c0dd278a8ce273cda1872', // General duplicate
      '690c0dd278a8ce273cda1873', // Gaming duplicate
      '690c0dd278a8ce273cda1874'  // Tech Talk duplicate
    ];
    
    console.log('🗑️  Deleting duplicate rooms...\n');
    
    for (const id of duplicateIds) {
      const result = await roomsCollection.deleteOne({ _id: new ObjectId(id) });
      if (result.deletedCount > 0) {
        console.log(`✓ Deleted room: ${id}`);
      } else {
        console.log(`✗ Failed to delete: ${id}`);
      }
    }
    
    console.log('\n📊 Checking remaining rooms...\n');
    const remainingRooms = await roomsCollection.find({}).toArray();
    console.log(`Total rooms: ${remainingRooms.length}`);
    remainingRooms.forEach(room => {
      console.log(`  - ${room.name} (${room._id})`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

deleteDuplicates();
