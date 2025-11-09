import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { connectToDatabase, getDatabase } from '../config/database.js';

// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from root directory
dotenv.config({ path: join(__dirname, '../../.env') });

/**
 * This script adds the nickName and lastNickNameChange fields to existing users
 * For existing users: nickName will be set to their current username
 * For new users: nickName will be set during registration
 */
async function addNickNameField() {
  try {
    // Connect to database first
    await connectToDatabase();
    const db = getDatabase();
    const usersCollection = db.collection('users');

    console.log('🔄 Starting to add nickName field to users...');

    // Get all users
    const users = await usersCollection.find({}).toArray();
    console.log(`📊 Found ${users.length} users to update`);

    let updatedCount = 0;
    let skippedCount = 0;

    for (const user of users) {
      // Skip if user already has nickName
      if (user.nickName) {
        console.log(`⏭️  User ${user.username} already has nickName: ${user.nickName}`);
        skippedCount++;
        continue;
      }

      // Set nickName to username for existing users
      // Set lastNickNameChange to null (they can change immediately)
      await usersCollection.updateOne(
        { _id: user._id },
        {
          $set: {
            nickName: user.username,
            lastNickNameChange: null,
            updatedAt: new Date()
          }
        }
      );

      console.log(`✅ Updated user ${user.username}: nickName set to ${user.username}`);
      updatedCount++;
    }

    console.log('\n📈 Update Summary:');
    console.log(`   ✅ Updated: ${updatedCount} users`);
    console.log(`   ⏭️  Skipped: ${skippedCount} users (already had nickName)`);
    console.log(`   📊 Total: ${users.length} users\n`);

    // Update the schema validator to include nickName
    console.log('🔄 Updating collection schema validator...');
    
    await db.command({
      collMod: 'users',
      validator: {
        $jsonSchema: {
          bsonType: 'object',
          required: ['username', 'email', 'passwordHash', 'createdAt', 'nickName'],
          properties: {
            username: { bsonType: 'string' },
            email: { bsonType: 'string' },
            passwordHash: { bsonType: 'string' },
            displayName: { bsonType: 'string' },
            nickName: { bsonType: 'string' },
            lastNickNameChange: { bsonType: ['date', 'null'] },
            age: {
              bsonType: 'int',
              minimum: 18,
              maximum: 100
            },
            gender: {
              bsonType: 'string',
              enum: ['Male', 'Female']
            },
            profilePictureId: { bsonType: 'string' },
            bio: { bsonType: 'string' },
            status: {
              bsonType: 'string',
              enum: ['online', 'offline', 'away', 'busy']
            },
            createdAt: { bsonType: 'date' },
            updatedAt: { bsonType: 'date' },
            lastSeen: { bsonType: 'date' }
          }
        }
      }
    });

    console.log('✅ Schema validator updated successfully');

    // Create a unique index on nickName
    console.log('🔄 Creating unique index on nickName...');
    
    try {
      await usersCollection.createIndex({ nickName: 1 }, { unique: true });
      console.log('✅ Unique index created on nickName');
    } catch (indexError) {
      if (indexError.code === 85) {
        console.log('⚠️  Index already exists, skipping index creation');
      } else {
        throw indexError;
      }
    }

    console.log('\n✅ All operations completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error adding nickName field:', error);
    process.exit(1);
  }
}

// Run the script
addNickNameField().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
