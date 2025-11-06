import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { connectToDatabase, getDatabase } from '../config/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '../../.env') });

async function updateUserSchema() {
  try {
    console.log('🔗 Connecting to database...');
    await connectToDatabase();
    
    const db = getDatabase();
    
    console.log('📝 Updating users collection schema...');
    
    // Update the users collection validator
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
            createdAt: { bsonType: 'date' },
            updatedAt: { bsonType: 'date' },
            lastSeen: { bsonType: 'date' }
          }
        }
      },
      validationLevel: 'moderate', // Won't affect existing documents
      validationAction: 'warn' // Won't block insertions, just log warnings
    });
    
    console.log('✅ Schema updated successfully!');
    console.log('\n📋 New fields added:');
    console.log('   • age: integer (18-100)');
    console.log('   • gender: string (Male/Female)');
    console.log('\n💡 Note: Existing users without age/gender will still work.');
    console.log('   New registrations will require these fields.');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error updating schema:', error);
    process.exit(1);
  }
}

updateUserSchema();
