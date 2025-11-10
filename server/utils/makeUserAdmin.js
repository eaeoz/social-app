import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

// Get username from command line argument
const targetUsername = process.argv[2];

if (!targetUsername) {
  console.log('❌ Please provide a username');
  console.log('Usage: node server/utils/makeUserAdmin.js <username>');
  console.log('Example: node server/utils/makeUserAdmin.js sedat');
  process.exit(1);
}

async function makeUserAdmin() {
  const client = new MongoClient(process.env.MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db('social-app');
    const usersCollection = db.collection('users');
    
    // Find the user
    const user = await usersCollection.findOne({ username: targetUsername });
    
    if (!user) {
      console.log(`❌ User '${targetUsername}' not found`);
      console.log('\n📋 Available users:');
      const allUsers = await usersCollection.find({}).toArray();
      allUsers.forEach(u => {
        console.log(`   - ${u.username} (${u.email}) - Role: ${u.role || 'none'}`);
      });
      return;
    }
    
    // Check if already admin
    if (user.role === 'admin') {
      console.log(`✅ User '${targetUsername}' is already an admin`);
      return;
    }
    
    // Update user to admin
    const result = await usersCollection.updateOne(
      { username: targetUsername },
      { $set: { role: 'admin' } }
    );
    
    if (result.modifiedCount > 0) {
      console.log(`\n✅ Successfully granted admin role to '${targetUsername}'`);
      console.log(`   Username: ${user.username}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Previous Role: ${user.role || 'user'}`);
      console.log(`   New Role: admin`);
      
      // Show all admin users
      const admins = await usersCollection.find({ role: 'admin' }).toArray();
      console.log(`\n👑 Current Admin Users (${admins.length}):`);
      admins.forEach(admin => {
        console.log(`   - ${admin.username} (${admin.email})`);
      });
    } else {
      console.log(`❌ Failed to update user '${targetUsername}'`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
    console.log('\n✅ Database connection closed');
  }
}

makeUserAdmin();
