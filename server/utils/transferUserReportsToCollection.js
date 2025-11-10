import { MongoClient, ObjectId } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

/**
 * Transfer reports from user document's reports array to reports collection
 * Reports are stored in batches of 10 per document for efficient querying
 */
async function transferUserReportsToCollection(userId, userEmail, username, reports) {
  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    const dbName = process.env.DB_NAME || 'social-app';
    const db = client.db(dbName);

    if (!reports || reports.length === 0) {
      console.log('No reports to transfer');
      return { success: true, transferred: 0 };
    }

    console.log(`Found ${reports.length} reports for user: ${username} (${userEmail})`);

    // Split reports into batches of 10
    const batchSize = 10;
    const reportBatches = [];
    
    for (let i = 0; i < reports.length; i += batchSize) {
      const batch = reports.slice(i, i + batchSize);
      reportBatches.push(batch);
    }

    console.log(`Split into ${reportBatches.length} batch(es)`);

    // Insert each batch into reports collection
    let totalInserted = 0;
    
    for (let i = 0; i < reportBatches.length; i++) {
      const batchDoc = {
        reportedUserId: new ObjectId(userId),
        reportedUserEmail: userEmail,
        reportedUsername: username,
        batchNumber: i + 1,
        totalBatches: reportBatches.length,
        reports: reportBatches[i],
        transferredAt: new Date(),
        status: 'archived' // Mark as archived reports
      };

      await db.collection('userreports').insertOne(batchDoc);
      totalInserted += reportBatches[i].length;
      
      console.log(`Batch ${i + 1}/${reportBatches.length}: Transferred ${reportBatches[i].length} reports`);
    }

    console.log(`✅ Successfully transferred ${totalInserted} reports to collection`);
    console.log(`Note: Reports remain in user document for reference`);

    return { 
      success: true, 
      transferred: totalInserted,
      batches: reportBatches.length 
    };

  } catch (error) {
    console.error('Error transferring reports:', error);
    return { success: false, error: error.message };
  } finally {
    await client.close();
  }
}

/**
 * Get all reports for a user from the reports collection
 */
async function getUserReportsFromCollection(userEmail) {
  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    const dbName = process.env.DB_NAME || 'social-app';
    const db = client.db(dbName);

    // Find all report batches for this user
    const reportBatches = await db.collection('userreports')
      .find({ reportedUserEmail: userEmail })
      .sort({ batchNumber: 1 })
      .toArray();

    if (reportBatches.length === 0) {
      return { success: true, reports: [], total: 0 };
    }

    // Combine all reports from batches
    const allReports = [];
    reportBatches.forEach(batch => {
      allReports.push(...batch.reports);
    });

    // Enrich reports with reporter details
    const enrichedReports = await Promise.all(allReports.map(async (report) => {
      const reporter = await db.collection('users').findOne(
        { email: report.reporterEmail },
        { projection: { username: 1, displayName: 1, email: 1 } }
      );

      return {
        ...report,
        reporterDetails: reporter || { 
          username: 'Unknown', 
          email: report.reporterEmail 
        }
      };
    }));

    return { 
      success: true, 
      reports: enrichedReports,
      total: allReports.length,
      batches: reportBatches.length
    };

  } catch (error) {
    console.error('Error getting reports:', error);
    return { success: false, error: error.message };
  } finally {
    await client.close();
  }
}

export { transferUserReportsToCollection, getUserReportsFromCollection };

// If running directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const testUserId = process.argv[2];
  const testUserEmail = process.argv[3];

  if (!testUserId || !testUserEmail) {
    console.log('Usage: node transferUserReportsToCollection.js <userId> <userEmail>');
    console.log('Example: node transferUserReportsToCollection.js 6911f671be2c55e447204506 user@example.com');
    process.exit(1);
  }

  transferUserReportsToCollection(testUserId, testUserEmail)
    .then(result => {
      console.log('\nResult:', result);
      process.exit(0);
    })
    .catch(error => {
      console.error('Error:', error);
      process.exit(1);
    });
}
