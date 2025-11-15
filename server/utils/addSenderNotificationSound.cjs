const { MongoClient } = require('mongodb');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = process.env.DB_NAME || 'chatapp';

async function addSenderNotificationSound() {
  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    console.log('📡 Connected to MongoDB');

    const db = client.db(DB_NAME);
    const settingsCollection = db.collection('sitesettings');

    // Add senderNotificationSound field to existing settings
    const result = await settingsCollection.updateMany(
      {},
      {
        $set: {
          senderNotificationSound: 'pop' // Default sender sound
        }
      }
    );

    console.log('✅ Sender notification sound field added successfully');
    console.log(`   Modified ${result.modifiedCount} document(s)`);
    console.log('   Default sender sound: pop');

  } catch (error) {
    console.error('❌ Error adding sender notification sound field:', error);
    throw error;
  } finally {
    await client.close();
    console.log('🔌 MongoDB connection closed');
  }
}

// Run the migration
addSenderNotificationSound()
  .then(() => {
    console.log('🎉 Migration completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Migration failed:', error);
    process.exit(1);
  });
