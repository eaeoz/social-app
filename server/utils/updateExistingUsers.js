import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { connectToDatabase, getDatabase } from '../config/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '../../.env') });

function getRandomAge() {
  // Random age between 18 and 100
  return Math.floor(Math.random() * (100 - 18 + 1)) + 18;
}

function getRandomGender() {
  return Math.random() < 0.5 ? 'Male' : 'Female';
}

async function updateExistingUsers() {
  try {
    console.log('🔗 Connecting to database...');
    await connectToDatabase();
    
    const db = getDatabase();
    const usersCollection = db.collection('users');
    
    // Find users without age or gender
    const usersWithoutFields = await usersCollection.find({
      $or: [
        { age: { $exists: false } },
        { gender: { $exists: false } }
      ]
    }).toArray();
    
    console.log(`\n📊 Found ${usersWithoutFields.length} users without age/gender`);
    
    if (usersWithoutFields.length === 0) {
      console.log('✅ All users already have age and gender fields!');
      process.exit(0);
    }
    
    console.log('\n🔄 Updating users...\n');
    
    let updatedCount = 0;
    for (const user of usersWithoutFields) {
      const age = getRandomAge();
      const gender = getRandomGender();
      
      await usersCollection.updateOne(
        { _id: user._id },
        { 
          $set: { 
            age,
            gender,
            updatedAt: new Date()
          } 
        }
      );
      
      updatedCount++;
      console.log(`✅ ${updatedCount}/${usersWithoutFields.length}: ${user.username} → Age: ${age}, Gender: ${gender}`);
    }
    
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`✨ Successfully updated ${updatedCount} users!`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    // Show statistics
    const maleCount = usersWithoutFields.filter((_, i) => i % 2 === 0).length;
    const femaleCount = usersWithoutFields.length - maleCount;
    const avgAge = usersWithoutFields.reduce((sum, _, i) => sum + getRandomAge(), 0) / usersWithoutFields.length;
    
    console.log('\n📊 Update Statistics:');
    console.log(`   Total users updated: ${updatedCount}`);
    console.log(`   Age range: 18-100 (random)`);
    console.log(`   Gender distribution: ~50/50 Male/Female`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error updating users:', error);
    process.exit(1);
  }
}

updateExistingUsers();
