import { getDatabase } from '../config/database.js';

/**
 * Adds email verification fields to existing users in the database
 * This script updates the users collection schema to support email verification
 */
async function addEmailVerificationFields() {
  try {
    const db = getDatabase();
    const usersCollection = db.collection('users');

    console.log('🔧 Starting email verification fields migration...');

    // Update all existing users to have email verification fields
    const result = await usersCollection.updateMany(
      { isEmailVerified: { $exists: false } },
      {
        $set: {
          isEmailVerified: false,
          emailVerificationToken: null,
          emailVerificationExpires: null
        }
      }
    );

    console.log(`✅ Updated ${result.modifiedCount} users with email verification fields`);

    // Update the collection validator to include the new fields
    await db.command({
      collMod: 'users',
      validator: {
        $jsonSchema: {
          bsonType: 'object',
          required: ['username', 'email', 'passwordHash', 'createdAt'],
          properties: {
            username: { bsonType: 'string' },
            email: { bsonType: 'string' },
            passwordHash: { bsonType: 'string' },
            displayName: { bsonType: 'string' },
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
            isEmailVerified: { bsonType: 'bool' },
            emailVerificationToken: { bsonType: ['string', 'null'] },
            emailVerificationExpires: { bsonType: ['date', 'null'] },
            createdAt: { bsonType: 'date' },
            updatedAt: { bsonType: 'date' },
            lastSeen: { bsonType: 'date' }
          }
        }
      }
    });

    console.log('✅ Updated users collection schema validator');
    console.log('🎉 Email verification fields migration completed successfully!');

    return {
      success: true,
      modifiedCount: result.modifiedCount
    };

  } catch (error) {
    console.error('❌ Error adding email verification fields:', error);
    throw error;
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const { connectToDatabase } = await import('../config/database.js');
  await connectToDatabase();
  await addEmailVerificationFields();
  process.exit(0);
}

export { addEmailVerificationFields };
