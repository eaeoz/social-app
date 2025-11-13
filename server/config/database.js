import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB_NAME || 'social-app';

let client;
let db;

export async function connectToDatabase() {
  try {
    if (db) {
      return db;
    }

    // Configuration for MongoDB Atlas with TLS options for Render compatibility
    // Using more permissive TLS settings to avoid SSL handshake issues on Render
    const options = {
      ssl: true,
      tls: true,
      tlsAllowInvalidCertificates: true, // More permissive for Render environment
      tlsAllowInvalidHostnames: true,
      serverSelectionTimeoutMS: 30000,
      connectTimeoutMS: 30000,
      socketTimeoutMS: 45000,
      retryWrites: true,
      w: 'majority'
    };

    client = new MongoClient(uri, options);

    await client.connect();
    console.log('✅ Connected to MongoDB Atlas');

    db = client.db(dbName);
    
    // Test the connection
    await db.command({ ping: 1 });
    console.log('✅ Database ping successful');

    return db;
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    console.error('💡 Tip: Make sure your IP is whitelisted in MongoDB Atlas');
    console.error('💡 You can whitelist all IPs (0.0.0.0/0) for testing');
    console.error('💡 Ensure your MongoDB connection string includes the correct options');
    throw error;
  }
}

export function getDatabase() {
  if (!db) {
    throw new Error('Database not initialized. Call connectToDatabase first.');
  }
  return db;
}

export async function closeDatabase() {
  if (client) {
    await client.close();
    console.log('🔌 MongoDB connection closed');
  }
}

// Handle process termination
process.on('SIGINT', async () => {
  await closeDatabase();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await closeDatabase();
  process.exit(0);
});
