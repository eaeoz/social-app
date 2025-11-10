import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

async function addRoleField() {
  const client = new MongoClient(process.env.MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db('social-app');
    const usersCollection = db.collection('users');
    
    // Count users without role field
    const usersWithoutRole = await usersCollection.countDocuments({
      role: { $exists: false }
    });
    
    console.log(`📊 Found ${usersWithoutRole} users without role field`);
    
    if (usersWithoutRole === 0) {
      console.log('✅ All users already have role field');
      return;
    }
    
    // Add role: 'user' to all users that don't have a role
    const result = await usersCollection.updateMany(
      { role: { $exists: false } },
      { $set: { role: 'user' } }
    );
    
    console.log(`✅ Updated ${result.modifiedCount} users with default role: 'user'`);
    
    // Show statistics
    const totalUsers = await usersCollection.countDocuments({});
    const adminUsers = await usersCollection.countDocuments({ role: 'admin' });
    const regularUsers = await usersCollection.countDocuments({ role: 'user' });
    
    console.log('\n📈 User Role Statistics:');
    console.log(`   Total Users: ${totalUsers}`);
    console.log(`   Admin Users: ${adminUsers}`);
    console.log(`   Regular Users: ${regularUsers}`);
    
    // Show admin users
    if (adminUsers > 0) {
      console.log('\n👑 Admin Users:');
      const admins = await usersCollection.find({ role: 'admin' }).toArray();
      admins.forEach(admin => {
        console.log(`   - ${admin.username} (${admin.email})`);
      });
    } else {
      console.log('\n⚠️  No admin users found!');
      console.log('   To make a user admin, run:');
      console.log('   db.users.updateOne({ username: "your_username" }, { $set: { role: "admin" } })');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
    console.log('\n✅ Database connection closed');
  }
}

addRoleField();
