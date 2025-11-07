import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { connectToDatabase, getDatabase } from '../config/database.js';
import bcrypt from 'bcrypt';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '../../.env') });

const firstNames = [
  'Alex', 'Jordan', 'Taylor', 'Morgan', 'Casey',
  'Riley', 'Cameron', 'Avery', 'Quinn', 'Reese',
  'Parker', 'Skylar', 'Rowan', 'Sage', 'River',
  'Phoenix', 'Dakota', 'Jamie', 'Blake', 'Drew',
  'Sam', 'Charlie', 'Emerson', 'Logan', 'Hayden',
  'Peyton', 'Angel', 'Ashton', 'Bailey', 'Brooklyn'
];

const adjectives = [
  'Cool', 'Fast', 'Smart', 'Brave', 'Swift',
  'Bright', 'Bold', 'Quick', 'Wild', 'Sharp',
  'Lucky', 'Happy', 'Clever', 'Strong', 'Free',
  'True', 'Pure', 'Kind', 'Wise', 'Noble',
  'Silver', 'Golden', 'Mystic', 'Cosmic', 'Solar',
  'Lunar', 'Storm', 'Ocean', 'Forest', 'Mountain'
];

function generateUsername(index) {
  const firstName = firstNames[index % firstNames.length];
  const adjective = adjectives[Math.floor(index / firstNames.length)];
  const number = Math.floor(Math.random() * 99) + 1;
  return `${firstName}${adjective}${number}`.toLowerCase();
}

function generateDisplayName(index) {
  const firstName = firstNames[index % firstNames.length];
  const adjective = adjectives[Math.floor(index / firstNames.length)];
  return `${firstName} ${adjective}`;
}

async function generateTestUsers() {
  try {
    console.log('🔗 Connecting to database...');
    await connectToDatabase();
    
    const db = getDatabase();
    const usersCollection = db.collection('users');
    
    console.log('🔐 Hashing password...');
    const passwordHash = await bcrypt.hash('testtest', 10);
    
    console.log('👥 Generating 60 test users...\n');
    
    const users = [];
    for (let i = 0; i < 60; i++) {
      const username = generateUsername(i);
      const displayName = generateDisplayName(i);
      const email = `${username}@test.com`;
      
      // Check if user already exists
      const existingUser = await usersCollection.findOne({ 
        $or: [{ username }, { email }] 
      });
      
      if (existingUser) {
        console.log(`⚠️  User ${i + 1}/60: ${username} already exists, skipping...`);
        continue;
      }
      
      const user = {
        username,
        email,
        passwordHash,
        displayName,
        bio: `Test user - ${displayName}`,
        status: 'offline',
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSeen: new Date()
      };
      
      const result = await usersCollection.insertOne(user);
      users.push({
        ...user,
        _id: result.insertedId
      });
      
      console.log(`✅ User ${i + 1}/60: ${username} (${displayName}) - ${email}`);
    }
    
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`✨ Successfully created ${users.length} test users!`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n📋 Login Credentials:');
    console.log('   Password for all users: testtest');
    console.log('\n📝 Sample Usernames:');
    users.slice(0, 5).forEach(user => {
      console.log(`   • ${user.username}`);
    });
    console.log(`   ... and ${users.length - 5} more`);
    
    console.log('\n💡 Usage:');
    console.log('   1. Go to login page');
    console.log('   2. Use any of the generated usernames');
    console.log('   3. Password: testtest');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error generating test users:', error);
    process.exit(1);
  }
}

generateTestUsers();
