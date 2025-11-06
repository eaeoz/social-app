import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { connectToDatabase, getDatabase } from '../config/database.js';

// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from root directory (up two levels from utils)
dotenv.config({ path: join(__dirname, '../../.env') });

async function checkRooms() {
  try {
    // Connect to database first
    await connectToDatabase();
    
    const db = getDatabase();
    const roomsCollection = db.collection('publicrooms');
    
    const rooms = await roomsCollection.find({}).toArray();
    
    console.log(`\n📊 Total rooms in database: ${rooms.length}\n`);
    
    if (rooms.length === 0) {
      console.log('❌ No rooms found! Run: node utils/seedRooms.js');
    } else {
      console.log('📝 Rooms:');
      rooms.forEach((room, index) => {
        console.log(`${index + 1}. ${room.name}`);
        console.log(`   Description: ${room.description}`);
        console.log(`   ID: ${room._id}`);
        console.log(`   Created: ${room.createdAt}`);
        console.log('');
      });
    }
    
    // Check for duplicates
    const roomNames = rooms.map(r => r.name);
    const duplicates = roomNames.filter((name, index) => roomNames.indexOf(name) !== index);
    
    if (duplicates.length > 0) {
      console.log('⚠️  WARNING: Duplicate rooms found!');
      console.log('Duplicates:', [...new Set(duplicates)]);
      console.log('\nRun cleanup: node utils/cleanupDuplicateRooms.js');
    } else {
      console.log('✅ No duplicate rooms found!');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkRooms();
