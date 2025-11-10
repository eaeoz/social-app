import { MongoClient, ObjectId } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

async function addTestReportsToUser1() {
  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    console.log('Connected to MongoDB');

    const db = client.db();

    // Find first user (or user1 if exists)
    const targetUser = await db.collection('users').findOne({ username: 'user1' }) ||
                       await db.collection('users').findOne({ role: { $ne: 'admin' } }) ||
                       await db.collection('users').findOne({});
    
    if (!targetUser) {
      console.log('No users found in database. Please create users first.');
      return;
    }

    console.log(`Found target user: ${targetUser.username} (${targetUser._id})`);

    // Find a reporter user (different from target user)
    const reporter = await db.collection('users').findOne({ 
      _id: { $ne: targetUser._id }
    });

    if (!reporter) {
      console.log('No other user found to be the reporter. Creating test reports with placeholder reporter.');
    }

    // Delete existing pending reports for target user to start fresh
    const deleteResult = await db.collection('reports').deleteMany({
      reportedUserId: targetUser._id,
      status: 'pending'
    });
    console.log(`Deleted ${deleteResult.deletedCount} existing pending reports for ${targetUser.username}`);

    // Create 9 test reports
    const reports = [];
    const reportReasons = [
      'Harassment',
      'Spam',
      'Inappropriate content',
      'Offensive language',
      'Threatening behavior',
      'Bullying',
      'False information',
      'Impersonation',
      'Hate speech'
    ];

    for (let i = 0; i < 9; i++) {
      reports.push({
        reporterId: reporter ? reporter._id : new ObjectId(),
        reportedUserId: targetUser._id,
        reason: reportReasons[i],
        description: `Test report ${i + 1} - demonstrating danger-level styling for admin dashboard`,
        status: 'pending',
        createdAt: new Date(Date.now() - (i * 3600000)), // Spread reports over last 9 hours
        adminNotes: null,
        resolvedAt: null,
        resolvedBy: null
      });
    }

    // Insert all reports
    const result = await db.collection('reports').insertMany(reports);
    console.log(`\n✅ Successfully added ${result.insertedCount} test reports to ${targetUser.username}`);
    console.log(`\nReport count breakdown:`);
    console.log(`- ${targetUser.username} now has 9 pending reports`);
    console.log(`- This should display as DANGER level (red badge with intense pulse)`);
    console.log(`\nYou can now test the admin dashboard to see:`);
    console.log(`  1. Gray badge (0 reports) for most users`);
    console.log(`  2. Yellow badge (1-4 reports) - add a few reports to other users`);
    console.log(`  3. Orange badge (5-7 reports) - add more reports to other users`);
    console.log(`  4. RED badge (8-10+ reports) - ${targetUser.username} with 9 reports ⚠️`);

  } catch (error) {
    console.error('Error adding test reports:', error);
  } finally {
    await client.close();
    console.log('\nDisconnected from MongoDB');
  }
}

addTestReportsToUser1();
