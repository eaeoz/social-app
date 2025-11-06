import { getDatabase } from '../config/database.js';
import { ObjectId } from 'mongodb';

export async function seedDefaultRooms() {
  try {
    const db = getDatabase();
    const roomsCollection = db.collection('publicrooms');
    
    // Check if rooms already exist
    const existingRooms = await roomsCollection.countDocuments();
    
    if (existingRooms > 0) {
      console.log('📌 Public rooms already exist');
      return;
    }

    // Create a system user for room creation
    const usersCollection = db.collection('users');
    let systemUser = await usersCollection.findOne({ username: 'system' });
    
    if (!systemUser) {
      const result = await usersCollection.insertOne({
        username: 'system',
        email: 'system@chatapp.com',
        passwordHash: 'N/A',
        displayName: 'System',
        bio: 'System Account',
        status: 'online',
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSeen: new Date()
      });
      systemUser = { _id: result.insertedId };
    }

    // Create default rooms
    const defaultRooms = [
      {
        name: 'General',
        description: 'General discussion for everyone',
        createdBy: systemUser._id,
        participants: [],
        isActive: true,
        isPrivate: false,
        maxParticipants: 1000,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Gaming',
        description: 'Talk about your favorite games',
        createdBy: systemUser._id,
        participants: [],
        isActive: true,
        isPrivate: false,
        maxParticipants: 500,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Tech Talk',
        description: 'Discuss technology, programming, and more',
        createdBy: systemUser._id,
        participants: [],
        isActive: true,
        isPrivate: false,
        maxParticipants: 500,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    await roomsCollection.insertMany(defaultRooms);
    console.log('✅ Default public rooms created');
  } catch (error) {
    console.error('❌ Error seeding rooms:', error);
  }
}
