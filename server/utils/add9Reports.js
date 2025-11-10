import { MongoClient, ObjectId } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

async function add9Reports() {
  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    const db = client.db();

    // Find target user (user1 or any non-admin)
    const targetUser = await db.collection('users').findOne({ username: 'user1' }) || 
                       await db.collection('users').findOne({ role: { $ne: 'admin' } });
    
    if (!targetUser) {
      console.log('❌ No users found');
      return;
    }

    // Find reporter
    const reporter = await db.collection('users').findOne({ _id: { $ne: targetUser._id } });

    // Create 9 reports
    const reports = ['Harassment', 'Spam', 'Inappropriate content', 'Offensive language', 'Threatening behavior', 'Bullying', 'False information', 'Impersonation', 'Hate speech'].map((reason, i) => ({
      reporterId: reporter?._id || new ObjectId(),
      reportedUserId: targetUser._id,
      reason,
      description: `Test report ${i + 1}`,
      status: 'pending',
      createdAt: new Date(Date.now() - (i * 3600000)),
      adminNotes: null,
      resolvedAt: null,
      resolvedBy: null
    }));

    const result = await db.collection('reports').insertMany(reports);
    console.log(`✅ Added ${result.insertedCount} reports to ${targetUser.username}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.close();
  }
}

add9Reports();
